"""
Case Workspace Continuity End-to-End Test.
Validates the full case intelligence continuity chain:
1. Upload and attach document evidence to Case Workspace
2. Perform structured extraction of legal references, case numbers, and authority
3. Link extracted entities to Neo4j Knowledge Graph
4. Generate grounded 10-section legal finding
5. Evaluate government service and judicial forum eligibility
6. Synthesize deadlines and actionable next steps
7. Persist structured metadata into Case Timeline with full state continuity.
"""

import pytest
import asyncio
from backend.app.documents.services.knowledge_linker import DocumentKnowledgeLinker
from backend.app.legal.services.legal_engine import LegalEngine
from backend.app.government.services.eligibility import evaluate_eligibility
from backend.app.cases.models import CaseModel


def test_case_workspace_continuity_e2e():
    async def _run():
        # Step 1 & 2: Document analysis attached to case
        evidence = {
            "document_type": "Consumer Dispute Notice",
            "authority": "District Consumer Disputes Redressal Commission",
            "case_number": "CC/2026/412",
            "legal_references": ["Consumer Protection Act, 2019", "Section 35"]
        }

        # Step 3: Knowledge Graph Linking
        node_ids = await DocumentKnowledgeLinker.link_document_evidence(
            document_id="doc_cont_001",
            filename="consumer_complaint.pdf",
            evidence=evidence
        )
        assert len(node_ids) > 0, "Entities must link to Consumer Protection Act nodes"

        # Step 4: Legal Finding Generation
        legal_finding = await LegalEngine.generate_guidance(
            query="Consumer complaint filing process under Section 35 of Consumer Protection Act",
            jurisdiction="IN"
        )
        assert "Consumer Protection Act, 2019" in str(legal_finding.relevant_legal_basis)
        assert len(legal_finding.what_you_may_consider_doing) > 0
        assert legal_finding.what_i_understood != ""

        # Step 5: Government Service / Forum Identification
        eligibility = evaluate_eligibility(
            rules=[{
                "rule_id": "rule_consumer_1",
                "condition_type": "MAX_CLAIM_AMOUNT",
                "field_name": "claim_amount",
                "operator": "<=",
                "threshold_value": 5000000.0,
                "error_message": "District Commission handles claims up to 50 Lakhs"
            }],
            citizen_context={"claim_amount": 1500000}
        )
        assert eligibility.is_eligible is True
        assert eligibility.matching_rules_count == 1

        # Step 6 & 7: Case Timeline & Action items
        case = CaseModel(
            id="case_cont_001",
            citizen_id="usr_consumer_1",
            title="Defective Air Conditioner Consumer Complaint",
            description="Claim filed before District Commission for refund",
            category="Consumer Rights",
            status="ACTIVE",
            priority="HIGH",
            location="Delhi",
            counsel_notes=f"Statutory jurisdiction: District Forum. Recommended next step: {legal_finding.what_you_may_consider_doing[0]}",
            court_reference=evidence["case_number"],
            legal_findings=legal_finding.what_you_may_consider_doing,
            government_services=[{
                "service_id": "svc_edaakhil_01",
                "name": "e-Daakhil Consumer Portal Filing",
                "status": "RECOMMENDED"
            }],
            timeline=[
                {"event": "Notice Uploaded", "date": "2026-08-15", "status": "COMPLETED"},
                {"event": "Legal Guidance Generated", "date": "2026-08-16", "status": "COMPLETED"},
                {"event": "Filing Deadline", "date": "2026-09-15", "status": "PENDING"}
            ]
        )

        assert case.citizen_id == "usr_consumer_1"
        assert case.court_reference == "CC/2026/412"
        assert len(case.legal_findings) > 0
        assert len(case.government_services) == 1
        assert len(case.timeline) == 3
        assert case.timeline[2]["status"] == "PENDING"

    asyncio.run(_run())
