"""
SQLAlchemy Models for Intelligent Document Processing (Module D).
Stores uploaded documents and their structured AI analysis.
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
import uuid
from typing import Dict, Any

from backend.app.common.database import Base


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=True, index=True)
    
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False, default="application/pdf")
    file_size_bytes = Column(Integer, nullable=False, default=0)
    
    # 7-Stage Pipeline Status: UPLOADED, VALIDATING, SECURITY_SCANNING, PROCESSING, ANALYZING, LINKING_KNOWLEDGE, READY, BLOCKED, FAILED
    status = Column(String(50), default="UPLOADED", nullable=False, index=True)
    status_message = Column(String(255), default="")
    
    # Structured intelligence extracted by Module D
    analysis = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "case_id": self.case_id,
            "original_filename": self.original_filename,
            "storage_path": self.storage_path,
            "mime_type": self.mime_type,
            "file_size_bytes": self.file_size_bytes,
            "status": self.status,
            "status_message": self.status_message or "",
            "analysis": self.analysis or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
