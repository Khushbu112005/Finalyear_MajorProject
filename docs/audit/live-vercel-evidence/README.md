# CivicSphere AI — Live Vercel Audit Evidence Index

This directory contains the primary black-box audit artifacts, raw network probes, browser automation recordings, full-page screenshots, and evaluation logs captured during the live assessment of CivicSphere AI on Vercel.

**Audit Date**: October 28, 2026  
**Frontend Deployment**: [https://civicsphere-web.vercel.app](https://civicsphere-web.vercel.app)  
**Backend Deployment**: [https://civicsphere-backend.vercel.app](https://civicsphere-backend.vercel.app)  
**Primary API Prefix**: `/api/v1`

---

## 1. Browser Video Recordings (WebP)

These full-session video recordings document the complete end-to-end interactive audit conducted via autonomous browser subagents:

- **`homepage_and_legal_audit_1793176967406.webp`** (5.75 MB)  
  *Covers*: Initial homepage load, navigation header, light/dark mode theme toggling, statutory disclaimer verification, query execution on the Legal Guidance Engine (`/legal`), citation inspection, and unsupported cookie recipe query handling.
- **`modules_e2e_audit_1793177279225.webp`** (11.4 KB)  
  *Covers*: End-to-end inspection of Government Schemes (`/government`), Multi-Agent Chat Assistant (`/agents`), Knowledge Graph Explorer (`/knowledge`), Case Workspace (`/cases`), Document AI (`/documents`), and Admin Control Center (`/admin`).
- **`mobile_responsive_audit_1793177607994.webp`**  
  *Covers*: Mobile responsive testing at 375x812 viewport (iPhone SE/X dimensions), checking horizontal navigation bar overflow, touch targets, and mobile form rendering.

---

## 2. Screenshot Evidence Gallery

| File | Route / View | Description & Audit Observation |
|---|---|---|
| `homepage_view_1793176989717.png` | `/` (Desktop) | Clean initial rendering of CivicSphere AI homepage, statutory notice banner, and hero CTA. |
| `dark_mode_view_1793177013594.png` | `/` (Dark Mode) | Verified dark mode styling, card contrast, and theme toggle responsiveness. |
| `legal_page_view_1793177040971.png` | `/legal` | Empty query state, jurisdiction selection ("IN"), and legal disclaimers. |
| `legal_response_view_1793177153964.png` | `/legal` (Results) | Query results for RTI procedure, displaying "What I Understood" and legal basis cards. |
| `legal_response_scrolled_1793177162783.png` | `/legal` (Citations) | Scrolled view showing statutory basis for Sections 4, 6, and 7 of RTI Act 2005. |
| `unsupported_query_response_1793177218512.png` | `/legal` (Circuit Breaker) | Safe out-of-domain handling for "chocolate chip cookies" query (0 citations). |
| `government_page_1793177294122.png` | `/government` | Initial load showing "Verified Schemes (0)" due to unseeded database table (LIVE-006). |
| `government_results_1793177304220.png` | `/government` (Analyzed) | Problem analyzer output with extracted parameters and 0 matching schemes. |
| `agents_page_1793177344076.png` | `/agents` | Multi-agent interface showing specialist agent roles and boundary-wrapped tools. |
| `agents_answered_1793177371998.png` | `/agents` (Response) | Confirms MockLLM usage: `[MockLLM Response grounded on evidence]` (LIVE-003). |
| `knowledge_page_1793177393085.png` | `/knowledge` | Knowledge Graph Explorer showing indexed official acts and search interface. |
| `knowledge_results_1793177403238.png` | `/knowledge` (Search) | Search results for consumer dispute jurisdiction. |
| `cases_page_1793177425515.png` | `/cases` | Case workspace showing empty state when unauthenticated without redirect (LIVE-008). |
| `cases_modal_1793177450207.png` | `/cases` (Modal) | Case creation dialog with title, description, category, and priority controls. |
| `cases_saved_1793177463603.png` | `/cases` (Persisted) | Authenticated case creation verification showing saved case and details panel. |
| `cases_after_save_1793177479134.png` | `/cases` (Timeline) | Case timeline and status tracking after persistence. |
| `documents_page_1793177494877.png` | `/documents` | Drag-and-drop document upload interface and PDF processing guidelines. |
| `admin_page_1793177514066.png` | `/admin` | Admin Control Center shell rendered publicly to unauthenticated visitors (LIVE-015). |
| `mobile_homepage_375px.png` | `/` (Mobile 375px) | Demonstrates navbar horizontal overflow and absence of mobile hamburger menu (LIVE-012). |
| `mobile_legal_375px.png` | `/legal` (Mobile) | Responsive layout of legal guidance query cards on 375px viewport. |

---

## 3. Data & API Evidence Files

- **`backend_openapi.json`**: Complete OpenAPI 3.1.0 specification extracted directly from `https://civicsphere-backend.vercel.app/openapi.json`. Details all 47 backend endpoints, schemas, tags, and request bodies.
- **`backend_api_probes.json`**: Comprehensive test log of automated probes across all functional modules, recording status codes, execution latencies (ms), response headers, and response payloads.
- **`crawl_results.json`**: Enumeration of all 18 tested frontend routes, their HTTP status codes, document titles, script counts, and 404 detection flags.
- **`legal_rag_eval.json`**: Grounding and evaluation test results for 10 representative legal queries (RTI, Consumer Protection, DPDP, Paraphrased, Ambiguous, Out-of-Domain, Irrelevant, Jailbreak, Nonexistent Statute, Multi-Subject).
- **`security_audit_results.json`**: Non-destructive security review results recording missing HTTP security headers, CORS origin reflection tests, and CSRF token bypass verification.

---

## 4. Test Reproduction Scripts

The following scripts were used to perform reproducible verification without altering application state:

- **`crawl_all_routes.py`**: Automated spider enumerating and capturing HTML and script bundles across all public and administrative frontend routes.
- **`run_backend_probes.py`**: Automated test suite executing safe GET/POST probes against health, legal, government, knowledge, cases, documents, and agent APIs.
- **`run_legal_rag_eval.py`**: Evaluator testing legal retrieval precision, hallucination traps, out-of-domain rejection, and statutory citations.
- **`run_security_audit.py`**: Evaluator checking HTTP security headers, CORS policies, SameSite cookie settings, and server-side CSRF enforcement.
- **`test_register.py`**: Synthetic user registration probe verifying database write capability and password hashing.
- **`test_admin_register.py`**: Verifies that public registration with `role: "ADMIN"` is blocked with HTTP 403.
- **`test_authenticated_workflows.py`**: Tests authenticated session handling, case creation, case deletion, knowledge search, and role-based access control.
- **`test_authenticated_doc_upload.py`**: Tests authenticated multipart PDF upload (`/api/v1/documents/upload`) and document classification (`/api/v1/document-processing/process`).
- **`audit_semantics.py`**: Audits HTML heading hierarchy (`<h1>`-`<h3>`), accessibility landmarks (`<main>`, `<nav>`), and form label bindings.
