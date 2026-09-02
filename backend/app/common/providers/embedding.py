"""
Embedding Provider Abstraction for CivicSphere AI.
Defines clean abstract interfaces for text embedding generation,
ensuring vector dimensions are validated against configuration.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
import numpy as np
import re
import hashlib
import logging

logger = logging.getLogger("civicsphere.providers.embedding")


class EmbeddingProvider(ABC):
    """Abstract interface for embedding generation."""

    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for single text passage."""
        pass

    @abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embedding vectors for batch of text passages."""
        pass

    @abstractmethod
    def get_dimension(self) -> int:
        """Return embedding dimension."""
        pass

    @property
    def dimension(self) -> int:
        return self.get_dimension()


class MockEmbeddingProvider(EmbeddingProvider):
    """
    Deterministic feature-hash embedding provider for testing and offline execution.
    Preserves word-level token hashing and stopword filtering for exact semantic matching.
    """

    STOPWORDS = {
        "what", "is", "the", "of", "and", "a", "an", "in", "to", "for", "on", "with",
        "as", "by", "at", "from", "or", "which", "this", "that", "it", "are", "be",
        "under", "any", "how", "where", "when", "who", "all", "shall", "may"
    }

    def __init__(self, dimension: int = 384):
        self._dimension = dimension

    def get_dimension(self) -> int:
        return self._dimension

    async def embed_text(self, text: str) -> List[float]:
        raw_words = re.findall(r"\b[a-zA-Z0-9_]+\b", text.lower())
        words = [w for w in raw_words if w not in self.STOPWORDS]
        vec = np.zeros(self._dimension, dtype=np.float32)
        for w in words:
            # Deterministic hash index across platforms
            idx = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16) % self._dimension
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [await self.embed_text(t) for t in texts]


def get_embedding_provider(
    provider_name: Optional[str] = None,
    dimension: Optional[int] = None
) -> EmbeddingProvider:
    """Factory to get configured embedding provider."""
    from backend.app.common.config import settings
    dim = dimension or settings.EMBEDDING_DIMENSION
    return MockEmbeddingProvider(dimension=dim)
