# CivicSphere AI — Complete Route & API Inventory

**Scope:** All Frontend Pages & Backend API Endpoints  
**Total Frontend Routes:** 29 Statically Generated / SSR  
**Total Backend API Endpoints:** 23 Handlers Registered under `/api/v1` and `/health`

---

## 1. Backend API Endpoint Inventory

| HTTP Method | Path | Purpose | Minimum Role | Auth Requirement | DB & Storage Dependencies | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Core system liveness and dependency status | Public | None | None | VERIFIED (`test_health_check_endpoint`) |
| `POST` | `/api/v1/auth/register` | Register citizen/researcher account | Public | None (Privilege escalation blocked) | PostgreSQL `users` table | VERIFIED (`test_register_and_login_flow`) |
| `POST` | `/api/v1/auth/login` | Authenticate user, issue JWT & CSRF cookies | Public | None | PostgreSQL `users` table | VERIFIED (`test_register_and_login_flow`) |
| `POST` | `/api/v1/auth/logout` | Revoke session cookies | Authenticated | Cookie / Bearer | None | VERIFIED (`test_logout`) |
| `GET` | `/api/v1/auth/me` | Fetch active user profile and permissions | Authenticated | Cookie / Bearer | PostgreSQL `users` table | VERIFIED (`test_register_and_login_flow`) |
| `POST` | `/api/v1/auth/mfa/setup` | Generate TOTP secret and QR provisioning URI | Authenticated | Cookie / Bearer | PostgreSQL `users` table | VERIFIED (`test_totp_mfa_lifecycle`) |
| `POST` | `/api/v1/auth/mfa/verify` | Verify 6-digit TOTP code and enable MFA | Authenticated | Cookie / Bearer | PostgreSQL `users` table | VERIFIED (`test_totp_mfa_lifecycle`) |
| `POST` | `/api/v1/auth/mfa/disable` | Disable MFA using current password + token | Authenticated | Cookie / Bearer | PostgreSQL `users` table | VERIFIED (`test_totp_mfa_lifecycle`) |
| `PUT` | `/api/v1/auth/profile` | Update user details, bio, or change password | Authenticated | Cookie / Bearer | PostgreSQL `users` table | VERIFIED (`test_register_and_login_flow`) |
| `POST` | `/api/v1/knowledge/search` | Hybrid vector + lexical statutory retrieval | Citizen | JWT / Verified Context | PostgreSQL pgvector / in-memory | VERIFIED (`test_search_api_endpoint`) |
| `GET` | `/api/v1/knowledge/sources` | List verified legal acts and sources | Citizen | JWT / Verified Context | PostgreSQL `sources` table | VERIFIED (`test_list_sources_endpoint`) |
| `GET` | `/api/v1/knowledge/admin/overview` | Admin metrics: source counts, graph size | Admin | JWT / Role: Admin | Neo4j + PostgreSQL | VERIFIED (`test_admin_overview_allowed_for_admin`) |
| `POST` | `/api/v1/knowledge/admin/sync` | Trigger incremental sync on registered sources | Admin | JWT / Role: Admin | Source Registry + Pipeline | VERIFIED (`test_admin_refresh_endpoint_rbac`) |
| `GET` | `/api/v1/knowledge/graph/entity/{id}` | Retrieve graph node and incident relationships | Citizen | JWT / Verified Context | Neo4j Aura Graph Engine | VERIFIED (`test_knowledge_graph_agent_execution`) |
| `POST` | `/api/v1/knowledge/graph/traverse` | Multi-hop statutory graph traversal | Citizen | JWT / Verified Context | Neo4j Aura Graph Engine | VERIFIED (`test_knowledge_graph_agent_execution`) |
| `POST` | `/api/v1/agents/chat` | AI Agent dialogue with verified citations | Citizen | JWT / Verified Context | LLM Provider + Retrieval | VERIFIED (`test_agent_chat_endpoint`) |
| `GET` | `/api/v1/agents/tools` | List sandboxed tools available to agents | Citizen | JWT / Verified Context | Tool Registry | VERIFIED (`test_list_agent_tools_endpoint`) |
| `POST` | `/api/v1/government/problem-analyze` | Analyze citizen issue and match gov schemes | Citizen | JWT / Verified Context | Scheme Rules Database | VERIFIED (`test_analyze_problem_endpoint`) |
| `GET` | `/api/v1/government/services` | Query available state & federal public services | Citizen | JWT / Verified Context | Service Registry | VERIFIED (`test_list_services_endpoint`) |
| `POST` | `/api/v1/documents/upload` | Multi-part document upload with magic byte check | Citizen | JWT / Verified Context | Supabase Storage / Local | VERIFIED (`test_document_pipeline_upload_and_link`) |
| `GET` | `/api/v1/cases/` | List citizen legal cases and track progress | Citizen | JWT / IDOR Enforced | PostgreSQL `cases` table | VERIFIED (`test_case_lifecycle_and_idor_protection`) |
| `POST` | `/api/v1/cases/` | Create a new structured legal case | Citizen | JWT / Verified Context | PostgreSQL `cases` table | VERIFIED (`test_case_lifecycle_and_idor_protection`) |
| `GET` | `/api/v1/cases/{case_id}` | Fetch detailed case workspace and linked files | Citizen (Owner) | JWT / IDOR Enforced | PostgreSQL `cases` table | VERIFIED (`test_case_lifecycle_and_idor_protection`) |

---

## 2. Frontend Page & Route Inventory

| Route Path | Type | Protected | Target Audience | Primary Functionality |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Static | No | Public / Citizens | Platform hero landing, search bar, flagship module tiles |
| `/about` | Static | No | Public | Architecture overview, verified sources policy, mission |
| `/login` & `/auth/login` | Static | No | Unauthenticated | User login form with credentials and optional MFA token |
| `/register` & `/auth/register` | Static | No | Unauthenticated | Account registration form for citizens and researchers |
| `/dashboard` | Client | Yes | Authenticated Users | Personalized civic dashboard, active cases, recent searches |
| `/legal` | Client | Yes | Citizens / Lawyers | Statutory search engine with verified act citations |
| `/government` | Client | Yes | Citizens | Government scheme eligibility calculator and service portal |
| `/documents` | Client | Yes | Authenticated Users | PDF document upload, OCR parsing, and case linking |
| `/cases` | Client | Yes | Authenticated Users | Case management workspace, timeline, and document storage |
| `/knowledge` | Client | Yes | Citizens / Researchers | Interactive knowledge base browser and source explorer |
| `/sources` | Client | Yes | Citizens / Researchers | Registry of verified Acts (RTI, DPDP, CPA) and sync dates |
| `/assistant` & `/agents` | Client | Yes | Citizens | Multi-turn conversational AI with evidence pack references |
| `/profile` | Client | Yes | Authenticated Users | Account settings, contact info, security & MFA setup |
| `/settings` | Client | Yes | Authenticated Users | Notification preferences, theme settings, privacy options |
| `/notifications` | Client | Yes | Authenticated Users | Case updates, scheme announcements, document alerts |
| `/privacy` | Static | No | Public | Platform privacy statement and data protection disclosures |
| `/security` | Static | No | Public | Vulnerability reporting, encryption details, threat posture |
| `/admin` | Client | Yes (Admin) | Platform Administrators | High-level system statistics, worker health, database state |
| `/admin/sources` | Client | Yes (Admin) | Platform Administrators | Manage source URLs, trigger indexing, inspect freshness |
| `/admin/audit` | Client | Yes (Admin) | Platform Administrators | Tamper-evident audit log stream and event search |
| `/admin/evaluation` | Client | Yes (Admin) | Platform Administrators | Retrieval metrics (MRR, NDCG, Groundedness benchmarks) |
| `/admin/knowledge` | Client | Yes (Admin) | Platform Administrators | Knowledge graph topology and vector collection controls |
| `/admin/security` | Client | Yes (Admin) | Platform Administrators | Rate limit monitor, prompt injection blocks, SSRF audits |
