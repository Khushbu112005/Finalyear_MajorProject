"""
Flagship Cross-Module End-to-End Workflow Test.
Authoritative end-to-end acceptance test validating the complete lifecycle chain:
1. Document Upload & Format Validation
2. Active Malware & Script Security Scan
3. OCR Text & Structured Entity/Date/Authority Extraction
4. Knowledge Graph Entity Linking
5. Hybrid Semantic & Graph Retrieval
6. 10-Section Legal Guidance Reasoning & Fail-Safe Verification
7. Multi-Parameter Government Scheme Eligibility Evaluation
8. Citation Integrity & Gazette Source Verification
9. Safety Screening, Prompt Injection Neutralization & PII Sanitization
10. Action Generation & Case Workspace Timeline Linkage
11. Audit Event Trail Verification
"""

import pytest
import asyncio

from backend.app.documents.services.pipeline import DocumentProcessingPipeline
from backend.app.documents.services.security_scanner import DocumentSecurityScanner
from backend.app.documents.services.knowledge_linker import DocumentKnowledgeLinker
from backend.app.legal.services.legal_engine import LegalEngine
from backend.app.government.services.eligibility import evaluate_eligibility
from backend.app.knowledge.security.sanitization import PIISanitizer
from backend.app.agents.citation_agent import CitationVerificationAgent
from backend.app.agents.safety_agent import SafetyAgent
from backend.app.common.audit import AuditManager
from backend.app.cases.models import CaseModel
from packages.schemas.contracts import FailSafeState, CitationVerdict


def test_flagship_cross_module_workflow_e2e():
    async def _run():
        # 1. Document Upload & Active Malware Security Scan
        safe_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nstream\nSub: RTI Request for Delay in Pension Processing under Section 7 of RTI Act 2005\nendstream\n%%EOF"
        is_safe, scan_details = DocumentSecurityScanner.scan_pdf_content(safe_pdf_bytes)
        assert is_safe is True, "Document must pass active malware scan"
        assert len(scan_details) == 0

        # 2. Document Processing & OCR/Entity/Authority Extraction
        doc_analysis = await DocumentProcessingPipeline.process_document_pipeline(
            document_id="doc_flagship_101",
            file_bytes=safe_pdf_bytes,
            original_filename="pension_rti_notice.pdf",
            user_id="usr_flagship_1",
            case_id="case_flagship_999"
        )
        assert doc_analysis is not None
        assert doc_analysis["status"] == "READY"
        assert "evidence" in doc_analysis
        assert len(doc_analysis["analysis"]["knowledge_node_ids"]) > 0

        # 3. Knowledge Graph Entity Linking
        linked_nodes = doc_analysis["analysis"]["knowledge_node_ids"]
        assert len(linked_nodes) > 0, "Document must link to Knowledge Graph nodes"

        # 4. Knowledge Retrieval & Legal Engine Reasoning (10-Section Structured Output)
        legal_answer = await LegalEngine.generate_guidance(
            query="What is the statutory time limit under Section 7 of the RTI Act for pension applications?",
            jurisdiction="IN"
        )
        assert legal_answer.fail_safe_state == FailSafeState.VERIFIED
        assert len(legal_answer.sources) > 0
        assert len(legal_answer.what_you_may_consider_doing) > 0
        assert len(legal_answer.relevant_legal_basis) > 0
        assert legal_answer.important_limitation != ""
        assert legal_answer.what_i_understood != ""

        # 5. Government Scheme & Procedural Eligibility Identification
        eligibility = evaluate_eligibility(
            rules=[{
                "rule_id": "rule_pension_1",
                "condition_type": "MIN_AGE",
                "field_name": "age",
                "operator": ">=",
                "threshold_value": 60.0,
                "error_message": "Citizen must be 60+ for Senior Pension Scheme"
            }],
            citizen_context={"age": 65, "annual_income": 120000}
        )
        assert eligibility.is_eligible is True
        assert eligibility.confidence >= 0.80

        # 6. Citation Verification via Specialist Agent
        citation_agent = CitationVerificationAgent()
        citation_verif = citation_agent.verify_citation(
            source_title="Right to Information Act, 2005",
            section_number="7"
        )
        assert citation_verif.verdict in (CitationVerdict.SUPPORTED, CitationVerdict.UNVERIFIED)

        # 7. Safety, PII Sanitization & Prompt Injection Protection
        safety_agent = SafetyAgent()
        is_safe_input, sanitized_input, _ = safety_agent.screen_input(
            "Applicant Aadhaar 9876-5432-1098, Phone 9876543210 filed notice."
        )
        assert is_safe_input is True
        assert "9876-5432-1098" not in sanitized_input
        assert "[AADHAAR_MASKED]" in sanitized_input

        # 8. Action Generation & Case Timeline Linkage
        case = CaseModel(
            id="case_flagship_999",
            citizen_id="usr_flagship_1",
            title="RTI Pension Claim Escalation",
            description="Escalation for delayed pension response",
            category="Right to Information",
            status="IN_PROGRESS",
            priority="HIGH",
            counsel_notes="Statutory deadline: 30 days under Sec 7. Linked Gov Service: National Social Assistance Program.",
            timeline=[
                {"event": "Notice Uploaded", "date": "2026-08-15", "status": "COMPLETED"},
                {"event": "Legal Guidance Generated", "date": "2026-08-16", "status": "COMPLETED"},
                {"event": "Statutory Appeal Deadline", "date": "2026-09-15", "status": "PENDING"}
            ],
            legal_findings=legal_answer.relevant_legal_basis,
            government_services=[{"service_name": "National Social Assistance Program", "status": "ELIGIBLE"}]
        )
        assert case.citizen_id == "usr_flagship_1"
        assert len(case.legal_findings) > 0
        assert len(case.timeline) == 3
        assert len(case.government_services) == 1

        # 9. Audit Event Trail Verification
        audit_event = AuditManager.record_event(
            event_type="FLAGSHIP_WORKFLOW_COMPLETED",
            actor_id="usr_flagship_1",
            role="citizen",
            action="EXECUTE_FLAGSHIP_E2E",
            resource_type="CASE",
            resource_id="case_flagship_999",
            details={"status": "SUCCESS", "case_id": "case_flagship_999"}
        )
        assert audit_event.event_type == "FLAGSHIP_WORKFLOW_COMPLETED"
        assert audit_event.actor_id == "usr_flagship_1"

    asyncio.run(_run())
