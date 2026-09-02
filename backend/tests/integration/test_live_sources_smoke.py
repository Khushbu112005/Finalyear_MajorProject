"""
Opt-In Real External Source Smoke Test for CivicSphere AI.
Exclusively exercises live, read-only HTTP/HTTPS connectivity against authoritative public sources.
Excluded from standard offline CI unless ENABLE_EXTERNAL_NETWORK_TESTS=true is explicitly set.
"""

import os
import pytest
import asyncio
from backend.app.knowledge.ingestion.fetcher import SourceFetcher
from backend.app.knowledge.sources.sync_worker import source_sync_worker
from backend.app.knowledge.sources.registry import source_registry
from packages.schemas.contracts import SourceTrustLevel, VerificationStatus


@pytest.mark.skipif(
    os.getenv("ENABLE_EXTERNAL_NETWORK_TESTS", "false").lower() != "true",
    reason="External network tests are opt-in to protect deterministic CI/CD environments."
)
def test_real_external_source_live_smoke():
    """Performs a live, read-only probe against an official government portal."""
    async def _run():
        test_url = "https://pmkisan.gov.in/"
        content, meta = await SourceFetcher.fetch_source_content(test_url)
        assert content is not None
        assert len(content) > 100
        assert meta["status_code"] == 200
        assert "pmkisan.gov.in" in meta["final_url"]

    asyncio.run(_run())
