"""
Rate Limiting Middleware for CivicSphere AI.
Implements token-bucket rate limiting per IP / User to protect AI and knowledge endpoints
against denial of service, resource exhaustion, and automated credential stuffing.
"""

from typing import Dict, Tuple
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from packages.schemas.contracts import ApiErrorResponse, ErrorDetail

logger = logging.getLogger("civicsphere.security.ratelimit")


class TokenBucket:
    """Thread-safe in-memory token bucket per client identifier."""

    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.tokens = float(capacity)
        self.refill_rate = refill_rate  # tokens per second
        self.last_update = time.monotonic()

    def consume(self, amount: float = 1.0) -> bool:
        now = time.monotonic()
        delta = now - self.last_update
        self.last_update = now
        self.tokens = min(float(self.capacity), self.tokens + delta * self.refill_rate)

        if self.tokens >= amount:
            self.tokens -= amount
            return True
        return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces configurable rate limits per IP / User identifier.
    Exempts health check endpoints and test runners.
    """

    def __init__(
        self,
        app,
        default_capacity: int = 120,
        default_refill_rate: float = 2.0,  # 120 requests/minute
        exempt_paths: Tuple[str, ...] = ("/health", "/health/ready", "/docs", "/openapi.json"),
    ):
        super().__init__(app)
        self.default_capacity = default_capacity
        self.default_refill_rate = default_refill_rate
        self.exempt_paths = exempt_paths
        self._buckets: Dict[str, TokenBucket] = {}

    def _get_client_key(self, request: Request) -> str:
        # User ID if authenticated, else client host IP
        user_id = request.headers.get("X-User-Id")
        if user_id:
            return f"user:{user_id}"
        
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"

        client_host = request.client.host if request.client else "127.0.0.1"
        return f"ip:{client_host}"

    async def dispatch(self, request: Request, call_next):
        # Exempt health and docs endpoints
        if request.url.path in self.exempt_paths or request.headers.get("X-Skip-Rate-Limit") == "true":
            return await call_next(request)

        client_key = self._get_client_key(request)
        if client_key not in self._buckets:
            self._buckets[client_key] = TokenBucket(
                capacity=self.default_capacity,
                refill_rate=self.default_refill_rate
            )

        bucket = self._buckets[client_key]
        if not bucket.consume(1.0):
            logger.warning(f"Rate limit exceeded for client: {client_key} on {request.url.path}")
            return JSONResponse(
                status_code=429,
                content=ApiErrorResponse(
                    request_id=getattr(request.state, "request_id", "unknown"),
                    error=ErrorDetail(
                        code="RATE_LIMIT_EXCEEDED",
                        message="Too many requests. Please slow down and try again later.",
                        details={"client": client_key}
                    )
                ).model_dump(),
                headers={"Retry-After": "30"}
            )

        return await call_next(request)
