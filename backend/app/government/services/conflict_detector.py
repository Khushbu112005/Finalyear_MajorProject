"""
Conflict Detection and Source Trust Resolution for Government Services.
Resolves discrepancies across multiple official portals and gazette notifications
using strict statutory trust hierarchy.
"""

from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger("civicsphere.government.conflict")

TRUST_HIERARCHY = {
    "LEGISLATION": 6,
    "MINISTRY_PORTAL": 5,
    "central_government": 5,
    "STATE_PORTAL": 4,
    "state_government": 4,
    "AUTHORITY_NOTIF": 3,
    "official_authority": 3,
    "official_department": 3,
    "SECONDARY_TRUSTED": 2,
    "secondary": 2,
    "SECONDARY_UNTRUSTED": 1,
}


def get_trust_score(source_type: str) -> int:
    return TRUST_HIERARCHY.get(source_type, 0)


def detect_and_resolve_conflicts(
    service_dict: Dict[str, Any],
    sources: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Inspects multiple sources and resolves any discrepancies in fees, eligibility rules, or deadlines.
    """
    conflicts = []
    warnings = []
    conflict_data = service_dict.get("conflict_data") or service_dict.get("conflictData")

    if not conflict_data or not isinstance(conflict_data, dict):
        return {
            "has_conflict": False,
            "conflicts": [],
            "warnings": [],
        }

    sources_map = {s.get("source_id", s.get("sourceId")): s for s in (sources or [])}

    for field, claims in conflict_data.items():
        if not isinstance(claims, list) or len(claims) <= 1:
            continue

        first_val = claims[0].get("value")
        has_discrepancy = any(c.get("value") != first_val for c in claims)

        if has_discrepancy:
            resolved_claim = None
            highest_trust = -1
            details = []

            for claim in claims:
                sid = claim.get("source_id", claim.get("sourceId"))
                source = sources_map.get(sid, {})
                stype = source.get("source_type", source.get("sourceType", "SECONDARY_UNTRUSTED"))
                trust = get_trust_score(stype)

                details.append({
                    "source_id": sid,
                    "source_title": source.get("title", sid),
                    "source_type": stype,
                    "trust_score": trust,
                    "value": claim.get("value"),
                })

                if trust > highest_trust:
                    highest_trust = trust
                    resolved_claim = claim

            conflicts.append({
                "field": field,
                "resolved_value": resolved_claim.get("value") if resolved_claim else None,
                "resolved_source_id": resolved_claim.get("source_id", resolved_claim.get("sourceId")) if resolved_claim else None,
                "details": details,
            })

            warnings.append(
                f"Conflicting values for '{field}' detected between sources. Resolved using trust hierarchy."
            )

    return {
        "has_conflict": len(conflicts) > 0,
        "conflicts": conflicts,
        "warnings": warnings,
    }
