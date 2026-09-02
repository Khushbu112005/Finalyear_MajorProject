"""
CivicSphere Global Configuration and Startup Validation Package.
Ensures unified settings across backend, workers, and migration tools.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class GlobalSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    APP_NAME: str = "CivicSphere-AI"
    API_PREFIX: str = "/api/v1"

    # Security & CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    JWT_SECRET_KEY: str = "test-secret-key-32-chars-minimum-length!"
    JWT_ALGORITHM: str = "HS256"
    CSRF_SECRET_KEY: str = "test-csrf-secret-key-32-chars-minimum!"
    MAX_SOURCE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB max payload

    # Database & Vector
    DATABASE_URL: str = "sqlite+aiosqlite:///./civicsphere_knowledge.db"
    EMBEDDING_DIMENSION: int = 384
    
    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "test-neo4j-password-123!"
    NEO4J_DATABASE: str = "neo4j"
    NEO4J_MAX_DEPTH: int = 3
    NEO4J_DEFAULT_DEPTH: int = 2
    NEO4J_MAX_NEIGHBORS: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Providers
    EMBEDDING_PROVIDER: str = "mock"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    LLM_PROVIDER: str = "mock"
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    RERANKER_PROVIDER: str = "heuristic"

    # Ingestion & SSRF
    SSRF_PROTECTION_ENABLED: bool = True
    ALLOWED_INGESTION_SCHEMES: List[str] = ["http", "https"]
    FETCH_TIMEOUT_SECONDS: float = 10.0
    MAX_REDIRECTS: int = 3


global_settings = GlobalSettings()
