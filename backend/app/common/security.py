"""
Security context and authorization utilities.
Provides role checks, tenant isolation, and IDOR protection.
"""

from typing import Optional, List
from fastapi import Request, Depends
from pydantic import BaseModel, Field

from backend.app.common.errors import UnauthorizedException, ForbiddenException


from backend.app.common.config import settings
from backend.app.auth.services import decode_access_token


class AuthContext(BaseModel):
    user_id: str
    email: str
    role: str = "citizen"  # citizen, legal_researcher, admin, system
    tenant_id: Optional[str] = None
    scopes: List[str] = Field(default_factory=list)


def get_current_user_context(request: Request) -> AuthContext:
    """
    Extracts authenticated user context with cryptographic verification.
    Prioritizes verified Bearer JWT tokens and httpOnly access_token cookies.
    In production, spoofed client headers are strictly rejected without a valid token.
    In test/dev, test fixture headers are permitted as a fallback.
    """
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if token:
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub", "")
            role = payload.get("role", "citizen").lower()
            return AuthContext(
                user_id=user_id,
                email=payload.get("email", f"{user_id}@civicsphere.org"),
                role=role,
                tenant_id=payload.get("tenant_id"),
                scopes=payload.get("scopes", ["read:knowledge", "search:knowledge"])
            )
        except Exception:
            raise UnauthorizedException("Invalid or expired authentication credentials.")

    # Strict check: In production, unauthenticated requests with spoofed headers must NEVER be trusted
    if settings.ENVIRONMENT == "production":
        raise UnauthorizedException("Authentication credentials required. Please provide a valid Bearer token or session cookie.")

    # Safe development/testing fallback for fixtures
    user_id = request.headers.get("X-User-Id", "usr_civic_default_1")
    email = request.headers.get("X-User-Email", "citizen@civicsphere.org")
    role = request.headers.get("X-User-Role", "citizen").lower()
    tenant_id = request.headers.get("X-Tenant-Id", None)
    
    return AuthContext(
        user_id=user_id,
        email=email,
        role=role,
        tenant_id=tenant_id,
        scopes=["read:knowledge", "search:knowledge"]
    )


def require_role(allowed_roles: List[str]):
    """Enforces role-based authorization on route dependencies."""
    def role_checker(auth: AuthContext = Depends(get_current_user_context)) -> AuthContext:
        if auth.role not in allowed_roles:
            raise ForbiddenException(
                f"Role '{auth.role}' is not authorized. Required: {allowed_roles}"
            )
        return auth
    return role_checker


def check_object_ownership(auth: AuthContext, resource_owner_id: Optional[str], resource_type: str = "resource") -> None:
    """
    IDOR Prevention: Validates that the requesting user owns the object or is an admin.
    """
    if auth.role == "admin" or auth.role == "system":
        return
    if resource_owner_id and resource_owner_id != auth.user_id:
        raise ForbiddenException(
            f"Access denied to {resource_type}: unauthorized entity access."
        )
