"""
Legal Research Specialist Agent.
Specializes in statutory retrieval, section cross-referencing, jurisdiction scoping,
and grounded 10-section legal guidance generation.
"""

from typing import Dict, Any, Optional
from backend.app.agents.core.base_agent import BaseAgent
from backend.app.legal.services.legal_engine import LegalEngine
from packages.schemas.contracts import LegalAnswer, EvidencePack


class LegalResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="LegalResearchAgent",
            system_prompt=(
                "You are the CivicSphere Legal Research Specialist Agent. "
                "Your role is to analyze civic queries under Indian Law, perform statutory retrieval, "
                "and formulate grounded guidance based exclusively on verified Acts and Gazettes."
            ),
            allowed_tools=["search_knowledge", "graph_lookup", "get_legal_guidance"],
            max_steps=5
        )

    async def execute_research(
        self,
        query: str,
        jurisdiction: str = "IN",
        user_context: Optional[Dict[str, Any]] = None
    ) -> LegalAnswer:
        """Executes full legal research grounded in verified statutory sources."""
        return await LegalEngine.generate_guidance(
            query=query,
            jurisdiction=jurisdiction,
            user_context=user_context
        )
