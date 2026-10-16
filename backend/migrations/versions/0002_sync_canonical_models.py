"""Sync canonical models schema for PostgreSQL

Revision ID: 0002_sync_canonical_models
Revises: 0001_initial_schema
Create Date: 2026-10-16 21:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '0002_sync_canonical_models'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table additions
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) DEFAULT '';")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bar_council_id VARCHAR(100) DEFAULT '';")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years VARCHAR(20) DEFAULT '0';")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(1000) DEFAULT '';")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500) DEFAULT '';")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(100);")

    # 2. Cases table additions
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS citizen_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE;")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS counsel_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_reference VARCHAR(255) DEFAULT '';")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS legal_findings JSONB DEFAULT '[]'::jsonb;")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS government_services JSONB DEFAULT '[]'::jsonb;")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS deadlines JSONB DEFAULT '[]'::jsonb;")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;")
    op.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS processing_history JSONB DEFAULT '[]'::jsonb;")
    op.execute("ALTER TABLE cases ALTER COLUMN user_id DROP NOT NULL;")

    # 3. Documents table
    op.execute("ALTER TABLE documents ALTER COLUMN filename DROP NOT NULL;")

    # 4. Government services table
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS department VARCHAR(255) DEFAULT 'General' NOT NULL;")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS ministry VARCHAR(255);")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS state VARCHAR(100);")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS application_methods JSONB DEFAULT '[]'::jsonb;")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS official_portal VARCHAR(500);")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS grievance_portal VARCHAR(500);")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS appeal_authority VARCHAR(255);")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS source_version INTEGER DEFAULT 1 NOT NULL;")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL;")
    op.execute("ALTER TABLE government_services ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 1.0 NOT NULL;")
    op.execute("ALTER TABLE government_services ALTER COLUMN authority DROP NOT NULL;")


def downgrade() -> None:
    pass
