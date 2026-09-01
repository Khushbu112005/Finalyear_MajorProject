"""
Intelligent Document Processing — Upload API.
Provides the secure document upload and processing endpoint for Module D.

Security:
    - Validates filename extension (.pdf only).
    - Validates file content via PDF magic-byte signature (%PDF-).
    - Enforces 10 MB maximum file size.
    - Requires authenticated user with citizen, admin, or system role.
    - Treats all uploaded content as untrusted.
"""

from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import ValidationError
import logging

from backend.app.common.security import AuthContext, require_role
from backend.app.common.errors import CivicSphereException
from backend.app.document_processing.schemas.document import (
    DocumentProcessingResponse,
    DocumentEvidence,
    ExtractedEntity,
)
from backend.app.document_processing.services.ocr_service import OCRService
from backend.app.document_processing.services.classification_service import ClassificationService

router = APIRouter(prefix="/document-processing", tags=["Intelligent Document Processing"])
logger = logging.getLogger("civicsphere.upload")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
PDF_MAGIC_BYTES = b"%PDF-"


@router.post("/process", response_model=DocumentProcessingResponse)
async def process_document(
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_role(["citizen", "admin", "system"])),
):
    """
    Accepts a PDF upload, extracts text via OCR, and returns structured
    DocumentEvidence using AI classification.

    Flow:
        1. Filename extension check (.pdf)
        2. File size check (≤ 10 MB)
        3. Magic-byte validation (%PDF-)
        4. Text extraction (PyMuPDF)
        5. AI classification (Gemini)
        6. Pydantic schema validation
        7. Return structured response
    """
    # 1. Filename extension validation
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise CivicSphereException(
            code="INVALID_FILE_TYPE",
            message="Only PDF files are supported.",
            status_code=400,
        )

    # 2. Read bytes and enforce size limit
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise CivicSphereException(
            code="FILE_TOO_LARGE",
            message="File exceeds 10MB limit.",
            status_code=400,
        )

    # 3. Magic-byte validation: verify the file is actually a PDF
    if not file_bytes.startswith(PDF_MAGIC_BYTES):
        raise CivicSphereException(
            code="INVALID_PDF_SIGNATURE",
            message="Uploaded file is not a valid PDF document.",
            status_code=400,
        )

    logger.info(
        f"User {auth.user_id} uploaded document {file.filename} ({len(file_bytes)} bytes)"
    )

    # 4. OCR / Text Extraction
    try:
        text = OCRService.extract_text_from_pdf(file_bytes)
    except Exception:
        raise CivicSphereException(
            code="OCR_FAILED",
            message="Failed to extract text from the document.",
            status_code=422,
        )

    # 5. AI Classification & Information Extraction
    evidence_dict = ClassificationService.extract_evidence(text)

    # 6. Validate through Pydantic schema
    try:
        # Normalize entities from dicts to ExtractedEntity objects if needed
        raw_entities = evidence_dict.get("entities", [])
        normalized_entities = []
        for ent in raw_entities:
            if isinstance(ent, dict):
                normalized_entities.append(ExtractedEntity(**ent))
            elif isinstance(ent, ExtractedEntity):
                normalized_entities.append(ent)
        evidence_dict["entities"] = normalized_entities

        evidence = DocumentEvidence(**evidence_dict)
    except (ValidationError, TypeError, KeyError) as e:
        logger.error(f"Evidence schema validation failed: {type(e).__name__}")
        raise CivicSphereException(
            code="EVIDENCE_VALIDATION_FAILED",
            message="Extracted evidence did not match the expected schema.",
            status_code=422,
        )

    return DocumentProcessingResponse(
        success=True,
        filename=file.filename,
        evidence=evidence,
        raw_text_snippet=text[:500] + "..." if len(text) > 500 else text,
    )
