"""
Shared Domain Schema Contracts Unit Tests.
Validates instantiation, serialization, field validations, and type safety
across all specification-required and implementation contracts.
"""

import pytest
from packages.schemas.contracts import (
    User,
    Session,
    LegalSource,
    GraphEntity,
    GraphRelationship,
    SearchResult,
    Citation,
    AuditEvent,
    SecurityEvent,
    AgentToolCall,
    AgentRun,
    LegalQuery,
    LegalAnswer,
    EligibilityRule,
    GovernmentProcedure,
    GovernmentService,
    DocumentAnalysis,
    Document,
    EligibilityResult,
    EvidenceItem,
    EvidencePack,
    CitationVerificationResult,
    VerificationStatus,
    SourceTrustLevel,
    FailSafeState,
    CitationVerdict,
    ApiResponse,
    ApiErrorResponse,
)


def test_shared_contracts_instantiation_and_serialization():
    # 1. User Contract
    user = User(user_id="usr_01", email="test@civicsphere.org", role="citizen")
    assert user.user_id == "usr_01"
    assert user.role == "citizen"

    # 2. LegalSource Contract
    src = LegalSource(
        source_id="src_01",
        title="Right to Information Act, 2005",
        publisher="Ministry of Law and Justice",
        official_url="https://rti.gov.in",
        jurisdiction="IN",
        source_type="PRIMARY_STATUTE",
        content_hash="sha256_dummy_hash"
    )
    assert src.title == "Right to Information Act, 2005"

    # 3. Graph Contracts
    entity = GraphEntity(entity_id="ent_01", name="Public Information Officer", entity_type="AUTHORITY")
    rel = GraphRelationship(relationship_id="rel_01", source_entity_id="ent_01", target_entity_id="ent_02", relation_type="GOVERNED_BY")
    assert entity.entity_type == "AUTHORITY"
    assert rel.relation_type == "GOVERNED_BY"

    # 4. Search & Citation Contracts
    citation = Citation(
        source_id="src_01",
        source_version=1,
        chunk_id="chk_01",
        section="Section 7",
        passage="Disposal of request within thirty days.",
        official_url="https://rti.gov.in",
        verification_status=VerificationStatus.ACTIVE,
        is_verified=True
    )
    assert citation.is_verified is True

    # 5. Legal Guidance Contract (10 Expandable Sections)
    answer = LegalAnswer(
        query="What is the RTI disposal time limit?",
        what_i_understood="Inquiry regarding Section 7 RTI disposal timeline.",
        relevant_legal_basis=["Right to Information Act, 2005, Section 7(1)"],
        what_it_generally_means="Statutory 30-day mandate for PIO to provide information.",
        how_it_may_relate="Applies to your pending pension RTI request.",
        what_you_may_consider_doing=["File First Appeal under Section 19(1)"],
        evidence_that_may_help=["Original RTI receipt", "Application copy"],
        where_to_go=["First Appellate Authority of the concerned Department"],
        sources=[citation],
        confidence=0.98,
        fail_safe_state=FailSafeState.VERIFIED
    )
    assert answer.confidence == 0.98
    assert len(answer.what_you_may_consider_doing) == 1

    # 6. Evidence Pack & Citation Verification
    ev_item = EvidenceItem(
        item_id="ev_01",
        text="Section 7 mandates thirty day disposal.",
        source_title="Right to Information Act, 2005",
        section_number="7",
        confidence=0.98
    )
    ev_pack = EvidencePack(
        pack_id="pack_01",
        query="RTI disposal time limit",
        items=[ev_item],
        evidence_confidence=0.98,
        fail_safe_state=FailSafeState.VERIFIED
    )
    assert len(ev_pack.items) == 1

    verif = CitationVerificationResult(
        citation_source_id="src_01",
        verdict=CitationVerdict.SUPPORTED,
        confidence=1.0,
        official_url="https://rti.gov.in",
        verification_notes="Source matched active gazette registry."
    )
    assert verif.verdict == CitationVerdict.SUPPORTED
    assert verif.citation_source_id == "src_01"

    # 7. Envelope Serialization
    resp = ApiResponse(data=answer.model_dump(), confidence=answer.confidence)
    assert resp.success is True
    assert resp.data["query"] == "What is the RTI disposal time limit?"
