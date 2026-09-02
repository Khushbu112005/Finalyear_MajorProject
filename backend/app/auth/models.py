"""
SQLAlchemy Models for Authentication and RBAC (Module Auth).
Supports the 5 canonical roles: CITIZEN, ADMIN, KNOWLEDGE_EDITOR, REVIEWER, RESEARCHER.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
import uuid
import bcrypt
from typing import Dict, Any

from backend.app.common.database import Base


class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    ADMIN = "ADMIN"
    KNOWLEDGE_EDITOR = "KNOWLEDGE_EDITOR"
    REVIEWER = "REVIEWER"
    RESEARCHER = "RESEARCHER"


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CITIZEN, nullable=False, index=True)
    phone = Column(String(50), default="")
    specialization = Column(String(255), default="")
    bar_council_id = Column(String(100), default="")
    experience_years = Column(String(20), default="0")
    bio = Column(String(1000), default="")
    address = Column(String(500), default="")
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash plain text password with bcrypt."""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(self, password: str) -> bool:
        """Verify plain text password against stored hash."""
        return bcrypt.checkpw(password.encode("utf-8"), self.hashed_password.encode("utf-8"))

    def to_safe_dict(self) -> Dict[str, Any]:
        """Return public dictionary without sensitive password or MFA secrets."""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role.value if hasattr(self.role, "value") else str(self.role),
            "phone": self.phone or "",
            "specialization": self.specialization or "",
            "bar_council_id": self.bar_council_id or "",
            "experience_years": self.experience_years or "0",
            "bio": self.bio or "",
            "address": self.address or "",
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "mfa_enabled": self.mfa_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
