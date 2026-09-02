"""
Reranker Provider Abstraction for CivicSphere AI.
Defines interfaces for reranking candidate search results.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger("civicsphere.providers.reranker")


class RerankerProvider(ABC):
    """Abstract interface for reranking candidate chunks."""

    @abstractmethod
    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Rerank candidates and return top_k."""
        pass


class HeuristicRerankerProvider(RerankerProvider):
    """
    RRF + Authority + Freshness boosting reranker.
    Wraps and standardizes existing reranking logic.
    """

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        if not candidates:
            return []
        
        # Sort candidates by existing rerank_score or score descending
        sorted_candidates = sorted(
            candidates,
            key=lambda c: c.get("rerank_score", c.get("score", 0.0)),
            reverse=True
        )
        return sorted_candidates[:top_k]


def get_reranker_provider(provider_name: Optional[str] = None) -> RerankerProvider:
    """Factory to get configured reranker provider."""
    return HeuristicRerankerProvider()
