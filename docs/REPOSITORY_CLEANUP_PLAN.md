# CivicSphere AI — Repository Cleanup & Final Remediation Plan
**Phase**: PLANNING ONLY (DO NOT EXECUTE UNTIL AUTHORIZED)

## 1. Overview & Remediation Goals
This plan outlines the staged, safe cleanup of dead legacy runtimes, duplicate files, and operational enhancements.

---

## 2. 10-Step Cleanup Execution Roadmap

### STEP 0 — Snapshot / Backup / Tag Current Release
- Preserve a snapshot / git tag of the current working state before making filesystem deletions.

### STEP 1 — Prove Legacy Data Migration
- Fully verify 100% field-by-field parity of all 12 government services from `server/src/data/governmentSeedData.js` against canonical PostgreSQL models and seed definitions (`backend/app/government/models.py`).

### STEP 2 — Prove Zero Active References
- Verify 0 active runtime imports or configuration dependencies pointing to `server/`, `client/`, or `Civicsphere/`.

### STEP 3 — Remove / Ignore Temporary Artifacts
- Add `uploads/*.pdf` and `*.db` to `.gitignore`; clean temporary upload cache.

### STEP 4 — Remove Legacy Runtimes
- Safely delete obsolete directories:
  1. `server/` (legacy Express backend)
  2. `client/` (legacy Vite frontend)
  3. `Civicsphere/` (legacy duplicate prototype)
  4. `data/evaluation/evaluator.js` (legacy Node evaluator)

### STEP 5 — Remove Legacy Dependencies
- Consolidate root `package.json` to manage only the active `apps/web/` workspace; remove `express`, `mongoose`, `helmet`, and `cors` from root.

### STEP 6 — Verify Canonical Startup & Build
- Verify that FastAPI boots cleanly on port 8000 and Next.js 14 boots cleanly on port 3000.

### STEP 7 — Verify PostgreSQL Migrations in Clean Environment
- Execute `alembic upgrade head` in a clean containerized PostgreSQL instance to confirm DDL creation.

### STEP 8 — Implement Live Data Synchronization Framework
- Create scheduled cron worker (`infrastructure/scripts/sync_sources_cron.py`) to periodically invoke `SourceRegistry.check_freshness()` and `SourceFetcher`.

### STEP 9 — Re-Run Complete Specification Verification
- Run full pytest regression suite: `python -m pytest -p no:pytest_ethereum backend/tests/ packages/schemas/ -v`.
- Run quality benchmark suite: `python infrastructure/scripts/run_benchmarks.py`.

### STEP 10 — Final Release Freeze
- Confirm 72/72 tests passing and seal the repository.
