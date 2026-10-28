with open('backend/app/main.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports
import_target = "from contextlib import asynccontextmanager\nimport uuid\nimport time\nimport logging"
import_replacement = """from contextlib import asynccontextmanager
import uuid
import time
import logging
import secrets
from urllib.parse import urlparse
from starlette.responses import JSONResponse"""

text = text.replace(import_target, import_replacement)

# 2. Government services seeding in lifespan
seed_target = """    # Initialize seed data if database is empty
    if len(source_registry.list_sources()) == 0:
        try:
            from data.seed.seed_data import seed_knowledge_base
            logger.info("Auto-seeding verified knowledge base with core statutory acts...")
            await seed_knowledge_base()
        except Exception as e:
            logger.warning(f"Knowledge base auto-seeding notice: {e}")"""

seed_replacement = """    # Initialize seed data if database is empty
    if len(source_registry.list_sources()) == 0:
        try:
            from data.seed.seed_data import seed_knowledge_base
            logger.info("Auto-seeding verified knowledge base with core statutory acts...")
            await seed_knowledge_base()
        except Exception as e:
            logger.warning(f"Knowledge base auto-seeding notice: {e}")

    # Auto-seed verified government schemes (LIVE-006)
    try:
        from backend.app.common.database import AsyncSessionLocal
        from data.seed.seed_government_services import seed_government_services
        async with AsyncSessionLocal() as session:
            await seed_government_services(session)
    except Exception as e:
        logger.warning(f"Government schemes auto-seeding notice: {e}")"""

text = text.replace(seed_target, seed_replacement)

# 3. Security headers and CSRF middleware
sec_target = """# Security Headers & Correlation Middleware
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
    return response"""

sec_replacement = """# Server-Side CSRF Protection Middleware (LIVE-001)
@app.middleware("http")
async def csrf_protection_middleware(request: Request, call_next):
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        has_session_cookie = bool(request.cookies.get("access_token"))
        exempt_paths = {
            f"{settings.API_PREFIX}/auth/login",
            f"{settings.API_PREFIX}/auth/register",
            f"{settings.API_PREFIX}/auth/mfa/verify",
            "/auth/login",
            "/auth/register",
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
    return response"""

text = text.replace(sec_target, sec_replacement)

with open('backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated backend/app/main.py successfully")
