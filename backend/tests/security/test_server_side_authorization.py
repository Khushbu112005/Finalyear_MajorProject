"""
Comprehensive Server-Side Authorization & RBAC Defense Tests.
Guarantees:
1. Unauthenticated requests to protected citizen/admin endpoints return HTTP 401.
2. Citizen requests to administrative endpoints return HTTP 403.
3. Cross-user IDOR attempts on cases (GET, PUT, DELETE) return HTTP 403.
4. Cross-user IDOR attempts on documents (GET, DOWNLOAD, DELETE) return HTTP 403.
5. Admin accounts cannot be self-deleted via citizen erasure endpoints.
"""

import pytest
import io
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.auth.models import UserModel, UserRole
from backend.app.auth.dependencies import get_current_user
from backend.app.cases.models import CaseModel
from backend.app.documents.models import DocumentModel

client = TestClient(app)

@pytest.fixture
def citizen_a():
    return UserModel(
        id="usr_cit_auth_a",
        name="Citizen Alpha",
        email="citizen_a@civicsphere.org",
        role="CITIZEN",
        is_active=True,
    )

@pytest.fixture
def citizen_b():
    return UserModel(
        id="usr_cit_auth_b",
        name="Citizen Beta",
        email="citizen_b@civicsphere.org",
        role="CITIZEN",
        is_active=True,
    )

@pytest.fixture
def admin_user():
    return UserModel(
        id="usr_adm_auth_x",
        name="Admin Officer",
        email="admin_x@civicsphere.org",
        role="ADMIN",
        is_active=True,
    )


def test_unauthenticated_access_denial():
    """Verify that protected citizen and admin endpoints reject unauthenticated requests with HTTP 401."""
    app.dependency_overrides.pop(get_current_user, None)

    endpoints_401 = [
        ("GET", "/api/v1/cases"),
        ("POST", "/api/v1/cases"),
        ("GET", "/api/v1/documents"),
        ("POST", "/api/v1/documents/upload"),
        ("GET", "/api/v1/auth/me"),
        ("DELETE", "/api/v1/auth/me"),
        ("GET", "/api/v1/audit/events"),
        ("GET", "/api/v1/audit/security-events"),
        ("GET", "/api/v1/knowledge/admin/overview"),
        ("GET", "/api/v1/knowledge/admin/audit-logs"),
    ]

    for method, path in endpoints_401:
        if method == "GET":
            resp = client.get(path)
        elif method == "POST":
            resp = client.post(path, json={})
        elif method == "DELETE":
            resp = client.delete(path)
        assert resp.status_code == 401, f"Expected 401 for unauthenticated {method} {path}, got {resp.status_code}"


def test_citizen_cannot_access_admin_endpoints(citizen_a):
    """Verify server-side RBAC: Citizen role is strictly rejected with HTTP 403 on admin routes."""
    app.dependency_overrides[get_current_user] = lambda: citizen_a

    admin_endpoints = [
        ("GET", "/api/v1/audit/events"),
        ("GET", "/api/v1/audit/security-events"),
    ]

    for method, path in admin_endpoints:
        resp = client.get(path)
        assert resp.status_code == 403, f"Expected 403 for citizen accessing {path}, got {resp.status_code}"

    app.dependency_overrides.pop(get_current_user, None)


def test_cross_user_case_idor_prevention(citizen_a, citizen_b):
    """Verify citizen B cannot view, modify, or delete citizen A's case."""
    # 1. Citizen A creates a case
    app.dependency_overrides[get_current_user] = lambda: citizen_a
    create_resp = client.post(
        "/api/v1/cases",
        json={"title": "Disputed Property Tax", "description": "Assessment error by municipal corporation"},
    )
    assert create_resp.status_code == 200
    case_id = create_resp.json()["data"]["id"]

    # 2. Citizen B attempts GET case A -> 403
    app.dependency_overrides[get_current_user] = lambda: citizen_b
    get_resp = client.get(f"/api/v1/cases/{case_id}")
    assert get_resp.status_code == 403, f"Expected 403, got {get_resp.status_code}"

    # 3. Citizen B attempts PUT case A -> 403
    put_resp = client.put(f"/api/v1/cases/{case_id}", json={"title": "Hacked Title"})
    assert put_resp.status_code == 403, f"Expected 403, got {put_resp.status_code}"

    # 4. Citizen B attempts DELETE case A -> 403
    del_resp = client.delete(f"/api/v1/cases/{case_id}")
    assert del_resp.status_code == 403, f"Expected 403, got {del_resp.status_code}"

    # 5. Citizen A can successfully view and delete own case
    app.dependency_overrides[get_current_user] = lambda: citizen_a
    del_owner = client.delete(f"/api/v1/cases/{case_id}")
    assert del_owner.status_code == 200

    app.dependency_overrides.pop(get_current_user, None)


def test_cross_user_document_idor_prevention(citizen_a, citizen_b):
    """Verify citizen B cannot view, download, or delete citizen A's document."""
    pdf_content = b"%PDF-1.4\n%OwnershipIsolationTest\n%%EOF"
    fake_pdf = io.BytesIO(pdf_content)

    # 1. Citizen A uploads a document
    app.dependency_overrides[get_current_user] = lambda: citizen_a
    up_resp = client.post(
        "/api/v1/documents/upload",
        files={"file": ("isolation_doc.pdf", fake_pdf, "application/pdf")},
    )
    assert up_resp.status_code in (200, 201)
    doc_id = up_resp.json()["data"]["id"]

    # 2. Citizen B attempts GET metadata -> 403
    app.dependency_overrides[get_current_user] = lambda: citizen_b
    meta_resp = client.get(f"/api/v1/documents/{doc_id}")
    assert meta_resp.status_code == 403

    # 3. Citizen B attempts GET download -> 403
    dl_resp = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_resp.status_code == 403

    # 4. Citizen B attempts DELETE document -> 403
    del_resp = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_resp.status_code == 403

    # 5. Citizen A can delete own document
    app.dependency_overrides[get_current_user] = lambda: citizen_a
    owner_del = client.delete(f"/api/v1/documents/{doc_id}")
    assert owner_del.status_code == 200

    app.dependency_overrides.pop(get_current_user, None)


def test_admin_account_self_deletion_blocked(admin_user):
    """Verify administrative accounts are forbidden from self-deletion via /auth/me."""
    app.dependency_overrides[get_current_user] = lambda: admin_user
    del_resp = client.delete("/api/v1/auth/me")
    assert del_resp.status_code == 403
    assert del_resp.json()["error"]["code"] == "ADMIN_DELETION_FORBIDDEN"

    app.dependency_overrides.pop(get_current_user, None)
