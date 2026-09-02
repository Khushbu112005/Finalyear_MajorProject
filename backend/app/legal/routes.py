"""
Legal Guidance API Routes (Module A).
Provides structured statutory query endpoints grounded on Module C verified evidence.
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any, List

from packages.schemas.contracts import (
    ApiResponse,
    LegalQuery,
    LegalAnswer,
)
from backend.app.legal.services.legal_engine import LegalGuidanceEngine
from backend.app.knowledge.sources.registry import source_registry

router = APIRouter(prefix="/legal", tags=["Legal Guidance Engine"])


@router.post("/query", response_model=ApiResponse[LegalAnswer])
async def execute_legal_query(payload: LegalQuery):
    """
    Submits a citizen legal query and returns a structured, citation-verified 10-section answer.
    """
    answer = await LegalGuidanceEngine.process_legal_query(
        query=payload.query,
        jurisdiction=payload.jurisdiction or "IN",
        user_context=payload.user_context,
        case_id=payload.case_id,
    )

    return ApiResponse(
        data=answer,
        confidence=answer.confidence,
        warnings=answer.warnings,
    )


@router.get("/acts", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_indexed_acts():
    """Returns verified Acts and statutory sources available in the knowledge repository."""
    sources = source_registry.list_sources()
    acts = []
    for s in sources:
        acts.append({
            "source_id": s.source_id,
            "title": s.title,
            "publisher": s.publisher,
            "jurisdiction": s.jurisdiction,
            "verification_status": s.verification_status.value if hasattr(s.verification_status, "value") else str(s.verification_status),
            "official_url": s.official_url,
            "source_type": s.source_type,
        })
    return ApiResponse(data=acts, confidence=1.0)
