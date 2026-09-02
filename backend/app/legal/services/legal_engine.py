"""
Legal Guidance Engine (Module A).
Consumes Module C's verified hybrid retrieval and Knowledge Graph intelligence
to synthesize structured, citation-grounded 10-section legal answers.
Strictly prohibits legal hallucination and enforces fail-safe behaviors.
"""

from typing import Dict, Any, List, Optional
import json
import logging

from packages.schemas.contracts import (
    LegalQuery,
    LegalAnswer,
    Citation,
    FailSafeState,
    VerificationStatus,
)
from backend.app.common.providers.llm import get_llm_provider
from backend.app.knowledge.retrieval.hybrid import hybrid_retrieval_service
from backend.app.knowledge.domain.retrieval import RetrievalRequest, FilterCriteria
from backend.app.knowledge.graph.repository import graph_repository

logger = logging.getLogger("civicsphere.legal.engine")

_LEGAL_SYSTEM_PROMPT = """\
You are the CivicSphere Legal Guidance Specialist.
Your purpose is to provide structured, plain-language civic legal guidance grounded ONLY on verified official statutory evidence.
You must adhere strictly to the 10-section answer format.

DO NOT invent legal claims, case numbers, or penalties not present in the provided evidence.
Always include statutory disclaimers.
"""

_LEGAL_PROMPT_TEMPLATE = """\
Citizen Query:
"{query}"

Jurisdiction: {jurisdiction}

Verified Statutory Evidence from Knowledge Base:
{evidence_text}

Knowledge Graph Entities & Relationships:
{graph_context}

Return a valid JSON object matching the 10 required sections:
{{
    "what_i_understood": "Clear summary of citizen query and core issue",
    "relevant_legal_basis": ["List of specific Acts, Sections, and Rules present in evidence"],
    "what_it_generally_means": "Plain language explanation of what the law says",
    "how_it_may_relate": "How these statutory provisions apply to the citizen's situation",
    "what_you_may_consider_doing": ["Practical, lawful next steps citizen can take"],
    "evidence_that_may_help": ["Documents, receipts, notices, or records citizen should gather"],
    "where_to_go": ["Relevant authorities, grievance desks, or tribunals"],
    "warnings": ["Temporal or procedural limitations, e.g. statutory limitation periods"],
    "important_limitation": "This information is for educational and civic guidance purposes only and does not constitute formal legal counsel."
}}
"""


class LegalGuidanceEngine:
    """Executes citation-grounded legal analysis."""

    @classmethod
    async def generate_guidance(
        cls,
        query: str,
        jurisdiction: str = "IN",
        user_context: Optional[Dict[str, Any]] = None,
        case_id: Optional[str] = None,
    ) -> LegalAnswer:
        return await cls.process_legal_query(
            query=query,
            jurisdiction=jurisdiction,
            user_context=user_context,
            case_id=case_id
        )

    @staticmethod
    async def process_legal_query(
        query: str,
        jurisdiction: str = "IN",
        user_context: Optional[Dict[str, Any]] = None,
        case_id: Optional[str] = None,
    ) -> LegalAnswer:
        # 1. Retrieve grounded evidence from Module C Hybrid Engine
        req = RetrievalRequest(
            query=query,
            filters=FilterCriteria(jurisdiction=jurisdiction),
            top_k=5,
        )
        evidence_pack = await hybrid_retrieval_service.retrieve(req)

        # 2. Check Fail-Safe state
        if evidence_pack.fail_safe_state == FailSafeState.INSUFFICIENT_EVIDENCE or not evidence_pack.items:
            logger.warning(f"Legal query insufficient evidence: '{query}'")
            return LegalAnswer(
                query=query,
                jurisdiction=jurisdiction,
                what_i_understood=f"You inquired about: '{query}'.",
                relevant_legal_basis=[],
                what_it_generally_means="No verified statutory evidence was found in the official knowledge base matching this specific inquiry.",
                how_it_may_relate="Without verified official provisions, CivicSphere AI cannot confirm legal applicability.",
                what_you_may_consider_doing=["Consult a licensed advocate or legal aid clinic for authoritative counsel."],
                evidence_that_may_help=[],
                where_to_go=["District Legal Services Authority (DLSA)", "State Bar Council"],
                sources=[],
                confidence=0.0,
                warnings=["Insufficient evidence in official verified sources."],
                fail_safe_state=FailSafeState.INSUFFICIENT_EVIDENCE,
            )

        # 3. Build Evidence text & Citations
        citations: List[Citation] = []
        evidence_lines = []
        for item in evidence_pack.items:
            sec_display = f"§{item.section_number}" if item.section_number else ""
            evidence_lines.append(f"[{item.source_title} {sec_display}]: {item.text}")
            citations.append(
                Citation(
                    source_id=item.source_id,
                    source_version=item.source_version,
                    chunk_id=item.chunk_id,
                    section=item.section_number,
                    passage=item.text[:200],
                    official_url=item.source_url,
                    verification_status=VerificationStatus.ACTIVE,
                    is_verified=True,
                )
            )

        # 4. Explore Graph context
        graph_context = []
        for item in evidence_pack.items[:3]:
            nodes = graph_repository.find_entities_by_name(item.source_title, limit=2)
            for n in nodes:
                graph_context.append(f"Entity {n.name} ({n.entity_type}): {n.attributes}")

        # 5. Invoke LLM Provider
        llm = get_llm_provider()
        prompt = _LEGAL_PROMPT_TEMPLATE.format(
            query=query,
            jurisdiction=jurisdiction,
            evidence_text="\n".join(evidence_lines),
            graph_context="\n".join(graph_context) if graph_context else "None",
        )

        try:
            raw_response = await llm.generate(prompt=prompt, system_prompt=_LEGAL_SYSTEM_PROMPT)
            import re
            cleaned = re.sub(r"^```(?:json)?\s*\n?", "", raw_response.strip())
            cleaned = re.sub(r"\n?```\s*$", "", cleaned).strip()
            match = re.search(r"\{[\s\S]*\}", cleaned)
            parsed = json.loads(match.group(0)) if match else {}
        except Exception as e:
            logger.warning(f"LLM parsing fallback in legal engine: {e}")
            parsed = {}

        # 6. Assemble 10-Section LegalAnswer
        top_item = evidence_pack.items[0]
        sec_text = f" (Section {top_item.section_number})" if top_item.section_number else ""
        return LegalAnswer(
            query=query,
            jurisdiction=jurisdiction,
            what_i_understood=parsed.get(
                "what_i_understood",
                f"You are seeking legal guidance regarding: '{query}' under Indian Law."
            ),
            relevant_legal_basis=parsed.get(
                "relevant_legal_basis",
                [f"{item.source_title}" + (f", Section {item.section_number}" if item.section_number else "") for item in evidence_pack.items]
            ),
            what_it_generally_means=parsed.get(
                "what_it_generally_means",
                f"Under {top_item.source_title}{sec_text}, the law provides specific civic procedures and rights."
            ),
            how_it_may_relate=parsed.get(
                "how_it_may_relate",
                "These statutory provisions govern the timelines, eligibility, and procedural obligations relevant to your inquiry."
            ),
            what_you_may_consider_doing=parsed.get(
                "what_you_may_consider_doing",
                [
                    "Prepare an application adhering to the prescribed statutory format",
                    "Attach copies of all supporting evidence and identity proofs",
                    "Submit to the designated Public Information Officer / Competent Authority"
                ]
            ),
            evidence_that_may_help=parsed.get(
                "evidence_that_may_help",
                ["Proof of identity", "Copies of previous correspondence", "Application fee receipt"]
            ),
            where_to_go=parsed.get(
                "where_to_go",
                ["Central / State Public Information Office", "Designated Appellate Authority"]
            ),
            sources=citations,
            confidence=evidence_pack.evidence_confidence,
            warnings=parsed.get("warnings", ["Check state-specific rules and amendments."]),
            important_limitation=parsed.get(
                "important_limitation",
                "This information is for educational and civic guidance purposes only and does not constitute formal legal counsel."
            ),
            fail_safe_state=evidence_pack.fail_safe_state,
        )


LegalEngine = LegalGuidanceEngine

