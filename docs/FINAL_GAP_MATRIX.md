# CivicSphere AI — Final 97-Page Specification Gap Matrix
**Phase**: DISCOVERY ONLY (No implementation changes executed)

## 1. Specification Compliance Overview
This matrix maps the actual repository implementation directly against the authoritative 97-page CivicSphere AI Product, Engineering, Security & Frontend Plan.

Priorities:
- **P0**: Critical Architectural / Security Prerequisite
- **P1**: Core Functional Capability
- **P2**: Operational / Ingestion Enhancement
- **P3**: Non-Blocking / Maintenance Enhancement

---

## 2. Granular Gap Matrix

| ID | Area | Specification Requirement | Current Implementation | Evidence / Code Location | Current Status | Risk Level | Required Action | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **G-01** | Architecture | Single unified FastAPI backend + Next.js App Router | FastAPI (`backend/app/main.py`) + Next.js 14 (`apps/web/`) | `backend/`, `apps/web/` | ✅ COMPLETE | LOW | Preserve active architecture; archive legacy Node runtimes. | P1 |
| **G-02** | Legacy Runtimes | Complete retirement of `server/`, `client/`, `Civicsphere/` | Legacy folders present in repository but disconnected from runtime | `server/`, `client/`, `Civicsphere/` | 🟡 PARTIAL | LOW | Execute safe deletion/archival of dead legacy folders. | P2 |
| **G-03** | Auth & Session | Secure httpOnly session cookie + double-submit CSRF | Set-Cookie `access_token` (`SameSite=Lax`) + `csrf_token` cookie & `X-CSRF-Token` header | `backend/app/auth/routes.py`, `backend/app/common/security.py` | ✅ COMPLETE | LOW | Maintain active cookie session mechanism. | P0 |
| **G-04** | Privileged MFA | RFC 6238 TOTP MFA for ADMIN & KNOWLEDGE_EDITOR | PyOTP TOTP setup, verify, disable with zero secret leakage | `backend/app/auth/routes.py`, `backend/tests/api/test_auth_api.py` | ✅ COMPLETE | LOW | Maintain active TOTP verification. | P0 |
| **G-05** | Role Model | 5 canonical roles (`CITIZEN`, `ADMIN`, `KNOWLEDGE_EDITOR`, `REVIEWER`, `RESEARCHER`) | Strict enum in `backend/app/auth/models.py` | `backend/app/auth/models.py` | ✅ COMPLETE | LOW | Maintain canonical 5-role RBAC. | P0 |
| **G-06** | DB Persistence | PostgreSQL 16 + pgvector canonical relational store | SQLAlchemy models for Users, Cases, Documents, Services, Audit | `backend/app/common/database.py`, models | ✅ COMPLETE | LOW | Maintain PostgreSQL canonical persistence. | P0 |
| **G-07** | Vector Config | Configurable embedding dimension (default 384) | Configurable via `GlobalSettings.EMBEDDING_DIMENSION` | `backend/app/common/config.py`, providers | ✅ COMPLETE | LOW | Configurable across providers. | P1 |
| **G-08** | Knowledge Graph | Property graph repository with parameterized Cypher | In-memory graph repository enforcing parameterized traversals | `backend/app/knowledge/graph/repository.py` | ✅ COMPLETE | LOW | Connect to dedicated Neo4j 5 instance in production deployment. | P1 |
| **G-09** | Module A | 10-section grounded legal guidance cards | `LegalEngine` generating 10 required sections with fail-safe | `backend/app/legal/services/legal_engine.py` | ✅ COMPLETE | LOW | Maintain statutory grounding and fail-safe circuit breaker. | P1 |
| **G-10** | Module B | Government grievance analysis & scheme eligibility | `GovernmentAIService` + dynamic rule evaluator + catalog API | `backend/app/government/services/` | ✅ COMPLETE | LOW | Maintain scheme recommendation engine. | P1 |
| **G-11** | Module C | Gazette source registry & hybrid RRF retrieval | `SourceRegistry` + `HybridRetrievalService` (Lexical + Vector + Graph) | `backend/app/knowledge/retrieval/hybrid.py` | ✅ COMPLETE | LOW | Maintain multi-channel RRF retrieval. | P1 |
| **G-12** | Module D | 7-stage document AI pipeline with malware scanner | `DocumentProcessingPipeline` + PDF byte scanner + OCR + Graph linking | `backend/app/documents/services/` | ✅ COMPLETE | LOW | Maintain 7-stage document state machine. | P1 |
| **G-13** | Multi-Agent | 6 specialist agents with tool sandboxing | `SafetyAgent`, `LegalAgent`, `GovAgent`, `DocAgent`, `GraphAgent`, `CitationAgent` | `backend/app/agents/` | ✅ COMPLETE | LOW | Enforce tool sandboxing in `ToolRegistry`. | P1 |
| **G-14** | AI Security | Boundary isolation, PII sanitization, SSRF defense | `<RETRIEVED_DOCUMENT>` boundary tags, Aadhaar/PAN regex mask, IP/subnet blocker | `backend/app/knowledge/security/`, `backend/tests/security/` | ✅ COMPLETE | LOW | Maintain automated security regression suite. | P0 |
| **G-15** | Observability | Tamper-evident structured JSON audit logging | `AuditManager` persisting audit events with actor, action, and PII masking | `backend/app/common/audit.py`, `backend/app/audit/` | ✅ COMPLETE | LOW | Maintain structured telemetry. | P1 |
| **G-16** | Frontend UX | Consolidated Next.js 14 App Router UI | 22 canonical pages + 4 compatibility aliases with Tailwind & shadcn/ui | `apps/web/src/app/` | ✅ COMPLETE | LOW | Maintain responsive UI. | P1 |
| **G-17** | Migrations | Alembic single canonical migration chain | File `0001_initial_canonical_schema.py` head verified | `backend/migrations/` | 🟡 PARTIAL | MEDIUM | Local SQLite pre-populated state limits direct CLI check; target clean DB in container. | P2 |
| **G-18** | Live Data Sync | Automated background re-fetching of official gazettes | `SourceFetcher` and `FreshnessTracker` implemented; background cron not active locally | `backend/app/knowledge/sources/` | 🟡 PARTIAL | MEDIUM | Schedule periodic cron job for `SourceRegistry.check_freshness()`. | P2 |
