"""
Audit & Observability API Routes (Phase 10).
Provides authorized admins with real-time access to tamper-evident audit logs and security telemetry.
"""

from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, List, Optional

from packages.schemas.contracts import ApiResponse
from backend.app.auth.models import UserModel
from backend.app.auth.dependencies import require_role
from backend.app.common.audit import AuditManager

router = APIRouter(prefix="/audit", tags=["Audit & Observability"])


@router.get("/events", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_audit_events(
    event_type: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=100),
    current_user: UserModel = Depends(require_role(["ADMIN"])),
):
    """Returns recent system audit events (Admin only)."""
    events = AuditManager.list_events(event_type=event_type, limit=limit)
    return ApiResponse(data=[e.model_dump() for e in events], confidence=1.0)


@router.get("/security-events", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_security_events(
    threat_type: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=100),
    current_user: UserModel = Depends(require_role(["ADMIN"])),
):
    """Returns recent security threat events and blocks (Admin only)."""
    events = AuditManager.list_security_events(threat_type=threat_type, limit=limit)
    return ApiResponse(data=[e.model_dump() for e in events], confidence=1.0)
