# Chapter 13 — Deployment, CI/CD, Infrastructure and Operations

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. Dual Vercel Production Cloud Architecture

CivicSphere AI is hosted in production across two decoupled, synchronized Vercel cloud projects:

```
[Citizen Client]
       |
       +---> 1. Frontend Web Portal: https://civicsphere-web.vercel.app
       |     - Framework: Next.js 15 App Router (Node.js 22.x)
       |     - Deployed via: npx vercel --prod in apps/web
       |     - Active Deployment ID: dpl_5E9C9wjft69ERYSm2xWcociPe6zL
       |
       +---> 2. Unified Backend API: https://civicsphere-backend.vercel.app
             - Framework: FastAPI / ASGI (Python 3.12 Serverless)
             - Entrypoint: api/index.py -> backend.app.main:app
             - Active Deployment ID: dpl_6d5PbXUoHi4ufTe1PP965LDjttgd
             - Persistence: Supabase PostgreSQL 17.6 + pgvector (Port 6543)
```

### 1.1 Backend Vercel Configuration (`vercel.json`)
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
*Note on Vercel Python Compatibility:* Vercel v2 configurations using `@vercel/python` strictly prohibit combining `"functions"` with `"builds"`. Commit `b566c93` removed the conflicting `"functions"` key, ensuring instant, error-free automated builds.

### 1.2 Frontend Vercel Configuration (`apps/web/.vercel/project.json`)
```json
{
  "projectId": "prj_e8qZuiSm9DKFb5ZL3GgCO2UjsKGT",
  "orgId": "team_FWMl2iG5JaXnfIBbw6Samefu",
  "projectName": "civicsphere-web",
  "settings": {
    "framework": "nextjs",
    "nodeVersion": "24.x"
  }
}
```
- **Environment Variable:** `NEXT_PUBLIC_API_URL="https://civicsphere-backend.vercel.app"` is configured in Vercel project production settings.

---

## 2. Docker Compose 7-Service Topology

For local development, automated testing, and offline deployment demonstrations, the complete platform runs via [`infrastructure/docker/docker-compose.yml`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/infrastructure/docker/docker-compose.yml):

```yaml
version: '3.8'

services:
  # 1. Primary Relational DB with Vector Extension
  postgres:
    image: pgvector/pgvector:pg16
    container_name: civicsphere-postgres
    restart: unless-stopped
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U civicsphere_user -d civicsphere"]

  # 2. Graph Database
  neo4j:
    image: neo4j:5.15.0
    container_name: civicsphere-neo4j
    restart: unless-stopped
    ports: ["7474:7474", "7687:7687"]
    volumes: [neo4jdata:/data]

  # 3. Cache & Rate Limiting
  redis:
    image: redis:7.2-alpine
    container_name: civicsphere-redis
    ports: ["6379:6379"]

  # 4. S3-Compatible Object Store
  minio:
    image: minio/minio:latest
    container_name: civicsphere-minio
    ports: ["9000:9000", "9001:9001"]
    volumes: [miniodata:/data]

  # 5. Modular Monolith Backend
  backend:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.backend
    container_name: civicsphere-backend
    ports: ["8000:8000"]
    depends_on:
      postgres: { condition: service_healthy }

  # 6. Next.js Frontend Web Client
  frontend:
    build:
      context: ../../apps/web
      dockerfile: Dockerfile
    container_name: civicsphere-frontend
    ports: ["3000:3000"]
    depends_on: [backend]

  # 7. Continuous Source Synchronization Scheduler Daemon
  sync-cron:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.backend
    container_name: civicsphere-sync-cron
    command: ["python", "infrastructure/scripts/sync_sources_cron.py"]
```

---

## 3. GitHub Actions CI/CD Pipeline

The project includes two GitHub Actions workflows under `.github/workflows/`:

### 3.1 Continuous Integration (`.github/workflows/ci.yml`)
- **Triggers:** Push to `main` branch or pull requests targeting `main`.
- **Jobs:**
  1. **Backend Tests:** Provisions Python 3.12, installs `requirements.txt`, executes `pytest` suite across all 91 tests.
  2. **Frontend Lint & Build:** Provisions Node.js 20, installs npm dependencies, runs `npm run lint` and `npm run build`.

### 3.2 Security Scanning (`.github/workflows/security.yml`)
- **Triggers:** Weekly scheduled cron and manual workflow dispatch.
- **Tools:**
  - `safety`: Scans Python dependencies for known CVEs.
  - `bandit`: Static analysis for Python security vulnerabilities.
  - `npm audit`: Scans JavaScript packages for critical advisories.

---

## 4. Operations & Runbooks

### 4.1 Deployment Runbook
To deploy code changes to production:

```bash
# 1. Commit and push changes to GitHub main branch
git add .
git commit -m "feat/fix: descriptive commit message"
git push origin main

# 2. Deploy Backend to Vercel
npx vercel --prod --yes

# 3. Deploy Frontend to Vercel
cd apps/web
npx vercel --prod --yes
cd ../..

# 4. Verify live production endpoints
curl https://civicsphere-backend.vercel.app/api/v1/health
curl https://civicsphere-backend.vercel.app/api/v1/health/ready
curl -I https://civicsphere-web.vercel.app
```

### 4.2 Rollback Procedure
If a production deployment introduces regressions:
1. Identify the previous stable Vercel deployment ID via:
   ```bash
   npx vercel list civicsphere-backend
   ```
2. Promote the previous stable deployment:
   ```bash
   npx vercel rollback <deployment-id> --yes
   ```
3. Revert the corresponding Git commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

### 4.3 Log Inspection & Diagnostics
To inspect live production serverless logs in real time:
```bash
npx vercel logs civicsphere-backend.vercel.app
```
To inspect live frontend web logs:
```bash
npx vercel logs civicsphere-web.vercel.app
```
