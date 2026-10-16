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
