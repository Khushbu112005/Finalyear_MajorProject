# Chapter 11 — Installation, Configuration and Build from Scratch

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. System Prerequisites

Before setting up CivicSphere AI, ensure the following developer tools are installed on your host machine:

| Tool / Runtime | Minimum Version | Recommended Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows 10/11, Ubuntu 20.04+, macOS 12+ | Windows 11 / Ubuntu 22.04 LTS | Host OS |
| **Git** | `2.34.0` | `2.45+` | Version control |
| **Python** | `3.10.0` | `3.12.x` | Backend runtime |
| **Node.js** | `18.18.0` | `20.x LTS` or `22.x` | Frontend runtime |
| **npm** | `9.0.0` | `10.x` | Node package manager |
| **Docker Desktop** | `24.0.0` | Latest (Compose v2) | Local database & infrastructure stack |

---

## 2. Step-by-Step Clean Checkout Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/Khushbu112005/Finalyear_MajorProject.git
cd Finalyear_MajorProject
```

### Step 2: Start Infrastructure Stack (Docker)
The local development environment uses Docker Compose to provision PostgreSQL with pgvector, Neo4j, Redis, and MinIO:
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```
Verify all 4 core containers are running:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
*Expected running containers:*
- `civicsphere-postgres` (`0.0.0.0:5432->5432/tcp`)
- `civicsphere-neo4j` (`0.0.0.0:7474->7474/tcp`, `0.0.0.0:7687->7687/tcp`)
- `civicsphere-redis` (`0.0.0.0:6379->6379/tcp`)
- `civicsphere-minio` (`0.0.0.0:9000->9000/tcp`, `0.0.0.0:9001->9001/tcp`)

---

### Step 3: Backend Python Environment & Dependencies
Create and activate an isolated Python 3.12 virtual environment:

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**On Linux / macOS (Bash):**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 4: Configure Backend Environment Variables
Copy the provided `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```

Generate a secure 32-byte hexadecimal secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Edit `.env` to set:
```env
ENVIRONMENT=development
LOG_LEVEL=INFO
APP_NAME=CivicSphere-AI
API_PREFIX=/api/v1
ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
JWT_SECRET_KEY=<paste_generated_32_byte_key_here>
JWT_ALGORITHM=HS256

DATABASE_URL=postgresql+asyncpg://civicsphere_user:civicsphere_secure_db_pass_2026@localhost:5432/civicsphere
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=civicsphere_graph_pass_2026

EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=384
LLM_PROVIDER=mock
RERANKER_PROVIDER=heuristic
```

---

### Step 5: Execute Database Migrations
Apply the version-controlled Alembic schema migrations:
```bash
alembic upgrade head
```
*Expected output:*
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 0001, initial canonical schema
INFO  [alembic.runtime.migration] Running upgrade 0001 -> 0002, sync canonical models
INFO  [alembic.runtime.migration] Running upgrade 0002 -> 0003, pgvector and durable knowledge
```

---

### Step 6: Seed Verified Statutory Knowledge Base
Populate the knowledge repository with the Right to Information Act, DPDP Act, and Consumer Protection Act:
```bash
python -c "import asyncio; from data.seed.seed_data import seed_knowledge_base; asyncio.run(seed_knowledge_base())"
```

---

### Step 7: Frontend Dependencies & Configuration
Install frontend workspace dependencies:
```bash
cd apps/web
npm install
```

Create or verify `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Return to repository root:
```bash
cd ../..
```

---

## 3. Starting the Development Servers

### Terminal 1: Backend FastAPI Server
From the repository root (with `.venv` activated):
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Liveness check: `curl http://localhost:8000/api/v1/health`
- Readiness check: `curl http://localhost:8000/api/v1/health/ready`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### Terminal 2: Frontend Next.js Server
From `apps/web`:
```bash
cd apps/web
npm run dev
```
Open your browser at: `http://localhost:3000`

---

## 4. Verification & Testing Commands

To verify full system integrity from the repository root:

```bash
# 1. Run full backend automated test suite (91 passing tests)
python -m pytest -p no:pytest_ethereum -q

# 2. Run frontend lint check
npm run lint --workspace=civicsphere-web

# 3. Run frontend production compilation build
npm run build --workspace=civicsphere-web
```

---

## 5. Troubleshooting Common Setup Issues

| Symptom / Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `FATAL: JWT_SECRET_KEY is missing or too short (min 16 chars)` | `.env` has missing or default placeholder key. | Generate a 32-byte key via `secrets.token_hex(32)` and set in `.env`. |
| `psycopg2.OperationalError` / `ConnectionRefusedError: port 5432` | Docker PostgreSQL container is not started. | Run `docker compose -f infrastructure/docker/docker-compose.yml up -d`. |
| `prepared statement "..." already exists` | Using Supabase transaction pooler without statement cache disable. | Ensure `connect_args["statement_cache_size"] = 0` in `database.py` (already configured). |
| `ModuleNotFoundError: No module named 'packages'` | Python path does not include repository root. | Run Python commands from repository root with `.venv` active. |
| Next.js API requests fail with `CORS Error` | Backend `ALLOWED_ORIGINS` does not include `http://localhost:3000`. | Add `http://localhost:3000` to `ALLOWED_ORIGINS` in `.env`. |
