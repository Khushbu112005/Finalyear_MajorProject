"""
CivicSphere Shared Domain Schemas and Integration Contracts
Standardized across all CivicSphere modules (A, B, C, D, E, F).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
import uuid


class VerificationStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUPERSEDED = "SUPERSEDED"
    EXPIRED = "EXPIRED"
    UNVERIFIED = "UNVERIFIED"
    BLOCKED = "BLOCKED"


class SourceTrustLevel(int, Enum):
    OFFICIAL_LEGISLATION = 1
    OFFICIAL_GOVERNMENT_DEPARTMENT = 2
    OFFICIAL_COURT_JUDICIARY = 3
    OFFICIAL_NOTIFICATION = 4
    TRUSTED_SECONDARY_SOURCE = 5


class IngestionStatus(str, Enum):
    PENDING = "PENDING"
    FETCHING = "FETCHING"
    VALIDATING = "VALIDATING"
    PARSING = "PARSING"
    PROCESSING = "PROCESSING"
    EXTRACTING = "EXTRACTING"
    EMBEDDING = "EMBEDDING"
    INDEXING = "INDEXING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"


class FailSafeState(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    CONFLICT = "CONFLICT"
    UNVERIFIED_SOURCE = "UNVERIFIED_SOURCE"
    STALE_SOURCE = "STALE_SOURCE"
    UNSUPPORTED_JURISDICTION = "UNSUPPORTED_JURISDICTION"
    NO_PROVENANCE = "NO_PROVENANCE"
    SECURITY_BLOCKED = "SECURITY_BLOCKED"


# --- API Envelopes ---

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: Optional[T] = None
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.0
    warnings: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ApiErrorResponse(BaseModel):
    success: bool = False
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    error: ErrorDetail
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# --- Shared Domain Contracts ---

class User(BaseModel):
    user_id: str
    email: str
    role: str = "citizen"
    tenant_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Session(BaseModel):
    session_id: str
    user_id: str
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LegalSource(BaseModel):
    source_id: str
    title: str
    publisher: str
    official_url: str
    jurisdiction: str
    source_type: str
    trust_level: SourceTrustLevel = SourceTrustLevel.TRUSTED_SECONDARY_SOURCE
    publication_date: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    retrieved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    content_hash: str
    version: int = 1
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED


class GraphEntity(BaseModel):
    entity_id: str
    name: str
    entity_type: str
    canonical_id: Optional[str] = None
    aliases: List[str] = Field(default_factory=list)
    jurisdiction: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    source_ids: List[str] = Field(default_factory=list)
    confidence: float = 1.0


class GraphRelationship(BaseModel):
    relationship_id: str
    source_entity_id: str
    target_entity_id: str
    relation_type: str
    attributes: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    source_ids: List[str] = Field(default_factory=list)


class SearchResult(BaseModel):
    chunk_id: str
    source_id: str
    source_title: str
    source_url: str
    text: str
    score: float
    retrieval_mode: str  # lexical, vector, graph, hybrid
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Citation(BaseModel):
    citation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_id: str
    source_version: int
    chunk_id: str
    section: Optional[str] = None
    passage: str
    official_url: str
    verification_status: VerificationStatus
    is_verified: bool = False


class AuditEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    actor_id: str
    role: str
    action: str
    resource_type: str
    resource_id: str
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SecurityEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    threat_type: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    actor_id: Optional[str] = None
    endpoint: str
    payload_sample: Optional[str] = None
    action_taken: str  # BLOCKED, QUARANTINED, LOGGED
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AgentToolCall(BaseModel):
    call_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_name: str
    tool_name: str
    parameters: Dict[str, Any]
    authorized: bool = False
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    latency_ms: float = 0.0
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AgentRun(BaseModel):
    run_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_name: str
    query: str
    tool_calls: List[AgentToolCall] = Field(default_factory=list)
    outcome: str
    evidence_pack_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# --- Module A: Legal Guidance Contracts ---

class LegalQuery(BaseModel):
    query: str
    jurisdiction: str = "IN"
    user_context: Dict[str, Any] = Field(default_factory=dict)
    case_id: Optional[str] = None


class LegalAnswer(BaseModel):
    """
    Structured legal answer with all 10 specification-mandated expandable sections.
    """
    answer_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    jurisdiction: str = "IN"
    
    # 10 Required Sections
    what_i_understood: str = Field(description="User-facing summary of understanding")
    relevant_legal_basis: List[str] = Field(default_factory=list, description="Relevant statutory acts, sections, rules")
    what_it_generally_means: str = Field(description="Plain-language explanation of the legal concept")
    how_it_may_relate: str = Field(description="Contextual connection to the citizen's specific situation")
    what_you_may_consider_doing: List[str] = Field(default_factory=list, description="Actionable options to consider")
    evidence_that_may_help: List[str] = Field(default_factory=list, description="Documentation/evidence citizen might gather")
    where_to_go: List[str] = Field(default_factory=list, description="Relevant authorities, tribunals, portals, or desks")
    sources: List[Citation] = Field(default_factory=list, description="Verified citations with provenance")
    confidence: float = Field(default=0.0, description="Evidence confidence score (0.0 to 1.0)")
    warnings: List[str] = Field(default_factory=list, description="Temporal or jurisdictional warnings")
    important_limitation: str = Field(
        default="This information is for educational and civic guidance purposes only and does not constitute formal legal counsel.",
        description="Statutory disclaimer"
    )
    
    fail_safe_state: FailSafeState = FailSafeState.VERIFIED
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# --- Module B: Government Service Navigator Contracts ---

class EligibilityRule(BaseModel):
    rule_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    field: str
    operator: str  # equals, greater_than, less_than, in, not_in, contains
    value: Any
    description: Optional[str] = None
    is_mandatory: bool = True


class GovernmentProcedure(BaseModel):
    step_number: int
    title: str
    description: str
    authority: Optional[str] = None
    estimated_days: Optional[int] = None
    portal_url: Optional[str] = None
    documents_required: List[str] = Field(default_factory=list)


class GovernmentService(BaseModel):
    service_id: str
    title: str
    department: str
    ministry: Optional[str] = None
    jurisdiction: str = "IN"
    state: Optional[str] = None
    description: str
    category: str
    eligibility_rules: List[EligibilityRule] = Field(default_factory=list)
    required_documents: List[str] = Field(default_factory=list)
    application_methods: List[str] = Field(default_factory=list)  # ONLINE, OFFLINE, HYBRID
    procedure_steps: List[GovernmentProcedure] = Field(default_factory=list)
    official_portal: Optional[str] = None
    grievance_portal: Optional[str] = None
    appeal_authority: Optional[str] = None
    last_verified_at: Optional[str] = None
    source_version: int = 1
    verification_status: VerificationStatus = VerificationStatus.ACTIVE
    confidence: float = 1.0


# --- Module D: Intelligent Document Processing Contracts ---

class DocumentAnalysis(BaseModel):
    analysis_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    document_type: str
    confidence: float
    authority: Optional[str] = None
    important_dates: List[str] = Field(default_factory=list)
    deadlines: List[str] = Field(default_factory=list)
    legal_references: List[str] = Field(default_factory=list)
    required_actions: List[str] = Field(default_factory=list)
    obligations: List[str] = Field(default_factory=list)
    entities: List[Dict[str, Any]] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    related_services: List[str] = Field(default_factory=list)
    knowledge_node_ids: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Document(BaseModel):
    document_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    case_id: Optional[str] = None
    original_filename: str
    storage_path: str
    mime_type: str
    file_size_bytes: int
    status: str = "UPLOADED"  # UPLOADED, VALIDATING, SECURITY_SCANNING, PROCESSING, ANALYZING, LINKING_KNOWLEDGE, READY, BLOCKED, FAILED
    analysis: Optional[DocumentAnalysis] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EligibilityResult(BaseModel):
    is_eligible: bool
    confidence: float = 1.0
    reasons: List[str] = Field(default_factory=list)
    matching_rules_count: int = 0
    total_rules_count: int = 0


class EvidenceItem(BaseModel):
    item_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    source_title: str
    section_number: Optional[str] = None
    source_url: Optional[str] = None
    confidence: float = 1.0
    provenance: Dict[str, Any] = Field(default_factory=dict)


class EvidencePack(BaseModel):
    pack_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    items: List[EvidenceItem] = Field(default_factory=list)
    evidence_confidence: float = 1.0
    fail_safe_state: FailSafeState = FailSafeState.VERIFIED
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CitationVerdict(str, Enum):
    SUPPORTED = "SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    DISPROVED = "DISPROVED"
    UNVERIFIED = "UNVERIFIED"


class CitationVerificationResult(BaseModel):
    verdict: CitationVerdict
    confidence: float = 1.0
    citation_source_id: str
    official_url: Optional[str] = None
    verification_notes: Optional[str] = None



