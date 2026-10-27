# CivicSphere AI — Known Limitations & Technical Disclosures

**Document Version:** 2.0  
**Project:** CivicSphere AI (Final Year Major Project)  
**Standard:** Google Deepmind Advanced Agentic Engineering Standard  
**Date:** October 28, 2026  
**Auditor:** Principal Software Architect & QA Lead  

---

## 1. Transparency Principle

In strict adherence to the Google Deepmind Advanced Agentic Engineering Standard and academic integrity principles, this document transparently discloses all architectural constraints, environmental dependencies, active fallbacks, and known limitations.

No mock behavior is misrepresented as production AI, and no cloud dependency status is obfuscated.

---

## 2. Release Readiness Verdicts

| Evaluation Tier | Verdict | Key Condition / Rationale |
| :--- | :---: | :--- |
| **Academic Submission Readiness** | **GO (APPROVED)** | Codebase is fully structured, 28 Next.js routes prerendered, 91 tests passing, 0 ESLint errors/warnings, 0 production npm vulnerabilities, complete traceability matrix and full submission documentation. |
| **Live Demonstration Readiness** | **CONDITIONAL GO** | Read-only statutory workflows, 10-section legal cards, and circuit-breaker fail-safes are 100% operational live on Vercel and local runtime. State-mutating writes require either unpausing Supabase in dashboard or running Docker Compose locally. |
| **Production Release Readiness** | **NO-GO** | Blocked on commercial LLM credentials (production currently runs mock embeddings) and dedicated non-dormant cloud PostgreSQL persistence. |

---

## 3. Technical Disclosures

### 3.1 Embedding Provider Status in Live Production
- **Current Runtime Status:** `EMBEDDING_PROVIDER="mock"` (Active on Vercel Production).
- **Technical Implementation:**
  - The codebase implements a multi-provider embedding architecture in `backend/app/common/providers/embedding.py` with concrete classes for `OpenAIEmbeddingProvider` (`text-embedding-3-small`/`large`), `GeminiEmbeddingProvider` (`text-embedding-004`), and `HuggingFaceEmbeddingProvider` (`all-MiniLM-L6-v2`).
  - Provider factory `get_embedding_provider()` fails fast with an explicit `ValueError` if an external provider is selected without its required API key.
- **Why Mock is Active in Production:**
  - Commercial cloud LLM API keys (OpenAI, Google Gemini, Anthropic) require active billing accounts. For academic submission and free preview hosting, `EMBEDDING_PROVIDER="mock"` is actively configured in Vercel environment variables.
- **Behavior of Active Mock Provider:**
  - Generates deterministic 384-dimensional vectors using token-hash feature projections with English statutory stopword removal and $L_2$ normalization.
  - While it successfully supports exact statutory token matching and passes all hybrid retrieval benchmarks (MRR: 1.0000), it lacks cross-lingual semantic abstraction and deep latent synonym association.
- **Vector Dimension Compatibility Prerequisite:**
  - The canonical database schema specifies `vector(384)`.
  - OpenAI `text-embedding-3-small` supports variable dimensions via the `dimensions=384` API parameter (supported in `OpenAIEmbeddingProvider`).
  - HuggingFace `all-MiniLM-L6-v2` is natively 384-dimensional.
  - Models with fixed incompatible dimensions (e.g., 768 or 1536) cannot be inserted into `vector(384)` without schema migration or projection.
  - **Policy:** Never mix incompatible embedding models or substitute mock embeddings silently when real inference fails.

---

### 3.2 External Cloud Database Dormancy (Supabase Free Tier)
- **Current Status:** Paused / Dormant on Supabase Free Tier.
- **Technical Finding:**
  - Supabase enforces a strict 7-day inactivity pause policy on free-tier projects.
  - When paused, Supavisor connection pooler queries to `aws-0-ap-southeast-2.pooler.supabase.com:6543` return:
    ```
    asyncpg.exceptions.InternalServerError: (ENOTFOUND) tenant/user postgres.wfzapvgaxmzddrgolfok not found
    ```
- **System Resilience & Graceful Fallback:**
  - In `backend/app/main.py`, the backend wraps database initialization in `asyncio.wait_for` exception guards with a 2.5-second timeout. When the external pooler is dormant, the server fails fast to in-memory mode, logging a notice and operating using pre-seeded statutory knowledge.
  - Read queries (`GET /api/v1/health`, `GET /api/v1/health/ready`, `POST /api/v1/legal/query`) continue responding with HTTP 200 and high confidence (0.98).
  - Mutating operations (`POST /api/v1/auth/register`) return HTTP 500 when attempting to commit to the dormant external database.
- **Remediation Pathway:**
  1. The project owner can click "Restore Project" in the Supabase Cloud Dashboard.
  2. Alternatively, running the full local stack via `infrastructure/docker/docker-compose.yml` provides a permanent, non-dormant PostgreSQL 16 + pgvector container.

---

### 3.3 Knowledge Graph Persistence: Relational Graph vs. Neo4j Aura
- **Current Status:** Relational Graph Active (Canonical); Neo4j Driver Adapter Optional.
- **Technical Details:**
  - The authoritative primary knowledge graph is implemented using relational tables in PostgreSQL: `knowledge_graph_nodes` and `knowledge_graph_edges` with JSONB attributes.
  - Graph traversals (depth-1 and depth-2) are executed via optimized SQL queries in `PersistentGraphRepository`.
  - While complete Cypher driver code for Neo4j 5.x exists in `backend/app/knowledge/graph/repository.py`, a dedicated Neo4j Aura cloud instance is not provisioned. The local Docker Compose setup spins up a dedicated `neo4j:5.15.0` container.

---

### 3.4 Offline CI/CD Test Suite: Single Skipped Test
- **Test File:** `backend/tests/integration/test_live_sources_smoke.py`
- **Assertion:** 1 skipped test in automated Pytest run (91 passed, 1 skipped).
- **Reason:** Requires outbound network access to external government gazette websites (`indiacode.nic.in`, `egazette.gov.in`). Skipped by default to ensure deterministic, offline-capable CI build execution.

---

### 3.5 Build-Time Developer Dependency Advisory
- **Runtime Dependencies (`npm audit --omit=dev`):** **0 vulnerabilities**.
- **Full Dependencies (`npm audit`):** **1 moderate severity advisory** in `postcss-selector-parser <6.1.5` (GHSA-rj75-hqrm-r3gf).
- **Context:** An internal dependency of build-time CSS processing (`tailwindcss` 3.4.x). It does not ship to production client bundles or expose runtime server endpoints.

---

## 4. Summary Assessment

None of the disclosed limitations affect core algorithmic soundness, architectural integrity, or offline academic evaluation. The platform exhibits high resilience by gracefully handling external provider constraints and maintaining complete transparency.
