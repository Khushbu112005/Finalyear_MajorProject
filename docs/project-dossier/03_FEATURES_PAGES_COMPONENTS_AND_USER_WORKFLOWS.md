# Chapter 03 — Features, Pages, Components and User Workflows

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. Master Page & Route Catalog

The CivicSphere AI web portal contains 28 distinct routes defined under `apps/web/src/app/`, rendering accessible, responsive user interfaces powered by Next.js 15 App Router, React 19, and Tailwind CSS.

| Route | Page File | Access Level | Primary Feature / Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Public | Hero landing page, instant search bar, module launchpad |
| `/login` | `src/app/login/page.tsx` | Public | Citizen/researcher login form with TOTP MFA challenge |
| `/register` | `src/app/register/page.tsx` | Public | Account creation with role selection (Citizen/Researcher) |
| `/dashboard` | `src/app/dashboard/page.tsx` | Authenticated | Central user workspace showing recent queries, cases, and docs |
| `/legal` | `src/app/legal/page.tsx` | Public / Auth | 10-section structured legal guidance grounded on verified acts |
| `/government` | `src/app/government/page.tsx` | Public / Auth | Government scheme search, eligibility evaluation, and steps |
| `/documents` | `src/app/documents/page.tsx` | Authenticated | Document upload, OCR text extraction, and graph linking |
| `/cases` | `src/app/cases/page.tsx` | Authenticated | Citizen case workspace, timeline tracking, and counsel notes |
| `/knowledge` | `src/app/knowledge/page.tsx` | Public / Auth | Statutory acts explorer and interactive knowledge graph |
| `/assistant` | `src/app/assistant/page.tsx` | Public / Auth | Conversational legal AI assistant with source attribution pills |
| `/agents` | `src/app/agents/page.tsx` | Authenticated | Multi-agent collaboration view and sandboxed tool runner |
| `/sources` | `src/app/sources/page.tsx` | Public | Verified statutory acts registry with gazette links |
| `/profile` | `src/app/profile/page.tsx` | Authenticated | Profile management, password reset, and professional details |
| `/settings` | `src/app/settings/page.tsx` | Authenticated | User notification and accessibility preferences |
| `/notifications` | `src/app/notifications/page.tsx` | Authenticated | Case status alerts, scheme deadline notices |
| `/about` | `src/app/about/page.tsx` | Public | Project mission, architecture overview, and academic background |
| `/privacy` | `src/app/privacy/page.tsx` | Public | DPDP Act 2023 compliance disclosure and data policy |
| `/security` | `src/app/security/page.tsx` | Public | Security architecture overview and threat model summary |
| `/admin` | `src/app/admin/page.tsx` | Admin Only | System health dashboard and administrative metrics |
| `/admin/audit` | `src/app/admin/audit/page.tsx` | Admin Only | Tamper-evident system and security audit event log viewer |
| `/admin/evaluation`| `src/app/admin/evaluation/page.tsx`| Admin Only | RAG benchmark metrics, confidence distributions, and runs |
| `/admin/knowledge` | `src/app/admin/knowledge/page.tsx` | Admin Only | Graph entity counts, chunk statistics, and re-indexing |
| `/admin/security` | `src/app/admin/security/page.tsx` | Admin Only | Threat detection telemetry, SSRF blocks, and rate limit logs |
| `/admin/sources` | `src/app/admin/sources/page.tsx` | Admin Only | Administrative source registration and sync trigger |

---

## 2. In-Depth Screen & Workflow Forensic Analysis

### 2.1 Landing Page (`/`)
- **Component:** [`apps/web/src/app/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/page.tsx)
- **Role:** Citizen / Public
- **UI Elements:**
  - Hero header: "Empowering Citizens with Verified Legal & Civic AI"
  - Quick Search bar with direct routing to `/legal?q=...`
  - Trust guarantee badges: "Official Gazette Provenance", "IDOR & Privacy Protected", "Anti-Hallucination Fail-Safes"
  - 6 Module Cards with distinctive color gradients and Lucide icons:
    1. *Legal Guidance Engine (Module A)*
    2. *Government Service Navigator (Module B)*
    3. *Document AI Processing (Module D)*
    4. *Knowledge & Graph Explorer (Module C)*
    5. *Case Management Workspace (Module Cases)*
    6. *Multi-Agent AI Assistant (Phase 6)*
- **Data Flow:**
  `Search Input -> router.push('/legal?q=' + encodeURIComponent(query))`
- **Verification Status:** **RUNTIME-VERIFIED** (Renders HTTP 200 on live Vercel deployment).

---

### 2.2 Legal Guidance Engine (`/legal`)
- **Component:** [`apps/web/src/app/legal/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/legal/page.tsx)
- **Role:** Citizen, Paralegal, Legal Researcher
- **UI Elements:**
  - Query text area with pre-set suggestion pills (e.g. "RTI Appeal Timelines", "Consumer Defect Claims", "DPDP Data Breach Intimation")
  - Jurisdiction dropdown (Default: "National / Central (IN)")
  - "Generate Grounded Guidance" button with animated loading state
  - Results view displaying:
    - Overall confidence score pill (e.g. `98% Confidence (Grounded)`)
    - Out-of-domain rejection alert (when confidence is `0.0`)
    - 10-section tabbed or accordion cards:
      1. *Summary & Legal Issue Overview*
      2. *Applicable Statutory Enactments & Sections*
      3. *Citizen Rights & Entitlements*
      4. *Procedural Roadmap & Steps*
      5. *Strict Statutory Deadlines (Limitation Act)*
      6. *Competent Authorities & Forums*
      7. *Required Documentation & Evidentiary Checklist*
      8. *Penalties & Punitive Provisions*
      9. *Appellate Mechanisms & Second Appeals*
      10. *Precautionary Disclaimers & Counsel Recommendation*
    - Statutory citation pills linking to official India Code handles
- **API Call:** `POST /api/v1/legal/query` via `api.legal.query()`
- **Backend Trace:**
  `apps/web/src/lib/api-client.ts` -> `POST /api/v1/legal/query` -> `backend/app/legal/routes.py::execute_legal_query` -> `LegalGuidanceEngine::process_legal_query` -> `hybrid_retrieval_service.retrieve` -> `EvidencePackBuilder` -> Response.
- **Verification Status:** **RUNTIME-VERIFIED** (Verified with Constitution Art. 21 and RTI Act queries).

---

### 2.3 Government Service Navigator (`/government`)
- **Component:** [`apps/web/src/app/government/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/government/page.tsx)
- **Role:** Citizen, Welfare Beneficiary
- **UI Elements:**
  - Citizen Problem Description input
  - Demographic Context inputs:
    - Age, Annual Household Income, State/UT of residence, Employment status, Category (General, OBC, SC, ST)
  - Scheme Cards displaying eligibility match badges:
    - `ELIGIBLE (100% Match)`, `PARTIALLY ELIGIBLE (Missing Income Certificate)`, `INELIGIBLE`
  - Step-by-step procedural roadmap for application submission
  - Document requirement checklist (e.g. Aadhaar Card, Income Certificate, Domicile Certificate)
- **API Calls:**
  - `POST /api/v1/government/analyze` via `api.government.analyze()`
  - `POST /api/v1/government/check-eligibility` via `api.government.checkEligibility()`
  - `GET /api/v1/government/services` via `api.government.listServices()`
- **Verification Status:** **TEST-VERIFIED** (Passes `backend/tests/api/test_government_api.py`).

---

### 2.4 Intelligent Document Processing (`/documents`)
- **Component:** [`apps/web/src/app/documents/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/documents/page.tsx)
- **Role:** Authenticated Citizen, Counsel
- **UI Elements:**
  - Drag-and-drop PDF upload zone with client-side file size (< 10 MB) and extension (.pdf) checks
  - Optional "Attach to Case" dropdown selector
  - Upload progress bar with 7 processing stage indicators:
    1. *Upload Received*
    2. *Malware & Magic-Byte Scan*
    3. *PyMuPDF OCR Extraction*
    4. *Classification & Legal Domain Detection*
    5. *Entity Extraction (Parties, Dates, Penalties)*
    6. *Knowledge Graph Linkage*
    7. *Analysis Ready*
  - Document preview pane displaying extracted text, detected document type (e.g., "RTI Application", "Legal Notice", "FIR"), and confidence score
- **API Calls:**
  - `POST /api/v1/documents/upload` via `api.documents.upload()` (multipart form-data)
  - `GET /api/v1/documents` via `api.documents.list()`
- **Verification Status:** **TEST-VERIFIED** (Passes `backend/tests/api/test_document_pipeline_api.py`).

---

### 2.5 Citizen Case Workspace (`/cases`)
- **Component:** [`apps/web/src/app/cases/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/cases/page.tsx)
- **Role:** Authenticated Citizen, Assigned Counsel, Admin
- **UI Elements:**
  - "New Case Matter" modal form: Title, Description, Category, Priority, Court Reference, Location, Filing Deadline
  - Case Filter Bar: Status (`ALL`, `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), Search input
  - Detailed Case View:
    - Matter title and court docket number
    - Procedural timeline displaying milestone events
    - Attached evidence documents list
    - Counsel notes pane (editable by assigned legal researcher/counsel)
    - Status transition buttons
- **Security Check:** Row-level IDOR check enforces `citizen_id == current_user.id` or assigned counsel.
- **API Calls:**
  - `GET /api/v1/cases` via `api.cases.list()`
  - `POST /api/v1/cases` via `api.cases.create()`
  - `PUT /api/v1/cases/{case_id}` via `api.cases.update()`
- **Verification Status:** **TEST-VERIFIED** (Passes `backend/tests/api/test_cases_api.py` and `test_idor_and_auth.py`).

---

### 2.6 Knowledge & Graph Explorer (`/knowledge`)
- **Component:** [`apps/web/src/app/knowledge/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/knowledge/page.tsx)
- **Role:** Public / Legal Researcher
- **UI Elements:**
  - Statutory Source browser listing indexed Acts (RTI Act 2005, DPDP Act 2023, Consumer Protection Act 2019)
  - Interactive Entity Neighborhood search input
  - Graph Entity Details card: Canonical Name, Entity Type (`STATUTORY_BODY`, `SECTION`, `RIGHT`, `OBLIGATION`), Attributes, Source IDs
  - Visual relationship pills showing connected nodes (e.g. `Right to Information Act` -> `ESTABLISHES` -> `Central Information Commission`)
- **API Calls:**
  - `GET /api/v1/knowledge/sources` via `api.knowledge.listSources()`
  - `GET /api/v1/knowledge/entities/{entity_id}/relationships` via `api.knowledge.getNeighborhood()`
- **Verification Status:** **RUNTIME-VERIFIED** (Renders 34 hydrated nodes and active relationships).

---

### 2.7 AI Assistant Chat (`/assistant`)
- **Component:** [`apps/web/src/app/assistant/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/assistant/page.tsx)
- **Role:** Citizen / Public
- **UI Elements:**
  - Conversational message thread showing user queries and assistant responses
  - Assistant thinking indicator and evidence assembly status
  - Source Citation Badges under each response linking to official legislation
  - Copy response button and export as case note button
- **API Call:** `POST /api/v1/legal/query` and `POST /api/v1/agents/chat`
- **Verification Status:** **RUNTIME-VERIFIED** (Tested live on Vercel production).

---

### 2.8 Authentication & MFA Modals (`/login`, `/register`)
- **Components:** [`apps/web/src/app/login/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/login/page.tsx) and [`apps/web/src/app/register/page.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/app/register/page.tsx)
- **Role:** Public / Guest
- **UI Elements:**
  - Email and password input fields with client validation
  - Role selection radio buttons (Citizen vs. Legal Researcher)
  - Professional bar council number and experience fields (when Researcher role selected)
  - TOTP MFA Challenge Dialog (appears when `mfa_required: true` returned by backend)
- **Security Mechanics:**
  - Backend sets `access_token` as an httpOnly, Secure cookie
  - Backend sets `csrf_token` as a readable cookie
  - Frontend client automatically attaches `X-CSRF-Token` header on all subsequent mutations
- **API Calls:**
  - `POST /api/v1/auth/login` via `api.auth.login()`
  - `POST /api/v1/auth/register` via `api.auth.register()`
- **Verification Status:** **RUNTIME-VERIFIED** (Synthetic user successfully created and verified on Supabase PostgreSQL).
