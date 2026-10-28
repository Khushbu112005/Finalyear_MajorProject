"""
CivicSphere Main Application Entrypoint.
Exposes Module C Knowledge + Agentic Graph Engine APIs.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uuid
import time
import logging
import secrets
from urllib.parse import urlparse
from starlette.responses import JSONResponse

import asyncio
from packages.schemas.contracts import ApiResponse
from backend.app.common.config import settings
from backend.app.common.errors import (
    CivicSphereException,
    civicsphere_exception_handler,
    generic_exception_handler
)
from backend.app.knowledge.api.search import router as search_router
from backend.app.knowledge.api.graph import router as graph_router
from backend.app.knowledge.api.sources import router as sources_router
from backend.app.knowledge.api.ingestion import router as ingestion_router
from backend.app.knowledge.api.admin import router as admin_router
from backend.app.document_processing.api.upload import router as document_processing_router
from backend.app.auth.routes import router as auth_router
from backend.app.legal.routes import router as legal_router
from backend.app.government.routes import router as government_router
from backend.app.cases.routes import router as cases_router
from backend.app.documents.routes import router as documents_router
from backend.app.agents.routes import router as agents_router
from backend.app.audit.routes import router as audit_router
from backend.app.common.init_db import init_models

logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("civicsphere.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Initializing {settings.APP_NAME} in [{settings.ENVIRONMENT}] mode...")
    # Initialize database models
    try:
        await asyncio.wait_for(init_models(), timeout=2.5)
    except Exception as e:
        logger.warning(f"Database table initialization notice: {e}")
    # Hydrate persistent knowledge from database (survives cold starts and serverless container lifecycles)
    from backend.app.knowledge.sources.registry import source_registry
    from backend.app.knowledge.graph.repository import graph_repository
    from backend.app.knowledge.ingestion.vector_writer import vector_store
    try:
        await asyncio.wait_for(source_registry.hydrate_from_db(), timeout=2.0)
        await asyncio.wait_for(graph_repository.hydrate_from_db(), timeout=2.0)
        await asyncio.wait_for(vector_store.hydrate_from_db(), timeout=2.0)
    except Exception as e:
        logger.warning(f"Notice: Knowledge persistence hydration: {e}")

    # Initialize seed data if database is empty
    if len(source_registry.list_sources()) == 0:
        try:
            from data.seed.seed_data import seed_knowledge_base
            logger.info("Auto-seeding verified knowledge base with core statutory acts...")
            await asyncio.wait_for(seed_knowledge_base(), timeout=3.5)
        except Exception as e:
            logger.warning(f"Knowledge base auto-seeding notice: {e}")

    # Auto-seed verified government schemes (LIVE-006)
    try:
        from backend.app.common.database import AsyncSessionLocal
        from data.seed.seed_government_services import seed_government_services
        async with AsyncSessionLocal() as session:
            await seed_government_services(session)
    except Exception as e:
        logger.warning(f"Government schemes auto-seeding notice: {e}")
    logger.info(f"Knowledge Engine ready. Currently holding {len(source_registry.list_sources())} registered sources, {len(graph_repository._nodes)} graph nodes, {len(vector_store._vectors)} vector records.")
    yield
    logger.info("Shutting down CivicSphere Unified Backend...")


app = FastAPI(
    title="CivicSphere AI — Unified Backend",
    version="1.0.0",
    description="Production-grade, modular-monolith backend powering CivicSphere AI.",
    lifespan=lifespan
)

from backend.app.common.rate_limiter import RateLimitMiddleware

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware, default_capacity=200, default_refill_rate=5.0)


# Server-Side CSRF Protection Middleware (LIVE-001)
@app.middleware("http")
async def csrf_protection_middleware(request: Request, call_next):
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        has_session_cookie = bool(request.cookies.get("access_token"))
        exempt_paths = {
            f"{settings.API_PREFIX}/auth/login",
            f"{settings.API_PREFIX}/auth/register",
            f"{settings.API_PREFIX}/auth/logout",
            f"{settings.API_PREFIX}/auth/mfa/verify",
            "/auth/login",
            "/auth/register",
            "/auth/logout",
            "/docs",
            "/openapi.json",
        }
        if has_session_cookie and request.url.path not in exempt_paths:
            # Validate Origin / Referer against allowed CORS origins
            origin = request.headers.get("origin") or request.headers.get("referer")
            if origin:
                parsed_origin = urlparse(origin)
                origin_base = f"{parsed_origin.scheme}://{parsed_origin.netloc}"
                allowed_origins = set(settings.ALLOWED_ORIGINS)
                is_allowed = (
                    origin_base in allowed_origins or
                    parsed_origin.hostname in ("127.0.0.1", "localhost", "civicsphere-web.vercel.app") or
                    "*" in allowed_origins
                )
                if not is_allowed:
                    logger.warning(f"[CSRF] Origin check failed for: {origin_base}")
                    return JSONResponse(
                        status_code=403,
                        content={
                            "success": False,
                            "error": {
                                "code": "CSRF_ORIGIN_DENIED",
                                "message": "Cross-origin state-changing request denied by CSRF policy."
                            }
                        }
                    )

            # Double-submit token validation
            csrf_header = request.headers.get("x-csrf-token")
            csrf_cookie = request.cookies.get("csrf_token")
            if not csrf_header or not csrf_cookie or not secrets.compare_digest(csrf_header, csrf_cookie):
                logger.warning(f"[CSRF] State-changing request to {request.url.path} rejected: token mismatch or missing.")
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "error": {
                            "code": "CSRF_VALIDATION_FAILED",
                            "message": "CSRF verification failed: Missing or invalid X-CSRF-Token."
                        }
                    }
                )

    return await call_next(request)


# Security Headers & Correlation Middleware (LIVE-011)
@app.middleware("http")
async def security_and_correlation_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
    request.state.request_id = req_id
    start_time = time.perf_counter()

    response = await call_next(request)

    process_time_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Request-Id"] = req_id
    response.headers["X-Process-Time-Ms"] = str(round(process_time_ms, 2))
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response


# Exception Handlers
app.add_exception_handler(CivicSphereException, civicsphere_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Register API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(legal_router, prefix=settings.API_PREFIX)
app.include_router(government_router, prefix=settings.API_PREFIX)
app.include_router(cases_router, prefix=settings.API_PREFIX)
app.include_router(documents_router, prefix=settings.API_PREFIX)
app.include_router(agents_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)
app.include_router(search_router, prefix=settings.API_PREFIX)
app.include_router(graph_router, prefix=settings.API_PREFIX)
app.include_router(sources_router, prefix=settings.API_PREFIX)
app.include_router(ingestion_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(document_processing_router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["Health"])
@app.get("/healthz", tags=["Health"])
@app.get(f"{settings.API_PREFIX}/health", tags=["Health"])
async def health_check():
    """Health check endpoint for liveness probes (canonical: /health, aliases: /healthz, /api/v1/health)."""
    return {"status": "HEALTHY", "service": "civicsphere_unified_backend", "timestamp": time.time()}


@app.get("/health/ready", tags=["Health"])
@app.get("/readyz", tags=["Health"])
@app.get(f"{settings.API_PREFIX}/health/ready", tags=["Health"])
async def readiness_check():
    """Readiness probe verifying vector and graph repository availability (canonical: /health/ready, aliases: /readyz, /api/v1/health/ready)."""
    from backend.app.knowledge.graph.repository import graph_repository
    from backend.app.knowledge.ingestion.vector_writer import vector_store
    return {
        "ready": True,
        "graph_nodes": len(graph_repository._nodes),
        "vector_records": len(vector_store._vectors),
        "persistence": "postgresql_pgvector" if "postgresql" in settings.DATABASE_URL else "sqlite_memory"
    }


