"""
Tests for Module D 7-Stage Document Processing Pipeline.
Verifies PDF upload, security scanning, OCR extraction, AI structuring, and Knowledge Graph linking.
"""

import pytest
import io
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
