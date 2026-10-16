"""
First-Class Source Registry for CivicSphere.
Tracks all legal, civic, and governmental sources with their trust level, verification status, and provenance.
Supports durable PostgreSQL persistence across cold starts and container recycles.
"""

from typing import Dict, List, Optional
import hashlib
from datetime import datetime, timezone
import asyncio
import json
import logging

from packages.schemas.contracts import VerificationStatus, SourceTrustLevel, IngestionStatus
from backend.app.knowledge.domain.source import SourceRecord, SourceVersionRecord, ChunkRecord
from backend.app.common.errors import NotFoundException, IngestionValidationException
from backend.app.common.config import settings

logger = logging.getLogger("civicsphere.source_registry")


class SourceRegistry:
    """In-memory & persistent registry tracking trusted civic knowledge sources."""

    def __init__(self):
        self._sources: Dict[str, SourceRecord] = {}
        self._versions: Dict[str, List[SourceVersionRecord]] = {}
        self._chunks: Dict[str, List[ChunkRecord]] = {}
        self._verified_urls: set = set()

    def register_source(
        self,
        title: str,
        publisher: str,
        official_url: str,
        jurisdiction: str,
        source_type: str,
        content: str,
        trust_level: SourceTrustLevel = SourceTrustLevel.TRUSTED_SECONDARY_SOURCE,
        publication_date: Optional[str] = None,
        effective_date: Optional[str] = None,
        expiry_date: Optional[str] = None,
        verification_status: VerificationStatus = VerificationStatus.UNVERIFIED,
        metadata: Optional[Dict] = None
    ) -> SourceRecord:
        """Registers a new source or increments version if content changed."""
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        
        # Check if identical source title + publisher exists
        existing_source = None
        for s in self._sources.values():
            if s.title.strip().lower() == title.strip().lower() and s.publisher.strip().lower() == publisher.strip().lower():
                existing_source = s
                break

        if existing_source:
            # Check if content has changed
            if existing_source.content_hash == content_hash:
                # Idempotent: Same content, no new version needed
                return existing_source
            
            # Content changed -> create new version
            new_version_num = existing_source.current_version + 1
            existing_source.current_version = new_version_num
            existing_source.content_hash = content_hash
            existing_source.updated_at = datetime.now(timezone.utc).isoformat()
            
            # Record historical version
            version_rec = SourceVersionRecord(
                source_id=existing_source.source_id,
                version_number=new_version_num,
                content_hash=content_hash,
                extracted_text=content,
                effective_date=effective_date or existing_source.effective_date,
                verification_status=verification_status,
                change_summary=f"Updated to version {new_version_num}"
            )
            self._versions[existing_source.source_id].append(version_rec)
            return existing_source

        # Create brand new source
        source_id = f"src_{hashlib.md5(f'{title}_{publisher}_{jurisdiction}'.encode()).hexdigest()[:12]}"
        source_rec = SourceRecord(
            source_id=source_id,
            title=title,
            publisher=publisher,
            official_url=official_url,
            jurisdiction=jurisdiction,
            source_type=source_type,
            trust_level=trust_level,
            current_version=1,
            content_hash=content_hash,
            verification_status=verification_status,
            ingestion_status=IngestionStatus.PENDING,
            publication_date=publication_date,
            effective_date=effective_date,
            expiry_date=expiry_date,
            metadata=metadata or {}
        )

        version_rec = SourceVersionRecord(
            source_id=source_id,
            version_number=1,
            content_hash=content_hash,
            extracted_text=content,
            effective_date=effective_date,
            verification_status=verification_status,
            change_summary="Initial source registration"
        )

        self._sources[source_id] = source_rec
        self._versions[source_id] = [version_rec]
        self._chunks[source_id] = []
        
        if verification_status == VerificationStatus.ACTIVE:
            self._verified_urls.add(official_url)
            
        return source_rec

    def get_source(self, source_id: str) -> SourceRecord:
        if source_id not in self._sources:
            raise NotFoundException(f"Source with id '{source_id}' not found in registry.")
        return self._sources[source_id]

    def list_sources(
        self,
        jurisdiction: Optional[str] = None,
        verification_status: Optional[VerificationStatus] = None,
        limit: int = 50
    ) -> List[SourceRecord]:
        results = list(self._sources.values())
        if jurisdiction:
            results = [s for s in results if s.jurisdiction.lower() == jurisdiction.lower()]
        if verification_status:
            results = [s for s in results if s.verification_status == verification_status]
        return results[:limit]

    def list_active_sources(self) -> List[SourceRecord]:
        return [s for s in self._sources.values() if s.verification_status == VerificationStatus.ACTIVE]

    def get_versions(self, source_id: str) -> List[SourceVersionRecord]:
        if source_id not in self._sources:
            raise NotFoundException(f"Source with id '{source_id}' not found.")
        return self._versions.get(source_id, [])

    def store_chunks(self, source_id: str, chunks: List[ChunkRecord]) -> None:
        self._chunks[source_id] = chunks

    def get_chunks(self, source_id: str, version: Optional[int] = None) -> List[ChunkRecord]:
        all_chunks = self._chunks.get(source_id, [])
        if version is not None:
            return [c for c in all_chunks if c.source_version == version]
        return all_chunks

    def get_chunk(self, chunk_id: str) -> Optional[ChunkRecord]:
        for chunk_list in self._chunks.values():
            for c in chunk_list:
                if c.chunk_id == chunk_id:
                    return c
        return None

    def get_chunk_by_id(self, chunk_id: str) -> Optional[ChunkRecord]:
        return self.get_chunk(chunk_id)

    def update_status(
        self,
        source_id: str,
        verification_status: Optional[VerificationStatus] = None,
        ingestion_status: Optional[IngestionStatus] = None
    ) -> SourceRecord:
        source = self.get_source(source_id)
        if verification_status:
            source.verification_status = verification_status
            source.last_verified_at = datetime.now(timezone.utc).isoformat()
            if verification_status == VerificationStatus.ACTIVE:
                self._verified_urls.add(source.official_url)
            elif source.official_url in self._verified_urls:
                self._verified_urls.discard(source.official_url)
        if ingestion_status:
            source.ingestion_status = ingestion_status
        source.updated_at = datetime.now(timezone.utc).isoformat()
        return source

    def is_url_verified(self, url: str) -> bool:
        """Strict check that a source URL is in the verified registry."""
        return url in self._verified_urls

    def clear(self) -> None:
        """Reset registry for testing."""
        self._sources.clear()
        self._versions.clear()
        self._chunks.clear()
        self._verified_urls.clear()


class PersistentSourceRegistry(SourceRegistry):
    """
    Durable Source Registry syncing source records and statuses to PostgreSQL table `knowledge_sources`.
    """

    def register_source(self, *args, **kwargs) -> SourceRecord:
        src = super().register_source(*args, **kwargs)
        if settings.ENVIRONMENT != "test":
            self._schedule_persist_source(src)
        return src

    def update_status(self, *args, **kwargs) -> SourceRecord:
        src = super().update_status(*args, **kwargs)
        if settings.ENVIRONMENT != "test":
            self._schedule_persist_source(src)
        return src

    def _schedule_persist_source(self, source_rec: SourceRecord) -> None:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._persist_source_to_db(source_rec))
        except RuntimeError:
            pass

    async def _persist_source_to_db(self, src: SourceRecord) -> None:
        try:
            from backend.app.common.database import engine
            from sqlalchemy import text
            meta_json = json.dumps(src.metadata or {})
            tlevel = src.trust_level.name if hasattr(src.trust_level, 'name') else str(src.trust_level)
            vstat = src.verification_status.value if hasattr(src.verification_status, 'value') else src.verification_status
            istat = src.ingestion_status.value if hasattr(src.ingestion_status, 'value') else src.ingestion_status

            async with engine.begin() as conn:
                await conn.execute(text("""
                    INSERT INTO knowledge_sources (
                        source_id, title, publisher, official_url, jurisdiction, source_type,
                        trust_level, current_version, content_hash, verification_status, ingestion_status,
                        publication_date, effective_date, expiry_date, parser_version, embedding_version,
                        retrieved_at, last_verified_at, metadata
                    ) VALUES (
                        :sid, :title, :pub, :url, :jur, :stype,
                        :tlevel, :cver, :chash, :vstat, :istat,
                        :pdate, :edate, :xdate, :pver, :ever,
                        :rat, :lvat, CAST(:meta AS jsonb)
                    ) ON CONFLICT (source_id) DO UPDATE SET
                        current_version = EXCLUDED.current_version,
                        content_hash = EXCLUDED.content_hash,
                        verification_status = EXCLUDED.verification_status,
                        ingestion_status = EXCLUDED.ingestion_status,
                        last_verified_at = EXCLUDED.last_verified_at,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW();
                """), {
                    "sid": src.source_id,
                    "title": src.title,
                    "pub": src.publisher,
                    "url": src.official_url,
                    "jur": src.jurisdiction,
                    "stype": src.source_type,
                    "tlevel": tlevel,
                    "cver": src.current_version,
                    "chash": src.content_hash,
                    "vstat": vstat,
                    "istat": istat,
                    "pdate": src.publication_date,
                    "edate": src.effective_date,
                    "xdate": src.expiry_date,
                    "pver": src.parser_version,
                    "ever": src.embedding_version,
                    "rat": src.retrieved_at,
                    "lvat": src.last_verified_at,
                    "meta": meta_json
                })
        except Exception as e:
            logger.warning(f"Error persisting source {src.source_id} to DB: {e}")

    async def hydrate_from_db(self) -> int:
        """Loads registered sources from PostgreSQL database into memory."""
        if settings.ENVIRONMENT == "test":
            return len(self._sources)

        try:
            from backend.app.common.database import engine
            from sqlalchemy import text
            
            async with engine.begin() as conn:
                res = await conn.execute(text("""
                    SELECT source_id, title, publisher, official_url, jurisdiction, source_type,
                           trust_level, current_version, content_hash, verification_status, ingestion_status,
                           publication_date, effective_date, expiry_date, parser_version, embedding_version,
                           retrieved_at, last_verified_at, metadata
                    FROM knowledge_sources;
                """))
                rows = res.fetchall()
                for r in rows:
                    sid = r[0]
                    title = r[1]
                    pub = r[2]
                    url = r[3]
                    jur = r[4]
                    stype = r[5]
                    tlevel = r[6]
                    cver = r[7]
                    chash = r[8]
                    vstat = r[9]
                    istat = r[10]
                    pdate = r[11]
                    edate = r[12]
                    xdate = r[13]
                    pver = r[14]
                    ever = r[15]
                    rat = r[16]
                    lvat = r[17]
                    meta = r[18] if isinstance(r[18], dict) else json.loads(r[18] or "{}")

                    if isinstance(tlevel, int) or (isinstance(tlevel, str) and tlevel.isdigit()):
                        trust_enum = SourceTrustLevel(int(tlevel))
                    elif tlevel in SourceTrustLevel.__members__:
                        trust_enum = SourceTrustLevel[tlevel]
                    else:
                        trust_enum = SourceTrustLevel.TRUSTED_SECONDARY_SOURCE

                    source_rec = SourceRecord(
                        source_id=sid,
                        title=title,
                        publisher=pub,
                        official_url=url,
                        jurisdiction=jur or "IN",
                        source_type=stype,
                        trust_level=trust_enum,
                        current_version=cver or 1,
                        content_hash=chash,
                        verification_status=VerificationStatus(vstat) if vstat in VerificationStatus._value2member_map_ else VerificationStatus.UNVERIFIED,
                        ingestion_status=IngestionStatus(istat) if istat in IngestionStatus._value2member_map_ else IngestionStatus.COMPLETED,
                        publication_date=pdate,
                        effective_date=edate,
                        expiry_date=xdate,
                        parser_version=pver or "1.0.0",
                        embedding_version=ever or "1.0.0",
                        retrieved_at=rat or datetime.now(timezone.utc).isoformat(),
                        last_verified_at=lvat,
                        metadata=meta
                    )
                    self._sources[sid] = source_rec
                    if source_rec.verification_status == VerificationStatus.ACTIVE:
                        self._verified_urls.add(url)

            logger.info(f"Hydrated source registry: {len(self._sources)} sources from database.")
            return len(self._sources)
        except Exception as e:
            logger.warning(f"Notice: Source registry hydration from DB: {e}")
            return len(self._sources)


# Global Singleton Registry Instance
source_registry = PersistentSourceRegistry()
