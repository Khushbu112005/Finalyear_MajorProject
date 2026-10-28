# Chapter 02 — Complete Repository and Technology Inventory

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. Annotated Repository Structure

The CivicSphere AI codebase is structured as a consolidated monorepo containing a Python backend modular monolith, a TypeScript/React Next.js 15 web client, shared contract packages, Docker infrastructure, and evaluation benchmark suites.

```
Finalyear_MajorProject/
├── .github/                           # CI/CD Workflows & Templates
│   ├── workflows/ci.yml               # Automated Pytest & Lint GitHub Action
│   ├── workflows/security.yml         # Security vulnerability scanning workflow
│   └── pull_request_template.md       # PR guidelines and verification checklist
├── api/
│   └── index.py                       # Vercel Serverless Python entrypoint (imports backend.app.main:app)
├── apps/
│   └── web/                           # Next.js 15 App Router Frontend Web Application
│       ├── src/
│       │   ├── app/                   # App Router Page Routes (28 static/dynamic routes)
│       │   │   ├── about/page.tsx     # Platform mission and engineering background
│       │   │   ├── admin/             # Administrator management interfaces
│       │   │   │   ├── audit/         # Tamper-evident audit log viewer
│       │   │   │   ├── evaluation/    # RAG benchmark evaluation viewer
│       │   │   │   ├── knowledge/     # Knowledge base overview & status
│       │   │   │   ├── security/      # Security threat telemetry dashboard
│       │   │   │   ├── sources/       # Statutory source registration & sync
│       │   │   │   └── page.tsx       # Main admin portal dashboard
│       │   │   ├── agents/page.tsx    # Multi-agent chat interface & tool viewer
│       │   │   ├── assistant/page.tsx # Primary legal AI assistant chat
│       │   │   ├── auth/              # Alternate auth routes (login/register)
│       │   │   ├── cases/page.tsx     # Citizen case management workspace
│       │   │   ├── dashboard/page.tsx # Authenticated citizen dashboard
│       │   │   ├── documents/page.tsx # Document upload & OCR analysis
│       │   │   ├── government/page.tsx# Scheme discovery & eligibility checker
│       │   │   ├── knowledge/page.tsx # Knowledge graph & act explorer
│       │   │   ├── legal/page.tsx     # 10-section legal guidance engine
│       │   │   ├── login/page.tsx     # User authentication & MFA modal
│       │   │   ├── register/page.tsx  # Citizen/researcher self-registration
│       │   │   ├── privacy/page.tsx   # DPDP compliance and privacy notice
│       │   │   ├── profile/page.tsx   # User profile management & password update
│       │   │   ├── security/page.tsx  # Security disclosure & threat model
│       │   │   ├── settings/page.tsx  # User preferences & theme settings
│       │   │   ├── sources/page.tsx   # Statutory acts & gazette registry
│       │   │   ├── layout.tsx         # Root layout (Header, Navigation, Footer, Theme)
│       │   │   ├── globals.css        # Tailwind global CSS styling
│       │   │   └── page.tsx           # Platform landing page & module launcher
│       │   ├── components/            # Shared React UI Components
│       │   │   ├── Header.tsx         # Global header with search, auth state, and theme toggle
│       │   │   ├── Navigation.tsx     # Responsive navigation bar with module pills
│       │   │   ├── Footer.tsx         # Global footer with India Code links & copyright
│       │   │   └── ui/                # UI primitives (badge, button, card)
│       │   └── lib/                   # Frontend Utilities & API Client
│       │       ├── api-client.ts      # Universal typed fetch client with CSRF propagation
│       │       ├── types.ts           # TypeScript domain interfaces matching backend schemas
│       │       └── utils.ts           # Styling helper functions (cn)
│       ├── package.json               # Frontend dependencies (Next 15, React 19, Tailwind)
│       ├── tailwind.config.js         # Tailwind CSS styling configuration
│       ├── tsconfig.json              # TypeScript compilation configuration
│       └── next.config.js             # Next.js build options & API rewrites
├── backend/                           # Modular Monolith Python Backend
│   ├── app/
│   │   ├── main.py                    # Canonical FastAPI application entrypoint & lifespan
│   │   ├── common/                    # Cross-Cutting Core Utilities
│   │   │   ├── config.py              # Pydantic Settings & environment validation
│   │   │   ├── database.py            # Async SQLAlchemy engine & session dependency
│   │   │   ├── init_db.py             # DDL model initialization helper
│   │   │   ├── security.py            # AuthContext, password hashing, and token validation
│   │   │   ├── audit.py               # In-memory and structured JSON audit event manager
│   │   │   ├── errors.py              # Custom exceptions & global exception handlers
│   │   │   ├── rate_limiter.py        # Token bucket rate limiting middleware
│   │   │   ├── telemetry.py           # Request ID correlation & latency tracking
│   │   │   └── providers/             # Pluggable AI / Database Provider Factories
│   │   │       ├── embedding.py       # OpenAI, Gemini, Hugging Face & Mock embedding providers
│   │   │       ├── llm.py             # Anthropic, OpenAI, Gemini & Mock LLM providers
│   │   │       ├── reranker.py        # Heuristic, Cohere & Cross-Encoder rerankers
│   │   │       └── vector_store.py    # Vector store abstraction
│   │   ├── auth/                      # Authentication & Identity Subsystem
│   │   │   ├── routes.py              # /api/v1/auth endpoints (login, register, MFA, me)
│   │   │   ├── models.py              # UserModel & UserRole SQLAlchemy declarations
│   │   │   ├── services.py            # Registration, authentication, and JWT issuance
│   │   │   ├── dependencies.py        # FastApi get_current_user & require_role dependencies
│   │   │   └── totp.py                # RFC 6238 TOTP multi-factor authentication manager
│   │   ├── legal/                     # Module A: Legal Guidance Engine
│   │   │   ├── routes.py              # /api/v1/legal/query and /api/v1/legal/acts
│   │   │   └── services/legal_engine.py# 10-section legal guidance generator & circuit breaker
│   │   ├── government/                # Module B: Government Service Navigator
│   │   │   ├── routes.py              # /api/v1/government endpoints
│   │   │   ├── models.py              # GovernmentServiceModel SQLAlchemy declaration
│   │   │   └── services/              # Scheme recommendation, eligibility & conflict logic
│   │   ├── knowledge/                 # Module C: Knowledge Engine & Hybrid RAG
│   │   │   ├── models.py              # SQLAlchemy models for pgvector & relational graph
│   │   │   ├── api/                   # Knowledge API endpoints (search, graph, sources, ingestion, admin)
│   │   │   ├── domain/                # Pure domain entities (Source, Chunk, EvidencePack)
│   │   │   ├── ingestion/             # 13-stage ingestion pipeline components
│   │   │   ├── graph/                 # Knowledge graph repository & traversal services
│   │   │   ├── retrieval/             # Hybrid retrieval service (BM25 + Vector + Graph + RRF)
│   │   │   ├── sources/               # Source registry, freshness tracker & verification engine
│   │   │   ├── security/              # Prompt injection, poisoning defense & sanitization
│   │   │   └── evaluation/            # Retrieval benchmarking & metric calculation
│   │   ├── documents/                 # Module D: Document Intelligence
│   │   │   ├── routes.py              # /api/v1/documents upload, list & details
│   │   │   ├── models.py              # DocumentModel SQLAlchemy declaration
│   │   │   └── services/              # OCR processing, security scanner, storage backend
│   │   ├── cases/                     # Citizen Case Management Workspace
│   │   │   ├── routes.py              # /api/v1/cases CRUD & assignment endpoints
│   │   │   └── models.py              # CaseModel SQLAlchemy declaration
│   │   ├── agents/                    # Phase 6: Multi-Agent System
│   │   │   ├── routes.py              # /api/v1/agents/chat and /tools
│   │   │   ├── orchestrator.py        # 5-agent coordinator & execution planner
│   │   │   └── core/                  # BaseAgent class and sandboxed ToolRegistry
│   │   └── audit/                     # Phase 10: Observability & Compliance
│   │       ├── routes.py              # /api/v1/audit/events and /security-events
│   │       └── models.py              # AuditEvent database models
│   ├── migrations/                    # Alembic Database Migrations
│   │   ├── versions/
│   │   │   ├── 0001_initial_canonical_schema.py      # Initial users, cases, documents schema
│   │   │   ├── 0002_sync_canonical_models.py         # Added government services & audit models
│   │   │   └── 0003_pgvector_and_durable_knowledge.py# Durable pgvector & knowledge tables
│   │   └── env.py                     # Alembic async migration runner configuration
│   └── tests/                         # Comprehensive Pytest Test Suites (91 tests)
│       ├── api/                       # API endpoint contract tests
│       ├── integration/               # Cross-module e2e & hybrid retrieval tests
│       ├── security/                  # IDOR, SSRF, injection, and PII tests
│       └── unit/                      # Isolated unit tests for chunker, reranker, models
├── data/                              # Seed Sources & Evaluation Datasets
│   ├── seed/seed_data.py              # Statutory text for RTI, DPDP, and Consumer Protection Acts
│   └── evaluation/                    # Benchmarking JSON fixtures (standard, adversarial, conflict)
├── infrastructure/                    # Deployment & DevOps Assets
│   ├── docker/                        # Dockerfiles and Docker Compose configuration
│   └── scripts/                       # Maintenance, migration, and benchmarking utility scripts
├── packages/                          # Shared Monorepo Packages
│   ├── config/settings.py             # Shared settings loader
│   └── schemas/contracts.py           # Canonical Pydantic schemas (ApiResponse, EvidencePack)
├── .env.example                       # Documented environment variable template
├── alembic.ini                        # Alembic migration configuration
├── package.json                       # Monorepo root workspace configuration
├── pyproject.toml                     # Python package definitions & pytest configuration
├── requirements.txt                   # Locked backend Python dependencies
├── vercel.json                        # Vercel deployment configuration
└── README.md                          # Repository overview & setup guide
```

---

## 2. Technology & Dependency Inventory

### 2.1 Backend Python Environment
- **Python Version:** 3.12 (compatible with 3.10+)
- **Dependency Manager:** `pip` with `requirements.txt` and `pyproject.toml`
- **Core Dependencies:**

| Package | Declared Version | Purpose | Tier |
| :--- | :--- | :--- | :--- |
| `fastapi` | `>=0.111.0` | High-performance asynchronous web API framework | Runtime (Direct) |
| `uvicorn` | `>=0.30.0` | Production ASGI web server | Runtime (Direct) |
| `pydantic` | `>=2.7.0` | Data validation, request parsing, and schema generation | Runtime (Direct) |
| `pydantic-settings` | `>=2.2.0` | Typed environment configuration management | Runtime (Direct) |
| `sqlalchemy[asyncio]` | `>=2.0.0` | Asynchronous ORM for PostgreSQL and SQLite | Runtime (Direct) |
| `asyncpg` | `>=0.29.0` | High-performance PostgreSQL async database driver | Runtime (Direct) |
| `aiosqlite` | `>=0.20.0` | Asynchronous SQLite driver for testing / local fallback | Test / Local (Direct) |
| `pgvector` | `>=0.2.5` | PostgreSQL extension for vector similarity search | Runtime (Direct) |
| `alembic` | `>=1.13.0` | Version-controlled database schema migration framework | Tooling (Direct) |
| `greenlet` | `>=3.0.0` | Coroutine library required for SQLAlchemy asyncpg pooling | Runtime (Transitive) |
| `httpx` | `>=0.27.0` | Async HTTP client for external AI providers & SSRF verification | Runtime (Direct) |
| `python-multipart` | `>=0.0.9` | Multipart form-data parser for file uploads | Runtime (Direct) |
| `PyMuPDF` | `>=1.23.0` | PDF text extraction and OCR parsing library | Runtime (Direct) |
| `numpy` | `>=1.26.0` | Vector mathematics, normalisation, and cosine similarity | Runtime (Direct) |
| `bcrypt` | `>=4.1.0` | Secure password hashing with automatic salting | Runtime (Direct) |
| `pyjwt` | `>=2.8.0` | JSON Web Token encoding and signature verification | Runtime (Direct) |
| `email-validator` | `>=2.0.0` | Email address validation for Pydantic `EmailStr` | Runtime (Direct) |
| `redis` | `>=5.0.0` | Redis client for caching and distributed rate limiting | Runtime (Optional) |
| `neo4j` | `>=5.15.0` | Neo4j Cypher driver for enterprise graph storage | Runtime (Optional) |
| `google-generativeai` | `>=0.4.0` | Official Google Gemini AI SDK for embeddings and chat | Runtime (Optional) |
| `pytest` | `>=8.0.0` | Automated testing framework | Test (Direct) |
| `pytest-asyncio` | `>=0.23.0` | Asynchronous test execution runner for Pytest | Test (Direct) |

### 2.2 Frontend Node.js Environment
- **Node.js Version:** 22.x (Vercel target) / 20.x LTS
- **Package Manager:** `npm` (monorepo workspaces enabled)
- **Core Dependencies (`apps/web/package.json`):**

| Package | Declared Version | Purpose | Tier |
| :--- | :--- | :--- | :--- |
| `next` | `15.1.0` | App Router, Server-Side Rendering, edge optimizations | Runtime (Direct) |
| `react` | `19.0.0` | Component framework and React compiler primitives | Runtime (Direct) |
| `react-dom` | `19.0.0` | DOM rendering layer for React 19 | Runtime (Direct) |
| `tailwindcss` | `^3.4.1` | Utility-first responsive CSS styling | Build (Direct) |
| `lucide-react` | `^0.460.0` | Modern SVG iconography for legal and civic UI | Runtime (Direct) |
| `clsx` | `^2.1.1` | Conditional CSS class constructor | Runtime (Direct) |
| `tailwind-merge` | `^2.5.4` | Conflict-free Tailwind class merger | Runtime (Direct) |
| `typescript` | `^5.6.3` | Type system and static analysis | Build (Dev) |
| `eslint` | `^9.15.0` | Code quality and React hook rule enforcer | Build (Dev) |
| `eslint-config-next` | `15.1.0` | Official Next.js linting configuration | Build (Dev) |

---

## 3. Infrastructure & Service Classification

| Service | Environment | Responsibility | Status |
| :--- | :--- | :--- | :--- |
| **Vercel Serverless Function** | Cloud Deployed | Hosts backend FastAPI instance (`/api/v1/*`) | **Active** |
| **Vercel Edge Network** | Cloud Deployed | Serves static frontend bundles & App Router SSR | **Active** |
| **Supabase Cloud PostgreSQL** | Cloud Hosted | Primary ACID database with pgvector on port 6543 | **Active** |
| **Docker PostgreSQL (pg16)** | Local Stack | Local database with pgvector on port 5432 | **Available** |
| **Docker Neo4j (5.15)** | Local Stack | Dedicated Cypher graph database on port 7687 | **Available** |
| **Docker Redis (7.2)** | Local Stack | In-memory cache on port 6379 | **Available** |
| **Docker MinIO** | Local Stack | S3-compatible local object store on port 9000 | **Available** |
