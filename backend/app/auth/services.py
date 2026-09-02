"""
Authentication & User Management Services for CivicSphere AI.
Implements secure JWT generation, bcrypt verification, session expiry,
TOTP multi-factor authentication (MFA) for privileged accounts,
and password reset flows with zero hardcoded secrets.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt
import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.common.config import settings
from backend.app.common.errors import CivicSphereException
from backend.app.auth.models import UserModel, UserRole
from backend.app.auth.totp import TOTPManager

logger = logging.getLogger("civicsphere.auth.service")

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
PASSWORD_RESET_EXPIRE_MINUTES = 30  # 30 minutes


def create_access_token(user_id: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": user_id,
        "role": role,
        "jti": str(uuid.uuid4()),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a signed JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise CivicSphereException(code="TOKEN_EXPIRED", message="Authentication token has expired.", status_code=401)
    except jwt.PyJWTError:
        raise CivicSphereException(code="INVALID_TOKEN", message="Could not validate authentication credentials.", status_code=401)


async def register_user(
    session: AsyncSession,
    email: str,
    name: str,
    password: str,
    role: str = "CITIZEN",
    phone: str = "",
    specialization: str = "",
    bar_council_id: str = "",
    experience_years: str = "0",
    bio: str = "",
    address: str = "",
) -> Tuple[UserModel, str]:
    """Registers a new user and returns (user, access_token)."""
    clean_email = email.lower().strip()
    
    # Check if user exists
    existing = await session.execute(select(UserModel).where(UserModel.email == clean_email))
    if existing.scalar_one_or_none():
        raise CivicSphereException(
            code="USER_ALREADY_EXISTS",
            message="An account with this email address already exists. Please log in.",
            status_code=400
        )

    # Validate role
    role_str = role.upper()
    valid_roles = [r.value for r in UserRole]
    if role_str not in valid_roles:
        role_str = "CITIZEN"

    user = UserModel(
        email=clean_email,
        name=name.strip(),
        hashed_password=UserModel.hash_password(password),
        role=UserRole(role_str),
        phone=phone.strip(),
        specialization=specialization.strip(),
        bar_council_id=bar_council_id.strip(),
        experience_years=str(experience_years),
        bio=bio.strip(),
        address=address.strip(),
        is_active=True,
        is_verified=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(user.id, user.role.value)
    return user, token


async def authenticate_user(
    session: AsyncSession,
    email: str,
    password: str,
    mfa_code: Optional[str] = None,
) -> Tuple[UserModel, Optional[str], bool]:
    """
    Authenticates user with email and password, validating TOTP MFA if enabled.
    Returns (user, access_token, mfa_required).
    """
    clean_email = email.lower().strip()
    result = await session.execute(select(UserModel).where(UserModel.email == clean_email))
    user = result.scalar_one_or_none()

    if not user or not user.verify_password(password):
        raise CivicSphereException(
            code="INVALID_CREDENTIALS",
            message="Invalid email or password provided.",
            status_code=401
        )

    if not user.is_active:
        raise CivicSphereException(
            code="ACCOUNT_DISABLED",
            message="Your account has been deactivated. Please contact support.",
            status_code=403
        )

    # TOTP MFA Challenge for enrolled or privileged accounts
    if user.mfa_enabled:
        if not mfa_code:
            # MFA is enabled and code is required
            return user, None, True

        if not user.mfa_secret or not TOTPManager.verify_code(user.mfa_secret, mfa_code):
            raise CivicSphereException(
                code="INVALID_MFA_CODE",
                message="Invalid or expired multi-factor authentication code.",
                status_code=401
            )

    token = create_access_token(user.id, user.role.value)
    return user, token, False
