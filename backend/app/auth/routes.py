"""
Authentication API Endpoints.
Provides register, login, logout, profile update, session inspection,
and TOTP multi-factor authentication (MFA) lifecycle endpoints.
Uses secure httpOnly cookies with CSRF double-submit token protection.
"""

from fastapi import APIRouter, Depends, Response, Request
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
import secrets
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.schemas.contracts import ApiResponse
from backend.app.common.database import get_db_session
from backend.app.common.errors import CivicSphereException
from backend.app.auth.models import UserModel, UserRole
from backend.app.auth.services import register_user, authenticate_user, create_access_token
from backend.app.auth.dependencies import get_current_user
from backend.app.auth.totp import TOTPManager

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Optional[str] = "CITIZEN"
    phone: Optional[str] = ""
    specialization: Optional[str] = ""
    bar_council_id: Optional[str] = ""
    experience_years: Optional[str] = "0"
    bio: Optional[str] = ""
    address: Optional[str] = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: Optional[str] = None


class MFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    issuer: str = "CivicSphere AI"


class MFAVerifyRequest(BaseModel):
    secret: str
    code: str


class MFADisableRequest(BaseModel):
    password: str
    code: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    specialization: Optional[str] = None
    bar_council_id: Optional[str] = None
    experience_years: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


def _set_auth_cookies(response: Response, token: str) -> str:
    """Sets secure httpOnly cookie and returns a CSRF token."""
    csrf_token = secrets.token_hex(32)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=60 * 60 * 24,  # 24 hours
        path="/",
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,  # Readable by frontend client to set X-CSRF-Token header
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24,
        path="/",
    )
    return csrf_token


@router.post("/register", response_model=ApiResponse[Dict[str, Any]])
async def register(
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db_session)
):
    """Registers a new citizen or researcher account."""
    user, token = await register_user(
        session=db,
        email=payload.email,
        name=payload.name,
        password=payload.password,
        role=payload.role or "CITIZEN",
        phone=payload.phone or "",
        specialization=payload.specialization or "",
        bar_council_id=payload.bar_council_id or "",
        experience_years=payload.experience_years or "0",
        bio=payload.bio or "",
        address=payload.address or "",
    )
    csrf_token = _set_auth_cookies(response, token)
    return ApiResponse(
        data={"user": user.to_safe_dict(), "csrf_token": csrf_token},
        confidence=1.0,
    )


@router.post("/login", response_model=ApiResponse[Dict[str, Any]])
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db_session)
):
    """Authenticates citizen or privileged user with optional TOTP MFA challenge."""
    user, token, mfa_required = await authenticate_user(
        session=db,
        email=payload.email,
        password=payload.password,
        mfa_code=payload.mfa_code,
    )

    if mfa_required:
        return ApiResponse(
            data={"mfa_required": True, "user_id": user.id, "email": user.email},
            confidence=1.0,
            warnings=["MFA verification required to complete authentication."]
        )

    csrf_token = _set_auth_cookies(response, token)
    return ApiResponse(
        data={"user": user.to_safe_dict(), "csrf_token": csrf_token, "mfa_required": False},
        confidence=1.0,
    )


@router.post("/mfa/setup", response_model=ApiResponse[MFASetupResponse])
async def setup_mfa(
    current_user: UserModel = Depends(get_current_user),
):
    """Generates a new TOTP secret and QR provisioning URI for the authenticated account."""
    secret = TOTPManager.generate_secret()
    provisioning_uri = TOTPManager.get_provisioning_uri(secret, current_user.email)
    return ApiResponse(
        data=MFASetupResponse(
            secret=secret,
            provisioning_uri=provisioning_uri,
        ),
        confidence=1.0,
    )


@router.post("/mfa/verify", response_model=ApiResponse[Dict[str, Any]])
async def verify_and_enable_mfa(
    payload: MFAVerifyRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Verifies the initial TOTP code to activate MFA protection on the account."""
    if not TOTPManager.verify_code(payload.secret, payload.code):
        raise CivicSphereException(
            code="INVALID_MFA_CODE",
            message="Invalid or expired TOTP code. Please verify time synchronization and try again.",
            status_code=400
        )

    current_user.mfa_enabled = True
    current_user.mfa_secret = payload.secret
    await db.commit()
    await db.refresh(current_user)

    return ApiResponse(
        data={"mfa_enabled": True, "message": "Multi-factor authentication enabled successfully."},
        confidence=1.0,
    )


@router.post("/mfa/disable", response_model=ApiResponse[Dict[str, Any]])
async def disable_mfa(
    payload: MFADisableRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Disables MFA protection with mandatory password and TOTP challenge verification."""
    if not current_user.verify_password(payload.password):
        raise CivicSphereException(
            code="PASSWORD_MISMATCH",
            message="Password verification failed.",
            status_code=400
        )

    if current_user.mfa_secret and not TOTPManager.verify_code(current_user.mfa_secret, payload.code):
        raise CivicSphereException(
            code="INVALID_MFA_CODE",
            message="Invalid TOTP code.",
            status_code=400
        )

    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    await db.commit()
    await db.refresh(current_user)

    return ApiResponse(
        data={"mfa_enabled": False, "message": "Multi-factor authentication disabled."},
        confidence=1.0,
    )


@router.post("/logout", response_model=ApiResponse[Dict[str, Any]])
async def logout(response: Response):
    """Clears authentication session cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="csrf_token", path="/")
    return ApiResponse(data={"message": "Logged out successfully."}, confidence=1.0)


@router.get("/me", response_model=ApiResponse[Dict[str, Any]])
async def get_me(current_user: UserModel = Depends(get_current_user)):
    """Returns profile of currently authenticated user."""
    return ApiResponse(data={"user": current_user.to_safe_dict()}, confidence=1.0)


@router.put("/profile", response_model=ApiResponse[Dict[str, Any]])
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Updates user profile and credentials securely."""
    if payload.name is not None:
        current_user.name = payload.name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.address is not None:
        current_user.address = payload.address
    if payload.specialization is not None:
        current_user.specialization = payload.specialization
    if payload.bar_council_id is not None:
        current_user.bar_council_id = payload.bar_council_id
    if payload.experience_years is not None:
        current_user.experience_years = payload.experience_years

    # Password update
    if payload.current_password and payload.new_password:
        if not current_user.verify_password(payload.current_password):
            raise CivicSphereException(code="PASSWORD_MISMATCH", message="Current password does not match.", status_code=400)
        current_user.hashed_password = UserModel.hash_password(payload.new_password)

    await db.commit()
    await db.refresh(current_user)
    return ApiResponse(data={"user": current_user.to_safe_dict(), "message": "Profile updated."}, confidence=1.0)
