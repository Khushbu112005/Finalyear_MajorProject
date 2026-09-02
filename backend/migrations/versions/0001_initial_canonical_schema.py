"""Initial canonical schema for PostgreSQL

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-02 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, default='CITIZEN'),
        sa.Column('phone', sa.String(length=32), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 2. Cases Table
    op.create_table(
        'cases',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False, default='General'),
        sa.Column('status', sa.String(length=32), nullable=False, default='DRAFT', index=True),
        sa.Column('priority', sa.String(length=32), nullable=False, default='MEDIUM'),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('counsel_notes', sa.Text(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 3. Documents Table
    op.create_table(
        'documents',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('case_id', sa.String(length=64), sa.ForeignKey('cases.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('storage_path', sa.String(length=512), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=128), nullable=False, default='application/pdf'),
        sa.Column('status', sa.String(length=32), nullable=False, default='UPLOADED', index=True),
        sa.Column('status_message', sa.String(length=512), nullable=True),
        sa.Column('ocr_extracted_text', sa.Text(), nullable=True),
        sa.Column('analysis', sa.JSON(), nullable=True),
        sa.Column('is_malicious', sa.Boolean(), nullable=False, default=False),
        sa.Column('security_scan_details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 4. Government Services Table
    op.create_table(
        'government_services',
        sa.Column('service_id', sa.String(length=64), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False, index=True),
        sa.Column('authority', sa.String(length=255), nullable=False),
        sa.Column('jurisdiction', sa.String(length=32), nullable=False, default='IN'),
        sa.Column('official_url', sa.String(length=512), nullable=True),
        sa.Column('sla_days', sa.Integer(), nullable=True),
        sa.Column('required_documents', sa.JSON(), nullable=True),
        sa.Column('eligibility_rules', sa.JSON(), nullable=True),
        sa.Column('procedure_steps', sa.JSON(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 5. Audit Events Table
    op.create_table(
        'audit_events',
        sa.Column('event_id', sa.String(length=64), primary_key=True),
        sa.Column('event_type', sa.String(length=64), nullable=False, index=True),
        sa.Column('actor_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('resource_type', sa.String(length=64), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )

    # 6. Security Events Table
    op.create_table(
        'security_events',
        sa.Column('event_id', sa.String(length=64), primary_key=True),
        sa.Column('threat_type', sa.String(length=64), nullable=False, index=True),
        sa.Column('severity', sa.String(length=32), nullable=False),
        sa.Column('endpoint', sa.String(length=255), nullable=False),
        sa.Column('action_taken', sa.String(length=64), nullable=False),
        sa.Column('actor_id', sa.String(length=64), nullable=True),
        sa.Column('payload_sample', sa.String(length=512), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )


def downgrade() -> None:
    op.drop_table('security_events')
    op.drop_table('audit_events')
    op.drop_table('government_services')
    op.drop_table('documents')
    op.drop_table('cases')
    op.drop_table('users')
