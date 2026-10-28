"""
API Tests for Document Authorized Retrieval and Access Control.
Verifies:
- Synthetic PDF upload through metadata persistence to authorized byte retrieval.
- Unauthorized user access rejection (HTTP 403 Forbidden).
- Unauthenticated access rejection (HTTP 401 Unauthorized).
- Storage write failure produces error and never false success.
"""

import io
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.auth.dependencies import get_current_user
from backend.app.auth.models import UserModel


@pytest.fixture
def client():
    return TestClient(app)


def test_synthetic_pdf_upload_and_authorized_download(client):
    """Test full journey: upload synthetic PDF, persist metadata, download bytes as owner."""
    user_owner = UserModel(
        id="usr_doc_owner_1",
        email="owner1@civicsphere.org",
        role="CITIZEN",
        is_active=True,
    )
    user_intruder = UserModel(
        id="usr_doc_intruder_2",
        email="intruder@civicsphere.org",
        role="CITIZEN",
        is_active=True,
    )

    pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    fake_pdf = io.BytesIO(pdf_content)

    # Override auth to act as owner
    app.dependency_overrides[get_current_user] = lambda: user_owner

    # 1. Upload
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("synthetic_legal_notice.pdf", fake_pdf, "application/pdf")},
    )
    assert response.status_code in (200, 201), f"Upload failed: {response.text}"
    upload_data = response.json()
    doc_id = upload_data["data"]["id"]
    assert doc_id.startswith("doc_")
    assert upload_data["data"]["original_filename"] == "synthetic_legal_notice.pdf"

    # 2. Retrieve metadata as owner
    meta_resp = client.get(f"/api/v1/documents/{doc_id}")
    assert meta_resp.status_code == 200
    meta_data = meta_resp.json()
    assert meta_data["data"]["id"] == doc_id
    assert meta_data["data"]["user_id"] == "usr_doc_owner_1"

    # 3. Authorized Download as owner
    dl_resp = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.content == pdf_content
    assert "synthetic_legal_notice.pdf" in dl_resp.headers.get("content-disposition", "")
    assert dl_resp.headers.get("content-type") == "application/pdf"

    # 4. Unauthorized access by different user (intruder)
    app.dependency_overrides[get_current_user] = lambda: user_intruder
    intruder_resp = client.get(f"/api/v1/documents/{doc_id}/download")
    assert intruder_resp.status_code == 403, f"Intruder should get 403: {intruder_resp.status_code}"

    # Intruder also blocked from metadata
    intruder_meta = client.get(f"/api/v1/documents/{doc_id}")
    assert intruder_meta.status_code == 403

    # 5. Unauthenticated access
    app.dependency_overrides.pop(get_current_user, None)
    unauth_resp = client.get(f"/api/v1/documents/{doc_id}/download")
    assert unauth_resp.status_code == 401

    # 6. Non-existent document
    app.dependency_overrides[get_current_user] = lambda: user_owner
    notfound_resp = client.get("/api/v1/documents/doc_nonexistent_999/download")
    assert notfound_resp.status_code == 404

    # Clean up overrides
    app.dependency_overrides.pop(get_current_user, None)


def test_storage_write_failure_never_returns_false_success(client):
    """Confirm that an unhandled storage write failure never returns HTTP 200 false success."""
    from unittest.mock import patch

    user = UserModel(
        id="usr_fail_test",
        email="fail@civicsphere.org",
        role="CITIZEN",
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: user

    pdf_content = b"%PDF-1.4\nSynthetic failure test\n%%EOF"
    fake_pdf = io.BytesIO(pdf_content)

    with patch("backend.app.documents.services.storage.LocalStorageBackend.save_file", side_effect=OSError("Disk full")):
        with patch("backend.app.documents.services.storage.get_storage_backend") as mock_backend:
            mock_inst = mock_backend.return_value
            mock_inst.save_file.side_effect = OSError("Cloud unavailable")
            
            response = client.post(
                "/api/v1/documents/upload",
                files={"file": ("failure_test.pdf", fake_pdf, "application/pdf")},
            )
            # Must NOT succeed with 200
            assert response.status_code in (422, 500, 502), f"Expected error status, got {response.status_code}: {response.text}"
            res_json = response.json()
            assert res_json.get("success") is not True

    app.dependency_overrides.pop(get_current_user, None)

