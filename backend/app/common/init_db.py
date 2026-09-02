"""
Database Initialization Utility.
Creates all tables registered on SQLAlchemy Base.metadata.
"""

import asyncio
import logging
from backend.app.common.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from backend.app.auth.models import UserModel
from backend.app.cases.models import CaseModel
from backend.app.documents.models import DocumentModel
from backend.app.government.models import GovernmentServiceModel
from backend.app.audit.models import AuditEventModel, SecurityEventModel

logger = logging.getLogger("civicsphere.init_db")


async def init_models() -> None:
    """Creates all database tables asynchronously."""
    async with engine.begin() as conn:
        logger.info("Initializing database tables on engine...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("All database tables created successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(init_models())
