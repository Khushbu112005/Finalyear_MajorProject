"""
Eligibility Engine for Government Service Navigator (Module B).
Evaluates citizen profile against service eligibility rules.
"""

from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger("civicsphere.government.eligibility")


def evaluate_rule(user_value: Any, operator: str, required_value: Any) -> bool:
    """Evaluates a single eligibility rule against citizen profile value."""
    # Normalize booleans
    norm_user = user_value
    if isinstance(user_value, str):
        if user_value.lower() == "true":
            norm_user = True
        elif user_value.lower() == "false":
            norm_user = False

    norm_req = required_value
    if isinstance(required_value, str):
        if required_value.lower() == "true":
            norm_req = True
        elif required_value.lower() == "false":
            norm_req = False

    op = operator.lower().strip()
    if op in ("equals", "==", "="):
        return norm_user == norm_req
    elif op in ("not_equals", "!="):
        return norm_user != norm_req
    elif op in ("greater_than", ">"):
        try:
            return float(norm_user) > float(norm_req)
        except (ValueError, TypeError):
            return False
    elif op in ("less_than", "<"):
        try:
            return float(norm_user) < float(norm_req)
        except (ValueError, TypeError):
            return False
    elif op in ("greater_than_or_equal", ">="):
        try:
            return float(norm_user) >= float(norm_req)
        except (ValueError, TypeError):
            return False
    elif op in ("less_than_or_equal", "<="):
        try:
            return float(norm_user) <= float(norm_req)
        except (ValueError, TypeError):
            return False
    elif op == "contains":
        if isinstance(norm_user, list):
            return norm_req in norm_user
        if isinstance(norm_user, str):
            return str(norm_req).lower() in norm_user.lower()
        return False
    elif op == "in":
        if isinstance(norm_req, list):
            return norm_user in norm_req
        return False
    elif op == "boolean":
        return bool(norm_user) == bool(norm_req)
    return False


def check_eligibility(rules: List[Dict[str, Any]], citizen_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Checks list of eligibility rules against citizen context.
    Returns {status: CONFIRMED|FAILED|UNKNOWN, confirmed: [], failed: [], unknown: [], percent_complete: int}
    """
    confirmed = []
    failed = []
    unknown = []

    if not rules:
        return {
            "status": "CONFIRMED",
            "confirmed": [],
            "failed": [],
            "unknown": [],
            "percent_complete": 100
        }

    for rule in rules:
        field = rule.get("field") or rule.get("field_name", "")
        op = rule.get("operator", "equals")
        req_val = rule.get("value") if "value" in rule else rule.get("threshold_value")
        desc = rule.get("description") or rule.get("error_message", f"Field '{field}' is required.")

        if field not in citizen_context or citizen_context[field] is None or citizen_context[field] == "":
            unknown.append({
                "field": field,
                "description": desc,
                "operator": op,
                "required_value": req_val,
            })
            continue

        user_val = citizen_context[field]
        passed = evaluate_rule(user_val, op, req_val)

        evaluated_item = {
            "field": field,
            "operator": op,
            "required_value": req_val,
            "user_value": user_val,
            "description": desc,
        }

        if passed:
            confirmed.append(evaluated_item)
        else:
            failed.append(evaluated_item)

    if failed:
        status = "FAILED"
    elif unknown:
        status = "UNKNOWN"
    else:
        status = "CONFIRMED"

    total = len(rules)
    known = len(confirmed) + len(failed)
    percent = round((known / total) * 100) if total > 0 else 100

    return {
        "status": status,
        "confirmed": confirmed,
        "failed": failed,
        "unknown": unknown,
        "percent_complete": percent,
    }


def evaluate_eligibility(rules: List[Dict[str, Any]], citizen_context: Dict[str, Any]):
    """Evaluates rules and returns an EligibilityResult-compatible object."""
    from packages.schemas.contracts import EligibilityResult
    res = check_eligibility(rules, citizen_context)
    is_eligible = res["status"] == "CONFIRMED"
    reasons = [f["description"] for f in res["failed"]]
    return EligibilityResult(
        is_eligible=is_eligible,
        confidence=1.0 if res["status"] != "UNKNOWN" else 0.5,
        reasons=reasons,
        matching_rules_count=len(res["confirmed"]),
        total_rules_count=len(rules)
    )

