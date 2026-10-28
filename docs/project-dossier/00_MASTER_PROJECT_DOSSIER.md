# Chapter 00 — Master Project Dossier: CivicSphere AI

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Git Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  
**Document Author:** Multi-Disciplinary Forensic Architecture Team  

---

## 1. Executive Summary & Purpose

**CivicSphere AI** is a multi-agent, evidence-grounded civic and legal intelligence platform engineered specifically for the Indian legal and administrative ecosystem. The platform bridges the profound gap between complex statutory legal frameworks and ordinary citizens by translating unstructured civic queries into verified statutory guidance, procedural roadmaps, scheme eligibility calculations, and case workspace dossiers.

Unlike generic conversational AI tools that hallucinate non-existent laws, incorrect judicial precedents, or expired filing deadlines, CivicSphere AI enforces an **uncompromising anti-hallucination paradigm**:
- All guidance is synthesized strictly from official, verified Indian statutory acts (e.g., *Right to Information Act, 2005*, *Digital Personal Data Protection Act, 2023*, *Consumer Protection Act, 2019*).
- An out-of-domain circuit breaker instantly rejects queries outside Indian legal and civic purview with confidence score $0.0$.
- Hybrid retrieval balances lexical search (BM25), vector similarity (pgvector), and graph traversal (relational knowledge graph) via Reciprocal Rank Fusion (RRF).
- Full source attribution accompanies every response with explicit section, chapter, and publication metadata.

---

## 2. Problem Statement & User Personas

### 2.1 The Problem
Over 1.4 billion Indian citizens interact with thousands of Central and State statutory enactments, administrative tribunals, and government entitlement programs. Citizens face critical hurdles:
1. **Linguistic & Jargon Barriers:** Legal terminology prevents understanding of fundamental rights and procedural redressal mechanisms.
2. **Procedural Complexity:** Navigating filing deadlines, jurisdictional commission limits (District vs. State vs. National Consumer Commissions), and appellate tiers is error-prone.
3. **Fragmented Welfare Portals:** Over 500 Central and State schemes operate on disconnected portals with complex, multi-variable eligibility rules.
4. **Vulnerability to Misinformation:** LLMs generate plausible-sounding but legally fabricated sections and case law citations.

### 2.2 Target User Personas
- **Ordinary Citizens:** Individuals seeking to exercise basic statutory rights (e.g., filing an RTI application, claiming consumer defect refunds, asserting data privacy rights).
- **Legal Researchers & Paralegals:** Professionals conducting initial legal discovery, entity-relationship mapping between acts, and statutory section lookup.
- **Welfare Applicants:** Beneficiaries seeking scheme eligibility pre-qualification (e.g., PMAY housing subsidies, educational scholarships).
- **Platform Administrators:** Compliance officers monitoring knowledge ingestion, tamper-evident audit logs, and security telemetry.

---

## 3. High-Level Architectural Snapshot

CivicSphere AI is structured as a **Modular Monolith** backend built with FastAPI, connected to a modern Next.js 15 App Router web client, backed by PostgreSQL 17 + pgvector and Neo4j graph storage:

```
+-----------------------------------------------------------------------------------+
|                            CITIZEN / USER BROWSER                                 |
|         (Next.js 15 Client: Assistant, Schemes, Documents, Cases, Knowledge)      |
+-----------------------------------------------------------------------------------+
                                          |
                      HTTPS (Cross-Origin + Cookie Auth)
                                          v
+-----------------------------------------------------------------------------------+
|               VERCEL EDGE ROUTING / NEXT.JS REVERSE PROXY                         |
|     (Static SSG / SSR Pages + Dynamic Client Rewrites to Backend Edge)            |
+-----------------------------------------------------------------------------------+
                                          |
                               API Requests (/api/v1/*)
                                          v
+-----------------------------------------------------------------------------------+
|               CIVICSPHERE UNIFIED BACKEND (FastAPI / Python 3.12)                |
|  +-------------------+  +-------------------+  +--------------------------------+ |
|  | Auth & Security   |  | Legal Engine      |  | Government Scheme Navigator    | |
|  | (JWT, RBAC, TOTP) |  | (Module A, 10-sec)|  | (Module B, Eligibility rules)  | |
|  +-------------------+  +-------------------+  +--------------------------------+ |
|  +-------------------+  +-------------------+  +--------------------------------+ |
|  | Document Pipeline |  | Case Workspace    |  | Knowledge & RAG Engine         | |
|  | (Module D, OCR)   |  | (CRUD, Timeline)  |  | (Module C, Ingestion, Hybrid)  | |
|  +-------------------+  +-------------------+  +--------------------------------+ |
|  +------------------------------------------------------------------------------+ |
|  | Multi-Agent Orchestrator (Legal, Knowledge, Document, Gov, Citation, Safety) | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
       |                         |                        |                 |
       v                         v                        v                 v
+--------------+         +---------------+        +---------------+  +--------------+
| PostgreSQL   |         | pgvector /    |        | Relational /  |  | Object Store |
| (Users,      |         | Knowledge     |        | Neo4j Graph   |  | (Local /     |
|  Cases, Docs)|         | Embeddings    |        | (Entities,    |  |  Supabase    |
|              |         | (12 vectors)  |        |  Edges)       |  |  Storage)    |
+--------------+         +---------------+        +---------------+  +--------------+
```

---

## 4. Master Technology Inventory

| Layer | Primary Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 15.1.0 | Server-side rendering, client-side routing, static generation |
| **Frontend UI Library** | React & React DOM | 19.0.0 | Component rendering, hooks, responsive layouts |
| **Styling & Icons** | Tailwind CSS & Lucide React | 3.4.1 / 0.460.0 | Utility styling, responsive cards, legal icons |
| **Backend Framework** | FastAPI | 0.111.0 | Asynchronous REST API, OpenAPI docs, dependency injection |
| **ASGI Web Server** | Uvicorn | 0.30.0 | High-performance async server |
| **Primary Database** | PostgreSQL | 17.6 / 16.15 | Durable ACID relational persistence for users, cases, and chunks |
| **Vector Engine** | pgvector | 0.8.6 | Vector embeddings table (`knowledge_embeddings`) and cosine similarity |
| **Graph Engine** | Neo4j / Relational | 5.15.0 | Entity relationship graph (`knowledge_graph_nodes`, `knowledge_graph_edges`) |
| **Database ORM** | SQLAlchemy (Asyncio) | 2.0.31 | Async object relational mapping, async session management |
| **Database Migrations** | Alembic | 1.13.2 | Version-controlled schema migrations (`0001`, `0002`, `0003`) |
| **Authentication** | PyJWT & bcrypt | 2.8.0 / 4.1.3 | HS256 JWT tokens, 12-round bcrypt salt, httpOnly cookies |
| **Document OCR** | PyMuPDF (fitz) | 1.23.26 | Text and metadata extraction from PDF documents |
| **Embedding Providers** | Mock / OpenAI / Gemini / HF | — | Text embedding generation (384-dimensional vectors) |
| **Caching & Queue** | Redis | 7.2-alpine | Distributed cache and rate limiting store |
| **Containerization** | Docker & Docker Compose | Compose v2 | 7-service local development & testing stack |
| **Cloud Hosting** | Vercel Edge / Serverless | Node 22 / Py 3.12 | Production hosting for frontend web portal and backend API |

---

## 5. High-Level Feature Inventory Across the 6 Modules

### Module A: Legal Guidance Engine
- **Structured Legal Query:** Generates 10-section structured legal guidance including Overview, Applicable Provisions, Procedural Steps, Deadlines, Competent Authorities, and Appeal Pathways.
- **Statutory Acts Registry:** Real-time catalog of ingested and verified Indian Central and State Acts (`GET /api/v1/legal/acts`).
- **Citation Attribution:** Automatic attachment of exact section numbers, publishers, and official India Code URLs.

### Module B: Government Service Navigator
- **Problem Analysis:** Natural language extraction of problem domain, applicant demographic variables, and needed government services (`POST /api/v1/government/analyze`).
- **Eligibility Engine:** Evaluates multi-parameter criteria (age, income ceiling, state residence, category) against scheme rules.
- **Service Catalog:** Curated directory of schemes with application checklists and required supporting documents (`GET /api/v1/government/services`).

### Module C: Knowledge Engine & Hybrid RAG
- **13-Stage Ingestion Pipeline:** Automated ingestion from raw text or remote URL through validation, cleaning, chunking, entity extraction, embedding, and dual vector/graph persistence.
- **Hybrid Retrieval:** Multi-modal query retrieval combining lexical BM25 matching, dense vector similarity, and graph neighborhood expansion.
- **Evidence Pack Synthesis:** Packaging retrieved chunks into an auditable evidence pack with confidence scoring and warning indicators.

### Module D: Intelligent Document Processing
- **Secure PDF Upload:** Magic-byte validation (`%PDF-`), 10 MB size limit, and active malware/script scanning.
- **OCR & Text Extraction:** Automated structural text extraction via PyMuPDF.
- **Knowledge Graph Linking:** Automatic linkage of uploaded citizen documents to related statutory acts and open case workspaces.

### Module Cases: Citizen Case Workspace
- **Case Lifecycle CRUD:** Create, read, update, and track status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
- **Strict IDOR Prevention:** Row-level ownership enforcement ensuring citizens only access their own legal cases.
- **Counsel Assignment:** Role-based visibility permitting legal researchers and paralegals to review assigned or open matters.

### Phase 6: Multi-Agent Orchestrator
- **Coordinated Agent Specialists:** Five domain-specific agents: Legal Specialist, Knowledge Specialist, Government Specialist, Document Specialist, and Citation Specialist.
- **Bounded Autonomous Reasoning:** Maximum 5-step execution loop with loop-detection guardrails and safety filtering.

---

## 6. Current Implementation & Release Status

### Multi-Tier Release Verdicts

```
+---------------------------------------------------------------------------------------+
| VERDICT 1: ACADEMIC MAJOR PROJECT DEFENSE                                              |
| STATUS: 100% GO (APPROVED)                                                            |
| Justification: All SRS and PRD functional requirements implemented; 91 automated     |
| tests passing with 0 failures; complete documentation and architecture verified.       |
+---------------------------------------------------------------------------------------+
| VERDICT 2: LIVE DEMONSTRATION & EXAMINATION                                           |
| STATUS: 100% GO (OPERATIONAL)                                                         |
| Justification: Deployed live on Vercel; connected to active Supabase PostgreSQL 17.6   |
| with pgvector; zero-latency Docker stack operational for offline backup.              |
+---------------------------------------------------------------------------------------+
| VERDICT 3: COMMERCIAL ENTERPRISE PRODUCTION                                           |
| STATUS: NO-GO / HOLD (BLOCKED ON COMMERCIAL KEYS)                                     |
| Justification: Production uses deterministic mock embeddings (EMBEDDING_PROVIDER=mock)|
| until dedicated commercial OpenAI/Cohere API credentials are funded and attached.     |
+---------------------------------------------------------------------------------------+
```

---

## 7. Master Status Matrix

The following table provides an evidence-based summary of all major platform subsystems:

| Subsystem / Feature | Source File | Status | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **User Registration & Login** | `backend/app/auth/routes.py` | **RUNTIME-VERIFIED** | Live HTTP 200 on Supabase PostgreSQL; 91 pytest unit tests pass |
| **TOTP Multi-Factor Auth** | `backend/app/auth/totp.py` | **SOURCE-VERIFIED** | RFC 6238 compliant; setup, verify, and disable endpoints implemented |
| **RBAC (5 Roles)** | `backend/app/auth/models.py` | **TEST-VERIFIED** | CITIZEN, ADMIN, KNOWLEDGE_EDITOR, REVIEWER, RESEARCHER validated |
| **Legal Guidance Engine** | `backend/app/legal/routes.py` | **RUNTIME-VERIFIED** | Art. 21 query returns 0.98 confidence with full citations |
| **Out-of-Domain Guardrail** | `backend/app/legal/services/legal_engine.py` | **RUNTIME-VERIFIED** | Irrelevant queries (e.g. quantum physics) rejected with 0.0 confidence |
| **Government Service Nav** | `backend/app/government/routes.py` | **TEST-VERIFIED** | Problem analysis and scheme recommendation tests passing |
| **Intelligent Document OCR** | `backend/app/documents/routes.py` | **TEST-VERIFIED** | PDF magic-byte checks and PyMuPDF text extraction verified |
| **Case Workspace (CRUD)** | `backend/app/cases/routes.py` | **TEST-VERIFIED** | IDOR authorization and role filtering confirmed in automated tests |
| **13-Stage Ingestion** | `backend/app/knowledge/ingestion/pipeline.py` | **RUNTIME-VERIFIED** | Hydrates 34 graph nodes and 12 vector chunks on cold start |
| **Vector Storage (pgvector)** | `backend/app/knowledge/models.py` | **RUNTIME-VERIFIED** | Migration `0003` active on PostgreSQL 17.6 (`postgresql_pgvector`) |
| **Relational Knowledge Graph** | `backend/app/knowledge/graph/repository.py` | **RUNTIME-VERIFIED** | 34 statutory entities and relationships hydrated in memory and DB |
| **Hybrid Retrieval & RRF** | `backend/app/knowledge/retrieval/hybrid.py` | **TEST-VERIFIED** | BM25 + Vector + Graph combined via reciprocal rank fusion |
| **Audit & Security Logging** | `backend/app/common/audit.py` | **RUNTIME-VERIFIED** | Ingestion and security events logged with timestamps and actor IDs |
| **Frontend Web Portal** | `apps/web/src/app/` | **RUNTIME-VERIFIED** | Live on Vercel (`https://civicsphere-web.vercel.app`), HTTP 200 |
| **Backend API Serverless** | `api/index.py` | **RUNTIME-VERIFIED** | Live on Vercel (`https://civicsphere-backend.vercel.app`), HTTP 200 |
| **Commercial Embeddings** | `backend/app/common/providers/embedding.py` | **MOCKED (PROD)** | Production configured with deterministic token-hash mock provider |

---

## 8. Clean-Checkout Quickstart

To run the full stack locally from a clean git checkout:

```bash
# 1. Clone repository
git clone https://github.com/Khushbu112005/Finalyear_MajorProject.git
cd Finalyear_MajorProject

# 2. Start infrastructure stack via Docker Compose
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 3. Setup Python backend virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate
pip install -r requirements.txt

# 4. Copy environment template
cp .env.example .env
# Edit .env to set JWT_SECRET_KEY and NEO4J_PASSWORD

# 5. Run database migrations
alembic upgrade head

# 6. Start FastAPI backend
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# 7. Start Next.js frontend (in another terminal)
cd apps/web
npm install
npm run dev
```

The web application will be available at `http://localhost:3000` and the interactive OpenAPI documentation at `http://localhost:8000/docs`.

---

## 9. Dossier Directory Structure

All subsequent technical details are organized across the dedicated dossier chapters:

- **[01. Project Origin & Development History](./01_PROJECT_ORIGIN_REQUIREMENTS_AND_DEVELOPMENT_HISTORY.md)**
- **[02. Repository & Tech Stack Inventory](./02_COMPLETE_REPOSITORY_AND_TECH_STACK_INVENTORY.md)**
- **[03. Features, Pages & User Workflows](./03_FEATURES_PAGES_COMPONENTS_AND_USER_WORKFLOWS.md)**
- **[04. Complete Backend API Catalogue](./04_COMPLETE_BACKEND_API_CATALOGUE.md)**
- **[05. Database Schema & Persistence Architecture](./05_DATABASE_SCHEMA_MIGRATIONS_AND_PERSISTENCE.md)**
- **[06. AI/ML, RAG, Agents & Prompt Architecture](./06_AI_ML_RAG_AGENTS_AND_PROMPT_ARCHITECTURE.md)**
- **[07. Datasets, Knowledge Base & Statutory Sources](./07_DATASETS_KNOWLEDGE_BASE_AND_EXTERNAL_DATA_SOURCES.md)**
- **[08. API Keys & Environment Variables Inventory](./08_API_KEYS_ENVIRONMENT_VARIABLES_AND_EXTERNAL_INTEGRATIONS.md)**
- **[09. Authentication, Authorization & Security Architecture](./09_AUTHENTICATION_AUTHORIZATION_AND_SECURITY_ARCHITECTURE.md)**
- **[10. System Architecture & End-to-End Data Flows](./10_SYSTEM_ARCHITECTURE_AND_END_TO_END_DATA_FLOWS.md)**
- **[11. Installation & Build from Scratch Guide](./11_INSTALLATION_CONFIGURATION_AND_BUILD_FROM_SCRATCH.md)**
- **[12. Testing, QA, Benchmarks & Evidence](./12_TESTING_QA_BENCHMARKS_AND_VERIFICATION_EVIDENCE.md)**
- **[13. Deployment, CI/CD & Operations Runbook](./13_DEPLOYMENT_CICD_INFRASTRUCTURE_AND_OPERATIONS.md)**
- **[14. Complete Feature Traceability Matrix](./14_FEATURE_TRACEABILITY_AND_IMPLEMENTATION_STATUS.md)**
- **[15. Troubleshooting, Known Limitations & Technical Debt](./15_TROUBLESHOOTING_KNOWN_LIMITATIONS_AND_TECHNICAL_DEBT.md)**
- **[16. Developer Handover & Extension Guide](./16_DEVELOPER_MAINTENANCE_AND_FUTURE_EXTENSION_GUIDE.md)**
- **[17. Academic Demonstration & Viva Guide](./17_ACADEMIC_DEMONSTRATION_AND_VIVA_TECHNICAL_GUIDE.md)**
