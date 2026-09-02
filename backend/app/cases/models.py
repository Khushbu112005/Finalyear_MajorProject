"""
SQLAlchemy Models for Case Workspace.
Stores citizen cases, linked legal findings, government services, deadlines, timeline, and sources.
"""

from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
import uuid
from typing import Dict, Any

from backend.app.common.database import Base


class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    citizen_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    counsel_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    category = Column(String(100), default="General / Other", nullable=False)
    status = Column(String(50), default="OPEN", nullable=False, index=True)  # OPEN, IN_PROGRESS, CLOSED
    priority = Column(String(50), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH
    deadline = Column(DateTime(timezone=True), nullable=True)
    location = Column(String(255), default="")
    court_reference = Column(String(255), default="")
    counsel_notes = Column(Text, default="")
    
    # Linked domain intelligence (JSON structures for portable relational representation)
    legal_findings = Column(JSON, default=list)
    government_services = Column(JSON, default=list)
    deadlines = Column(JSON, default=list)
    timeline = Column(JSON, default=list)
    sources = Column(JSON, default=list)
    processing_history = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "citizen_id": self.citizen_id,
            "counsel_id": self.counsel_id,
            "category": self.category,
            "status": self.status,
            "priority": self.priority,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "location": self.location or "",
            "court_reference": self.court_reference or "",
            "counsel_notes": self.counsel_notes or "",
            "legal_findings": self.legal_findings or [],
            "government_services": self.government_services or [],
            "deadlines": self.deadlines or [],
            "timeline": self.timeline or [],
            "sources": self.sources or [],
            "processing_history": self.processing_history or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
