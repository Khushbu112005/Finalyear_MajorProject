"""
Tests for Module D 7-Stage Document Processing Pipeline.
Verifies PDF upload, security scanning, OCR extraction, AI structuring, and Knowledge Graph linking.
"""

import pytest
import io
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

MINIMAL_VALID_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n"
    b"xref\n0 4\n"
    b"0000000000 65535 f \n"
    b"0000000009 00000 n \n"
    b"0000000058 00000 n \n"
    b"0000000115 00000 n \n"
    b"trailer\n<< /Size 4 /Root 1 0 R >>\n"
    b"startxref\n196\n%%EOF\n"
)


def test_document_pipeline_upload_and_link(citizen_auth_headers):
    pdf_file = io.BytesIO(MINIMAL_VALID_PDF)
    files = {"file": ("RTI_Order_Notice.pdf", pdf_file, "application/pdf")}
    
    resp = client.post("/api/v1/documents/upload", files=files, headers=citizen_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["status"] == "READY"
    assert "analysis" in data
    assert "knowledge_node_ids" in data["analysis"]
    assert len(data["analysis"]["knowledge_node_ids"]) > 0


def test_document_security_scanner_blocks_malicious_pdf(citizen_auth_headers):
    malicious_pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert('pwned');) >>\nendobj\n"
        b"trailer\n<< /Root 1 0 R >>\n%%EOF\n"
    )
    pdf_file = io.BytesIO(malicious_pdf)
    files = {"file": ("malicious.pdf", pdf_file, "application/pdf")}
    
    resp = client.post("/api/v1/documents/upload", files=files, headers=citizen_auth_headers)
    assert resp.status_code == 400
    body = resp.json()
    assert body["error"]["code"] == "SECURITY_THREAT_BLOCKED"


@patch("httpx.AsyncClient.post", new_callable=AsyncMock)
@patch("httpx.AsyncClient.get", new_callable=AsyncMock)
def test_document_e2e_supabase_storage_integration(mock_http_get, mock_http_post, citizen_auth_headers, monkeypatch):
    """
    Verifies full application integration with Supabase Storage:
    API upload -> FastAPI -> SupabaseStorageBackend.save_file -> DocumentModel in DB ->
    GET /api/v1/documents/{doc_id} -> retrieve file bytes via SupabaseStorageBackend.get_file.
    """
    from backend.app.common.config import settings
    from backend.app.documents.services.storage import get_storage_backend

    monkeypatch.setattr(settings, "STORAGE_BACKEND", "supabase")
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "test-key-32-chars-minimum-length!")
    monkeypatch.setattr(settings, "SUPABASE_STORAGE_BUCKET", "civicsphere-demo-documents")

    mock_resp_up = MagicMock()
    mock_resp_up.status_code = 200
    mock_resp_up.text = '{"Key": "civicsphere-demo-documents/doc_test123.pdf"}'
    mock_http_post.return_value = mock_resp_up

    mock_resp_down = MagicMock()
    mock_resp_down.status_code = 200
    mock_resp_down.content = MINIMAL_VALID_PDF
    mock_http_get.return_value = mock_resp_down

    pdf_file = io.BytesIO(MINIMAL_VALID_PDF)
    files = {"file": ("Court_Affidavit.pdf", pdf_file, "application/pdf")}

    resp = client.post("/api/v1/documents/upload", files=files, headers=citizen_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    doc_data = body["data"]
    doc_id = doc_data["id"]
    storage_path = doc_data["storage_path"]

    # 1. Verify storage path is formed with supabase scheme
    assert storage_path.startswith("supabase://civicsphere-demo-documents/")
    assert doc_data["status"] == "READY"

    # 2. Verify document metadata retrieval via API
    get_resp = client.get(f"/api/v1/documents/{doc_id}", headers=citizen_auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["storage_path"] == storage_path

    # 3. Verify retrieving original file bytes through storage backend using stored metadata
    backend = get_storage_backend()
    retrieved_bytes = asyncio.run(backend.get_file(storage_path))
    assert retrieved_bytes == MINIMAL_VALID_PDF
