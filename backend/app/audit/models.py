"""
SQLAlchemy Models for Audit and Security Logging.
Provides persistent audit trail and tamper-evident event logging.
"""

from sqlalchemy import Column, String, DateTime, Text, JSON
from sqlalchemy.sql import func
import uuid
from typing import Dict, Any

from backend.app.common.database import Base


class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(100), nullable=False, index=True)
    actor_id = Column(String(100), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False, index=True)
    resource_id = Column(String(255), nullable=False, index=True)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type,
            "actor_id": self.actor_id,
            "role": self.role,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "details": self.details or {},
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class SecurityEventModel(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    threat_type = Column(String(100), nullable=False, index=True)  # PROMPT_INJECTION, SSRF, IDOR, CYCLIC_CYPHER, UNVERIFIED_CITATION
    severity = Column(String(50), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    actor_id = Column(String(100), nullable=True, index=True)
    endpoint = Column(String(255), nullable=False)
    payload_sample = Column(Text, nullable=True)
    action_taken = Column(String(50), nullable=False)  # BLOCKED, QUARANTINED, LOGGED
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "threat_type": self.threat_type,
            "severity": self.severity,
            "actor_id": self.actor_id,
            "endpoint": self.endpoint,
            "payload_sample": self.payload_sample,
            "action_taken": self.action_taken,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
