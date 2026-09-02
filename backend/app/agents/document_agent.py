"""
Document Analysis Specialist Agent.
Orchestrates document classification, OCR parsing, security sanitization,
and Knowledge Graph entity linking.
"""

from typing import Dict, Any, List
from backend.app.agents.core.base_agent import BaseAgent
from backend.app.documents.services.security_scanner import DocumentSecurityScanner
from backend.app.documents.services.knowledge_linker import DocumentKnowledgeLinker
from packages.schemas.contracts import DocumentAnalysis


class DocumentAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="DocumentAnalysisAgent",
            system_prompt=(
                "You are the CivicSphere Document Analysis Specialist Agent. "
                "Your role is to analyze legal and civic documents, extract authorities, "
                "case numbers, and statutory references, and link them to the Knowledge Graph."
            ),
            allowed_tools=["search_knowledge", "graph_lookup"],
            max_steps=5
        )

    def scan_security(self, file_bytes: bytes) -> Dict[str, Any]:
        """Scans raw PDF bytes for embedded malicious objects and scripts."""
        is_safe, reasons = DocumentSecurityScanner.scan_pdf_bytes(file_bytes)
        return {"is_safe": is_safe, "reasons": reasons}

    async def link_entities(self, document_id: str, filename: str, evidence: Dict[str, Any]) -> List[str]:
        """Links extracted document entities and statutory references to Neo4j."""
        return await DocumentKnowledgeLinker.link_document_evidence(document_id, filename, evidence)
