# Chapter 01 — Project Origin, Requirements and Development History

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. Project Genesis & Problem Statement Evolution

CivicSphere AI originated as a final-year major engineering project to address a critical civic challenge in India: the inability of ordinary citizens to navigate the dense, fragmented, and technical landscape of Indian statutory law and government welfare schemes.

### 1.1 The Original Problem Statement
In early 2024, foundational research into public civic interactions revealed:
- Over 70% of citizen queries regarding fundamental rights, consumer grievances, and public information requests (RTI) go unasserted due to prohibitive legal consultation fees and obscure administrative jargon.
- Existing commercial generative AI solutions (ChatGPT, Claude, Gemini) frequently hallucinate statutory sections, cite overruled Supreme Court judgments, or confuse Indian laws with US/UK jurisprudence.
- Citizens seeking government welfare entitlements are overwhelmed by disparate state and central portals with inconsistent eligibility criteria.

### 1.2 Evolution of Objectives
The project's scope expanded from a simple legal QA chatbot into an **Evidence-Grounded National Civic Intelligence Platform** compliant with an extensive 97-page Master Engineering Specification. The evolution progressed across three major architectural epochs:

```
+-----------------------------------------------------------------------------------------+
| EPOCH 1: Prototype Chatbot (Commits d94d513 - 7245119)                                  |
| Initial frontend and backend prototypes, basic Gemini API integration, and mock search. |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| EPOCH 2: Multi-Branch Feature Development (Commits 1cda1d5 - b493943)                   |
| Parallel feature streams merged via PRs: Module C (Knowledge Graph), Module B (Gov      |
| Schemes), and Module D (Intelligent Document Processing).                              |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| EPOCH 3: Hardening, Persistence & Edge Deployment (Commits 779884c - b566c93)          |
| Canonical monorepo consolidation, security remediation, Alembic migrations 0001-0003,   |
| pgvector durable persistence, and Vercel serverless deployment.                         |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Detailed Git Commit Forensic History

A comprehensive inspection of the Git commit graph (`git log --all`) reveals 40 distinct commits chronicling the project's development. Below is the chronological breakdown of the major phases:

### Phase 1: Inception & Prototype Foundations
- **Commit `d94d513`** — `Initial commit`
  - *Context:* Repository initialized on GitHub by team lead.
- **Commit `7245119`** — `Frontend and Backend`
  - *Context:* Initial scaffolding of the Next.js web application and basic FastAPI backend.
- **Commit `5ca9421`** — `Merge branch 'Khushbu'`
  - *Context:* Integration of early UI screens and basic layout elements.

### Phase 2: Core Module Feature Expansion
- **Commit `1cda1d5`** — `feat: add government services and recommendation engine`
  - *Context:* Module B implementation by Anushka, introducing `GovernmentServiceModel`, eligibility rules evaluation, and citizen context parsing.
- **Commit `9cbcee6`** — `feat(module-c): implement production-ready knowledge and agentic graph subsystem with hybrid retrieval, evidence packs, and security guardrails`
  - *Context:* Module C implementation by Devansh, introducing the 13-stage ingestion pipeline, Neo4j graph traversal, BM25 + Vector hybrid retrieval, and evidence pack schemas.
- **Commit `91efdf3` / `b493943`** — `Implement intelligent document processing` / `Merge PR #3 from rahul-intelligent-document-processing`
  - *Context:* Module D implementation by Rahul, introducing PyMuPDF OCR processing, magic-byte validation, and document-to-knowledge graph linking.

### Phase 3: Monorepo Consolidation & Canonical Baseline
- **Commit `779884c`** — `chore(freeze): pre-cleanup repository snapshot baseline`
  - *Context:* Snapshot taken before restructuring inconsistent subfolders and unmerged experimental branches.
- **Commit `3f1cfc2`** — `chore: finalize canonical deployment-ready repository`
  - *Context:* Restructured repository into canonical modular monolith: `backend/app/`, `apps/web/`, `packages/schemas/`, `infrastructure/docker/`, and `data/seed/`.

### Phase 4: Security Remediation & Vulnerability Patching
- **Commit `7fb2294`** — `fix(security): remediate privilege escalation, unauthenticated tool execution, and header spoofing; add audit suite`
  - *Context:* Disallowed public self-registration of `ADMIN` and `SYSTEM` roles in production; enforced strict RBAC dependencies on agent tools; replaced spoofable headers with secure session tokens; created comprehensive security test suite.
- **Commit `861ebc3`** — `fix(security): auto-seed statutory acts, harden CORS, rotate secrets, and document Gate D persistence blocker`
  - *Context:* Removed wildcard `*` from production CORS; implemented mandatory 16-character minimum secret validation in `Settings`; added automatic cold-start seeding of verified statutory acts.

### Phase 5: Persistence Evolution & Gate D Verification
- **Commit `1e830b6`** — `feat(persistence): verify Supabase PostgreSQL & Storage, apply migration 0002, and document Gate D vector/graph blocker`
  - *Context:* Migrated user authentication, cases, and documents from local SQLite to hosted Supabase PostgreSQL.
- **Commit `a490011`** — `feat(persistence): resolve Gate D with pgvector and relational graph storage, migration 0003, and cold-start hydration`
  - *Context:* Replaced in-memory only vector and graph repositories with durable PostgreSQL tables (`knowledge_sources`, `knowledge_chunks`, `knowledge_embeddings`, `knowledge_graph_nodes`, `knowledge_graph_edges`) via Alembic Migration `0003`.
- **Commit `bda515a`** — `fix(retrieval): hydrate chunks from postgres knowledge_chunks into source registry on cold start`
  - *Context:* Added automatic cold-start database hydration in `lifespan()` to populate memory indexes from PostgreSQL upon serverless startup.
- **Commit `687c9e0`** — `fix(knowledge): implement multi-provider embeddings, async ingestion persistence, and dynamic pgvector queries`
  - *Context:* Integrated OpenAI, Gemini, Hugging Face, and Mock embedding providers; made ingestion completely asynchronous.

### Phase 6: Edge Deployment & Production Hosting
- **Commit `6a10e27`** — `feat(release): upgrade to React 19, add serverless greenlet concurrency, and verify live Vercel deployments`
  - *Context:* Upgraded web portal to React 19 / Next.js 15; added greenlet dependency to resolve asyncpg SQLAlchemy concurrency in serverless environments.
- **Commit `894f27d`** — `fix(resilience): add serverless-safe db connection timeouts, update multi-tier verdicts, and document persistence verification`
  - *Context:* Added 3.0-second asyncpg pooler connect timeout and 2.5-second initialization timeout to prevent container hanging during cold starts.
- **Commit `9939778`** — `docs(submission): certify live demonstration readiness with restored Supabase and Docker PostgreSQL verification`
  - *Context:* Certified live multi-tier release verdicts following user restoration of Supabase cloud project.
- **Commit `b566c93`** — `fix(deploy): remove conflicting functions key from vercel.json for vercel-python compatibility`
  - *Context:* Resolved Vercel CLI deployment conflict between `@vercel/python` builds and custom functions config, achieving 100% successful production deployment.

---

## 3. Forensic Milestone Summary Table

| Milestone / Phase | Date / Commit | Core Architectural Change | Motivation | Key Modules Affected | Verification Evidence | Current State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Initial Prototype** | Early 2026<br>`d94d513` | Basic Next.js + FastAPI structure | Proof of concept for legal QA | `apps/web`, `backend` | Manual page loading | Replaced |
| **Module B Integration** | Mid 2026<br>`1cda1d5` | Gov Scheme Navigator & Eligibility | PR #1 from Anushka | `backend/app/government` | `test_government_api.py` | Retained (Active) |
| **Module C Ingestion & Graph** | Mid 2026<br>`9cbcee6` | 13-stage ingestion, Neo4j, Hybrid RAG | PR #2 from Devansh | `backend/app/knowledge` | `test_hybrid_retrieval.py` | Retained (Active) |
| **Module D Document AI** | Mid 2026<br>`91efdf3` | PyMuPDF OCR, PDF upload, malware scan | PR #3 from Rahul | `backend/app/documents` | `test_document_pipeline_api.py` | Retained (Active) |
| **Canonical Monorepo Refactor** | Late 2026<br>`3f1cfc2` | Unified backend modular monolith | Fix circular imports & duplicate files | Entire repository | Import consistency tests | Retained (Active) |
| **Security Hardening** | Late 2026<br>`7fb2294` | Enforce RBAC, block admin self-reg | Security audit remediation | `backend/app/auth`, `common` | Security test suite (7 tests) | Retained (Active) |
| **Durable Persistence (Gate D)** | Oct 2026<br>`a490011` | PostgreSQL + pgvector + Alembic 0003 | Eliminate ephemeral SQLite/tmp storage | `backend/app/knowledge/models.py` | Migration 0003 applied | Retained (Active) |
| **Serverless Cold-Start Safety** | Oct 2026<br>`894f27d` | 3.0s db connect timeout, 2.5s init | Prevent Vercel function timeout | `backend/app/main.py`, `database.py` | Live health probe < 1.5s | Retained (Active) |
| **Production Vercel Hosting** | Oct 2026<br>`b566c93` | Dual Vercel deployment (web + backend) | Public cloud hosting & viva defense | `vercel.json`, `apps/web` | Live HTTP 200 on both URLs | Retained (Active) |

---

## 4. Active vs. Legacy Codebase Components

During repository consolidation, several legacy artifacts and development workarounds were superseded:

1. **Root `app.py` & Hugging Face Spaces Artifacts:**
   - *Status:* Legacy / Inactive.
   - *Detail:* Commits `7a4cdc9` through `b92efba` added Hugging Face Spaces compatibility (`@spaces.GPU` decorators, Gradio mounting at `/gradio`). These are preserved for optional cardless free demo hosting, but the canonical production deployment target is native Vercel serverless via [`api/index.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/api/index.py) and [`backend/app/main.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/main.py).
2. **Local SQLite File (`civicsphere_knowledge.db`):**
   - *Status:* Development Fallback.
   - *Detail:* Created during offline local unit test runs. When `DATABASE_URL` is configured with PostgreSQL, the system automatically uses asyncpg and pgvector.
3. **In-Memory Graph Fallback (`PersistentGraphRepository`):**
   - *Status:* Retained Hybrid.
   - *Detail:* Operates as an in-memory cache for ultra-low latency graph lookups while mirroring all node and edge writes to the underlying PostgreSQL `knowledge_graph_nodes` and `knowledge_graph_edges` tables.
