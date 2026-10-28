# CivicSphere AI — Deployment & Setup Guide

**Document Version:** 2.0  
**Project:** CivicSphere AI (Final Year Major Project)  
**Standard:** Google Deepmind Advanced Agentic Engineering Standard  
**Date:** October 28, 2026  

---

## 1. System Requirements & Prerequisites

### 1.1 Software Dependencies
- **Python:** Version 3.11 or higher (`python --version`)
- **Node.js:** Version 18.x, 20.x, or 22.x LTS (`node --version`)
- **Package Managers:** `pip` (Python) and `npm` (Node.js)
- **Container Engine (Optional for full stack):** Docker Desktop 24+ and Docker Compose 2.20+

### 1.2 Hardware Recommendations
- **Minimum:** 4 CPU Cores, 8 GB RAM, 20 GB Disk Space.
- **Recommended for Full Docker Stack:** 8 CPU Cores, 16 GB RAM, 50 GB SSD.

---

## 2. Local Bare-Metal Setup Guide

### Step 1: Clone Repository
```bash
git clone https://github.com/Khushbu112005/Finalyear_MajorProject.git
cd Finalyear_MajorProject
```

### Step 2: Backend Virtual Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Upgrade pip and install backend packages
pip install --upgrade pip
pip install -e ".[dev]"
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and set local development secrets:
```ini
ENVIRONMENT=development
LOG_LEVEL=INFO
JWT_SECRET_KEY=dev-secret-key-at-least-32-characters-long-2026!
CSRF_SECRET_KEY=dev-csrf-secret-key-at-least-32-chars-long!
DATABASE_URL=sqlite+aiosqlite:///./civicsphere_dev.db
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=./uploads
EMBEDDING_PROVIDER=mock
LLM_PROVIDER=mock
```

### Step 4: Frontend Dependencies Setup
```bash
# Navigate to web application directory
cd apps/web

# Install npm dependencies
npm install

# Return to root directory
cd ../..
```

### Step 5: Database Schema Initialization
If using PostgreSQL, execute Alembic migrations:
```bash
# Run migrations up to latest revision
alembic upgrade head

# Verify active revision
alembic current
```
*(If using SQLite for local offline development, models auto-initialize on boot).*

### Step 6: Start Development Servers
**Terminal 1 (Backend):**
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/v1/health`

**Terminal 2 (Frontend):**
```bash
npm run dev --workspace=civicsphere-web
```
- Web Portal: `http://localhost:3000`

---

## 3. Production Deployment with Docker Compose

CivicSphere provides a comprehensive, self-contained 7-service Docker topology located in `infrastructure/docker/docker-compose.yml`.

### Step 1: Start All Services
```bash
cd infrastructure/docker
docker-compose up -d --build
```

### Step 2: Service Inventory & Exposed Ports
| Container Name | Service Description | Port Mapping | Healthcheck Probe |
| :--- | :--- | :---: | :--- |
| `civicsphere-postgres` | PostgreSQL 16 with `pgvector` | `5432:5432` | `pg_isready -U civicsphere_user` |
| `civicsphere-neo4j` | Neo4j 5.15 Graph Database | `7474:7474`, `7687:7687` | Bolt TCP port probe |
| `civicsphere-redis` | Redis 7 Cache & Rate Limiting | `6379:6379` | `redis-cli ping` |
| `civicsphere-minio` | MinIO S3-Compatible Object Store | `9000:9000`, `9001:9001` | MinIO web console |
| `civicsphere-backend` | Unified FastAPI Modular Monolith | `8000:8000` | `GET /api/v1/health` |
| `civicsphere-frontend` | Next.js 14 App Router Web Portal | `3000:3000` | HTTP probe |
| `civicsphere-sync-cron` | Source Sync Daemon | In-container | Daemon process loop |

### Step 3: Monitor Logs
```bash
docker-compose logs -f backend
```

---

## 4. Serverless Cloud Deployment (Vercel & Supabase)

CivicSphere AI is verified and live on Vercel Serverless ASGI:
- **Backend URL:** `https://civicsphere-backend.vercel.app`
- **Frontend Canonical URL:** `https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app`
- **Frontend Short Alias:** `https://civicsphere-web.vercel.app` (Requires Vercel team domain alias assignment in project settings)

### 4.1 Backend Vercel Configuration (`vercel.json`)
The backend is bundled via `@vercel/python` routing all requests to `api/index.py`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ]
}
```

### 4.2 Mandatory Vercel Project Environment Variables
Configure the following in the Vercel Project Settings (`Settings -> Environment Variables`):

| Variable Name | Environment | Value Description |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Production | `production` |
| `DATABASE_URL` | Production | `postgresql+asyncpg://postgres.[REF]:[PASS]@[HOST]:6543/postgres` |
| `JWT_SECRET_KEY` | Production | 64-hex-character cryptographically secure key |
| `CSRF_SECRET_KEY` | Production | 64-hex-character cryptographically secure key |
| `ALLOWED_ORIGINS` | Production | `["https://civicsphere-web.vercel.app", "https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app"]` |
| `STORAGE_BACKEND` | Production | `supabase` (or `local` for fallback) |
| `SUPABASE_URL` | Production | `https://[PROJECT_REF].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Masked secret API key |
| `SUPABASE_STORAGE_BUCKET`| Production | `civicsphere-demo-documents` |
| `EMBEDDING_PROVIDER` | Production | `mock` (or `openai`, `gemini`, `huggingface`) |
| `NEXT_PUBLIC_API_URL` | Production (Web) | `https://civicsphere-backend.vercel.app/api/v1` |

---

## 5. Verification & Smoke Testing Checklist

After deploying, verify the deployment by running the following commands:

1. **Verify Backend Health:**
   ```bash
   curl -s https://civicsphere-backend.vercel.app/api/v1/health
   # Expected: {"status":"HEALTHY","service":"civicsphere_unified_backend",...}
   ```

2. **Verify Knowledge Engine Readiness:**
   ```bash
   curl -s https://civicsphere-backend.vercel.app/api/v1/health/ready
   # Expected: {"ready":true,"graph_nodes":34,"vector_records":12,...}
   ```

3. **Verify Statutory Grounded Query:**
   ```bash
   curl -X POST https://civicsphere-backend.vercel.app/api/v1/legal/query \
     -H "Content-Type: application/json" \
     -d '{"query":"What are the rules and timelines for filing a first appeal under Section 19 of the Right to Information Act 2005?"}'
   # Expected: HTTP 200, confidence: 0.98, fail_safe_state: VERIFIED
   ```

4. **Verify Frontend Access:**
   Open `https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app` in any modern web browser.
