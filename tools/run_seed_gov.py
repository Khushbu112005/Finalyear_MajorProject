import os
import sys
sys.path.insert(0, os.path.abspath("."))
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-32-chars-minimum-length!")
os.environ.setdefault("NEO4J_PASSWORD", "test-neo4j-secure-password-123!")

import asyncio
import logging
from backend.app.common.database import AsyncSessionLocal
from backend.app.common.init_db import init_models
from data.seed.seed_government_services import seed_government_services

logging.basicConfig(level=logging.INFO)

async def main():
    await init_models()
    async with AsyncSessionLocal() as session:
        count = await seed_government_services(session)
        print(f"Seeded {count} government schemes successfully!")

if __name__ == "__main__":
    asyncio.run(main())
