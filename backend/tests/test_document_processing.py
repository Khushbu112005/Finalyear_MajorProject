"""
Tests for Module D — Intelligent Document Processing.
Covers file validation, size limits, magic-byte checks, and the happy-path flow.

Convention: Uses the project's existing TestClient / auth-header fixtures from conftest.py.
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app
import io

client = TestClient(app)

# A minimal but structurally valid PDF (single blank page).
# This satisfies the %PDF- magic-byte check and PyMuPDF parsing.
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

# Simulated LLM evidence output used in the happy-path mock.
MOCK_EVIDENCE = {
    "document_type": "Identity Proof",
    "confidence": 0.95,
    "authority": "Government of India",
    "important_dates": ["2024-01-15"],
    "deadlines": [],
    "legal_references": ["Aadhaar Act, 2016"],
    "required_actions": ["Update address if changed"],
    "obligations": [],
    "entities": [
        {"name": "Rahul Kumar", "entity_type": "PERSON", "context": "Cardholder"}
    ],
    "risk_flags": [],
    "related_services": ["Address Update Service"],
}

ENDPOINT = "/api/v1/document-processing/process"


# ---------------------------------------------------------------------------
# Error-path tests
# ---------------------------------------------------------------------------


class TestDocumentUploadValidation:
    """Validation and security edge-case tests."""

    def test_upload_invalid_extension(self, citizen_auth_headers):
        """Uploading a non-PDF extension must be rejected with INVALID_FILE_TYPE."""
        file_content = b"Mock image data"
        files = {"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")}
        response = client.post(ENDPOINT, files=files, headers=citizen_auth_headers)
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_FILE_TYPE"

    def test_upload_too_large(self, citizen_auth_headers):
        """Uploading a file over 10 MB must be rejected with FILE_TOO_LARGE."""
        # Build an oversized payload that still starts with %PDF- to pass magic check
        file_content = b"%PDF-" + b"0" * (11 * 1024 * 1024)
        files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
        response = client.post(ENDPOINT, files=files, headers=citizen_auth_headers)
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "FILE_TOO_LARGE"

    def test_upload_fake_pdf(self, citizen_auth_headers):
        """A .pdf file without the %PDF- magic bytes must be rejected."""
        file_content = b"This is NOT a real PDF file"
        files = {"file": ("fake.pdf", io.BytesIO(file_content), "application/pdf")}
        response = client.post(ENDPOINT, files=files, headers=citizen_auth_headers)
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_PDF_SIGNATURE"

    def test_upload_empty_pdf(self, citizen_auth_headers):
        """An empty file named .pdf must be rejected (no magic bytes)."""
        files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
        response = client.post(ENDPOINT, files=files, headers=citizen_auth_headers)
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_PDF_SIGNATURE"


# ---------------------------------------------------------------------------
# Happy-path test (mocked OCR + classification — no network calls)
# ---------------------------------------------------------------------------


class TestDocumentUploadSuccess:
    """End-to-end happy-path tests with mocked services."""

    @patch(
        "backend.app.document_processing.api.upload.ClassificationService.extract_evidence",
        return_value=MOCK_EVIDENCE,
    )
    @patch(
        "backend.app.document_processing.api.upload.OCRService.extract_text_from_pdf",
        return_value="Sample extracted text from a government document.",
    )
    def test_valid_pdf_upload(self, mock_ocr, mock_classify, citizen_auth_headers):
        """
        A valid PDF upload should return 200 with structured DocumentEvidence.
        OCR and Classification are mocked so no real PDF parsing or Gemini call occurs.
        """
        files = {
            "file": ("aadhaar.pdf", io.BytesIO(MINIMAL_VALID_PDF), "application/pdf")
        }
        response = client.post(ENDPOINT, files=files, headers=citizen_auth_headers)

        assert response.status_code == 200
        body = response.json()

        # Top-level response structure
        assert body["success"] is True
        assert body["filename"] == "aadhaar.pdf"
        assert "evidence" in body
        assert "raw_text_snippet" in body

        # DocumentEvidence fields
        evidence = body["evidence"]
        assert evidence["document_type"] == "Identity Proof"
        assert evidence["confidence"] == 0.95
        assert evidence["authority"] == "Government of India"
        assert "2024-01-15" in evidence["important_dates"]
        assert "Aadhaar Act, 2016" in evidence["legal_references"]
        assert len(evidence["entities"]) == 1
        assert evidence["entities"][0]["name"] == "Rahul Kumar"
        assert evidence["entities"][0]["entity_type"] == "PERSON"
        assert evidence["entities"][0]["context"] == "Cardholder"
        assert evidence["required_actions"] == ["Update address if changed"]
        assert evidence["related_services"] == ["Address Update Service"]

        # Verify mocks were invoked exactly once
        mock_ocr.assert_called_once()
        mock_classify.assert_called_once()

    @patch(
        "backend.app.document_processing.api.upload.ClassificationService.extract_evidence",
        return_value=MOCK_EVIDENCE,
    )
    @patch(
        "backend.app.document_processing.api.upload.OCRService.extract_text_from_pdf",
        return_value="Sample extracted text from a government document.",
    )
    def test_admin_can_upload(self, mock_ocr, mock_classify, admin_auth_headers):
        """Admin role should also be allowed to upload documents."""
        files = {
            "file": ("notice.pdf", io.BytesIO(MINIMAL_VALID_PDF), "application/pdf")
        }
        response = client.post(ENDPOINT, files=files, headers=admin_auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True
