"""
Configuration management for CivicSphere Module C.
Loads settings from environment variables with strong typing and security defaults.
"""

from typing import Any, List, Optional, Union
import json
from pydantic import field_validator
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
    ALLOWED_ORIGINS: Any = [
        "https://civicsphere-web.vercel.app",
        "https://civicsphere-ez3pqxzli-devanshparagsavla1709-6335s-projects.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    JWT_SECRET_KEY: str  # REQUIRED — no default. Must be set via environment.
    JWT_ALGORITHM: str = "HS256"
    MAX_SOURCE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB max payload

    # Ingestion & SSRF Protections
    SSRF_PROTECTION_ENABLED: bool = True
    ALLOWED_INGESTION_SCHEMES: Any = ["http", "https"]
    FETCH_TIMEOUT_SECONDS: float = 10.0
    MAX_REDIRECTS: int = 3

    @field_validator("ALLOWED_ORIGINS", "ALLOWED_INGESTION_SCHEMES", mode="after")
    @classmethod
    def parse_string_or_list(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    inner = v[1:-1].strip()
                    if not inner:
                        return []
                    return [item.strip(" '\"") for item in inner.split(",") if item.strip(" '\"")]
            elif "," in v:
                return [item.strip() for item in v.split(",") if item.strip()]
            elif v:
                return [v]
            return []
        return v

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
    EMBEDDING_PROVIDER: str = "mock"  # mock, openai, google, gemini, huggingface
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 384
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "mock"  # mock, anthropic, openai, google
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    ANTHROPIC_API_KEY: Optional[str] = None
    RERANKER_PROVIDER: str = "heuristic"  # heuristic, cohere, cross-encoder

    # Retrieval Engine Config
    DEFAULT_TOP_K: int = 5
    MAX_TOP_K: int = 25
    RRF_K: int = 60
    EVIDENCE_CONFIDENCE_THRESHOLD_STRONG: float = 0.90
    EVIDENCE_CONFIDENCE_THRESHOLD_GOOD: float = 0.75
    EVIDENCE_CONFIDENCE_THRESHOLD_LIMITED: float = 0.50

    # Document Object Storage (Local Filesystem or Supabase Storage)
    STORAGE_BACKEND: str = "local"  # "local" or "supabase"
    STORAGE_LOCAL_PATH: str = "./uploads"
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "civicsphere-demo-documents"

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

        if self.ENVIRONMENT == "production":
            origins = self.ALLOWED_ORIGINS if isinstance(self.ALLOWED_ORIGINS, list) else [self.ALLOWED_ORIGINS]
            if "*" in origins:
                raise ValueError("FATAL: Wildcard CORS ('*') is strictly forbidden in production.")

        if self.STORAGE_BACKEND == "supabase":
            if not self.SUPABASE_URL or not self.SUPABASE_SERVICE_ROLE_KEY:
                raise ValueError(
                    "FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set when STORAGE_BACKEND=supabase"
                )
            if any(pattern in (self.SUPABASE_SERVICE_ROLE_KEY or "").lower() for pattern in unsafe_patterns):
                if self.ENVIRONMENT not in ("development", "test"):
                    raise ValueError(
                        "FATAL: SUPABASE_SERVICE_ROLE_KEY contains an unsafe placeholder value."
                    )


settings = Settings()
