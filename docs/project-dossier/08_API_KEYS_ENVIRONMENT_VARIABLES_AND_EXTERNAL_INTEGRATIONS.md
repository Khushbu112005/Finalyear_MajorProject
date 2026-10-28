# Chapter 08 — API Keys, Environment Variables and External Integrations

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

> [!CAUTION]
> **Zero-Exposure Policy:** In accordance with strict security standards, no actual credentials, passwords, private keys, or raw JWT secrets appear in this document. All variables are documented by identifier, schema, purpose, and verified presence state.

---

## 1. Master Environment Variable Inventory

The following table documents every environment variable consumed by CivicSphere AI across backend services, frontend builds, database migrations, and container topologies.

| Variable Name | Service / Provider | Purpose | Required? | Consuming File(s) | Present Locally? | Present in Production? | Sensitivity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Core Runtime | Defines environment mode (`development`, `test`, `production`) | No (Default: `development`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Public |
| `LOG_LEVEL` | Core Logging | Controls log verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | No (Default: `INFO`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Public |
| `APP_NAME` | Core Runtime | Application identifier for telemetry and headers | No (Default: `CivicSphere-AI`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Public |
| `API_PREFIX` | FastAPI Router | Base path prefix for all versioned REST endpoints | No (Default: `/api/v1`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Public |
| `ALLOWED_ORIGINS` | FastAPI CORS | Whitelisted origins permitted to make cross-origin requests | Yes in Production | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Moderate |
| `JWT_SECRET_KEY` | Auth Subsystem | Secret key used to sign and verify HMAC-SHA256 JWT tokens | **REQUIRED (Fatal if missing)** | `backend/app/common/config.py`, `auth/services.py` | **PRESENT** | **PRESENT** | **CRITICAL** |
| `JWT_ALGORITHM` | Auth Subsystem | Cryptographic algorithm for JWT encoding (Default: `HS256`) | No | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Low |
| `CSRF_SECRET_KEY` | Auth Security | Entropy source for generating double-submit CSRF tokens | No (Has fallback) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | High |
| `MAX_SOURCE_SIZE_BYTES` | Ingestion Pipeline | Maximum allowed payload size for statutory documents (5 MB) | No | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Low |
| `SSRF_PROTECTION_ENABLED`| Ingestion Pipeline | Enforces DNS validation and blocks RFC1918 private IPs | No (Default: `True`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Moderate |
| `DATABASE_URL` | PostgreSQL / SQLite | Connection URI for async SQLAlchemy relational database | **REQUIRED** | `backend/app/common/database.py`, `alembic.ini` | **PRESENT** | **PRESENT** | **CRITICAL** |
| `DATABASE_POOL_SIZE` | Database Engine | Maximum persistent connections in connection pool | No (Default: 10) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Low |
| `NEO4J_URI` | Neo4j Graph DB | Bolt connection URI for Neo4j instance | Optional (Has SQL fallback) | `backend/app/common/config.py` | **PRESENT** | **NOT REQUIRED** | Moderate |
| `NEO4J_USER` | Neo4j Graph DB | Username for Cypher graph queries (Default: `neo4j`) | Optional | `backend/app/common/config.py` | **PRESENT** | **NOT REQUIRED** | Low |
| `NEO4J_PASSWORD` | Neo4j Graph DB | Password for Neo4j authentication | **REQUIRED if Neo4j used** | `backend/app/common/config.py` | **PRESENT** | **NOT REQUIRED** | **CRITICAL** |
| `REDIS_URL` | Redis Cache | Redis connection string for distributed caching & rate limit | Optional (Has memory fallback) | `backend/app/common/config.py` | **PRESENT** | **NOT REQUIRED** | High |
| `STORAGE_BACKEND` | Document Store | Storage driver (`local` or `supabase`) | No (Default: `local`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Moderate |
| `STORAGE_LOCAL_PATH` | Document Store | Local filesystem directory for uploaded documents | No (Default: `./uploads`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Low |
| `SUPABASE_URL` | Supabase Storage | REST URL of Supabase project instance | Conditional (If `supabase`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Moderate |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase Storage | Privileged service key for bucket object uploads | Conditional (If `supabase`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | **CRITICAL** |
| `SUPABASE_STORAGE_BUCKET`| Supabase Storage | Target bucket name (`civicsphere-demo-documents`) | No | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Low |
| `EMBEDDING_PROVIDER` | AI Engine | Active embedding provider (`mock`, `openai`, `gemini`, `huggingface`) | No (Default: `mock`) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** (`mock`) | Low |
| `EMBEDDING_MODEL` | AI Engine | Target embedding model name | No (Default: `text-embedding-3-small`)| `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Low |
| `EMBEDDING_DIMENSION` | AI Engine | Target vector dimensionality (Enforced: 384) | No (Default: 384) | `backend/app/common/config.py` | **PRESENT** | **PRESENT** | Low |
| `OPENAI_API_KEY` | OpenAI API | Commercial API key for text-embedding-3-small and GPT-4 | Optional | `backend/app/common/providers/embedding.py` | **ABSENT** | **ABSENT** | **CRITICAL** |
| `GEMINI_API_KEY` | Google Gemini API | Commercial API key for Gemini 1.5 Flash / Pro and embeddings | Optional | `backend/app/common/providers/embedding.py` | **ABSENT** | **ABSENT** | **CRITICAL** |
| `HUGGINGFACE_API_KEY` | Hugging Face API | API key for Hugging Face feature extraction endpoint | Optional | `backend/app/common/providers/embedding.py` | **ABSENT** | **ABSENT** | **CRITICAL** |
| `ANTHROPIC_API_KEY` | Anthropic API | API key for Claude 3.5 Sonnet LLM provider | Optional | `backend/app/common/providers/llm.py` | **ABSENT** | **ABSENT** | **CRITICAL** |
| `NEXT_PUBLIC_API_URL` | Frontend Web | Absolute URL of the backend API called by the browser | **REQUIRED for Web** | `apps/web/.env.local`, `apps/web/src/lib/api-client.ts` | **PRESENT** | **PRESENT** | Public |

---

## 2. In-Depth Configuration Details

### 2.1 Critical Security Validations (`backend/app/common/config.py`)
CivicSphere AI includes startup sanity checks in `Settings.model_post_init()`:
1. **Placeholder Rejection:** The application refuses to start in `production` if `JWT_SECRET_KEY` or `NEO4J_PASSWORD` matches insecure placeholders (e.g. `change-this`, `CHANGE_ME`, `development-secret`).
2. **Minimum Entropy:** `JWT_SECRET_KEY` and `NEO4J_PASSWORD` must be at least 16 characters long.
3. **Wildcard CORS Prohibition:** In `production`, setting `ALLOWED_ORIGINS=["*"]` raises a fatal `ValueError`.

### 2.2 Frontend Public Variables vs. Private Secrets
- **Client-Exposed Variables:** Only variables prefixed with `NEXT_PUBLIC_` (specifically `NEXT_PUBLIC_API_URL`) are embedded in client-side JavaScript bundles.
- **Server-Side Protection:** `JWT_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and database passwords are never referenced in frontend code and remain strictly server-side.

---

## 3. Safe Configuration Checklist for New Developers

To configure an environment from scratch without risking secret exposure:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Generate a secure, 32-byte hexadecimal JWT secret key:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
   Paste the output as `JWT_SECRET_KEY` in `.env`.
3. Set `DATABASE_URL` to your local PostgreSQL instance:
   ```env
   DATABASE_URL=postgresql+asyncpg://civicsphere_user:your_password@localhost:5432/civicsphere
   ```
4. Keep `EMBEDDING_PROVIDER=mock` and `LLM_PROVIDER=mock` for zero-cost, offline local development.
5. In `apps/web/.env.local`, ensure:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
