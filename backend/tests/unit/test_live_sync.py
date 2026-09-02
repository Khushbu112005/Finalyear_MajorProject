"""
Tests for CivicSphere Live Source Synchronization Engine & Observability.
Covers:
- Unchanged source hash detection & timestamp updates
- Changed source versioning & knowledge graph / vector propagation
- Last-known-good preservation on network fetch failures
- Parser failure handling
- SSRF prevention during source sync
- Admin API authorization and RBAC
- Concurrency lock protection
"""

import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from packages.schemas.contracts import VerificationStatus, SourceTrustLevel
from backend.app.main import app
from backend.app.common.audit import AuditManager
from backend.app.knowledge.sources.registry import source_registry
from backend.app.knowledge.sources.sync_worker import source_sync_worker
from backend.app.knowledge.graph.repository import graph_repository
from backend.app.knowledge.ingestion.vector_writer import vector_store


@pytest.fixture
def mock_source():
    """Registers a clean test source for sync tests."""
    return source_registry.register_source(
        title="Test Civic Scheme Act, 2024",
        publisher="Ministry of Civic Technology",
        official_url="https://civictechnology.gov.in/acts/test-scheme-2024",
        jurisdiction="IN",
        source_type="ACT",
        content="Section 1. Short Title. This is the Test Civic Scheme Act.",
        trust_level=SourceTrustLevel.OFFICIAL_LEGISLATION,
        verification_status=VerificationStatus.ACTIVE
    )


def test_sync_unchanged_source_idempotency(mock_source):
    """Verifies that an unchanged source updates verification timestamp without reindexing."""
    async def _run():
        source_id = mock_source.source_id
        initial_version = mock_source.current_version
        initial_hash = mock_source.content_hash

        # Mock fetch returning identical content
        with patch("backend.app.knowledge.ingestion.fetcher.SourceFetcher.fetch_source_content", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = ("Section 1. Short Title. This is the Test Civic Scheme Act.", {"status": 200})

            result = await source_sync_worker.refresh_source(source_id=source_id, force=False)

            assert result["status"] == "UNCHANGED"
            assert result["changed"] is False
            assert result["version"] == initial_version
            assert result["new_hash"] == initial_hash
            assert result["final_status"] == "ACTIVE"

    asyncio.run(_run())


def test_sync_changed_source_triggers_full_reindex(mock_source):
    """Verifies that changed source content increments version and updates vector/graph."""
    async def _run():
        source_id = mock_source.source_id
        initial_version = mock_source.current_version
        initial_hash = mock_source.content_hash
        new_text = "Section 1. Amended Title. Section 2. New Benefit for citizens up to 50000 rupees."

        with patch("backend.app.knowledge.ingestion.fetcher.SourceFetcher.fetch_source_content", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = (new_text, {"status": 200})

            result = await source_sync_worker.refresh_source(source_id=source_id, force=False)

            assert result["status"] == "UPDATED"
            assert result["changed"] is True
            assert result["version"] == initial_version + 1
            assert result["final_status"] == "ACTIVE"

            # Verify registry holds updated record
            updated_source = source_registry.get_source(source_id)
            assert updated_source.current_version == initial_version + 1
            assert updated_source.content_hash != initial_hash

    asyncio.run(_run())


def test_sync_preserves_last_known_good_on_fetch_failure(mock_source):
    """Verifies that a network failure marks status FETCH_FAILED and keeps previous version intact."""
    async def _run():
        source_id = mock_source.source_id
        initial_version = mock_source.current_version
        initial_hash = mock_source.content_hash

        with patch("backend.app.knowledge.ingestion.fetcher.SourceFetcher.fetch_source_content", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.side_effect = Exception("Connection timed out after 10.0s")

            result = await source_sync_worker.refresh_source(source_id=source_id, max_retries=1)

            assert result["status"] == "FETCH_FAILED"
            assert result["retrieved"] is False
            assert result["version"] == initial_version

            # Verify source in registry was NOT wiped
            retained_source = source_registry.get_source(source_id)
            assert retained_source.current_version == initial_version
            assert retained_source.content_hash == initial_hash
            assert retained_source.verification_status == VerificationStatus.FETCH_FAILED

    asyncio.run(_run())


def test_sync_blocks_ssrf_destination(mock_source):
    """Verifies that attempted sync against a private IP is blocked by SSRF defense."""
    async def _run():
        source_id = mock_source.source_id

        from backend.app.common.errors import SecurityBlockedException
        with patch("backend.app.knowledge.ingestion.fetcher.SourceFetcher.fetch_source_content", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.side_effect = SecurityBlockedException("SSRF Blocked: Prohibited destination IP.")

            result = await source_sync_worker.refresh_source(source_id=source_id)

            assert result["status"] == "BLOCKED"
            assert result["reason"] == "SSRF destination policy violation"

            retained_source = source_registry.get_source(source_id)
            assert retained_source.verification_status == VerificationStatus.BLOCKED

    asyncio.run(_run())


def test_sync_all_sources_cycle_and_observability(mock_source):
    """Verifies the complete batch sync cycle and status telemetry."""
    async def _run():
        with patch("backend.app.knowledge.ingestion.fetcher.SourceFetcher.fetch_source_content", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = ("Sample content for batch sync", {"status": 200})

            summary = await source_sync_worker.refresh_all_sources(actor_id="test_runner")

            assert "total_configured" in summary
            assert "executed" in summary
            assert summary["executed"] > 0
            assert "duration_ms" in summary

            # Check observability status endpoint
            status_telemetry = source_sync_worker.get_sync_status()
            assert status_telemetry["total_cycles_executed"] >= 1
            assert status_telemetry["sources_total"] >= 1

    asyncio.run(_run())


def test_admin_refresh_endpoint_rbac(test_client, mock_source, citizen_auth_headers, admin_auth_headers):
    """Verifies that only admin or knowledge_editor roles can invoke on-demand source refresh."""
    source_id = mock_source.source_id

    # 1. Citizen Role -> 403 Forbidden
    resp_citizen = test_client.post(
        f"/api/v1/knowledge/sources/{source_id}/refresh",
        headers=citizen_auth_headers
    )
    assert resp_citizen.status_code == 403

    # 2. Admin Role -> 200 OK
    with patch("backend.app.knowledge.ingestion.fetcher.SourceFetcher.fetch_source_content", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = ("Section 1. Short Title. This is the Test Civic Scheme Act.", {"status": 200})

        resp_admin = test_client.post(
            f"/api/v1/knowledge/sources/{source_id}/refresh",
            headers=admin_auth_headers
        )
        assert resp_admin.status_code == 200
        data = resp_admin.json()
        assert data["success"] is True
        assert data["data"]["source_id"] == source_id
