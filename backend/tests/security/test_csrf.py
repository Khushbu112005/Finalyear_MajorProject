"""
Automated Regression Tests for Server-Side CSRF Protection (LIVE-001).
Verifies:
1. State-changing requests with access_token cookie but missing X-CSRF-Token are rejected with 403.
2. State-changing requests with access_token cookie and mismatched/fake X-CSRF-Token are rejected with 403.
3. State-changing requests with valid matching X-CSRF-Token succeed with 200.
4. Programmatic non-browser clients (Bearer token or test headers) without session cookies are permitted.
5. Disallowed cross-site origins are rejected with 403.
"""

import pytest
from fastapi.testclient import TestClient
import secrets

from backend.app.main import app
from backend.app.auth.services import create_access_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_user_session(client):
    """Registers an authenticated user and captures their access_token and csrf_token."""
    email = f"csrf_test_{secrets.token_hex(4)}@example.com"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "CSRF Tester",
            "email": email,
            "password": "Password123!",
            "role": "CITIZEN",
        },
    )
    assert reg_res.status_code in (200, 201)
    token = reg_res.cookies.get("access_token")
    csrf_token = reg_res.cookies.get("csrf_token")
    user_data = reg_res.json().get("data", {}).get("user", {})
    user_id = user_data.get("id") or user_data.get("user_id")
    return {
        "user_id": user_id,
        "access_token": token,
        "csrf_token": csrf_token,
    }


def test_csrf_rejected_when_header_missing(client, test_user_session):
    """LIVE-001: Missing X-CSRF-Token header on cookie-authenticated request must return 403."""
    client.cookies.set("access_token", test_user_session["access_token"])
    client.cookies.set("csrf_token", test_user_session["csrf_token"])

    # Attempt state-changing POST to /api/v1/cases without X-CSRF-Token header
    response = client.post(
        "/api/v1/cases",
        json={
            "title": "Test Case CSRF Violation",
            "description": "Attempting case creation without CSRF header",
            "category": "Property",
            "priority": "LOW",
        },
    )
    assert response.status_code == 403
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "CSRF_VALIDATION_FAILED"


def test_csrf_rejected_when_token_mismatched(client, test_user_session):
    """LIVE-001: Mismatched or forged X-CSRF-Token header must return 403."""
    client.cookies.set("access_token", test_user_session["access_token"])
    client.cookies.set("csrf_token", test_user_session["csrf_token"])

    fake_csrf = secrets.token_hex(32)
    response = client.post(
        "/api/v1/cases",
        json={
            "title": "Test Case Fake CSRF",
            "description": "Attempting case creation with invalid CSRF token",
            "category": "Property",
            "priority": "LOW",
        },
        headers={"X-CSRF-Token": fake_csrf},
    )
    assert response.status_code == 403
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "CSRF_VALIDATION_FAILED"


def test_csrf_accepted_with_valid_matching_token(client, test_user_session):
    """LIVE-001: Legitimate state-changing request with valid matching token must succeed."""
    client.cookies.set("access_token", test_user_session["access_token"])
    client.cookies.set("csrf_token", test_user_session["csrf_token"])

    response = client.post(
        "/api/v1/cases",
        json={
            "title": "Legitimate Citizen Case",
            "description": "Valid case creation with verified CSRF token",
            "category": "Consumer",
            "priority": "MEDIUM",
        },
        headers={"X-CSRF-Token": test_user_session["csrf_token"]},
    )
    assert response.status_code in (200, 201)
    body = response.json()
    assert body["success"] is True
    assert "id" in body["data"]


def test_csrf_rejected_on_disallowed_origin(client, test_user_session):
    """LIVE-001: Request from unauthorized cross-site origin must return 403."""
    client.cookies.set("access_token", test_user_session["access_token"])
    client.cookies.set("csrf_token", test_user_session["csrf_token"])

    response = client.post(
        "/api/v1/cases",
        json={
            "title": "Malicious Cross-Origin Case",
            "description": "Attempted from untrusted external domain",
        },
        headers={
            "X-CSRF-Token": test_user_session["csrf_token"],
            "Origin": "https://malicious-attacker-site.com",
        },
    )
    assert response.status_code == 403
    body = response.json()
    assert body["error"]["code"] == "CSRF_ORIGIN_DENIED"


def test_programmatic_bearer_bypasses_csrf(client, test_user_session):
    """Programmatic API clients using Authorization Bearer header without session cookies bypass CSRF."""
    client.cookies.clear()
    response = client.post(
        "/api/v1/cases",
        json={
            "title": "API Client Case",
            "description": "Created via direct Bearer authorization header",
            "category": "Civic",
        },
        headers={"Authorization": f"Bearer {test_user_session['access_token']}"},
    )
    assert response.status_code in (200, 201)
    assert response.json()["success"] is True
