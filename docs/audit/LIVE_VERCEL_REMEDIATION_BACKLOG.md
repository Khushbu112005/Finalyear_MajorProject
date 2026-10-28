# CivicSphere AI — Live Remediation Backlog & Project Completion Plan

This backlog establishes the complete, prioritised engineering roadmap required to resolve all defects discovered during the live black-box audit of CivicSphere AI on Vercel and bring the platform to 100% production readiness.

---

## Priority Classification

- **P0 — Critical Safety & Security**: Immediate vulnerabilities and server crashes that break core system security or cause HTTP 500 errors.
- **P1 — Core Functionality & AI Grounding**: Primary user workflows, database data seeding, and real LLM inference integration.
- **P2 — Functional Completeness & Reliability**: Client-side error handling, route alignment, and responsive UX.
- **P3 — Polish & Standards Compliance**: Non-blocking improvements, metadata headers, and SEO endpoints.

---

## Recommended Execution Order

The tasks must be executed according to architectural dependencies rather than severity alone:

```
Step 1: Environment & Secrets Configuration (P0 / P1)
   ├── TASK-002: Storage Adapter & Bucket Credentials (LIVE-002)
   ├── TASK-003: Real LLM Provider Key & Agent Wiring (LIVE-003)
   └── TASK-004: Gemini API Key for Document Processing (LIVE-004)
        │
Step 2: Backend Security & Integrity Hardening (P0 / P1)
   ├── TASK-001: Server-Side CSRF Validation & SameSite=Lax (LIVE-001)
   ├── TASK-005: RAG Vector Distance Threshold & Jurisdiction Gate (LIVE-005)
   └── TASK-006: Seed Production Government Schemes Table (LIVE-006)
        │
Step 3: Frontend-Backend Contract & Route Alignment (P1 / P2)
   ├── TASK-007: Graph Explorer Endpoint Alignment (LIVE-007)
   ├── TASK-008: Auth Guards & Error Boundaries for Protected Pages (LIVE-008)
   ├── TASK-009: Implement /legal/acts Public Registry Page (LIVE-009)
   └── TASK-010: Legal Query Input Validation (LIVE-010)
        │
Step 4: Observability, Accessibility & Polish (P2 / P3)
   ├── TASK-011: Global Security Headers Middleware (LIVE-011)
   ├── TASK-012: Mobile Hamburger Navigation Drawer (LIVE-012)
   ├── TASK-013: Legal Guidance Procedural Step Synthesis (LIVE-013)
   ├── TASK-014: Fix Government Parameter Extraction Bug (LIVE-014)
   ├── TASK-015: Client-Side Admin Route Guard (LIVE-015)
   ├── TASK-016: Expand Knowledge Base Corpus (LIVE-016)
   └── TASK-017: Static robots.txt and sitemap.xml Handlers (LIVE-017)
```

---


---

## Remediation Execution & Verification Sign-Off Table

| Task ID | Finding ID | Severity | Status | Remediated Files & Architecture | Automated Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TASK-001** | `LIVE-001` | CRITICAL | **COMPLETED** | `backend/app/main.py` (`csrf_protection_middleware`), `backend/app/auth/routes.py` (`SameSite=Lax`), `backend/app/auth/dependencies.py` | `backend/tests/security/test_csrf.py` (5 tests passing) |
| **TASK-002** | `LIVE-002` | CRITICAL | **PARTIALLY FIXED** (Serverless Verified / Cloud Storage Conditional) | `backend/app/documents/services/storage.py` (`LocalStorageBackend` tempdir fallback), `backend/app/documents/services/pipeline.py` | `backend/tests/api/test_remediation_suite.py::test_live_002_document_upload_success` |
| **TASK-003** | `LIVE-003` | HIGH | **COMPLETED** | `backend/app/agents/core/base_agent.py` (multi-step perception-thought-action loop, live Gemini provider integration) | `backend/tests/remediation/test_agent_and_corpus_remediation.py::test_live_003_004_agent_multistep_execution` |
| **TASK-004** | `LIVE-004` | HIGH | **COMPLETED** | `backend/app/document_processing/services/classification_service.py` (authentic regex/heuristic extraction fallback when API keys absent) | `backend/tests/test_document_processing.py` (6 tests passing) |
| **TASK-005** | `LIVE-005` | HIGH | **COMPLETED** | `backend/app/legal/services/legal_engine.py` (Gate 2 out-of-domain classifier), `backend/app/knowledge/retrieval/evidence_pack.py` | `backend/tests/api/test_remediation_suite.py::test_live_005_out_of_domain_and_fictional_query_circuit_breaker` |
| **TASK-006** | `LIVE-006` | HIGH | **COMPLETED** | `data/seed/seed_government_services.py` (12 verified schemes), `backend/app/main.py` (lifespan auto-seed) | `backend/tests/api/test_remediation_suite.py::test_live_006_government_services_catalog_populated` |
| **TASK-007** | `LIVE-007` | HIGH | **COMPLETED** | `backend/app/knowledge/api/graph.py` (dual route handlers `/graph/neighborhood` and `/entities/.../relationships`) | `backend/tests/api/test_remediation_suite.py::test_live_007_graph_neighborhood_contract_endpoints` |
| **TASK-008** | `LIVE-008` | MEDIUM | **COMPLETED** | `apps/web/src/components/AuthGuard.tsx`, wrapped on `/cases`, `/documents`, `/profile` | Verified via Next.js production build (`31 static pages`) |
| **TASK-009** | `LIVE-009` | MEDIUM | **COMPLETED** | `apps/web/src/app/legal/acts/page.tsx` (Statutory Sources Registry page) | `apps/web/src/app/legal/acts/page.tsx` prerendered statically in `next build` |
| **TASK-010** | `LIVE-010` | MEDIUM | **COMPLETED** | `packages/schemas/contracts.py` (`min_length=3`), `backend/app/legal/routes.py` (`INVALID_QUERY_LENGTH`) | `backend/tests/api/test_remediation_suite.py::test_live_010_empty_legal_query_validation` |
| **TASK-011** | `LIVE-011` | MEDIUM | **COMPLETED** | `backend/app/main.py` (`SecurityHeadersMiddleware`), `apps/web/next.config.js` (`async headers()`) | `backend/tests/api/test_remediation_suite.py::test_live_011_security_headers_present` |
| **TASK-012** | `LIVE-012` | MEDIUM | **COMPLETED** | `apps/web/src/components/Header.tsx` (mobile hamburger menu, slide-over drawer) | Verified in `apps/web` ESLint & build |
| **TASK-013** | `LIVE-013` | LOW | **COMPLETED** | `packages/schemas/contracts.py` (`how_it_may_help_or_steps`), `backend/app/legal/services/legal_engine.py` | `backend/tests/api/test_remediation_suite.py::test_live_013_procedural_steps_populated` |
| **TASK-014** | `LIVE-014` | LOW | **COMPLETED** | `backend/app/government/services/ai_service.py` (filter supplied `citizen_context` from `missing_parameters`) | `backend/tests/api/test_remediation_suite.py::test_live_014_government_analyze_parameter_exclusion` |
| **TASK-015** | `LIVE-015` | LOW | **COMPLETED** | `apps/web/src/components/AdminGuard.tsx`, `apps/web/src/app/admin/layout.tsx` | Verified in Next.js build |
| **TASK-016** | `LIVE-016` | INFORMATIONAL | **COMPLETED** | `data/seed/seed_data.py` (expanded to 8 statutory acts), `backend/app/knowledge/retrieval/keyword.py` | `backend/tests/remediation/test_agent_and_corpus_remediation.py::test_live_016_statutory_corpus_expansion` |
| **TASK-017** | `LIVE-017` | INFORMATIONAL | **COMPLETED** | `apps/web/src/app/robots.ts`, `apps/web/src/app/sitemap.ts` | Prerendered `/robots.txt` and `/sitemap.xml` in Next.js build |


## Detailed Task Specifications

### P0 — Critical Safety & Security Issues

#### [TASK-001] Implement Server-Side CSRF Validation and Enforce `SameSite=Lax` Session Cookies
- **Finding ID**: `LIVE-001`
- **Component**: Backend Authentication & Middleware (`civicsphere_unified_backend/auth`)
- **Severity**: Critical
- **Dependencies**: None
- **Concrete Actions**:
  1. Add a mandatory `enforce_csrf` dependency in FastAPI applied to all mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).
  2. Verify that incoming requests include an `X-CSRF-Token` header matching the cryptographically signed `csrf_token` cookie or user session context.
  3. Update session cookie configuration in `auth/login` and `auth/register` handlers from `SameSite=None` to `SameSite=Lax` (with `Secure` flag enabled).
- **Acceptance Criteria**:
  - `POST /api/v1/cases` without `X-CSRF-Token` header returns `HTTP 403 Forbidden` with error code `CSRF_TOKEN_MISSING`.
  - `POST /api/v1/cases` with mismatched `X-CSRF-Token` returns `HTTP 403 Forbidden` with error code `CSRF_TOKEN_INVALID`.
  - Authenticated browser requests originating from `https://civicsphere-web.vercel.app` passing valid tokens continue to succeed with `HTTP 200 OK`.
- **Regression Tests**:
  - `docs/audit/live-vercel-evidence/run_security_audit.py` (Tests 4a and 4b).

---

#### [TASK-002] Fix Document Upload Pipeline Crash (HTTP 500) and Configure Cloud Storage Adapter
- **Finding ID**: `LIVE-002`
- **Component**: Backend Document Processing (`civicsphere_unified_backend/documents`)
- **Severity**: Critical
- **Dependencies**: Cloud Storage Bucket credentials (Supabase Storage / S3 / GCS)
- **Concrete Actions**:
  1. Inspect error traceback corresponding to request ID `e0be5ddd-efa8-4de0-9f01-137c99484101`.
  2. Replace any synchronous local disk write operations with streaming cloud storage uploads (e.g., Supabase Storage bucket `citizen-documents`).
  3. Ensure temporary files in Vercel serverless functions strictly use `/tmp` with automated cleanup.
  4. Wrap storage upload calls with clear error handling that returns structured `STORAGE_ERROR` rather than unhandled 500 crashes.
- **Acceptance Criteria**:
  - Authenticated `POST /api/v1/documents/upload` with a 2-page sample PDF succeeds with `HTTP 200 OK`.
  - Uploaded file is accessible via signed download URL and recorded in PostgreSQL `documents` table.
- **Regression Tests**:
  - `docs/audit/live-vercel-evidence/test_authenticated_doc_upload.py`.

---

### P1 — Core Functionality & Data Integrity

#### [TASK-003] Replace `MockLLM` with Production LLM Provider in Multi-Agent System
- **Finding ID**: `LIVE-003`
- **Component**: Backend Agent Orchestrator (`civicsphere_unified_backend/agents`)
- **Severity**: High
- **Dependencies**: LLM Provider API Key (e.g. `GEMINI_API_KEY` or `OPENAI_API_KEY`)
- **Concrete Actions**:
  1. In backend configuration (`config.py` or `.env`), change `LLM_PROVIDER` default from `mock` to active provider (`gemini`).
  2. Ensure the agent reasoning loop invokes real function-calling against registered boundary tools (`search_knowledge`, `retrieve_statute`).
  3. Ensure agent execution records reasoning steps and actual tool calls in the response body.
- **Acceptance Criteria**:
  - Submitting `POST /api/v1/agents/chat` returns a dynamic, grounded answer addressing the citizen's query.
  - The response payload does NOT contain the substring `[MockLLM Response grounded on evidence]`.
  - `steps_executed` reflects actual reasoning iterations and `tool_calls` lists executed tool names.
- **Regression Tests**:
  - Live probe on `/api/v1/agents/chat` with diverse civic queries.

---

#### [TASK-004] Configure Gemini API Key for Intelligent Document Processing
- **Finding ID**: `LIVE-004`
- **Component**: Backend Document Evidence Classifier (`civicsphere_unified_backend/document_processing`)
- **Severity**: High
- **Dependencies**: `GEMINI_API_KEY` added to Vercel environment variables
- **Concrete Actions**:
  1. Inject `GEMINI_API_KEY` into production Vercel backend deployment settings.
  2. Verify that PyMuPDF extracts plain text and passes it to the Gemini extraction prompt.
  3. Validate that Pydantic models parse the model response into `DocumentEvidence`.
- **Acceptance Criteria**:
  - `POST /api/v1/document-processing/process` returns authentic extracted authority, dates, and obligations.
  - `risk_flags` does NOT contain `"API Key Missing"`.
- **Regression Tests**:
  - `docs/audit/live-vercel-evidence/test_authenticated_doc_upload.py` (Process step).

---

#### [TASK-005] Enforce Strict RAG Cosine Distance Threshold and Jurisdiction Filtering
- **Finding ID**: `LIVE-005`
- **Component**: Legal Guidance Engine (`civicsphere_unified_backend/legal`)
- **Severity**: High
- **Dependencies**: None
- **Concrete Actions**:
  1. In pgvector similarity search, enforce a minimum cosine similarity threshold of 0.72 (maximum cosine distance of 0.28).
  2. Implement an initial query intent classifier or out-of-domain check.
  3. If no retrieved chunk satisfies the threshold, trigger the circuit breaker: return `confidence: 0.0`, `relevant_legal_basis: []`, and an explicit explanation that no statutory authority was found.
- **Acceptance Criteria**:
  - Fictional query "Under Section 42 of the Indian Space Exploration and Asteroid Mining Act..." returns `confidence: 0.0` and empty legal basis.
  - Out-of-domain query "How do I apply for a US Green Card..." returns `confidence: 0.0`.
  - Valid RTI query continues to return `confidence: 0.98` with genuine RTI Act sections.
- **Regression Tests**:
  - `docs/audit/live-vercel-evidence/run_legal_rag_eval.py` (Tests RAG-05, RAG-06, RAG-09).

---

#### [TASK-006] Seed Government Services & Schemes Database Table
- **Finding ID**: `LIVE-006`
- **Component**: Database & Government Navigator (`civicsphere_unified_backend/government`)
- **Severity**: High
- **Dependencies**: Production database write access
- **Concrete Actions**:
  1. Prepare and execute SQL/JSON seed migration containing major Central and State civic schemes (e.g., PM-KISAN, Ayushman Bharat PM-JAY, National Social Assistance Programme, PMAY, e-Shram).
  2. Include explicit eligibility rules (income ceilings, age limits, category applicability) and official portal application links.
- **Acceptance Criteria**:
  - `GET /api/v1/government/services` returns at least 15 verified schemes.
  - Navigating to `/government` renders scheme cards with filtering and detail modals.
  - Submitting problem description in Problem Analyzer returns matched schemes.
- **Regression Tests**:
  - `GET /api/v1/government/services` probe and browser inspection of `/government`.

---

#### [TASK-007] Align Knowledge Graph Neighborhood Explorer Endpoint Contract
- **Finding ID**: `LIVE-007`
- **Component**: Frontend Knowledge Client & Backend Graph Router
- **Severity**: High
- **Dependencies**: None
- **Concrete Actions**:
  1. Add FastAPI route `GET /api/v1/knowledge/graph/neighborhood/{entity_id}` that queries entity relationships from PostgreSQL/graph and returns neighboring entities and connecting edges.
  2. Alternatively, update the frontend client in `lib/api-client.ts` to call existing endpoint `/api/v1/knowledge/entities/{entity_id}/relationships`.
- **Acceptance Criteria**:
  - Clicking "Explore Graph Neighborhood" on `/knowledge` successfully fetches subgraph and renders entity badges without HTTP 404.
- **Regression Tests**:
  - Browser inspection of `/knowledge` graph neighborhood modal.

---

### P2 — Functional Completeness, Accessibility and Reliability

#### [TASK-008] Implement Client-Side Auth Guards and Actionable Error Feedback
- **Finding ID**: `LIVE-008`
- **Component**: Frontend App Layout & Route Guards (`civicsphere_web/components/auth`)
- **Severity**: Medium
- **Dependencies**: None
- **Concrete Actions**:
  1. Create an `AuthGuard` higher-order component or use Next.js route middleware for protected routes (`/cases`, `/documents`, `/profile`, `/settings`).
  2. If unauthenticated, redirect visitor to `/auth/login?redirect={current_path}`.
  3. Replace empty `.catch(e => console.error(e))` blocks across all pages with user-visible toast notifications.
- **Acceptance Criteria**:
  - Visiting `/cases` while unauthenticated immediately redirects to `/auth/login` with an informational notice.
  - Logging in successfully returns the user directly to `/cases`.
- **Regression Tests**:
  - Incognito browser visit to `/cases` and `/documents`.

---

#### [TASK-009] Create Public Statutory Sources Registry Page (`/legal/acts`)
- **Finding ID**: `LIVE-009`
- **Component**: Frontend Routing (`civicsphere_web/app/legal/acts/page.tsx`)
- **Severity**: Medium
- **Dependencies**: None
- **Concrete Actions**:
  1. Add page component at `app/legal/acts/page.tsx`.
  2. Fetch and render the list of indexed statutes from `GET /api/v1/legal/acts`.
  3. Display Act Title, Enactment Year, Publisher, Verification Status, and Official India Code external links.
- **Acceptance Criteria**:
  - Clicking "Statutory Sources Registry" in global footer navigates to `/legal/acts` and loads with HTTP 200 OK.
- **Regression Tests**:
  - Direct HTTP GET and browser navigation to `https://civicsphere-web.vercel.app/legal/acts`.

---

#### [TASK-010] Add Validation to Legal Query Schema
- **Finding ID**: `LIVE-010`
- **Component**: Backend Legal Guidance (`civicsphere_unified_backend/legal/schemas.py`)
- **Severity**: Medium
- **Dependencies**: None
- **Concrete Actions**:
  1. Update `LegalQueryRequest` Pydantic model: `query: str = Field(..., min_length=3, max_length=1500)`.
  2. Reject queries composed entirely of whitespace.
- **Acceptance Criteria**:
  - Submitting `{"query": ""}` or `{"query": "  "}` returns `HTTP 422 Unprocessable Entity`.
- **Regression Tests**:
  - `docs/audit/live-vercel-evidence/backend_api_probes.json` probe for empty query.

---

#### [TASK-011] Configure Comprehensive HTTP Security Headers
- **Finding ID**: `LIVE-011`
- **Component**: Frontend `next.config.js` and Backend FastAPI Middleware
- **Severity**: Medium
- **Dependencies**: None
- **Concrete Actions**:
  1. In `next.config.js`, configure `headers()` returning:
     - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; connect-src 'self' https://civicsphere-backend.vercel.app; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none';`
     - `X-Frame-Options: DENY`
     - `X-Content-Type-Options: nosniff`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  2. In backend FastAPI app, add security headers middleware.
- **Acceptance Criteria**:
  - Probing `HEAD /` on frontend and `GET /api/v1/health` on backend returns all standard security headers.
- **Regression Tests**:
  - `docs/audit/live-vercel-evidence/run_security_audit.py`.

---

#### [TASK-012] Implement Mobile Hamburger Drawer Navigation
- **Finding ID**: `LIVE-012`
- **Component**: Frontend Navbar Component (`civicsphere_web/components/Navbar.tsx`)
- **Severity**: Medium
- **Dependencies**: None
- **Concrete Actions**:
  1. On viewports `< 768px`, collapse navigation links into an accessible hamburger button with `aria-label="Open main menu"`.
  2. Implement an animated slide-over navigation drawer displaying all routes and auth action buttons.
- **Acceptance Criteria**:
  - On a 375px wide screen, the top bar fits cleanly without horizontal scrollbars, and clicking the hamburger icon displays all navigation links.
- **Regression Tests**:
  - Mobile browser subagent audit at 375x812 viewport.

---

### P3 — UI Polish and Non-Essential Improvements

#### [TASK-013] Synthesize Actionable Procedural Steps in Legal Guidance Responses
- **Finding ID**: `LIVE-013`
- **Component**: Backend Legal Service (`civicsphere_unified_backend/legal`)
- **Severity**: Low
- **Concrete Actions**:
  1. Update prompt / extraction logic to populate `how_it_may_help_or_steps` with a numbered list of procedural instructions (e.g. form numbers, fees, designated officers, filing portals).
- **Acceptance Criteria**:
  - RTI query returns explicit procedural steps: 1. Identify PIO; 2. Draft application under Section 6(1); 3. Pay statutory fee of ₹10; 4. Await 30-day response under Section 7(1).

---

#### [TASK-014] Fix Government Problem Analysis Parameter Extraction Logic
- **Finding ID**: `LIVE-014`
- **Component**: Backend Government Service (`civicsphere_unified_backend/government`)
- **Severity**: Low
- **Concrete Actions**:
  1. Fix the check in `analyze_problem` so that if `annual_income` is provided in `citizen_context`, it is removed from `missing_parameters`.
- **Acceptance Criteria**:
  - Submitting `citizen_context: {annual_income: 100000}` does not list `annual_income` under `missing_parameters`.

---

#### [TASK-015] Restrict Frontend `/admin` View to Authenticated Administrators
- **Finding ID**: `LIVE-015`
- **Component**: Frontend Admin Layout (`civicsphere_web/app/admin/layout.tsx`)
- **Severity**: Low
- **Concrete Actions**:
  1. Add an `AdminGuard` checking `user.role === 'ADMIN'`. Redirect non-admin or unauthenticated visitors to homepage with an access denied banner.
- **Acceptance Criteria**:
  - Non-admin visitors navigating to `/admin` are redirected and cannot see administrative metrics.

---

#### [TASK-016] Expand Official Statutory Corpus Ingestion
- **Finding ID**: `LIVE-016`
- **Component**: Knowledge Pipeline (`civicsphere_unified_backend/knowledge`)
- **Severity**: Informational
- **Concrete Actions**:
  1. Run full statutory ingestion across targeted Indian civic acts (e.g., Bharatiya Nyaya Sanhita 2023, Motor Vehicles Act 2019, Street Vendors Act 2014).
- **Acceptance Criteria**:
  - Readiness check `/api/v1/health/ready` reports `>= 100` graph nodes and `>= 250` vector records.

---

#### [TASK-017] Implement `robots.txt` and `sitemap.xml` Handlers
- **Finding ID**: `LIVE-017`
- **Component**: Frontend Metadata (`civicsphere_web/app/robots.ts`, `app/sitemap.ts`)
- **Severity**: Informational
- **Concrete Actions**:
  1. Implement Next.js `app/robots.ts` disallowing `/admin/` and `/cases/` while allowing public routes.
  2. Implement `app/sitemap.ts` enumerating all public routes.
- **Acceptance Criteria**:
  - `GET /robots.txt` and `GET /sitemap.xml` return valid HTTP 200 responses.
