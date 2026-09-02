import asyncio
from logging.config import fileConfig
import os
import sys

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("JWT_SECRET_KEY", "civicsphere_alembic_jwt_secret_key_2026_secure")
os.environ.setdefault("NEO4J_PASSWORD", "civicsphere_alembic_neo4j_password_2026_secure")

from backend.app.common.config import settings
from backend.app.common.database import Base
# Import all models to ensure metadata registration
from backend.app.auth.models import UserModel
from backend.app.cases.models import CaseModel
from backend.app.documents.models import DocumentModel
from backend.app.government.models import GovernmentServiceModel
from backend.app.audit.models import AuditEventModel, SecurityEventModel

config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Override URL with dedicated MIGRATION_DATABASE_URL or application settings
migration_url = os.environ.get("MIGRATION_DATABASE_URL")
if migration_url:
    db_url = str(migration_url)
else:
    db_url = str(settings.DATABASE_URL)

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
config.set_main_option("sqlalchemy.url", db_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    configuration = config.get_section(config.config_ini_section, {})
    connect_args = {}
    if db_url.startswith("postgresql+asyncpg"):
        connect_args = {"statement_cache_size": 0}

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
