# CivicSphere AI — Package & Dependency Cleanup Audit
**Phase**: PRE-CLEANUP DISCOVERY ONLY (No package files modified yet)

## 1. Package Dependency Inventory

| Package File | Project | Environment | Status | Action Upon Approval |
| :--- | :--- | :--- | :---: | :--- |
| `apps/web/package.json` | Canonical Web Frontend | Next.js 14 / TypeScript / Tailwind | **ACTIVE** | **KEEP** |
| `pyproject.toml` | Canonical Python Monolith | FastAPI / SQLAlchemy / Pytest | **ACTIVE** | **KEEP** |
| `package.json` (Root) | Root Workspace | Legacy Node.js Express scripts | **LEGACY** | **CONSOLIDATE** (Point to `apps/web`) |
| `server/package.json` | Legacy Express Backend | Node.js Express / Mongoose | **LEGACY** | **REMOVE-AFTER-LEGACY-DELETION** |
| `client/package.json` | Legacy React Frontend | Vite / React Router | **LEGACY** | **REMOVE-AFTER-LEGACY-DELETION** |
| `Civicsphere/package.json` | Legacy Prototype Root | Workspace wrapper | **LEGACY** | **REMOVE-AFTER-LEGACY-DELETION** |
| `Civicsphere/backend/package.json`| Legacy Duplicate Backend | Express / Mongoose | **LEGACY** | **REMOVE-AFTER-LEGACY-DELETION** |
| `Civicsphere/frontend/package.json`| Legacy Duplicate Frontend | Vite / React Router | **LEGACY** | **REMOVE-AFTER-LEGACY-DELETION** |

---

## 2. Dependency Classification Matrix

### Canonical Python Dependencies (`pyproject.toml`) — ALL KEEP
- `fastapi`, `uvicorn`, `pydantic`, `pydantic-settings`: Core API framework.
- `sqlalchemy`, `asyncpg`, `aiosqlite`, `alembic`: Relational DB and migrations.
- `pyotp`, `bcrypt`, `python-jose`, `passlib`: Authentication and TOTP MFA.
- `pytest`, `pytest-asyncio`, `httpx`: Testing framework.

### Canonical Frontend Dependencies (`apps/web/package.json`) — ALL KEEP
- `next` (14.2.1), `react` (18.3.1), `react-dom`: App Router framework.
- `lucide-react`, `clsx`, `tailwind-merge`: UI iconography and styling utilities.
- `tailwindcss`, `postcss`, `typescript`, `@types/node`, `@types/react`: Dev dependencies.

### Legacy Dependencies to Retire (`package.json` Root & Legacy folders) — REMOVE AFTER DELETION
- `mongoose`: MongoDB ORM (Deprecated — Canonical DB is PostgreSQL).
- `express`, `helmet`, `cors`, `express-rate-limit`: Legacy Node HTTP layer (Replaced by FastAPI).
- `vite`, `@vitejs/plugin-react`: Legacy bundler (Replaced by Next.js).
- `react-router-dom`: Legacy client-side routing (Replaced by Next.js App Router).
