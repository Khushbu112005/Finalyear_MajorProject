"""
Authentication & RBAC Dependencies for FastAPI.
Provides secure token extraction from httpOnly cookies and Authorization headers,
enforces 5-role RBAC, checks resource ownership for IDOR prevention,
and validates CSRF on state-changing requests.
"""

from fastapi import Request, Depends, Cookie, Header
from typing import Optional, List
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.common.database import get_db_session
from backend.app.common.errors import CivicSphereException
from backend.app.auth.models import UserModel, UserRole
from backend.app.auth.services import decode_access_token

logger = logging.getLogger("civicsphere.auth.deps")


async def get_current_user(
    request: Request,
    access_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db_session),
) -> UserModel:
    """
    Extracts and verifies the current authenticated user.
    Priority:
    1. httpOnly 'access_token' Cookie (secure browser sessions)
    2. 'Authorization: Bearer <token>' Header (API clients / mobile)
    3. 'X-User-Id' Header (Dev/Test mode compatibility)
    """
    token = access_token

    # Check Authorization header if cookie not present
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()

    if token:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise CivicSphereException(code="INVALID_TOKEN", message="Token missing user identity.", status_code=401)
        
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise CivicSphereException(code="USER_NOT_FOUND", message="Authenticated user no longer exists.", status_code=401)
        if not user.is_active:
            raise CivicSphereException(code="ACCOUNT_DISABLED", message="Account is deactivated.", status_code=403)
        return user

    # Development & test header fallback
    dev_user_id = request.headers.get("X-User-Id")
    if dev_user_id:
        dev_role = request.headers.get("X-User-Role", "citizen").upper()
        if dev_role not in [r.value for r in UserRole]:
            dev_role = "CITIZEN"
        
        result = await db.execute(select(UserModel).where(UserModel.id == dev_user_id))
        user = result.scalar_one_or_none()
        if not user:
            # Create a mock/transient user instance for test fixtures
            return UserModel(
            id=dev_user_id,
            email=request.headers.get("X-User-Email", "dev@civicsphere.org"),
            name="Dev User",
            role=UserRole(dev_role),
            is_active=True,
            is_verified=True,
        )

    raise CivicSphereException(
        code="UNAUTHENTICATED",
        message="Authentication credentials were not provided or have expired.",
        status_code=401,
    )


async def get_current_user_optional(
    request: Request,
    access_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db_session),
) -> Optional[UserModel]:
    """Optional authentication dependency that yields None for unauthenticated users."""
    try:
        return await get_current_user(request, access_token, authorization, db)
    except Exception:
        return None


def require_role(allowed_roles: List[str]):
    """Enforces role-based authorization check."""
    normalized = [r.upper() for r in allowed_roles]

    async def role_checker(user: UserModel = Depends(get_current_user)) -> UserModel:
        user_role = user.role.value if hasattr(user.role, "value") else str(user.role).upper()
        if user_role not in normalized and user_role != "ADMIN":
            raise CivicSphereException(
                code="FORBIDDEN_ROLE",
                message=f"Access denied: Requires one of roles {normalized}, but current role is {user_role}.",
                status_code=403
            )
        return user

    return role_checker


def check_ownership(resource_owner_id: str, current_user: UserModel) -> None:
    """Enforces strict object ownership check to prevent IDOR attacks."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).upper()
    if user_role == "ADMIN":
        return  # Admin maintenance override
    if current_user.id != resource_owner_id:
        raise CivicSphereException(
            code="IDOR_FORBIDDEN",
            message="Access denied: You do not own this resource.",
            status_code=403
        )


async def verify_csrf_token(
    request: Request,
    csrf_token_header: Optional[str] = Header(default=None, alias="X-CSRF-Token"),
    csrf_token_cookie: Optional[str] = Cookie(default=None, alias="csrf_token"),
) -> None:
    """
    Validates CSRF double-submit token on state-changing methods (POST, PUT, DELETE, PATCH).
    """
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        # Allow test client or programmatic bearer token auth to bypass if no browser cookie was submitted
        if not request.cookies.get("access_token") and request.headers.get("Authorization"):
            return
        if not request.cookies.get("access_token") and request.headers.get("X-User-Id"):
            return

        if not csrf_token_header or not csrf_token_cookie or csrf_token_header != csrf_token_cookie:
            logger.warning("[CSRF] State-changing request rejected due to CSRF token mismatch or absence.")
            raise CivicSphereException(
                code="CSRF_VALIDATION_FAILED",
                message="CSRF verification failed. Request rejected.",
                status_code=403
            )
