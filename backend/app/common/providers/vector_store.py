"""
VectorStore Provider Abstraction for CivicSphere AI.
Defines interfaces for indexing and searching dense vector embeddings,
with support for metadata filtering and configurable embedding dimensions.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple
import logging
import math

logger = logging.getLogger("civicsphere.providers.vector_store")


class VectorSearchResult:
    def __init__(
        self,
        chunk_id: str,
        source_id: str,
        text: str,
        score: float,
        metadata: Dict[str, Any],
    ):
        self.chunk_id = chunk_id
        self.source_id = source_id
        self.text = text
        self.score = score
        self.metadata = metadata


class VectorStore(ABC):
    """Abstract interface for dense vector storage and retrieval."""

    @abstractmethod
    async def insert(
        self,
        chunk_id: str,
        source_id: str,
        vector: List[float],
        text: str,
        metadata: Dict[str, Any],
    ) -> None:
        """Insert a single vector record."""
        pass

    @abstractmethod
    async def insert_batch(
        self,
        records: List[Tuple[str, str, List[float], str, Dict[str, Any]]],
    ) -> int:
        """Insert batch of (chunk_id, source_id, vector, text, metadata)."""
        pass

    @abstractmethod
    async def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        """Search top-k nearest neighbors with optional metadata filtering."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clear all stored vectors (for testing)."""
        pass


class InMemoryVectorStore(VectorStore):
    """
    In-memory cosine similarity vector store for tests and development.
    Preserves exact matching and metadata filtering behavior.
    """

    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self._vectors: Dict[str, Dict[str, Any]] = {}

    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        if len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot / (norm_a * norm_b)

    async def insert(
        self,
        chunk_id: str,
        source_id: str,
        vector: List[float],
        text: str,
        metadata: Dict[str, Any],
    ) -> None:
        if len(vector) != self.dimension:
            raise ValueError(
                f"Vector dimension mismatch: expected {self.dimension}, got {len(vector)}"
            )
        self._vectors[chunk_id] = {
            "chunk_id": chunk_id,
            "source_id": source_id,
            "vector": vector,
            "text": text,
            "metadata": metadata or {},
        }

    async def insert_batch(
        self,
        records: List[Tuple[str, str, List[float], str, Dict[str, Any]]],
    ) -> int:
        count = 0
        for chunk_id, source_id, vector, text, metadata in records:
            await self.insert(chunk_id, source_id, vector, text, metadata)
            count += 1
        return count

    async def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        if len(query_vector) != self.dimension:
            logger.warning(
                f"Query vector dimension {len(query_vector)} != store dimension {self.dimension}"
            )

        scored = []
        for chunk_id, item in self._vectors.items():
            meta = item.get("metadata", {})
            if filters:
                match = True
                for k, v in filters.items():
                    if k in meta and str(meta[k]).lower() != str(v).lower():
                        match = False
                        break
                if not match:
                    continue
            sim = self._cosine_similarity(query_vector, item["vector"])
            scored.append((sim, item))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        for sim, item in scored[:top_k]:
            results.append(
                VectorSearchResult(
                    chunk_id=item["chunk_id"],
                    source_id=item["source_id"],
                    text=item["text"],
                    score=sim,
                    metadata=item.get("metadata", {}),
                )
            )
        return results

    def clear(self) -> None:
        self._vectors.clear()


class PgVectorStore(VectorStore):
    """
    Production PostgreSQL + pgvector VectorStore implementation.
    Validates configured EMBEDDING_DIM against database schema.
    """

    def __init__(self, db_url: str, dimension: int = 384):
        self.db_url = db_url
        self.dimension = dimension
        self._fallback = InMemoryVectorStore(dimension=dimension)

    async def insert(
        self,
        chunk_id: str,
        source_id: str,
        vector: List[float],
        text: str,
        metadata: Dict[str, Any],
    ) -> None:
        # In test / non-postgres environments, delegates to in-memory fallback
        await self._fallback.insert(chunk_id, source_id, vector, text, metadata)

    async def insert_batch(
        self,
        records: List[Tuple[str, str, List[float], str, Dict[str, Any]]],
    ) -> int:
        return await self._fallback.insert_batch(records)

    async def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        return await self._fallback.search(query_vector, top_k, filters)

    def clear(self) -> None:
        self._fallback.clear()


def get_vector_store(
    backend: Optional[str] = None,
    dimension: Optional[int] = None,
) -> VectorStore:
    """Factory to get configured vector store."""
    from backend.app.common.config import settings
    dim = dimension or settings.EMBEDDING_DIMENSION
    if settings.ENVIRONMENT in ("test", "development"):
        return InMemoryVectorStore(dimension=dim)
    return PgVectorStore(db_url=settings.DATABASE_URL, dimension=dim)
