"""
Tests for Case Workspace API (Module Cases).
Verifies Case creation, role filtering, and IDOR protection.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_case_lifecycle_and_idor_protection(citizen_auth_headers):
    # 1. Create a case for citizen
    payload = {
        "title": "Unlawful Eviction Notice Under Rent Control",
        "description": "Received eviction notice without statutory 30-day period.",
        "category": "Property & Land",
        "priority": "HIGH",
    }
    resp = client.post("/api/v1/cases", json=payload, headers=citizen_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    case_id = body["data"]["id"]
    assert body["data"]["title"] == payload["title"]

    # 2. Get case as owner citizen -> Allowed
    get_resp = client.get(f"/api/v1/cases/{case_id}", headers=citizen_auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["id"] == case_id

    # 3. Attempt to get case as a DIFFERENT citizen -> IDOR Forbidden (403)
    attacker_headers = {
        "X-User-Id": "usr_attacker_666",
        "X-User-Email": "attacker@civicsphere.org",
        "X-User-Role": "citizen"
    }
    idor_resp = client.get(f"/api/v1/cases/{case_id}", headers=attacker_headers)
    assert idor_resp.status_code == 403
    assert idor_resp.json()["error"]["code"] == "IDOR_FORBIDDEN"
