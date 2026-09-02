"""
CivicSphere Continuous Source Synchronization Cron Task.
Can be executed as a scheduled container task, cron job, or Kubernetes CronJob.
Refreshes all official statutory and government sources with idempotent change detection.
"""

import asyncio
import os
import sys
import logging
import json

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

os.environ.setdefault("ENVIRONMENT", "production")
os.environ.setdefault("JWT_SECRET_KEY", "cron-runner-secret-key-32-chars-min-len!")
os.environ.setdefault("NEO4J_PASSWORD", "cron-runner-neo4j-password-123!")

from backend.app.common.config import settings
from backend.app.common.init_db import init_models
from data.seed.seed_data import seed_knowledge_base
from backend.app.knowledge.sources.sync_worker import source_sync_worker
from backend.app.knowledge.sources.registry import source_registry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("civicsphere.cron.sync_sources")


async def main():
    logger.info("==========================================================")
    logger.info("  CIVICSPHERE KNOWLEDGE SOURCE SYNCHRONIZATION RUNNER     ")
    logger.info("==========================================================")

    # 1. Initialize DB & Ensure seed sources exist
    await init_models()
    if not source_registry.list_sources():
        logger.info("Source registry empty. Seeding baseline official sources...")
        await seed_knowledge_base()

    # 2. Execute full synchronization cycle
    logger.info("Starting scheduled source synchronization cycle...")
    summary = await source_sync_worker.refresh_all_sources(actor_id="cron_sync_runner")

    # 3. Print Results
    logger.info("=== SYNCHRONIZATION CYCLE SUMMARY ===")
    logger.info(f"Total Configured Sources : {summary.get('total_configured')}")
    logger.info(f"Executed                 : {summary.get('executed')}")
    logger.info(f"Succeeded (ACTIVE)       : {summary.get('succeeded')}")
    logger.info(f"Changed / Updated        : {summary.get('changed')}")
    logger.info(f"Unchanged (Verified)     : {summary.get('unchanged')}")
    logger.info(f"Failed / Stale           : {summary.get('failed')}")
    logger.info(f"Blocked (SSRF)           : {summary.get('blocked')}")
    logger.info(f"Cycle Duration           : {summary.get('duration_ms', 0):.2f} ms")

    logger.info("==========================================================")
    logger.info("Sync completed successfully.")


if __name__ == "__main__":
    asyncio.run(main())
