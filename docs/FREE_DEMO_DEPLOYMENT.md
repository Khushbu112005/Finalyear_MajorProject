# CIVICSPHERE AI — FREE DEMO DEPLOYMENT GUIDE

> **CLASSIFICATION**: **FREE DEMO / EVALUATION DEPLOYMENT ONLY**
>
> ⚠️ **IMPORTANT NOTICE: FREE DEMO ≠ PRODUCTION SCALE**
>
> This free tier topology is configured exclusively for **low-traffic interactive demos, academic evaluations, hackathons, and single-user demonstration workflows**. It is **NOT** designed for enterprise production scale (1,000+ concurrent users, sub-second statutory SLAs, or continuous background stream indexing). Production workloads require the dedicated Kubernetes architecture defined in `infrastructure/kubernetes`.

---

## 1. Locked Primary Demo Architecture

```text
                                [ Citizen / Evaluator Browser ]
                                              │
                                              ▼ (HTTPS)
                                  [ Vercel (Next.js 14) ]
                                              │
                                              ▼ (REST API / Secure Cookie)
                                 [ Render Free Web Service ]
                                   (FastAPI Docker Monolith)
                                              │
         ┌────────────────────────────┼───────────────────────────┬───────────────────────────┐
         ▼ (SQL / pgvector)           ▼ (Bolt neo4j+s://)         ▼ (TLS rediss://)           ▼ (Supabase Storage REST)
  [ Supabase DB ]             [ Neo4j AuraDB Free ]       [ Upstash Redis Free ]      [ Supabase Storage ]
  PostgreSQL 16 + pgvector    200k nodes / 400k rels      256 MB / 500k cmds/mo       1 GB / Private Bucket
```

* **No MongoDB Atlas**: CivicSphere AI canonical storage strictly relies on PostgreSQL 16 + pgvector, Neo4j Graph, and Redis.
* **No Cloudflare R2**: Object storage is unified under Supabase Storage (private bucket `civicsphere-demo-documents`).
* **No Hugging Face as Primary**: Hugging Face Spaces requires a paid plan to provision compute-running Docker Spaces; HF is preserved only as an optional paid alternative.
* **Persistent Document Storage**: Supabase Storage provides persistent private document and artifact storage with service-role token authentication.

---

## 2. Definitive Free Provider Matrix

| Component | Provider | Verified Free Allowance | Current Limitations | Persistence Behavior | Cold Start / Pause Behavior | Credit Card Required? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Hobby Plan (Free personal projects, standard bandwidth) | Subject to Vercel Hobby serverless limits | Static and Edge App Router assets | Standard serverless function invocation | **No** |
| **Backend** | **Render** | 750 free instance hours / month, 512 MB RAM, 0.1 vCPU | 512 MB memory limit, 100 GB monthly bandwidth | Ephemeral container filesystem (Supabase Storage handles documents) | **Spins down after 15 min idle**; ~50–60s cold start on first request | **No** |
| **Database** | **Supabase** | 500 MB database, built-in `pgvector` extension | 500 MB storage cap; pooled connection recommended | Persistent cloud PostgreSQL 16 | Pauses after extended inactivity (resumed from dashboard) | **No** |
| **Object Storage** | **Supabase Storage** | 1 GB storage, private bucket, authenticated access | 1 GB storage cap | Persistent private object storage | Always accessible via Supabase Storage REST API | **No** |
| **Graph DB** | **Neo4j AuraDB** | 1 instance, up to 200,000 nodes, up to 400,000 relationships | 1 free instance, snapshot export for backups | Persistent graph storage | Pauses during periods of inactivity (resumed from console) | **No** |
| **Cache / Rate Limit** | **Upstash** | 256 MB storage, 500,000 commands / month, 10 GB bandwidth | Hard monthly command limit | Persistent serverless Redis | Serverless architecture (zero container spin-down) | **No** |

> ℹ️ **Operational Note on Render Free Hours**: 750 free instance hours per month across a workspace is sufficient for a single web service running continuously in a 31-day month (31 * 24 = 744 hours), but it is **not guaranteed 24/7 uptime** if multiple services share the workspace or if resource thresholds are exceeded.

---

## 3. Required Environment Variables Configuration

### Backend Configuration (Render Environment)

```env
# Runtime
ENVIRONMENT=production
JWT_SECRET_KEY=[USER_SUPPLIED_STRONG_RANDOM_32_CHAR_KEY]
CORS_ORIGINS=["https://[ACTUAL-VERCEL-DOMAIN]"]

# 1. Supabase PostgreSQL 16 + pgvector (Use pooled connection)
DATABASE_URL=postgresql+asyncpg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# 2. Neo4j AuraDB Free
NEO4J_URI=neo4j+s://[INSTANCE_ID].databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=[YOUR_AURADB_PASSWORD]

# 3. Upstash Redis Free
REDIS_URL=rediss://default:[PASSWORD]@[HOST].upstash.io:6379

# 4. Supabase Storage (Private Bucket)
STORAGE_BACKEND=supabase
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
SUPABASE_STORAGE_BUCKET=civicsphere-demo-documents

# 5. AI Reasoning Engine
GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]
```

### Frontend Configuration (Vercel Environment)

```env
NEXT_PUBLIC_API_URL=https://[YOUR-RENDER-APP].onrender.com
```

---

## 4. Public End-to-End (E2E) Verification Checklist

| Test Item | Target / Flow | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Vercel deployment** | Frontend bundle compiled and served on Vercel | `PENDING` | Requires connecting GitHub repo to Vercel |
| **Render deployment** | Backend container built from `Dockerfile.backend` | `PENDING` | Requires provisioning Render Web Service |
| **Vercel → Render** | Frontend API client routes to public Render URL | `PENDING` | Verified via CORS / health probe |
| **Render → Supabase** | SQLAlchemy async pool connects to Supabase | `PENDING` | Verified via Alembic migration |
| **pgvector** | Cosine similarity vector search on legal chunks | `PENDING` | Verified via `vector` extension in PostgreSQL |
| **Render → Neo4j AuraDB** | Bolt driver queries statutory knowledge graph | `PENDING` | Verified via Cypher query test |
| **Render → Upstash** | Token-bucket rate limiter and session storage | `PENDING` | Verified via Redis ping & token consumption |
| **Render → Supabase Storage** | Multipart PDF upload stored in private bucket | `PENDING` | Verified via authenticated storage API |
| **Registration** | Citizen user registration creates DB record | `PENDING` | Verified via `/api/v1/auth/register` |
| **Login** | Password validation & httpOnly cookie issuance | `PENDING` | Verified via `/api/v1/auth/login` |
| **Secure cookie** | Strict SameSite / httpOnly auth cookie delivery | `PENDING` | Verified in browser network inspector |
| **CSRF** | CSRF token generation and validation on mutations | `PENDING` | Verified on state-changing POST requests |
| **Legal query** | Grounded statutory retrieval with legal citations | `PENDING` | Verified via `/api/v1/legal/query` |
| **Government query** | Welfare scheme eligibility rules execution | `PENDING` | Verified via `/api/v1/government/problem/analyze` |
| **Graph retrieval** | Subgraph extraction of legal entities & sections | `PENDING` | Verified via `/api/v1/knowledge/graph/query` |
| **PDF upload** | PDF document validation & MIME verification | `PENDING` | Verified via `/api/v1/documents/upload` |
| **PDF persistence in Supabase Storage** | Document file retrieved from private bucket | `PENDING` | Verified by fetching authenticated document bytes |
| **Document processing** | PDF OCR, classification, and metadata extraction | `PENDING` | Verified via document pipeline status |
| **Evidence/citation flow**| Ground-truth statutory quotes matched to sources | `PENDING` | Verified in agent response payload |
| **Logout** | Token invalidation in Upstash Redis and cookie clear | `PENDING` | Verified via `/api/v1/auth/logout` |
| **Protected-route authorization** | Admin/Reviewer routes reject citizen access | `PENDING` | Verified via RBAC 403 test |
