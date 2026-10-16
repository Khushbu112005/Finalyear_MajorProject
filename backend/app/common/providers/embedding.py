"""
Embedding Provider Abstraction for CivicSphere AI.
Defines clean abstract interfaces for text embedding generation,
ensuring vector dimensions are validated against configuration.
Supports OpenAI, Google Gemini, HuggingFace, and deterministic Mock providers.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
import numpy as np
import re
import hashlib
import logging
import httpx

from backend.app.common.config import settings

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
            idx = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16) % self._dimension
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [await self.embed_text(t) for t in texts]


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """
    OpenAI API Embedding Provider (e.g. text-embedding-3-small).
    Validates api_key and enforces target dimension.
    """

    def __init__(self, api_key: str, model: str = "text-embedding-3-small", dimension: int = 384):
        if not api_key:
            raise ValueError("FATAL: OpenAI API key is missing. Required when EMBEDDING_PROVIDER='openai'.")
        self.api_key = api_key
        self.model = model
        self._dimension = dimension

    def get_dimension(self) -> int:
        return self._dimension

    async def embed_text(self, text: str) -> List[float]:
        res = await self.embed_batch([text])
        return res[0]

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        url = "https://api.openai.com/v1/embeddings"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "input": texts,
            "dimensions": self._dimension
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                raise RuntimeError(f"OpenAI embedding API failed with status {resp.status_code}: {resp.text}")
            data = resp.json()
            embeddings = [item["embedding"] for item in data["data"]]
            result = []
            for emb in embeddings:
                arr = np.array(emb[:self._dimension], dtype=np.float32)
                norm = np.linalg.norm(arr)
                if norm > 0:
                    arr = arr / norm
                result.append(arr.tolist())
            return result


class GeminiEmbeddingProvider(EmbeddingProvider):
    """
    Google Gemini Embedding Provider (e.g. text-embedding-004).
    Validates api_key and projects vectors to configured dimension.
    """

    def __init__(self, api_key: str, model: str = "models/text-embedding-004", dimension: int = 384):
        if not api_key:
            raise ValueError("FATAL: Gemini API key is missing. Required when EMBEDDING_PROVIDER='google' or 'gemini'.")
        self.api_key = api_key
        self.model = model if model.startswith("models/") else f"models/{model}"
        self._dimension = dimension

    def get_dimension(self) -> int:
        return self._dimension

    async def embed_text(self, text: str) -> List[float]:
        url = f"https://generativelanguage.googleapis.com/v1beta/{self.model}:embedContent?key={self.api_key}"
        payload = {
            "model": self.model,
            "content": {"parts": [{"text": text}]}
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini embedding API failed with status {resp.status_code}: {resp.text}")
            data = resp.json()
            values = data.get("embedding", {}).get("values", [])
            if not values:
                raise ValueError("No embedding values returned by Gemini API")
            arr = np.array(values[:self._dimension], dtype=np.float32)
            if len(arr) < self._dimension:
                arr = np.pad(arr, (0, self._dimension - len(arr)))
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
            return arr.tolist()

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [await self.embed_text(t) for t in texts]


class HuggingFaceEmbeddingProvider(EmbeddingProvider):
    """
    Hugging Face Inference Embedding Provider (e.g. sentence-transformers/all-MiniLM-L6-v2).
    """

    def __init__(self, api_key: str, model: str = "sentence-transformers/all-MiniLM-L6-v2", dimension: int = 384):
        if not api_key:
            raise ValueError("FATAL: HuggingFace API key is missing. Required when EMBEDDING_PROVIDER='huggingface'.")
        self.api_key = api_key
        self.model = model
        self._dimension = dimension

    def get_dimension(self) -> int:
        return self._dimension

    async def embed_text(self, text: str) -> List[float]:
        res = await self.embed_batch([text])
        return res[0]

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{self.model}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={"inputs": texts, "options": {"wait_for_model": True}}, headers=headers)
            if resp.status_code != 200:
                raise RuntimeError(f"HuggingFace embedding API failed with status {resp.status_code}: {resp.text}")
            embeddings = resp.json()
            result = []
            for emb in embeddings:
                arr = np.array(emb[:self._dimension], dtype=np.float32)
                norm = np.linalg.norm(arr)
                if norm > 0:
                    arr = arr / norm
                result.append(arr.tolist())
            return result


def get_embedding_provider(
    provider_name: Optional[str] = None,
    dimension: Optional[int] = None
) -> EmbeddingProvider:
    """
    Factory to get configured embedding provider.
    Fails explicitly if an external provider is selected without credentials.
    """
    p_name = (provider_name or settings.EMBEDDING_PROVIDER or "mock").lower()
    dim = dimension or settings.EMBEDDING_DIMENSION

    if p_name == "mock":
        return MockEmbeddingProvider(dimension=dim)
    elif p_name == "openai":
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise ValueError("Configuration Error: OPENAI_API_KEY must be configured when EMBEDDING_PROVIDER='openai'.")
        return OpenAIEmbeddingProvider(api_key=api_key, model=settings.EMBEDDING_MODEL, dimension=dim)
    elif p_name in ("google", "gemini"):
        api_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY
        if not api_key:
            raise ValueError("Configuration Error: GEMINI_API_KEY or GOOGLE_API_KEY must be configured when EMBEDDING_PROVIDER='google'.")
        return GeminiEmbeddingProvider(api_key=api_key, model=settings.EMBEDDING_MODEL, dimension=dim)
    elif p_name == "huggingface":
        api_key = settings.HUGGINGFACE_API_KEY
        if not api_key:
            raise ValueError("Configuration Error: HUGGINGFACE_API_KEY must be configured when EMBEDDING_PROVIDER='huggingface'.")
        return HuggingFaceEmbeddingProvider(api_key=api_key, model=settings.EMBEDDING_MODEL, dimension=dim)
    else:
        raise ValueError(f"Unknown or unsupported embedding provider: '{p_name}'. Supported: mock, openai, google, huggingface.")
