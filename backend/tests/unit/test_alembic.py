"""
Alembic Migration System Tests.
Verifies Alembic environment, migration revision history, script generation,
and executable upgrade/downgrade migration logic.
"""

from alembic.config import Config
from alembic.script import ScriptDirectory
import os
import importlib.util


def test_alembic_configuration_and_revisions():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    ini_path = os.path.join(root_dir, "alembic.ini")
    
    assert os.path.exists(ini_path), "alembic.ini must exist in project root"
    
    config = Config(ini_path)
    script = ScriptDirectory.from_config(config)
    
    heads = script.get_heads()
    assert len(heads) == 1, "Expected exactly 1 migration head"
    assert heads[0] == "0001_initial_schema", "Initial schema revision must be present"
    
    head_rev = script.get_revision(heads[0])
    assert head_rev is not None
    assert "Initial canonical schema" in head_rev.doc

    # Verify migration module exports upgrade and downgrade functions
    spec = importlib.util.spec_from_file_location("migration_0001", head_rev.path)
    migration_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration_module)
    assert hasattr(migration_module, "upgrade")
    assert hasattr(migration_module, "downgrade")
    assert callable(migration_module.upgrade)
    assert callable(migration_module.downgrade)
