# CivicSphere AI — Canonical Startup Dependency Map
**Phase**: PRE-CLEANUP DISCOVERY & VALIDATION ONLY

## 1. End-to-End System Startup Flow

```
                                  [ Citizen Browser ]
                                           │
                                           ▼ (Port 3000)
                     +-------------------------------------------+
                     |        Next.js 14 Web Frontend            |
                     |             (apps/web/)                   |
                     +---------------------+---------------------+
                                           │
                                           │ (HTTP/JSON + Cookies)
                                           ▼ (Port 8000)
                     +-------------------------------------------+
                     |           FastAPI Monolith API            |
                     |           (backend/app/main.py)           |
                     +--+--------+--------+--------+----------+--+
                        │        │        │        │          │
                        ▼        ▼        ▼        ▼          ▼
                  +---------+ +------+ +------+ +------+ +---------+
                  |Postgres | |Neo4j | |Redis | |MinIO | | AI / LLM|
                  |16 + vec | |5.x   | |7.x   | | S3   | |Providers|
                  |Port 5432| |P 7687| |P 6379| |P 9000| |(Pluggable
                  +---------+ +------+ +------+ +------+ +---------+
```

---

## 2. Startup Verification Checkpoints

1. **Database Layer**:
   - `PostgreSQL 16` container started on port 5432.
   - `pgvector` extension enabled via `CREATE EXTENSION IF NOT EXISTS vector;`.
   - `Alembic` applies `backend/migrations/versions/0001_initial_canonical_schema.py` (`0001_initial_schema`).

2. **Graph & Cache Layer**:
   - `Neo4j 5` graph daemon started on bolt://localhost:7687.
   - `Redis 7` rate limiter started on localhost:6379.

3. **Backend API Layer**:
   - `FastAPI` boots via `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`.
   - Loads `GlobalSettings` (`JWT_SECRET_KEY`, `NEO4J_PASSWORD`, `DATABASE_URL`).
   - Registers all 41 canonical endpoints with CORS & middleware.

4. **Frontend Web Layer**:
   - `Next.js 14` boots via `npm run start` in `apps/web/` on port 3000.
   - Connects to backend via `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.

---

## 3. Legacy Dependency Absence Confirmation
- **MongoDB**: 0% required for canonical startup.
- **Express / Node Server**: 0% required for canonical startup.
- **Vite / Client**: 0% required for canonical startup.
- All startup pipelines operate entirely independently of `server/`, `client/`, and `Civicsphere/`.
