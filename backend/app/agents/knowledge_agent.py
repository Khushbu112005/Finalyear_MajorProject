"""
Knowledge Graph Specialist Agent.
Specializes in multi-hop graph traversals, entity disambiguation, and cross-statute relationship discovery.
"""

from typing import Dict, Any, List
from backend.app.agents.core.base_agent import BaseAgent
from backend.app.knowledge.graph.repository import graph_repository
from backend.app.knowledge.domain.retrieval import RetrievalRequest, FilterCriteria
from backend.app.knowledge.retrieval.hybrid import hybrid_retrieval_service
from packages.schemas.contracts import EvidencePack


class KnowledgeGraphAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="KnowledgeGraphAgent",
            system_prompt=(
                "You are the CivicSphere Knowledge Graph Specialist Agent. "
                "Your role is to navigate the statutory knowledge graph, discover interconnected "
                "sections, authorities, and tribunals, and perform hybrid retrieval."
            ),
            allowed_tools=["search_knowledge", "graph_lookup"],
            max_steps=5
        )

    async def search_and_traverse(
        self,
        query: str,
        jurisdiction: str = "IN",
        top_k: int = 5
    ) -> EvidencePack:
        """Performs hybrid statutory retrieval with graph context expansion."""
        req = RetrievalRequest(query=query, filters=FilterCriteria(jurisdiction=jurisdiction), top_k=top_k)
        return await hybrid_retrieval_service.retrieve(req)

    def get_neighborhood(self, entity_id: str, max_depth: int = 2) -> Dict[str, Any]:
        """Traverses graph neighborhood around a specified entity."""
        return graph_repository.get_entity_neighborhood(entity_id=entity_id, max_depth=max_depth)
