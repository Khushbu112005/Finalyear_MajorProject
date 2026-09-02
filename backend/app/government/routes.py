"""
Government Service Navigator API Routes.
Provides problem analysis, service search, eligibility checking, and procedure retrieval.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.schemas.contracts import ApiResponse
from backend.app.common.database import get_db_session
from backend.app.common.errors import CivicSphereException
from backend.app.government.models import GovernmentServiceModel
from backend.app.government.services.ai_service import GovernmentAIService
from backend.app.government.services.eligibility import check_eligibility
from backend.app.government.services.recommendation import recommend_services

router = APIRouter(prefix="/government", tags=["Government Service Navigator"])


class AnalyzeProblemRequest(BaseModel):
    problem_text: str = Field(min_length=5, description="Citizen's civic or government service issue")
    citizen_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    jurisdiction: Optional[str] = "IN"


class CheckEligibilityRequest(BaseModel):
    service_id: str
    citizen_context: Dict[str, Any]


@router.post("/analyze", response_model=ApiResponse[Dict[str, Any]])
async def analyze_problem(
    payload: AnalyzeProblemRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """Analyzes a citizen's civic query, extracts parameters, and recommends eligible schemes."""
    analysis = await GovernmentAIService.analyze_problem(
        problem_text=payload.problem_text,
        citizen_context=payload.citizen_context
    )

    recommendations = await recommend_services(
        db=db,
        query=payload.problem_text,
        citizen_context=payload.citizen_context,
        category=analysis.get("category"),
        jurisdiction=payload.jurisdiction or "IN",
        top_k=5
    )

    return ApiResponse(
        data={
            "analysis": analysis,
            "services": recommendations,
        },
        confidence=0.92 if recommendations else 0.50,
    )


@router.get("/services", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_services(
    category: Optional[str] = Query(default=None),
    jurisdiction: Optional[str] = Query(default="IN"),
    db: AsyncSession = Depends(get_db_session),
):
    """Returns catalog of verified government services."""
    stmt = select(GovernmentServiceModel).where(GovernmentServiceModel.jurisdiction == jurisdiction)
    if category:
        stmt = stmt.where(GovernmentServiceModel.category == category)

    res = await db.execute(stmt)
    services = [s.to_dict() for s in res.scalars().all()]
    return ApiResponse(data=services, confidence=1.0)


@router.get("/services/{service_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_service_details(
    service_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Fetches full procedural steps, documents, and eligibility rules for a specific service."""
    res = await db.execute(select(GovernmentServiceModel).where(GovernmentServiceModel.service_id == service_id))
    svc = res.scalar_one_or_none()
    if not svc:
        raise CivicSphereException(code="SERVICE_NOT_FOUND", message=f"Service '{service_id}' not found.", status_code=404)
    return ApiResponse(data=svc.to_dict(), confidence=1.0)


@router.post("/check-eligibility", response_model=ApiResponse[Dict[str, Any]])
async def check_service_eligibility(
    payload: CheckEligibilityRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """Checks citizen eligibility for a specific government service."""
    res = await db.execute(select(GovernmentServiceModel).where(GovernmentServiceModel.service_id == payload.service_id))
    svc = res.scalar_one_or_none()
    if not svc:
        raise CivicSphereException(code="SERVICE_NOT_FOUND", message=f"Service '{payload.service_id}' not found.", status_code=404)

    eligibility = check_eligibility(svc.eligibility_rules or [], payload.citizen_context)
    return ApiResponse(data={"service_id": payload.service_id, "eligibility": eligibility}, confidence=1.0)
