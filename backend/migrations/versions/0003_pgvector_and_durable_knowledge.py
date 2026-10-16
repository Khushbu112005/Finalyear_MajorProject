"""Add persistent knowledge, pgvector, and relational graph schema

Revision ID: 0003_pgvector_knowledge
Revises: 0002_sync_canonical_models
Create Date: 2026-10-16 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '0003_pgvector_knowledge'
down_revision: Union[str, None] = '0002_sync_canonical_models'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = (bind.dialect.name == "postgresql")

    if is_postgres:
        op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        op.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_sources (
            source_id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            publisher VARCHAR(500) NOT NULL,
            official_url VARCHAR(1000) NOT NULL,
            jurisdiction VARCHAR(50) DEFAULT 'IN' NOT NULL,
            source_type VARCHAR(50) NOT NULL,
            trust_level VARCHAR(50) NOT NULL,
            current_version INTEGER DEFAULT 1 NOT NULL,
            content_hash VARCHAR(128) NOT NULL,
            verification_status VARCHAR(50) NOT NULL,
            ingestion_status VARCHAR(50) NOT NULL,
            publication_date VARCHAR(50),
            effective_date VARCHAR(50),
            expiry_date VARCHAR(50),
            parser_version VARCHAR(50) DEFAULT '1.0.0',
            embedding_version VARCHAR(50) DEFAULT '1.0.0',
            retrieved_at VARCHAR(100),
            last_verified_at VARCHAR(100),
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        op.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_chunks (
            chunk_id VARCHAR(64) PRIMARY KEY,
            source_id VARCHAR(64) NOT NULL REFERENCES knowledge_sources(source_id) ON DELETE CASCADE,
            source_version INTEGER DEFAULT 1 NOT NULL,
            chunk_index INTEGER NOT NULL,
            text TEXT NOT NULL,
            content_hash VARCHAR(128) NOT NULL,
            act_title VARCHAR(500),
            chapter VARCHAR(255),
            section_number VARCHAR(100),
            section_title VARCHAR(500),
            subsection_number VARCHAR(100),
            page_number INTEGER,
            jurisdiction VARCHAR(50) DEFAULT 'IN',
            source_type VARCHAR(50) DEFAULT 'ACT',
            verification_status VARCHAR(50) DEFAULT 'ACTIVE',
            effective_date VARCHAR(50),
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        op.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_embeddings (
            chunk_id VARCHAR(64) PRIMARY KEY REFERENCES knowledge_chunks(chunk_id) ON DELETE CASCADE,
            source_id VARCHAR(64) NOT NULL,
            embedding vector(384) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        op.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_cosine ON knowledge_embeddings USING hnsw (embedding vector_cosine_ops);")

        op.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
            entity_id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(500) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            canonical_id VARCHAR(255),
            aliases JSONB DEFAULT '[]'::jsonb,
            jurisdiction VARCHAR(50) DEFAULT 'IN',
            state VARCHAR(100),
            attributes JSONB DEFAULT '{}'::jsonb,
            source_ids JSONB DEFAULT '[]'::jsonb,
            source_versions JSONB DEFAULT '[]'::jsonb,
            confidence FLOAT DEFAULT 1.0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        op.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
            relationship_id VARCHAR(64) PRIMARY KEY,
            source_entity_id VARCHAR(64) NOT NULL REFERENCES knowledge_graph_nodes(entity_id) ON DELETE CASCADE,
            target_entity_id VARCHAR(64) NOT NULL REFERENCES knowledge_graph_nodes(entity_id) ON DELETE CASCADE,
            relation_type VARCHAR(50) NOT NULL,
            attributes JSONB DEFAULT '{}'::jsonb,
            source_id VARCHAR(64) NOT NULL,
            source_version INTEGER DEFAULT 1,
            source_chunk_id VARCHAR(64),
            confidence FLOAT DEFAULT 1.0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        op.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_src ON knowledge_graph_edges(source_entity_id);")
        op.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_tgt ON knowledge_graph_edges(target_entity_id);")

    else:
        # SQLite compatibility fallback for local tests
        op.create_table(
            'knowledge_sources',
            sa.Column('source_id', sa.String(length=64), primary_key=True),
            sa.Column('title', sa.String(length=500), nullable=False),
            sa.Column('publisher', sa.String(length=500), nullable=False),
            sa.Column('official_url', sa.String(length=1000), nullable=False),
            sa.Column('jurisdiction', sa.String(length=50), nullable=False, default='IN'),
            sa.Column('source_type', sa.String(length=50), nullable=False),
            sa.Column('trust_level', sa.String(length=50), nullable=False),
            sa.Column('current_version', sa.Integer(), nullable=False, default=1),
            sa.Column('content_hash', sa.String(length=128), nullable=False),
            sa.Column('verification_status', sa.String(length=50), nullable=False),
            sa.Column('ingestion_status', sa.String(length=50), nullable=False),
            sa.Column('publication_date', sa.String(length=50), nullable=True),
            sa.Column('effective_date', sa.String(length=50), nullable=True),
            sa.Column('expiry_date', sa.String(length=50), nullable=True),
            sa.Column('parser_version', sa.String(length=50), nullable=False, default='1.0.0'),
            sa.Column('embedding_version', sa.String(length=50), nullable=False, default='1.0.0'),
            sa.Column('retrieved_at', sa.String(length=100), nullable=True),
            sa.Column('last_verified_at', sa.String(length=100), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

        op.create_table(
            'knowledge_chunks',
            sa.Column('chunk_id', sa.String(length=64), primary_key=True),
            sa.Column('source_id', sa.String(length=64), sa.ForeignKey('knowledge_sources.source_id', ondelete='CASCADE'), nullable=False),
            sa.Column('source_version', sa.Integer(), nullable=False, default=1),
            sa.Column('chunk_index', sa.Integer(), nullable=False),
            sa.Column('text', sa.Text(), nullable=False),
            sa.Column('content_hash', sa.String(length=128), nullable=False),
            sa.Column('act_title', sa.String(length=500), nullable=True),
            sa.Column('chapter', sa.String(length=255), nullable=True),
            sa.Column('section_number', sa.String(length=100), nullable=True),
            sa.Column('section_title', sa.String(length=500), nullable=True),
            sa.Column('subsection_number', sa.String(length=100), nullable=True),
            sa.Column('page_number', sa.Integer(), nullable=True),
            sa.Column('jurisdiction', sa.String(length=50), nullable=True, default='IN'),
            sa.Column('source_type', sa.String(length=50), nullable=True, default='ACT'),
            sa.Column('verification_status', sa.String(length=50), nullable=True, default='ACTIVE'),
            sa.Column('effective_date', sa.String(length=50), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

        op.create_table(
            'knowledge_embeddings',
            sa.Column('chunk_id', sa.String(length=64), sa.ForeignKey('knowledge_chunks.chunk_id', ondelete='CASCADE'), primary_key=True),
            sa.Column('source_id', sa.String(length=64), nullable=False),
            sa.Column('embedding', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

        op.create_table(
            'knowledge_graph_nodes',
            sa.Column('entity_id', sa.String(length=64), primary_key=True),
            sa.Column('name', sa.String(length=500), nullable=False),
            sa.Column('entity_type', sa.String(length=50), nullable=False),
            sa.Column('canonical_id', sa.String(length=255), nullable=True),
            sa.Column('aliases', sa.JSON(), nullable=True),
            sa.Column('jurisdiction', sa.String(length=50), nullable=True, default='IN'),
            sa.Column('state', sa.String(length=100), nullable=True),
            sa.Column('attributes', sa.JSON(), nullable=True),
            sa.Column('source_ids', sa.JSON(), nullable=True),
            sa.Column('source_versions', sa.JSON(), nullable=True),
            sa.Column('confidence', sa.Float(), nullable=True, default=1.0),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

        op.create_table(
            'knowledge_graph_edges',
            sa.Column('relationship_id', sa.String(length=64), primary_key=True),
            sa.Column('source_entity_id', sa.String(length=64), sa.ForeignKey('knowledge_graph_nodes.entity_id', ondelete='CASCADE'), nullable=False),
            sa.Column('target_entity_id', sa.String(length=64), sa.ForeignKey('knowledge_graph_nodes.entity_id', ondelete='CASCADE'), nullable=False),
            sa.Column('relation_type', sa.String(length=50), nullable=False),
            sa.Column('attributes', sa.JSON(), nullable=True),
            sa.Column('source_id', sa.String(length=64), nullable=False),
            sa.Column('source_version', sa.Integer(), nullable=True, default=1),
            sa.Column('source_chunk_id', sa.String(length=64), nullable=True),
            sa.Column('confidence', sa.Float(), nullable=True, default=1.0),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )


def downgrade() -> None:
    op.drop_table('knowledge_graph_edges')
    op.drop_table('knowledge_graph_nodes')
    op.drop_table('knowledge_embeddings')
    op.drop_table('knowledge_chunks')
    op.drop_table('knowledge_sources')
