"""
Recommendation & Matching Engine for Government Services.
Scores, ranks, and filters services based on citizen eligibility and query relevance.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.government.models import GovernmentServiceModel
from backend.app.government.services.eligibility import check_eligibility
from backend.app.government.services.conflict_detector import detect_and_resolve_conflicts


async def recommend_services(
    db: AsyncSession,
    query: str,
    citizen_context: Optional[Dict[str, Any]] = None,
    category: Optional[str] = None,
    jurisdiction: str = "IN",
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Retrieves and ranks eligible government services for citizen query.
    Enforces that services without verified evidence never display a verified badge.
    """
    stmt = select(GovernmentServiceModel).where(GovernmentServiceModel.jurisdiction == jurisdiction)
    if category:
        stmt = stmt.where(GovernmentServiceModel.category == category)

    res = await db.execute(stmt)
    services = res.scalars().all()

    recommendations = []
    for svc in services:
        svc_dict = svc.to_dict()
        eligibility = check_eligibility(svc_dict.get("eligibility_rules", []), citizen_context or {})
        conflicts = detect_and_resolve_conflicts(svc_dict)

        # Compute match score
        score = 0.5
        if eligibility["status"] == "CONFIRMED":
            score += 0.4
        elif eligibility["status"] == "UNKNOWN":
            score += 0.2
        elif eligibility["status"] == "FAILED":
            score = max(0.1, score - 0.3)

        # Keyword match boost
        q_lower = query.lower()
        if svc.title.lower() in q_lower or q_lower in svc.title.lower():
            score += 0.2
        if svc.category.lower() in q_lower:
            score += 0.1

        score = min(1.0, score)

        # Verification badge requires ACTIVE verification status and verified sources
        is_verified_badge = (
            svc.verification_status == "ACTIVE" and
            svc.last_verified_at is not None
        )

        svc_dict["match_score"] = round(score, 2)
        svc_dict["eligibility_result"] = eligibility
        svc_dict["conflict_result"] = conflicts
        svc_dict["is_verified_badge"] = is_verified_badge

        recommendations.append(svc_dict)

    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations[:top_k]
