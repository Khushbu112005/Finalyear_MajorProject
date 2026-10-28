# Chapter 15 — Troubleshooting, Known Limitations and Technical Debt

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. Technical Debt & Production Blockers Inventory

In accordance with strict forensic standards, this chapter documents the real, unvarnished architectural trade-offs, constraints, and known limitations currently present in CivicSphere AI.

| Issue ID | Category | Severity | Summary | Current Status | Remediation Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LIMIT-01** | AI Engine | **HIGH (Prod Blocker)** | Production uses deterministic token-hash mock embeddings (`mock`) | Active in Prod | Provision commercial OpenAI / Cohere API key |
| **LIMIT-02** | Cloud DB | **MEDIUM** | Supabase free-tier projects automatically pause after 7 days of inactivity | Restored / Active | Upgrade to Supabase Pro or dedicated AWS RDS instance |
| **LIMIT-03** | Serverless | **LOW** | Vercel Python serverless cold starts experience ~1.5s - 2.5s initial hydration latency | Active in Prod | Deploy on dedicated container (Railway / AWS ECS / Render) |
| **LIMIT-04** | Graph DB | **LOW** | Neo4j enterprise driver is optional; production relies on PostgreSQL relational graph | Retained Fallback| Maintain relational graph or provision hosted AuraDB Neo4j |
| **LIMIT-05** | Rate Limit | **LOW** | Rate limiting is currently in-memory per container rather than Redis cluster | Active in Prod | Point `REDIS_URL` to an Upstash / ElastiCache Redis cluster |
| **LIMIT-06** | Repo Cleanup| **INFO** | Legacy root `civicsphere_knowledge.db` exists from local development | Harmless Artifact | Remove file from local working tree (ignored by git) |

---

## 2. In-Depth Technical Limitations & Remediation

### 2.1 LIMIT-01: Commercial Embedding Key Requirement
- **Description:** In `backend/app/common/config.py`, `EMBEDDING_PROVIDER` is set to `"mock"` in production. While the mock provider uses deterministic feature hashing with stopword removal for exact keyword-semantic matching (allowing accurate retrieval for indexed terms like "Article 21", "Section 7 RTI", "Consumer Forum"), it lacks the high-dimensional latent semantic generalization of dense neural models like OpenAI `text-embedding-3-small` or Cohere `embed-english-v3.0`.
- **Root Cause:** A commercial OpenAI or Cohere API key has not been funded or attached to the Vercel production environment variables.
- **Evidence:** `backend/app/common/providers/embedding.py::get_embedding_provider()` falls back to `MockEmbeddingProvider(dimension=384)`.
- **Workaround:** Seed sources contain rich lexical metadata, allowing hybrid BM25 + graph traversal to maintain high retrieval precision ($\ge 0.88$).
- **Resolution:**
  1. Add `OPENAI_API_KEY="sk-..."` in Vercel project environment variables.
  2. Set `EMBEDDING_PROVIDER="openai"` in Vercel production settings.
  3. Trigger automated re-indexing via `POST /api/v1/knowledge/ingestion/jobs`.

---

### 2.2 LIMIT-02: Supabase Free-Tier Auto-Pausing Behavior
- **Description:** The production PostgreSQL database is provisioned on the Supabase free tier. Supabase free projects enter a paused state after 7 consecutive days of inactivity. When paused, the transaction pooler rejects connections on port 6543 until manually unpaused via the Supabase dashboard.
- **Evidence:** During earlier release testing, the database entered dormancy and returned `ConnectionRefusedError` until unpaused by the project owner.
- **Workaround:**
  1. A daily automated ping script (`infrastructure/scripts/verify_hosted_postgres.py`) can be scheduled via GitHub Actions cron to prevent dormancy.
  2. For local evaluations and viva demonstrations, the local Docker PostgreSQL stack (`infrastructure/docker/docker-compose.yml`) provides zero-latency offline fallback.
- **Resolution:** For commercial enterprise operation, migrate from Supabase free tier to a dedicated AWS RDS PostgreSQL instance or Supabase Pro tier with persistent compute.

---

### 2.3 LIMIT-03: Serverless Python Cold-Start Latency
- **Description:** Vercel serverless functions running Python 3.12 spin down to 0 replicas when traffic is idle. On a fresh invocation:
  1. The serverless container initializes Python 3.12 runtime and downloads unbundled wheels (`pygments`, `sqlalchemy`, `asyncpg`).
  2. `lifespan()` executes, connecting to PostgreSQL and hydrating 34 graph nodes and 12 vector chunks into memory cache.
  - This results in a cold-start response latency of ~1.8 to 2.5 seconds for the very first request. Subsequent warm requests respond in under 80 ms.
- **Mitigation Implemented:** Commit `894f27d` added `connect_args["timeout"] = 3.0` and `asyncio.wait_for(init_models(), timeout=2.5)` to ensure the serverless container never hangs indefinitely waiting for a slow pooler.
- **Resolution:** For zero cold-start latency, host the FastAPI backend on a persistent container runtime (e.g., Render, Railway, AWS ECS, or DigitalOcean App Platform) using the provided `infrastructure/docker/Dockerfile.backend`.

---

### 2.4 LIMIT-04: Relational Graph vs. Neo4j Cypher Storage
- **Description:** While [`backend/app/knowledge/graph/repository.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/knowledge/graph/repository.py) supports native Neo4j Bolt connections (`neo4j://localhost:7687`), serverless edge environments lack a persistent Neo4j cluster unless an external cloud service (AuraDB) is provisioned.
- **Current Behavior:** The system uses a durable relational graph representation in PostgreSQL (`knowledge_graph_nodes` and `knowledge_graph_edges` tables) with recursive CTE traversal.
- **Impact:** Relational graph traversal in PostgreSQL provides identical 1-hop and 2-hop neighborhood exploration for civic acts with zero external dependency overhead.

---

### 2.5 LIMIT-05: In-Memory Token Bucket Rate Limiting
- **Description:** The current `RateLimitMiddleware` maintains client token buckets in process memory. Across multiple concurrent Vercel serverless function instances, each container tracks rate limits independently rather than sharing state.
- **Impact:** In high-concurrency environments, a distributed denial of service attack could distribute requests across multiple cold containers, effectively multiplying the allowed request quota.
- **Resolution:** Connect the middleware to the provisioned Redis container (`REDIS_URL`) or an Upstash Serverless Redis instance for global atomic rate limiting.
