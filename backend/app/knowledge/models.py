"""
SQLAlchemy Models for Persistent Knowledge Engine, PgVector, and Relational Graph.
Enforces durable persistence across cold starts and serverless instances.
"""

from sqlalchemy import Column, String, Integer, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from typing import Dict, Any

from backend.app.common.database import Base


class KnowledgeSourceModel(Base):
    __tablename__ = "knowledge_sources"

    source_id = Column(String(64), primary_key=True)
    title = Column(String(500), nullable=False)
    publisher = Column(String(500), nullable=False)
    official_url = Column(String(1000), nullable=False)
    jurisdiction = Column(String(50), nullable=False, default="IN")
    source_type = Column(String(50), nullable=False)
    trust_level = Column(String(50), nullable=False)
    current_version = Column(Integer, nullable=False, default=1)
    content_hash = Column(String(128), nullable=False)
    verification_status = Column(String(50), nullable=False)
    ingestion_status = Column(String(50), nullable=False)
    publication_date = Column(String(50), nullable=True)
    effective_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    parser_version = Column(String(50), nullable=False, default="1.0.0")
    embedding_version = Column(String(50), nullable=False, default="1.0.0")
    retrieved_at = Column(String(100), nullable=True)
    last_verified_at = Column(String(100), nullable=True)
    meta_data = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class KnowledgeChunkModel(Base):
    __tablename__ = "knowledge_chunks"

    chunk_id = Column(String(64), primary_key=True)
    source_id = Column(String(64), ForeignKey("knowledge_sources.source_id", ondelete="CASCADE"), nullable=False)
    source_version = Column(Integer, nullable=False, default=1)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    content_hash = Column(String(128), nullable=False)
    act_title = Column(String(500), nullable=True)
    chapter = Column(String(255), nullable=True)
    section_number = Column(String(100), nullable=True)
    section_title = Column(String(500), nullable=True)
    subsection_number = Column(String(100), nullable=True)
    page_number = Column(Integer, nullable=True)
    jurisdiction = Column(String(50), nullable=True, default="IN")
    source_type = Column(String(50), nullable=True, default="ACT")
    verification_status = Column(String(50), nullable=True, default="ACTIVE")
    effective_date = Column(String(50), nullable=True)
    meta_data = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class KnowledgeEmbeddingModel(Base):
    __tablename__ = "knowledge_embeddings"

    chunk_id = Column(String(64), ForeignKey("knowledge_chunks.chunk_id", ondelete="CASCADE"), primary_key=True)
    source_id = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class KnowledgeGraphNodeModel(Base):
    __tablename__ = "knowledge_graph_nodes"

    entity_id = Column(String(64), primary_key=True)
    name = Column(String(500), nullable=False)
    entity_type = Column(String(50), nullable=False)
    canonical_id = Column(String(255), nullable=True)
    aliases = Column(JSON, default=list)
    jurisdiction = Column(String(50), nullable=True, default="IN")
    state = Column(String(100), nullable=True)
    attributes = Column(JSON, default=dict)
    source_ids = Column(JSON, default=list)
    source_versions = Column(JSON, default=list)
    confidence = Column(Float, nullable=True, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class KnowledgeGraphEdgeModel(Base):
    __tablename__ = "knowledge_graph_edges"

    relationship_id = Column(String(64), primary_key=True)
    source_entity_id = Column(String(64), ForeignKey("knowledge_graph_nodes.entity_id", ondelete="CASCADE"), nullable=False)
    target_entity_id = Column(String(64), ForeignKey("knowledge_graph_nodes.entity_id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(50), nullable=False)
    attributes = Column(JSON, default=dict)
    source_id = Column(String(64), nullable=False)
    source_version = Column(Integer, nullable=True, default=1)
    source_chunk_id = Column(String(64), nullable=True)
    confidence = Column(Float, nullable=True, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
