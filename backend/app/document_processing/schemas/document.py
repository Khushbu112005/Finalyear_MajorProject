"""
Pydantic schemas for Intelligent Document Processing (Module D).
Defines the structured evidence output returned after document analysis.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class ExtractedEntity(BaseModel):
    """A single named entity extracted from a document."""
    name: str
    entity_type: str = Field(description="e.g. PERSON, ORGANIZATION, LOCATION, ACT, SECTION")
    context: Optional[str] = None


class DocumentEvidence(BaseModel):
    """
    Structured evidence extracted from an uploaded document.
    Contains classification, entities, dates, legal references, risk flags,
    and other civic/legal intelligence.
    """
    document_type: str = Field(
        description="Classification of the document "
        "(e.g. Identity Proof, Legal Order, Notification, Form)"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence score of the extraction (0.0 to 1.0)"
    )
    authority: Optional[str] = Field(
        default=None,
        description="Issuing authority or department"
    )
    important_dates: List[str] = Field(
        default_factory=list,
        description="Key dates extracted (e.g. Issue date, DOB)"
    )
    deadlines: List[str] = Field(
        default_factory=list,
        description="Any explicit deadlines mentioned"
    )
    legal_references: List[str] = Field(
        default_factory=list,
        description="References to Acts, Laws, or Sections"
    )
    required_actions: List[str] = Field(
        default_factory=list,
        description="Actions required by the citizen or authority"
    )
    obligations: List[str] = Field(
        default_factory=list,
        description="Legal or civic obligations mentioned"
    )
    entities: List[ExtractedEntity] = Field(
        default_factory=list,
        description="Named entities extracted from the document"
    )
    risk_flags: List[str] = Field(
        default_factory=list,
        description="Any warnings, risk factors, or missing fields"
    )
    related_services: List[str] = Field(
        default_factory=list,
        description="Potential related government services"
    )


class DocumentProcessingResponse(BaseModel):
    """Top-level API response for the document processing endpoint."""
    success: bool
    filename: str
    evidence: DocumentEvidence
    raw_text_snippet: Optional[str] = None
