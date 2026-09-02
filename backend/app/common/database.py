"""
Database infrastructure for CivicSphere AI.
Provides SQLAlchemy Base, async engine, and session dependency.
Supports both PostgreSQL (production) and SQLite (testing/local fallback).
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
import logging

from backend.app.common.config import settings

logger = logging.getLogger("civicsphere.database")

Base = declarative_base()

# Configure async engine
DATABASE_URL = settings.DATABASE_URL

engine_kwargs = {
    "echo": (settings.ENVIRONMENT == "development" and settings.LOG_LEVEL == "DEBUG"),
    "future": True,
}
if str(DATABASE_URL).startswith("postgresql+asyncpg"):
    engine_kwargs["connect_args"] = {"statement_cache_size": 0}

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
