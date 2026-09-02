"""
Continuous Source Synchronization Worker for CivicSphere AI.
Executes scheduled and on-demand official source refreshing with:
- SSRF defense preservation
- Exponential backoff & bounded retries
- Single-source isolation
- Hash-based change detection
- Vector & Graph propagation
- Last-known-good fallback on failure
- Full tamper-evident audit logging
"""

import asyncio
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from packages.schemas.contracts import VerificationStatus, IngestionStatus, SourceTrustLevel
from backend.app.common.audit import AuditManager
from backend.app.common.errors import SecurityBlockedException, IngestionValidationException, CivicSphereException
from backend.app.knowledge.domain.source import SourceRecord
from backend.app.knowledge.sources.registry import source_registry
from backend.app.knowledge.ingestion.fetcher import SourceFetcher
from backend.app.knowledge.ingestion.pipeline import ingestion_pipeline

logger = logging.getLogger("civicsphere.sources.sync")


class SourceSyncWorker:
    """Production-safe continuous source synchronization engine."""

    def __init__(self):
        self._lock = asyncio.Lock()
        self._last_sync_time: Optional[str] = None
        self._last_sync_duration_ms: float = 0.0
        self._total_runs: int = 0
        self._total_changed: int = 0
        self._total_unchanged: int = 0
        self._total_failed: int = 0
        self._total_blocked: int = 0

    async def refresh_source(
        self,
        source_id: str,
        force: bool = False,
        actor_id: str = "system",
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """
        Safely refreshes a single official source by source_id.
        Preserves last-known-good content on network/parser failure.
        """
        source = source_registry.get_source(source_id)
        if not source:
            raise IngestionValidationException(f"Source with ID '{source_id}' not found in registry.")

        old_hash = source.content_hash
        old_version = source.current_version
        official_url = source.official_url

        fetched_content = None
        fetch_metadata = {}
        error_reason = None

        # Step 1: Safe Fetch with bounded retries & backoff
        for attempt in range(1, max_retries + 1):
            try:
                fetched_content, fetch_metadata = await SourceFetcher.fetch_source_content(official_url)
                break
            except SecurityBlockedException as sbe:
                logger.warning(f"SSRF security violation blocked for source '{source_id}' ({official_url})")
                source_registry.update_status(source_id, verification_status=VerificationStatus.BLOCKED)
                self._total_blocked += 1
                AuditManager.record_security_event(
                    threat_type="SSRF_INGESTION_ATTEMPT",
                    severity="HIGH",
                    endpoint="/knowledge/sources/sync",
                    action_taken="BLOCKED",
                    actor_id=actor_id,
                    payload_sample=official_url
                )
                return {
                    "source_id": source_id,
                    "title": source.title,
                    "status": "BLOCKED",
                    "reason": "SSRF destination policy violation",
                    "http_status": 403,
                    "changed": False,
                    "version": old_version
                }
            except Exception as fetch_exc:
                error_reason = str(fetch_exc)
                logger.warning(f"Fetch attempt {attempt}/{max_retries} failed for '{source_id}': {error_reason}")
                if attempt < max_retries:
                    await asyncio.sleep(0.5 * (2 ** (attempt - 1)))  # Exponential backoff

        # Step 2: Handle Fetch Failure (Preserve last-known-good)
        if fetched_content is None or not fetched_content.strip():
            logger.error(f"Live fetch failed for source '{source_id}'. Retaining version {old_version}.")
            source_registry.update_status(source_id, verification_status=VerificationStatus.FETCH_FAILED)
            self._total_failed += 1
            AuditManager.record_event(
                event_type="SOURCE_SYNC_FETCH_FAILED",
                actor_id=actor_id,
                role="system",
                action="REFRESH_SOURCE",
                resource_type="SOURCE",
                resource_id=source_id,
                details={
                    "official_url": official_url,
                    "reason": error_reason or "Empty content or timeout",
                    "retained_version": old_version
                }
            )
            return {
                "source_id": source_id,
                "title": source.title,
                "url": official_url,
                "status": "FETCH_FAILED",
                "retrieved": False,
                "reason": error_reason or "Connection timed out or returned empty body",
                "old_hash": old_hash,
                "new_hash": None,
                "changed": False,
                "version": old_version,
                "parser_status": "SKIPPED",
                "final_status": "FETCH_FAILED"
            }

        # Step 3: Hash Comparison & Change Detection
        new_hash = hashlib.sha256(fetched_content.encode("utf-8")).hexdigest()

        if new_hash == old_hash and not force:
            # Content Unchanged -> Touch verification timestamp & mark ACTIVE
            source.last_verified_at = datetime.now(timezone.utc).isoformat()
            source_registry.update_status(source_id, verification_status=VerificationStatus.ACTIVE)
            self._total_unchanged += 1
            AuditManager.record_event(
                event_type="SOURCE_SYNC_UNCHANGED",
                actor_id=actor_id,
                role="system",
                action="REFRESH_SOURCE",
                resource_type="SOURCE",
                resource_id=source_id,
                details={
                    "hash": new_hash,
                    "version": old_version,
                    "status": "ACTIVE"
                }
            )
            return {
                "source_id": source_id,
                "title": source.title,
                "url": official_url,
                "status": "UNCHANGED",
                "retrieved": True,
                "old_hash": old_hash,
                "new_hash": new_hash,
                "changed": False,
                "version": old_version,
                "records_affected": 0,
                "parser_status": "SUCCESS",
                "final_status": "ACTIVE"
            }

        # Step 4: Content Changed -> Ingestion Pipeline (Version + Chunks + Vectors + Graph)
        try:
            ingest_result = await ingestion_pipeline.ingest_source(
                title=source.title,
                publisher=source.publisher,
                official_url=source.official_url,
                jurisdiction=source.jurisdiction,
                source_type=source.source_type,
                raw_text=fetched_content,
                fetch_remote=False,
                trust_level=source.trust_level,
                publication_date=source.publication_date,
                effective_date=source.effective_date,
                actor_id=actor_id
            )
            self._total_changed += 1
            AuditManager.record_event(
                event_type="SOURCE_SYNC_UPDATED",
                actor_id=actor_id,
                role="system",
                action="REFRESH_SOURCE",
                resource_type="SOURCE",
                resource_id=source_id,
                details={
                    "old_hash": old_hash,
                    "new_hash": new_hash,
                    "old_version": old_version,
                    "new_version": ingest_result.get("version"),
                    "chunks_indexed": ingest_result.get("chunks_indexed"),
                    "entities_indexed": ingest_result.get("entities_indexed")
                }
            )
            return {
                "source_id": source_id,
                "title": source.title,
                "url": official_url,
                "status": "UPDATED",
                "retrieved": True,
                "old_hash": old_hash,
                "new_hash": new_hash,
                "changed": True,
                "version": ingest_result.get("version"),
                "records_affected": ingest_result.get("chunks_indexed", 0),
                "parser_status": "SUCCESS",
                "final_status": "ACTIVE"
            }
        except Exception as parse_exc:
            logger.error(f"Parser/Indexing failed for source '{source_id}': {parse_exc}")
            source_registry.update_status(source_id, verification_status=VerificationStatus.PARSER_FAILED)
            self._total_failed += 1
            return {
                "source_id": source_id,
                "title": source.title,
                "url": official_url,
                "status": "PARSER_FAILED",
                "retrieved": True,
                "reason": str(parse_exc),
                "old_hash": old_hash,
                "new_hash": new_hash,
                "changed": True,
                "version": old_version,
                "parser_status": "FAILED",
                "final_status": "PARSER_FAILED"
            }

    async def refresh_all_sources(self, actor_id: str = "system") -> Dict[str, Any]:
        """
        Refreshes all registered sources sequentially with single-job concurrency lock.
        """
        if self._lock.locked():
            return {
                "status": "SKIPPED",
                "message": "Another synchronization cycle is currently executing.",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        async with self._lock:
            start_time = datetime.now(timezone.utc)
            sources = source_registry.list_sources()
            results = []

            for src in sources:
                res = await self.refresh_source(
                    source_id=src.source_id,
                    force=False,
                    actor_id=actor_id
                )
                results.append(res)
                await asyncio.sleep(0.1)  # Rate limiting courtesy delay

            end_time = datetime.now(timezone.utc)
            duration_ms = (end_time - start_time).total_seconds() * 1000.0

            self._last_sync_time = end_time.isoformat()
            self._last_sync_duration_ms = duration_ms
            self._total_runs += 1

            active_count = sum(1 for r in results if r.get("final_status") == "ACTIVE")
            failed_count = sum(1 for r in results if r.get("final_status") in ("FETCH_FAILED", "PARSER_FAILED"))
            blocked_count = sum(1 for r in results if r.get("final_status") == "BLOCKED")
            changed_count = sum(1 for r in results if r.get("changed") is True)
            unchanged_count = sum(1 for r in results if r.get("changed") is False and r.get("retrieved") is True)

            summary = {
                "total_configured": len(sources),
                "executed": len(results),
                "succeeded": active_count,
                "changed": changed_count,
                "unchanged": unchanged_count,
                "failed": failed_count,
                "blocked": blocked_count,
                "duration_ms": duration_ms,
                "timestamp": self._last_sync_time,
                "results": results
            }

            AuditManager.record_event(
                event_type="KNOWLEDGE_SYNC_CYCLE_COMPLETED",
                actor_id=actor_id,
                role="system",
                action="SYNC_ALL_SOURCES",
                resource_type="KNOWLEDGE_BASE",
                resource_id="all",
                details={
                    "total": len(sources),
                    "active": active_count,
                    "failed": failed_count,
                    "changed": changed_count,
                    "duration_ms": duration_ms
                }
            )

            return summary

    def get_sync_status(self) -> Dict[str, Any]:
        """Returns live observability telemetry for the sync engine."""
        sources = source_registry.list_sources()
        active_count = sum(1 for s in sources if s.verification_status == VerificationStatus.ACTIVE)
        stale_count = sum(1 for s in sources if s.verification_status in (VerificationStatus.STALE, VerificationStatus.FETCH_FAILED))
        blocked_count = sum(1 for s in sources if s.verification_status == VerificationStatus.BLOCKED)

        return {
            "sources_total": len(sources),
            "sources_active": active_count,
            "sources_stale_or_failed": stale_count,
            "sources_blocked": blocked_count,
            "total_cycles_executed": self._total_runs,
            "last_sync_timestamp": self._last_sync_time,
            "last_sync_duration_ms": self._last_sync_duration_ms,
            "total_records_changed": self._total_changed,
            "total_records_unchanged": self._total_unchanged,
            "total_failures": self._total_failed,
            "status": "IDLE" if not self._lock.locked() else "RUNNING"
        }


# Global singleton instance
source_sync_worker = SourceSyncWorker()
