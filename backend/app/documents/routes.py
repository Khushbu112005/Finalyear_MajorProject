"""
Intelligent Document Processing API Routes.
Provides secure upload, 7-stage status tracking, analysis retrieval, and case attachment.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional, Dict, Any, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import os
import uuid
import logging

from packages.schemas.contracts import ApiResponse
from backend.app.common.database import get_db_session
from backend.app.common.errors import CivicSphereException
from backend.app.auth.models import UserModel
from backend.app.auth.dependencies import get_current_user, check_ownership
from backend.app.documents.models import DocumentModel

router = APIRouter(prefix="/documents", tags=["Intelligent Document Processing"])
logger = logging.getLogger("civicsphere.documents.api")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
PDF_MAGIC_BYTES = b"%PDF-"


@router.post("/upload", response_model=ApiResponse[Dict[str, Any]])
async def upload_and_process_document(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(default=None),
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Uploads a document and executes the full 7-stage processing pipeline.
    Handles serverless environments, cloud fallback, and database persistence safely.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise CivicSphereException(code="INVALID_EXTENSION", message="Only PDF documents are supported.", status_code=400)

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise CivicSphereException(code="FILE_TOO_LARGE", message="File exceeds 10MB limit.", status_code=400)
    if not file_bytes.startswith(PDF_MAGIC_BYTES):
        raise CivicSphereException(code="INVALID_MAGIC_BYTES", message="File signature is not a valid PDF.", status_code=400)

    doc_id = f"doc_{uuid.uuid4().hex[:12]}"

    try:
        from backend.app.documents.services.pipeline import DocumentProcessingPipeline
        result = await DocumentProcessingPipeline.process_document_pipeline(
            document_id=doc_id,
            file_bytes=file_bytes,
            original_filename=file.filename or "document.pdf",
            user_id=current_user.id,
            case_id=case_id,
            db=db,
        )

        doc = DocumentModel(
            id=doc_id,
            user_id=current_user.id,
            case_id=case_id,
            original_filename=file.filename or "document.pdf",
            storage_path=result.get("storage_path", ""),
            mime_type=file.content_type or "application/pdf",
            file_size_bytes=len(file_bytes),
            status="READY",
            status_message=result.get("status_message", "Document processed successfully."),
            analysis=result.get("evidence", {}),
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

        return ApiResponse(
            data=doc.to_dict(),
            confidence=float(result.get("evidence", {}).get("confidence", 0.95)),
        )
    except CivicSphereException:
        raise
    except Exception as exc:
        logger.error(f"Document upload processing failed: {type(exc).__name__}: {exc}")
        raise CivicSphereException(
            code="DOCUMENT_PROCESSING_FAILED",
            message=f"Failed to process document: {str(exc)}",
            status_code=422
        )


@router.get("", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_documents(
    case_id: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Lists uploaded documents belonging to current user."""
    stmt = select(DocumentModel).where(DocumentModel.user_id == current_user.id)
    if case_id:
        stmt = stmt.where(DocumentModel.case_id == case_id)
    stmt = stmt.order_by(DocumentModel.created_at.desc())

    res = await db.execute(stmt)
    docs = [d.to_dict() for d in res.scalars().all()]
    return ApiResponse(data=docs, confidence=1.0)


@router.get("/{document_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_document(
    document_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieves document details and extracted intelligence."""
    res = await db.execute(select(DocumentModel).where(DocumentModel.id == document_id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise CivicSphereException(code="DOCUMENT_NOT_FOUND", message="Document not found.", status_code=404)

    check_ownership(doc.user_id, current_user)
    return ApiResponse(data=doc.to_dict(), confidence=1.0)
