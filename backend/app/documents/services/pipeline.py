"""
7-Stage Intelligent Document Processing Pipeline.
Executes the full state machine from upload to knowledge graph linking:
UPLOADED -> VALIDATING -> SECURITY_SCANNING -> PROCESSING -> ANALYZING -> LINKING_KNOWLEDGE -> READY
"""

from typing import Dict, Any, Optional
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.common.errors import CivicSphereException
from backend.app.documents.models import DocumentModel
from backend.app.documents.services.storage import get_storage_backend
from backend.app.documents.services.security_scanner import DocumentSecurityScanner
from backend.app.document_processing.services.ocr_service import OCRService
from backend.app.document_processing.services.classification_service import ClassificationService
from backend.app.documents.services.knowledge_linker import DocumentKnowledgeLinker

logger = logging.getLogger("civicsphere.documents.pipeline")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
PDF_MAGIC_BYTES = b"%PDF-"


class DocumentProcessingPipeline:
    """Executes the 7-stage document analysis pipeline asynchronously."""

    @staticmethod
    async def process_document_pipeline(
        document_id: str,
        file_bytes: bytes,
        original_filename: str,
        user_id: str,
        case_id: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        storage = get_storage_backend()
        
        # Stage 1: UPLOADED
        logger.info(f"Pipeline Stage 1 [UPLOADED]: doc_id={document_id}, name={original_filename}")

        # Stage 2: VALIDATING
        logger.info(f"Pipeline Stage 2 [VALIDATING]: checking size, extension, magic bytes")
        if not original_filename.lower().endswith(".pdf"):
            raise CivicSphereException(code="INVALID_EXTENSION", message="Only PDF documents are supported.", status_code=400)
        if len(file_bytes) > MAX_FILE_SIZE:
            raise CivicSphereException(code="FILE_TOO_LARGE", message="File exceeds 10MB limit.", status_code=400)
        if not file_bytes.startswith(PDF_MAGIC_BYTES):
            raise CivicSphereException(code="INVALID_MAGIC_BYTES", message="File signature is not a valid PDF.", status_code=400)

        # Stage 3: SECURITY_SCANNING
        logger.info(f"Pipeline Stage 3 [SECURITY_SCANNING]: scanning for active content/macros")
        is_safe, threats = DocumentSecurityScanner.scan_pdf_bytes(file_bytes)
        if not is_safe:
            raise CivicSphereException(
                code="SECURITY_THREAT_BLOCKED",
                message=f"Document blocked by security scanner: {', '.join(threats)}",
                status_code=400
            )

        # Save to storage
        storage_path, generated_filename = await storage.save_file(file_bytes, original_filename)

        # Stage 4: PROCESSING (OCR)
        logger.info(f"Pipeline Stage 4 [PROCESSING]: extracting raw text via OCR")
        text = OCRService.extract_text_from_pdf(file_bytes)

        # Stage 5: ANALYZING (LLM structured extraction with prompt injection defense)
        logger.info(f"Pipeline Stage 5 [ANALYZING]: running structured intelligence extraction")
        evidence = ClassificationService.extract_evidence(text)

        # Stage 6: LINKING_KNOWLEDGE
        logger.info(f"Pipeline Stage 6 [LINKING_KNOWLEDGE]: linking entities to Neo4j graph")
        linked_node_ids = await DocumentKnowledgeLinker.link_document_evidence(
            document_id=document_id,
            filename=original_filename,
            evidence=evidence,
            jurisdiction="IN"
        )
        evidence["knowledge_node_ids"] = linked_node_ids

        # Stage 7: READY
        logger.info(f"Pipeline Stage 7 [READY]: Document pipeline completed successfully for {document_id}")
        
        return {
            "document_id": document_id,
            "status": "READY",
            "status_message": "Document processed and linked to knowledge graph.",
            "storage_path": storage_path,
            "evidence": evidence,
            "analysis": evidence,
            "raw_text_snippet": text[:400] + "..." if len(text) > 400 else text,
        }
