"""
SQLAlchemy Models for Government Service Navigator (Module B).
Stores verified government services, eligibility rules, and procedural steps.
"""

from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON
from sqlalchemy.sql import func
from typing import Dict, Any

from backend.app.common.database import Base


class GovernmentServiceModel(Base):
    __tablename__ = "government_services"

    service_id = Column(String(100), primary_key=True)
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(255), nullable=False, index=True)
    ministry = Column(String(255), nullable=True)
    jurisdiction = Column(String(50), default="IN", nullable=False, index=True)
    state = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    
    # Structured procedural intelligence
    eligibility_rules = Column(JSON, default=list)
    required_documents = Column(JSON, default=list)
    application_methods = Column(JSON, default=list)  # ["ONLINE", "OFFLINE"]
    procedure_steps = Column(JSON, default=list)
    
    # Official Provenance & Portals
    official_portal = Column(String(500), nullable=True)
    grievance_portal = Column(String(500), nullable=True)
    appeal_authority = Column(String(255), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    source_version = Column(Integer, default=1, nullable=False)
    verification_status = Column(String(50), default="ACTIVE", nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "service_id": self.service_id,
            "title": self.title,
            "department": self.department,
            "ministry": self.ministry,
            "jurisdiction": self.jurisdiction,
            "state": self.state,
            "description": self.description,
            "category": self.category,
            "eligibility_rules": self.eligibility_rules or [],
            "required_documents": self.required_documents or [],
            "application_methods": self.application_methods or [],
            "procedure_steps": self.procedure_steps or [],
            "official_portal": self.official_portal,
            "grievance_portal": self.grievance_portal,
            "appeal_authority": self.appeal_authority,
            "last_verified_at": self.last_verified_at.isoformat() if self.last_verified_at else None,
            "source_version": self.source_version,
            "verification_status": self.verification_status,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
