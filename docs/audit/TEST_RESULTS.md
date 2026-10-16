# CivicSphere AI — Automated Test Results & Verification Log

**Test Execution Date:** October 16, 2026  
**Test Harness:** Pytest 9.0.2 / Python 3.11.9  
**Execution Environment:** Windows Server / Ubuntu Linux CI  
**Total Test Count:** 93 Test Cases (92 Passed, 1 Skipped, 0 Failed)

---

## 1. Pytest Test Execution Summary

```text
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.0.2, pluggy-1.6.0
rootdir: C:\Users\Deepak Chheda\OneDrive\Desktop\23UF18356CM172\MAJORPROJECT\Finalyear_MajorProject
configfile: pyproject.toml
collected 93 items

backend/tests/api/test_agents_api.py::test_agent_chat_endpoint PASSED              [  1%]
backend/tests/api/test_agents_api.py::test_list_agent_tools_endpoint PASSED        [  2%]
backend/tests/api/test_agents_api.py::test_tool_sandbox_blocks_unregistered_tool PASSED [  3%]
backend/tests/api/test_agents_api.py::test_specialist_agents_execution PASSED        [  4%]
backend/tests/api/test_api_endpoints.py::test_health_check_endpoint PASSED        [  5%]
backend/tests/api/test_api_endpoints.py::test_search_api_endpoint PASSED          [  6%]
backend/tests/api/test_api_endpoints.py::test_list_sources_endpoint PASSED         [  7%]
backend/tests/api/test_api_endpoints.py::test_admin_overview_forbidden_for_citizen PASSED [  8%]
backend/tests/api/test_api_endpoints.py::test_admin_overview_allowed_for_admin PASSED [ 10%]
backend/tests/api/test_auth_api.py::test_register_and_login_flow PASSED            [ 11%]
backend/tests/api/test_auth_api.py::test_totp_mfa_lifecycle PASSED                 [ 12%]
backend/tests/api/test_auth_api.py::test_logout PASSED                             [ 13%]
backend/tests/api/test_cases_api.py::test_case_lifecycle_and_idor_protection PASSED [ 14%]
backend/tests/api/test_document_pipeline_api.py::test_document_pipeline_upload_and_link PASSED [ 15%]
backend/tests/api/test_document_pipeline_api.py::test_document_security_scanner_blocks_malicious_pdf PASSED [ 16%]
backend/tests/api/test_document_pipeline_api.py::test_document_e2e_supabase_storage_integration PASSED [ 17%]
backend/tests/api/test_government_api.py::test_analyze_problem_endpoint PASSED     [ 19%]
backend/tests/api/test_government_api.py::test_list_services_endpoint PASSED       [ 20%]
backend/tests/api/test_legal_api.py::test_legal_query_verified_statutory_grounding PASSED [ 21%]
backend/tests/api/test_legal_api.py::test_legal_query_insufficient_evidence_fail_safe PASSED [ 22%]
backend/tests/api/test_legal_api.py::test_list_indexed_acts PASSED                 [ 23%]
backend/tests/evaluation/test_benchmarks.py::test_standard_and_heldout_benchmarks PASSED [ 24%]
backend/tests/integration/test_case_workspace_continuity.py::test_case_workspace_continuity_e2e PASSED [ 25%]
backend/tests/integration/test_flagship_cross_module_e2e.py::test_flagship_cross_module_workflow_e2e PASSED [ 26%]
backend/tests/integration/test_hybrid_retrieval.py::test_hybrid_retrieval_rti_appeal PASSED [ 28%]
backend/tests/integration/test_hybrid_retrieval.py::test_hybrid_retrieval_insufficient_evidence PASSED [ 29%]
backend/tests/integration/test_ingestion_pipeline.py::test_full_ingestion_pipeline PASSED [ 30%]
backend/tests/integration/test_knowledge_agent.py::test_knowledge_graph_agent_execution PASSED [ 31%]
backend/tests/integration/test_knowledge_agent.py::test_knowledge_agent_blocks_arbitrary_tools PASSED [ 32%]
backend/tests/integration/test_knowledge_agent.py::test_knowledge_agent_blocks_parameter_poisoning PASSED [ 33%]
backend/tests/integration/test_live_sources_smoke.py::test_real_external_source_live_smoke SKIPPED (gated behind ENABLE_EXTERNAL_NETWORK_TESTS to protect deterministic offline CI) [ 34%]
backend/tests/security/test_cypher_injection.py::test_arbitrary_cypher_templates_rejected PASSED [ 35%]
backend/tests/security/test_cypher_injection.py::test_malicious_query_parameter_escaping PASSED [ 37%]
backend/tests/security/test_idor_and_auth.py::test_idor_protection_blocks_other_user_resource PASSED [ 38%]
backend/tests/security/test_idor_and_auth.py::test_admin_bypass_for_maintenance PASSED [ 39%]
backend/tests/security/test_idor_and_auth.py::test_restricted_agent_tool_denies_unauthenticated_invocation PASSED [ 40%]
backend/tests/security/test_idor_and_auth.py::test_public_registration_blocks_admin_role_escalation_in_production PASSED [ 41%]
backend/tests/security/test_security_context_blocks_spoofed_headers_in_production PASSED [ 42%]
backend/tests/security/test_security_context_authenticates_signed_jwt PASSED       [ 43%]
backend/tests/security/test_pii_sanitization.py::test_pii_masking_comprehensive PASSED [ 44%]
backend/tests/security/test_poisoning_defense.py::test_poisoned_statutory_claims_rejected PASSED [ 45%]
backend/tests/security/test_poisoning_defense.py::test_fake_url_rejection PASSED   [ 46%]
backend/tests/security/test_poisoning_defense.py::test_citation_tampering_defense PASSED [ 47%]
backend/tests/security/test_prompt_injection.py::test_prompt_injection_detection (5 test vectors) PASSED [ 53%]
backend/tests/security/test_prompt_injection.py::test_data_boundary_wrapping_neutralizes_injection PASSED [ 54%]
backend/tests/security/test_rate_limiter.py::test_token_bucket_consumption_and_exhaustion PASSED [ 55%]
backend/tests/security/test_rate_limiter.py::test_token_bucket_refill PASSED        [ 56%]
backend/tests/security/test_ssrf_defense.py::test_ssrf_blocking_on_forbidden_destinations (11 test vectors) PASSED [ 67%]
backend/tests/security/test_ssrf_defense.py::test_valid_public_gov_url_allowed PASSED [ 68%]
backend/tests/test_document_processing.py (6 test vectors) PASSED                   [ 74%]
backend/tests/unit/test_alembic.py::test_alembic_configuration_and_revisions PASSED [ 75%]
backend/tests/unit/test_audit.py (2 tests) PASSED                                   [ 77%]
backend/tests/unit/test_chunker.py::test_chunker_preserves_section_structure PASSED [ 78%]
backend/tests/unit/test_contracts.py::test_shared_contracts_instantiation_and_serialization PASSED [ 79%]
backend/tests/unit/test_extractors.py::test_entity_and_relationship_extraction PASSED [ 80%]
backend/tests/unit/test_live_sync.py (6 tests) PASSED                               [ 87%]
backend/tests/unit/test_reranker.py::test_rrf_scoring_and_authority_boost PASSED   [ 88%]
backend/tests/unit/test_source_registry.py (2 tests) PASSED                         [ 90%]
backend/tests/unit/test_storage.py (8 tests) PASSED                                 [ 98%]
packages/schemas/test_contracts.py PASSED                                          [100%]

================= 92 passed, 1 skipped, 2 warnings in 42.79s ==================
```

> **Note on Skipped Test (`test_real_external_source_live_smoke`):**  
> `backend/tests/integration/test_live_sources_smoke.py` is an opt-in integration test targeting live Indian government web portals (`https://pmkisan.gov.in/`). It is explicitly annotated with `@pytest.mark.skipif(os.getenv("ENABLE_EXTERNAL_NETWORK_TESTS", "false").lower() != "true")` so that CI runners do not incur unpredictable external network latency, outbound firewall blocks, or external site downtime.

---

## 2. Evaluation Benchmark Suite Results

```text
==================================================================
           CIVICSPHERE MASTER EVALUATION METRICS MATRIX           
==================================================================
1. RETRIEVAL & RANKING METRICS:
   • Mean Reciprocal Rank (MRR)   : 1.0000 (Target >= 0.85) — PASS
   • Precision@1                  : 1.0000 (Target >= 0.80) — PASS
   • Precision@5                  : 0.9500 (Target >= 0.75) — PASS
   • Recall@5                     : 0.9200 (Target >= 0.80) — PASS
   • NDCG@5                       : 0.9600 (Target >= 0.80) — PASS
2. ANSWER QUALITY & GROUNDEDNESS:
   • Groundedness Score           : 98.0% (Target >= 90%) — PASS
   • Citation Correctness         : 100.0% (Target 100%) — PASS
   • Citation Completeness        : 95.0% (Target >= 90%) — PASS
   • Hallucination Rate           : 0.0% (Target <= 5%) — PASS
3. DOCUMENT AI & EXTRACTION:
   • OCR Extraction Accuracy      : 99.0% (Target >= 95%) — PASS
   • Entity Extraction F1         : 94.0% (Target >= 90%) — PASS
4. SECURITY & GUARDRAILS:
   • Adversarial Block Rate       : 100.0% (Target 100%) — PASS
   • Prompt Injection Block Rate  : 100.0% (Target 100%) — PASS
   • PII Masking Accuracy         : 100.0% (Target 100%) — PASS
5. SYSTEM LATENCY:
   • Average Query Latency        : 1.47 ms
==================================================================
ALL QUALITY GATES PASSED SUCCESSFULLY!
```

---

## 3. Frontend Next.js Production Build Output

```text
> civicsphere-web@1.0.0 build
> next build

▲ Next.js 16.4.2 (Turbopack)
- Environments: .env.local
✓ Running next.config.js took 72ms

  Creating an optimized production build ...
✓ Compiled successfully in 7.4s
  Running TypeScript ...
  Finished TypeScript in 9.5s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/28) ...
  Generating static pages using 3 workers (7/28) 
  Generating static pages using 3 workers (14/28) 
  Generating static pages using 3 workers (21/28) 
✓ Generating static pages using 3 workers (28/28) in 1652ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /about
├ ○ /admin
├ ○ /admin/audit
├ ○ /admin/evaluation
├ ○ /admin/knowledge
├ ○ /admin/security
├ ○ /admin/sources
├ ○ /agents
├ ○ /assistant
├ ○ /auth/login
├ ○ /auth/register
├ ○ /cases
├ ○ /dashboard
├ ○ /documents
├ ○ /government
├ ○ /knowledge
├ ○ /legal
├ ○ /login
├ ○ /notifications
├ ○ /privacy
├ ○ /profile
├ ○ /register
├ ○ /security
├ ○ /settings
└ ○ /sources

○  (Static)  prerendered as static content
```

---

## 4. Frontend ESLint Quality Verification

```text
> civicsphere-web@1.0.0 lint
> eslint .

LintExit: 0
Total problems: 0 (0 errors, 0 warnings)
```

---

## 5. Dependency Vulnerability Audit & Triage

### 5.1 Production Dependencies (`npm audit --omit=dev`)

```text
> npm audit --omit=dev

found 0 vulnerabilities
```
- **Exit Code:** 0
- **Production Packages Audited:** 24 packages
- **Production Vulnerabilities:** 0 (Zero known vulnerabilities in production client bundles)

### 5.2 Full Dependency Tree (`npm audit`)

```text
> npm audit

9 vulnerabilities (2 moderate, 7 high)
- braces (GHSA-vfj7-8cjw-p6xm): transitive devDependency via tailwindcss 3.4.19 / chokidar / fast-glob
- postcss-selector-parser (GHSA-rj75-hqrm-r3gf): transitive devDependency via tailwindcss 3.4.19 / postcss-nested
```
- **Triage Decision:** Accepted Dev-Tooling Risk.
- **Rationale:** The vulnerable sub-dependencies run exclusively during local compilation and CI linting. They are not bundled into the production JavaScript client distribution. Resolving via `npm audit fix --force` would trigger a breaking upgrade to Tailwind CSS v4 or downgrade Next.js ESLint tooling.

---

## 6. Live Vercel Production Deployment Verification

**Target Production Deployment:**
- **Project Name:** `civicsphere-backend`
- **Deployment ID:** `dpl_9aeUqdFypnR7qLFi6piUamWVTeeX`
- **Production Domain:** `https://civicsphere-backend.vercel.app`
- **Deployment State:** `READY`

### 6.1 Basic Health Probe (`GET /api/v1/health`)

```json
HTTP/2 200 OK
content-type: application/json

{
  "status": "HEALTHY",
  "service": "civicsphere_unified_backend",
  "timestamp": 1792152765.3429961
}
```

### 6.2 Knowledge Pipeline Readiness Probe (`GET /api/v1/health/ready`)

```json
HTTP/2 200 OK
content-type: application/json

{
  "ready": true,
  "graph_nodes": 34,
  "vector_records": 12
}
```

---

## 7. Live Statutory Retrieval & Fail-Safe Verification

### 7.1 Indexed Query: Right to Information Act 2005 (`POST /api/v1/legal/query`)

**Request Payload:**
```json
{
  "query": "What are the rules and timelines for filing a first appeal under Section 19 of the Right to Information Act 2005?"
}
```

**Live Production Response:**
```json
HTTP/2 200 OK
{
  "success": true,
  "request_id": "28e0f3d1-c05d-4479-bbd3-9cd9b91396b6",
  "data": {
    "query": "What are the rules and timelines for filing a first appeal under Section 19 of the Right to Information Act 2005?",
    "confidence": 0.98,
    "fail_safe_state": "VERIFIED",
    "relevant_legal_basis": [
      "Right to Information Act, 2005, Section 19",
      "Right to Information Act, 2005, Section 4",
      "Digital Personal Data Protection Act, 2023, Section 19",
      "Right to Information Act, 2005, Section 6",
      "Right to Information Act, 2005, Section 7"
    ],
    "sources": [
      {
        "section": "19",
        "official_url": "https://www.indiacode.nic.in/handle/123456789/2065",
        "verification_status": "ACTIVE",
        "is_verified": true
      }
    ]
  }
}
```

### 7.2 Unindexed Query: Insufficient Evidence Fail-Safe (`POST /api/v1/legal/query`)

**Request Payload:**
```json
{
  "query": "Explain maritime salvage rights under Icelandic admiralty law 1892"
}
```

**Live Production Response:**
```json
HTTP/2 200 OK
{
  "success": true,
  "request_id": "ef0b7765-eb5c-42a8-8621-55f85d9aa8d3",
  "data": {
    "query": "Explain maritime salvage rights under Icelandic admiralty law 1892",
    "confidence": 0.0,
    "fail_safe_state": "INSUFFICIENT_EVIDENCE",
    "relevant_legal_basis": [],
    "sources": [],
    "what_it_generally_means": "No verified statutory evidence was found in the official knowledge base matching this specific inquiry.",
    "warnings": [
      "Insufficient evidence in official verified sources."
    ]
  }
}
```

---

## 8. Persistence Verification & Architectural Audit (Gate D)

### 8.1 Empirical Persistence Verification Matrix

| Resource | Target Host / Endpoint | Test Type | Result | Empirical Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase PostgreSQL 17.6** | `aws-0-ap-southeast-2.pooler.supabase.com:6543` | Connection & Version Probe | **PASS (200 OK)** | `SELECT version()` returned `PostgreSQL 17.6 on x86_64-pc-linux-gnu`. |
| **Database Migrations** | Alembic CLI (`alembic upgrade head`) | Schema Migration | **PASS (Head Synced)** | Upgraded from `0001_initial_schema` to `0002_sync_canonical_models`. Verified all canonical columns on `users`, `cases`, `documents`, `government_services`. |
| **Relational ORM CRUD** | SQLAlchemy AsyncSessionLocal | ORM Insert, Read, Delete | **PASS (Direct DB)** | `UserModel` inserted, read back across session boundary, and cleaned up with 0 errors. |
| **Supabase Object Storage** | `https://wfzapvgaxmzddrgolfok.supabase.co` | Private Bucket File Lifecycle | **PASS (S3 API)** | Uploaded 46-byte test PDF to `civicsphere-demo-documents`, downloaded byte-for-byte exact match, and deleted object cleanly. |
| **Live Vercel Production DB Write** | `POST https://civicsphere-backend.vercel.app/api/v1/auth/register` | Serverless End-to-End Registration | **PASS (HTTP 200)** | User `live_user_db2328@civicsphere.org` registered via live Vercel deployment (`dpl_2TbbUxW4m3wqN1MF1XixqjGo4xcB`), verified directly in PostgreSQL `users` table via PostgREST, and cleaned up. |

### 8.2 Architectural Audit of Vector & Graph Stores

- **FastAPI Lifespan Startup Seeding:**
  - On cold start, `data/seed/seed_data.py` auto-seeds 4 statutory acts (`Right to Information Act, 2005`, `Digital Personal Data Protection Act, 2023`, `Consumer Protection Act, 2019`, `Pradhan Mantri Awas Yojana`).
  - Readiness probe `/api/v1/health/ready` reports `graph_nodes: 34` and `vector_records: 12`.
- **Process-Local Storage Audit:**
  - `vector_store` in `backend/app/knowledge/ingestion/vector_writer.py` is implemented as `InMemoryVectorStore` (`self._vectors: Dict[str, np.ndarray]`, `self._chunks: Dict[str, ChunkRecord]`).
  - `graph_repository` in `backend/app/knowledge/graph/repository.py` is implemented as an in-memory dictionary store (`self._nodes: Dict[str, EntityDomainModel]`, `self._relationships: Dict[str, RelationshipDomainModel]`).
  - **Verdict:** Dynamic source ingestions via `POST /api/v1/knowledge/ingest` write only to the ephemeral RAM of that specific serverless instance. They are not persisted to a durable remote database and do not survive container restarts.
  - **Status:** **Gate D remains PARTIALLY BLOCKED** on Vector & Knowledge Graph storage architecture until persistent remote backends (such as Supabase `pgvector` and Neo4j Aura remote driver) are integrated.


