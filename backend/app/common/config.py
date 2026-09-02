"""
Configuration management for CivicSphere Module C.
Loads settings from environment variables with strong typing and security defaults.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    APP_NAME: str = "CivicSphere-Knowledge-Engine"
    API_PREFIX: str = "/api/v1"

    # Security & Access
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    JWT_SECRET_KEY: str  # REQUIRED — no default. Must be set via environment.
    JWT_ALGORITHM: str = "HS256"
    MAX_SOURCE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB max payload

    # Ingestion & SSRF Protections
    SSRF_PROTECTION_ENABLED: bool = True
    ALLOWED_INGESTION_SCHEMES: List[str] = ["http", "https"]
    FETCH_TIMEOUT_SECONDS: float = 10.0
    MAX_REDIRECTS: int = 3

    # Database & Graph
    DATABASE_URL: str = "sqlite+aiosqlite:///./civicsphere_knowledge.db"
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str  # REQUIRED — no default. Must be set via environment.
    NEO4J_DATABASE: str = "neo4j"
    NEO4J_MAX_DEPTH: int = 3
    NEO4J_DEFAULT_DEPTH: int = 2
    NEO4J_MAX_NEIGHBORS: int = 10

    # AI Providers
    EMBEDDING_PROVIDER: str = "mock"  # mock, openai, voyage, huggingface
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 384
    LLM_PROVIDER: str = "mock"  # mock, anthropic, openai
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    RERANKER_PROVIDER: str = "heuristic"  # heuristic, cohere, cross-encoder

    # Retrieval Engine Config
    DEFAULT_TOP_K: int = 5
    MAX_TOP_K: int = 25
    RRF_K: int = 60
    EVIDENCE_CONFIDENCE_THRESHOLD_STRONG: float = 0.90
    EVIDENCE_CONFIDENCE_THRESHOLD_GOOD: float = 0.75
    EVIDENCE_CONFIDENCE_THRESHOLD_LIMITED: float = 0.50

    def model_post_init(self, __context) -> None:
        """Validate that required secrets are set and not placeholder values."""
        unsafe_patterns = [
            "change-this", "CHANGE_ME", "development-secret", "placeholder",
            "civicsphere_secret", "fallback", "default-key", "test-secret",
        ]
        for field_name in ("JWT_SECRET_KEY", "NEO4J_PASSWORD"):
            value = getattr(self, field_name, "")
            if not value or len(value) < 16:
                raise ValueError(
                    f"FATAL: {field_name} is missing or too short (min 16 chars). "
                    f"Set it in your .env file or environment variables."
                )
            if any(pattern in value.lower() for pattern in unsafe_patterns):
                if self.ENVIRONMENT not in ("development", "test"):
                    raise ValueError(
                        f"FATAL: {field_name} contains an unsafe placeholder value. "
                        f"Use a strong random secret for non-development environments."
                    )


settings = Settings()
