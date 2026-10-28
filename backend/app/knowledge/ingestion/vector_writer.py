"""
Vector Store and Vector Writer for Ingestion Pipeline.
Stores chunk embeddings with metadata filtering (jurisdiction, verification status, effective dates)
and provides cosine similarity search.
Supports in-memory caching and persistent PostgreSQL + pgvector storage.
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import asyncio
import json
import logging
from packages.schemas.contracts import VerificationStatus
from backend.app.knowledge.domain.source import ChunkRecord
from backend.app.common.providers import VectorStore
from backend.app.common.config import settings

logger = logging.getLogger("civicsphere.vector_store")


class InMemoryVectorStore(VectorStore):
    """In-memory Vector Store implementation with cosine similarity search and metadata filtering."""

    def __init__(self):
        self._vectors: Dict[str, np.ndarray] = {}  # chunk_id -> vector
        self._metadata: Dict[str, Dict[str, Any]] = {}  # chunk_id -> metadata
        self._chunks: Dict[str, ChunkRecord] = {}

    async def insert(
        self,
        chunk_id: str,
        source_id: str,
        vector: List[float],
        text: str,
        metadata: Dict[str, Any]
    ) -> None:
        await self.insert_vector(chunk_id, vector, {**metadata, "source_id": source_id, "text": text})

    async def insert_batch(
        self,
        records: List[Tuple[str, str, List[float], str, Dict[str, Any]]]
    ) -> int:
        for chunk_id, source_id, vector, text, metadata in records:
            await self.insert(chunk_id, source_id, vector, text, metadata)
        return len(records)

    async def insert_vector(
        self,
        vector_id: str,
        vector: List[float],
        metadata: Dict[str, Any]
    ) -> None:
        arr = np.array(vector, dtype=np.float32)
        norm = np.linalg.norm(arr)
        if norm > 0:
            arr = arr / norm
        self._vectors[vector_id] = arr
        self._metadata[vector_id] = metadata

    def store_chunk_mapping(self, chunk: ChunkRecord, vector: List[float]) -> None:
        self._chunks[chunk.chunk_id] = chunk
        arr = np.array(vector, dtype=np.float32)
        norm = np.linalg.norm(arr)
        if norm > 0:
            arr = arr / norm
        self._vectors[chunk.chunk_id] = arr
        self._metadata[chunk.chunk_id] = {
            "chunk_id": chunk.chunk_id,
            "source_id": chunk.source_id,
            "source_version": chunk.source_version,
            "source_type": chunk.source_type,
            "jurisdiction": chunk.jurisdiction,
            "verification_status": chunk.verification_status.value if hasattr(chunk.verification_status, 'value') else chunk.verification_status,
            "effective_date": chunk.effective_date,
            "content_hash": chunk.content_hash,
            "section_number": chunk.section_number,
            "act_title": chunk.act_title,
        }

    async def store_chunk_mapping_async(self, chunk: ChunkRecord, vector: List[float]) -> None:
        self.store_chunk_mapping(chunk, vector)

    async def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        if not self._vectors:
            return []

        q_arr = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_arr)
        if q_norm > 0:
            q_arr = q_arr / q_norm

        scored_candidates: List[Tuple[float, str, ChunkRecord]] = []

        for chunk_id, vec in self._vectors.items():
            meta = self._metadata.get(chunk_id, {})
            chunk = self._chunks.get(chunk_id)
            if not chunk:
                continue

            # Apply metadata filters
            if filters:
                if "source_id" in filters and filters["source_id"]:
                    if meta.get("source_id") != filters["source_id"]:
                        continue
                if "jurisdiction" in filters and filters["jurisdiction"]:
                    if meta.get("jurisdiction", "").lower() != filters["jurisdiction"].lower():
                        continue
                if "verification_status" in filters and filters["verification_status"]:
                    req_status = filters["verification_status"]
                    if isinstance(req_status, list):
                        req_status_vals = [s.value if hasattr(s, 'value') else s for s in req_status]
                        if meta.get("verification_status") not in req_status_vals:
                            continue
                    elif meta.get("verification_status") != (req_status.value if hasattr(req_status, 'value') else req_status):
                        continue
                if "source_types" in filters and filters["source_types"]:
                    if meta.get("source_type") not in filters["source_types"]:
                        continue

            score = float(np.dot(q_arr, vec))
            if score > 0.05:
                scored_candidates.append((score, chunk_id, chunk))

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, chunk_id, chunk in scored_candidates[:top_k]:
            results.append({
                "chunk_id": chunk_id,
                "score": score,
                "similarity": score,
                "chunk": chunk,
                "text": chunk.text if chunk else "",
                "section_number": chunk.section_number if chunk else None,
                "act_title": chunk.act_title if chunk else None,
                "metadata": self._metadata.get(chunk_id, {})
            })

        return results

    async def delete_by_source(self, source_id: str, source_version: Optional[int] = None) -> int:
        deleted = 0
        to_delete = []
        for cid, meta in self._metadata.items():
            if meta.get("source_id") == source_id:
                if source_version is None or meta.get("source_version") == source_version:
                    to_delete.append(cid)

        for cid in to_delete:
            self._vectors.pop(cid, None)
            self._metadata.pop(cid, None)
            self._chunks.pop(cid, None)
            deleted += 1

        return deleted

    def clear(self) -> None:
        self._vectors.clear()
        self._metadata.clear()
        self._chunks.clear()


class PersistentVectorStore(InMemoryVectorStore):
    """
    Persistent Vector Store integrating local in-memory indexing with
    durable PostgreSQL + pgvector storage for cold starts and multi-instance sharing.
    """

    def store_chunk_mapping(self, chunk: ChunkRecord, vector: List[float]) -> None:
        super().store_chunk_mapping(chunk, vector)
        if settings.ENVIRONMENT != "test":
            self._schedule_persist(chunk, vector)

    async def store_chunk_mapping_async(self, chunk: ChunkRecord, vector: List[float], timeout: float = 5.0) -> bool:
        """Stores chunk in memory and directly awaits persistence to PostgreSQL with observable error logging."""
        super().store_chunk_mapping(chunk, vector)
        if settings.ENVIRONMENT != "test":
            try:
                await asyncio.wait_for(self._persist_chunk_to_db(chunk, vector), timeout=timeout)
                return True
            except asyncio.TimeoutError:
                logger.warning(f"Timeout persisting chunk {chunk.chunk_id} to database after {timeout}s.")
                return False
            except Exception as e:
                logger.error(f"Failed to persist chunk {chunk.chunk_id} to database: {e}")
                return False
        return True

    def _schedule_persist(self, chunk: ChunkRecord, vector: List[float]) -> None:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._persist_chunk_to_db(chunk, vector))
        except RuntimeError:
            pass

    async def _persist_chunk_to_db(self, chunk: ChunkRecord, vector: List[float]) -> None:
        try:
            from backend.app.common.database import engine
            from sqlalchemy import text
            
            vec_str = "[" + ",".join(f"{x:.6f}" for x in vector) + "]"
            meta_json = json.dumps(chunk.metadata or {})
            vstat = chunk.verification_status.value if hasattr(chunk.verification_status, 'value') else chunk.verification_status

            async with engine.begin() as conn:
                await conn.execute(text("""
                    INSERT INTO knowledge_sources (
                        source_id, title, publisher, official_url, jurisdiction, source_type,
                        trust_level, current_version, content_hash, verification_status, ingestion_status
                    ) VALUES (
                        :sid, :atitle, 'Official Authority', 'https://india.gov.in', :jur, :stype,
                        'OFFICIAL_LEGISLATION', :sver, :chash, :vstat, 'COMPLETED'
                    ) ON CONFLICT (source_id) DO NOTHING;
                """), {
                    "sid": chunk.source_id,
                    "atitle": chunk.act_title or "Statutory Source",
                    "jur": chunk.jurisdiction or "IN",
                    "stype": chunk.source_type or "ACT",
                    "sver": chunk.source_version,
                    "chash": chunk.content_hash,
                    "vstat": vstat
                })

                await conn.execute(text("""
                    INSERT INTO knowledge_chunks (
                        chunk_id, source_id, source_version, chunk_index, text, content_hash,
                        act_title, chapter, section_number, section_title, subsection_number,
                        page_number, jurisdiction, source_type, verification_status, effective_date, metadata
                    ) VALUES (
                        :cid, :sid, :sver, :cidx, :txt, :chash,
                        :atitle, :chap, :secnum, :sectitle, :subsec,
                        :pg, :jur, :stype, :vstat, :effdate, CAST(:meta AS jsonb)
                    ) ON CONFLICT (chunk_id) DO UPDATE SET
                        text = EXCLUDED.text,
                        verification_status = EXCLUDED.verification_status,
                        metadata = EXCLUDED.metadata;
                """), {
                    "cid": chunk.chunk_id,
                    "sid": chunk.source_id,
                    "sver": chunk.source_version,
                    "cidx": chunk.chunk_index,
                    "txt": chunk.text,
                    "chash": chunk.content_hash,
                    "atitle": chunk.act_title,
                    "chap": chunk.chapter,
                    "secnum": chunk.section_number,
                    "sectitle": chunk.section_title,
                    "subsec": chunk.subsection_number,
                    "pg": chunk.page_number,
                    "jur": chunk.jurisdiction,
                    "stype": chunk.source_type,
                    "vstat": vstat,
                    "effdate": chunk.effective_date,
                    "meta": meta_json
                })

                await conn.execute(text("""
                    INSERT INTO knowledge_embeddings (chunk_id, source_id, embedding)
                    VALUES (:cid, :sid, CAST(:vec AS vector))
                    ON CONFLICT (chunk_id) DO UPDATE SET embedding = EXCLUDED.embedding;
                """), {"cid": chunk.chunk_id, "sid": chunk.source_id, "vec": vec_str})
        except Exception as e:
            logger.warning(f"Error persisting vector chunk {chunk.chunk_id} to database: {e}")

    async def hydrate_from_db(self) -> int:
        """Hydrates chunk mappings and vectors from persistent PostgreSQL database."""
        if settings.ENVIRONMENT == "test":
            return len(self._vectors)

        try:
            from backend.app.common.database import engine
            from sqlalchemy import text
            
            async with engine.begin() as conn:
                res = await conn.execute(text("""
                    SELECT c.chunk_id, c.source_id, c.source_version, c.chunk_index, c.text,
                           c.content_hash, c.act_title, c.chapter, c.section_number, c.section_title,
                           c.subsection_number, c.page_number, c.jurisdiction, c.source_type,
                           c.verification_status, c.effective_date, c.metadata,
                           CAST(e.embedding AS text) AS vec_str
                    FROM knowledge_chunks c
                    JOIN knowledge_embeddings e ON c.chunk_id = e.chunk_id;
                """))
                rows = res.fetchall()
                count = 0
                for r in rows:
                    cid = r[0]
                    sid = r[1]
                    sver = r[2]
                    cidx = r[3]
                    txt = r[4]
                    chash = r[5]
                    atitle = r[6]
                    chap = r[7]
                    secnum = r[8]
                    sectitle = r[9]
                    subsec = r[10]
                    pg = r[11]
                    jur = r[12]
                    stype = r[13]
                    vstat = r[14]
                    effdate = r[15]
                    meta = r[16] if isinstance(r[16], dict) else json.loads(r[16] or "{}")
                    v_raw = r[17]

                    if v_raw and v_raw.startswith("[") and v_raw.endswith("]"):
                        vec = [float(x.strip()) for x in v_raw[1:-1].split(",") if x.strip()]
                    else:
                        vec = [0.0] * settings.EMBEDDING_DIMENSION

                    arr = np.array(vec, dtype=np.float32)
                    norm = np.linalg.norm(arr)
                    if norm > 0:
                        arr = arr / norm

                    chunk = ChunkRecord(
                        chunk_id=cid,
                        source_id=sid,
                        source_version=sver,
                        chunk_index=cidx,
                        text=txt,
                        content_hash=chash,
                        act_title=atitle,
                        chapter=chap,
                        section_number=secnum,
                        section_title=sectitle,
                        subsection_number=subsec,
                        page_number=pg,
                        jurisdiction=jur,
                        source_type=stype,
                        verification_status=VerificationStatus(vstat) if vstat in VerificationStatus._value2member_map_ else VerificationStatus.ACTIVE,
                        effective_date=effdate,
                        metadata=meta
                    )
                    self._chunks[cid] = chunk
                    self._vectors[cid] = arr
                    self._metadata[cid] = {
                        "chunk_id": cid,
                        "source_id": sid,
                        "source_version": sver,
                        "source_type": stype,
                        "jurisdiction": jur,
                        "verification_status": vstat,
                        "effective_date": effdate,
                        "content_hash": chash,
                        "section_number": secnum,
                        "act_title": atitle
                    }
                    count += 1
                logger.info(f"Hydrated {count} chunks and pgvector embeddings from database.")
                return count
        except Exception as e:
            logger.warning(f"Notice: Vector store hydration from DB: {e}")
            return len(self._vectors)

    async def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes vector similarity search using PostgreSQL pgvector <=> operator
        when connected to PostgreSQL, falling back to local memory when running offline or in unit tests.
        """
        if settings.ENVIRONMENT != "test":
            try:
                from backend.app.common.database import engine
                from sqlalchemy import text
                
                vec_str = "[" + ",".join(f"{x:.6f}" for x in query_vector) + "]"
                where_clauses = []
                params = {"vec": vec_str, "top_k": top_k}

                if filters:
                    jur = filters.get("jurisdiction")
                    if jur:
                        where_clauses.append("LOWER(c.jurisdiction) = LOWER(:jur)")
                        params["jur"] = jur

                    vstat = filters.get("verification_status")
                    if isinstance(vstat, list):
                        vstat = vstat[0].value if hasattr(vstat[0], 'value') else vstat[0]
                    elif vstat and hasattr(vstat, 'value'):
                        vstat = vstat.value
                    if vstat:
                        where_clauses.append("c.verification_status = :vstat")
                        params["vstat"] = vstat

                    sid_filter = filters.get("source_id")
                    if sid_filter:
                        where_clauses.append("c.source_id = :sid")
                        params["sid"] = sid_filter

                where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

                async with engine.begin() as conn:
                    query_sql = text(f"""
                        SELECT c.chunk_id, c.source_id, c.source_version, c.chunk_index, c.text,
                               c.content_hash, c.act_title, c.chapter, c.section_number, c.section_title,
                               c.subsection_number, c.page_number, c.jurisdiction, c.source_type,
                               c.verification_status, c.effective_date, c.metadata,
                               1.0 - (e.embedding <=> CAST(:vec AS vector)) AS similarity_score
                        FROM knowledge_chunks c
                        JOIN knowledge_embeddings e ON c.chunk_id = e.chunk_id
                        {where_sql}
                        ORDER BY e.embedding <=> CAST(:vec AS vector) ASC
                        LIMIT :top_k;
                    """)
                    res = await conn.execute(query_sql, params)
                    rows = res.fetchall()
                    if rows:
                        results = []
                        for r in rows:
                            cid = r[0]
                            sid = r[1]
                            sver = r[2]
                            cidx = r[3]
                            txt = r[4]
                            chash = r[5]
                            atitle = r[6]
                            chap = r[7]
                            secnum = r[8]
                            sectitle = r[9]
                            subsec = r[10]
                            pg = r[11]
                            jur_val = r[12]
                            stype = r[13]
                            vstat_val = r[14]
                            effdate = r[15]
                            meta = r[16] if isinstance(r[16], dict) else json.loads(r[16] or "{}")
                            sim_score = float(r[17]) if r[17] is not None else 0.0

                            chunk = ChunkRecord(
                                chunk_id=cid,
                                source_id=sid,
                                source_version=sver,
                                chunk_index=cidx,
                                text=txt,
                                content_hash=chash,
                                act_title=atitle,
                                chapter=chap,
                                section_number=secnum,
                                section_title=sectitle,
                                subsection_number=subsec,
                                page_number=pg,
                                jurisdiction=jur_val,
                                source_type=stype,
                                verification_status=VerificationStatus(vstat_val) if vstat_val in VerificationStatus._value2member_map_ else VerificationStatus.ACTIVE,
                                effective_date=effdate,
                                metadata=meta
                            )
                            self._chunks[cid] = chunk
                            results.append({
                                "chunk_id": cid,
                                "score": max(0.0, min(1.0, sim_score)),
                                "similarity": max(0.0, min(1.0, sim_score)),
                                "chunk": chunk,
                                "text": txt,
                                "section_number": secnum,
                                "act_title": atitle,
                                "metadata": meta
                            })
                        return results
            except Exception as e:
                logger.debug(f"Notice: pgvector direct search falling back to memory: {e}")

        return await super().search(query_vector=query_vector, top_k=top_k, filters=filters)

    async def delete_by_source(self, source_id: str, source_version: Optional[int] = None) -> int:
        deleted = await super().delete_by_source(source_id, source_version)
        if settings.ENVIRONMENT != "test":
            try:
                from backend.app.common.database import engine
                from sqlalchemy import text
                async with engine.begin() as conn:
                    if source_version is not None:
                        await conn.execute(text("DELETE FROM knowledge_chunks WHERE source_id = :sid AND source_version = :sver;"), {"sid": source_id, "sver": source_version})
                    else:
                        await conn.execute(text("DELETE FROM knowledge_chunks WHERE source_id = :sid;"), {"sid": source_id})
            except Exception as e:
                logger.warning(f"Error deleting chunks from DB for source {source_id}: {e}")
        return deleted


# Global Singleton Vector Store
vector_store = PersistentVectorStore()
