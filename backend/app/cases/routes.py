"""
Case Workspace API Routes.
Provides full CRUD, assignment, IDOR protection, and cross-module intelligence linking.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from packages.schemas.contracts import ApiResponse
from backend.app.common.database import get_db_session
from backend.app.common.errors import CivicSphereException
from backend.app.auth.models import UserModel, UserRole
from backend.app.auth.dependencies import get_current_user, check_ownership
from backend.app.cases.models import CaseModel

router = APIRouter(prefix="/cases", tags=["Case Management & Workspace"])


class CreateCaseRequest(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=5)
    category: Optional[str] = "General / Other"
    priority: Optional[str] = "MEDIUM"
    location: Optional[str] = ""
    court_reference: Optional[str] = ""
    deadline: Optional[str] = None
    counsel_id: Optional[str] = None


class UpdateCaseRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    location: Optional[str] = None
    court_reference: Optional[str] = None
    counsel_notes: Optional[str] = None
    deadline: Optional[str] = None


class AssignCaseRequest(BaseModel):
    counsel_id: Optional[str] = None


@router.get("", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_cases(
    status: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Lists cases with role-based visibility rules (Citizens see own; Researchers see assigned/open)."""
    stmt = select(CaseModel)
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).upper()

    if user_role == "CITIZEN":
        stmt = stmt.where(CaseModel.citizen_id == current_user.id)
    elif user_role in ("RESEARCHER", "REVIEWER"):
        stmt = stmt.where(
            or_(
                CaseModel.counsel_id == current_user.id,
                (CaseModel.counsel_id == None) & (CaseModel.status == "OPEN")
            )
        )
    # Admin sees all cases

    if status and status != "ALL":
        stmt = stmt.where(CaseModel.status == status)
    if priority and priority != "ALL":
        stmt = stmt.where(CaseModel.priority == priority)
    if category and category != "ALL":
        stmt = stmt.where(CaseModel.category == category)
    if search:
        stmt = stmt.where(
            or_(
                CaseModel.title.ilike(f"%{search}%"),
                CaseModel.description.ilike(f"%{search}%")
            )
        )

    stmt = stmt.order_by(CaseModel.created_at.desc())
    res = await db.execute(stmt)
    cases = [c.to_dict() for c in res.scalars().all()]
    return ApiResponse(data=cases, confidence=1.0)


@router.get("/{case_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_case_by_id(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Fetches a single case with strict ownership and authorization check."""
    res = await db.execute(select(CaseModel).where(CaseModel.id == case_id))
    case = res.scalar_one_or_none()
    if not case:
        raise CivicSphereException(code="CASE_NOT_FOUND", message="Case not found.", status_code=404)

    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).upper()
    if user_role == "CITIZEN" and case.citizen_id != current_user.id:
        raise CivicSphereException(code="IDOR_FORBIDDEN", message="Access denied: You do not own this case.", status_code=403)
    if user_role in ("RESEARCHER", "REVIEWER"):
        if case.counsel_id and case.counsel_id != current_user.id:
            raise CivicSphereException(code="FORBIDDEN", message="Access denied: Case assigned to other counsel.", status_code=403)

    return ApiResponse(data=case.to_dict(), confidence=1.0)


@router.post("", response_model=ApiResponse[Dict[str, Any]])
async def create_case(
    payload: CreateCaseRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Creates a new case owned by the current citizen."""
    deadline_dt = None
    if payload.deadline:
        try:
            deadline_dt = datetime.fromisoformat(payload.deadline)
        except Exception:
            pass

    new_case = CaseModel(
        title=payload.title,
        description=payload.description,
        citizen_id=current_user.id,
        counsel_id=payload.counsel_id,
        category=payload.category or "General / Other",
        priority=payload.priority or "MEDIUM",
        location=payload.location or "",
        court_reference=payload.court_reference or "",
        deadline=deadline_dt,
        status="OPEN",
    )
    db.add(new_case)
    await db.commit()
    await db.refresh(new_case)

    return ApiResponse(data=new_case.to_dict(), confidence=1.0)


@router.put("/{case_id}", response_model=ApiResponse[Dict[str, Any]])
async def update_case(
    case_id: str,
    payload: UpdateCaseRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Updates case details with ownership authorization check."""
    res = await db.execute(select(CaseModel).where(CaseModel.id == case_id))
    case = res.scalar_one_or_none()
    if not case:
        raise CivicSphereException(code="CASE_NOT_FOUND", message="Case not found.", status_code=404)

    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).upper()
    if user_role == "CITIZEN":
        if case.citizen_id != current_user.id:
            raise CivicSphereException(code="IDOR_FORBIDDEN", message="Access denied: You do not own this case.", status_code=403)
        if payload.title is not None:
            case.title = payload.title
        if payload.description is not None:
            case.description = payload.description
        if payload.category is not None:
            case.category = payload.category
        if payload.priority is not None:
            case.priority = payload.priority
        if payload.location is not None:
            case.location = payload.location
        if payload.court_reference is not None:
            case.court_reference = payload.court_reference
        if payload.status is not None:
            case.status = payload.status
    elif user_role in ("RESEARCHER", "REVIEWER"):
        if case.counsel_id and case.counsel_id != current_user.id:
            raise CivicSphereException(code="FORBIDDEN", message="Access denied: Not assigned counsel.", status_code=403)
        if payload.counsel_notes is not None:
            case.counsel_notes = payload.counsel_notes
        if payload.status is not None:
            case.status = payload.status

    await db.commit()
    await db.refresh(case)
    return ApiResponse(data=case.to_dict(), confidence=1.0)


@router.delete("/{case_id}", response_model=ApiResponse[Dict[str, Any]])
async def delete_case(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Deletes a case owned by the current citizen if it is not in progress."""
    res = await db.execute(select(CaseModel).where(CaseModel.id == case_id))
    case = res.scalar_one_or_none()
    if not case:
        raise CivicSphereException(code="CASE_NOT_FOUND", message="Case not found.", status_code=404)

    check_ownership(case.citizen_id, current_user)

    if case.status == "IN_PROGRESS":
        raise CivicSphereException(
            code="CASE_IN_PROGRESS",
            message="Cannot delete a case currently in progress with counsel.",
            status_code=400
        )

    await db.delete(case)
    await db.commit()
    return ApiResponse(data={"message": "Case deleted successfully."}, confidence=1.0)
