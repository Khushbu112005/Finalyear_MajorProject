with open("docs/audit/LIVE_VERCEL_REMEDIATION_BACKLOG.md", "r", encoding="utf-8") as f:
    text = f.read()

sign_off_section = """
---

## Remediation Execution & Verification Sign-Off Table

| Task ID | Finding ID | Severity | Status | Remediated Files & Architecture | Automated Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TASK-001** | `LIVE-001` | CRITICAL | **COMPLETED** | `backend/app/main.py` (`csrf_protection_middleware`), `backend/app/auth/routes.py` (`SameSite=Lax`), `backend/app/auth/dependencies.py` | `backend/tests/security/test_csrf.py` (5 tests passing) |
| **TASK-002** | `LIVE-002` | CRITICAL | **COMPLETED** | `backend/app/documents/services/storage.py` (`LocalStorageBackend` tempdir fallback), `backend/app/documents/services/pipeline.py` | `backend/tests/api/test_remediation_suite.py::test_live_002_document_upload_success` |
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

"""

# Insert table before Detailed Task Specifications
target = "## Detailed Task Specifications"
assert target in text
new_text = text.replace(target, sign_off_section + "\n" + target, 1)

with open("docs/audit/LIVE_VERCEL_REMEDIATION_BACKLOG.md", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Updated LIVE_VERCEL_REMEDIATION_BACKLOG.md successfully.")
