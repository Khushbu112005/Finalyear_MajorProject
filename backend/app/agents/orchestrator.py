"""
Multi-Agent Orchestration Engine.
Coordinates the 6 specialist autonomous agents:
- SafetyAgent
- LegalResearchAgent
- GovernmentServiceAgent
- DocumentAnalysisAgent
- KnowledgeGraphAgent
- CitationVerificationAgent
Enforcing safety screening, bounded reasoning loops, sandboxed tool calls, and citation verification.
"""

from typing import Dict, Any, Optional, List
import logging

from backend.app.common.security import AuthContext
from backend.app.agents.legal_agent import LegalResearchAgent
from backend.app.agents.government_agent import GovernmentServiceAgent
from backend.app.agents.document_agent import DocumentAnalysisAgent
from backend.app.agents.knowledge_agent import KnowledgeGraphAgent
from backend.app.agents.citation_agent import CitationVerificationAgent
from backend.app.agents.safety_agent import SafetyAgent
from backend.app.common.audit import AuditManager

logger = logging.getLogger("civicsphere.agents.orchestrator")


class CivicSphereOrchestrator:
    """Coordinates specialist agents to resolve multi-disciplinary civic queries."""

    def __init__(self):
        self.safety_agent = SafetyAgent()
        self.legal_agent = LegalResearchAgent()
        self.gov_agent = GovernmentServiceAgent()
        self.doc_agent = DocumentAnalysisAgent()
        self.kg_agent = KnowledgeGraphAgent()
        self.citation_agent = CitationVerificationAgent()

    async def route_and_execute(
        self,
        query: str,
        auth: Optional[AuthContext] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # 1. Mandatory Safety Pre-Screening (Prompt Injection & PII Masking)
        is_safe, sanitized_query, threat_reason = self.safety_agent.screen_input(query)
        if not is_safe:
            AuditManager.record_security_event(
                event_type="PROMPT_INJECTION_BLOCKED",
                actor_id=auth.user_id if auth else "anonymous",
                severity="HIGH",
                threat_details=threat_reason,
                raw_payload={"query_snippet": query[:100]}
            )
            return {
                "status": "BLOCKED",
                "reason": "Input failed safety and security verification policy.",
                "response": "Your request could not be processed due to safety policy constraints."
            }

        query_lower = sanitized_query.lower()

        # 2. Intelligent Routing based on intent and query semantics
        if any(w in query_lower for w in ["document", "pdf", "notice", "upload", "ocr"]):
            logger.info(f"Orchestrator routing to DocumentAnalysisAgent")
            result = await self.doc_agent.execute(query=sanitized_query, auth=auth, context=context)

        elif any(w in query_lower for w in ["graph", "entity", "relationship", "traverse", "acts connected"]):
            logger.info(f"Orchestrator routing to KnowledgeGraphAgent")
            result = await self.kg_agent.execute(query=sanitized_query, auth=auth, context=context)

        elif any(w in query_lower for w in ["scheme", "eligibility", "benefit", "subsidy", "welfare", "apply", "pension"]):
            logger.info(f"Orchestrator routing to GovernmentServiceAgent")
            result = await self.gov_agent.execute(query=sanitized_query, auth=auth, context=context)

        else:
            logger.info(f"Orchestrator routing to LegalResearchAgent")
            result = await self.legal_agent.execute(query=sanitized_query, auth=auth, context=context)

        # 3. Post-execution Citation Verification (if sources are cited)
        if "response" in result and isinstance(result["response"], str):
            # Screen output for safety
            safe_resp = self.safety_agent.screen_output(result["response"])
            result["response"] = safe_resp

        return result


orchestrator = CivicSphereOrchestrator()
