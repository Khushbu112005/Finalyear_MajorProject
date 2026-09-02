# CivicSphere AI — Final Modular Monolith Architecture Specification

## 1. System Topology
CivicSphere AI operates as a unified modular monolith backend with a single Next.js web frontend, adhering to the 97-page authoritative product specification.

```
+-------------------------------------------------------------+
|               Next.js 14 Web Frontend (apps/web)            |
|  - Universal Civic Header & Global Search                   |
|  - Module A: 10-Section Legal Guidance Card UI              |
|  - Module B: Government Navigator & Scheme Wizard           |
|  - Module C: Knowledge & Subgraph Explorer                  |
|  - Module D: Intelligent Document Processing AI             |
|  - Case Workspace & Admin Monitoring Center                 |
+------------------------------+------------------------------+
                               |
      [Secure httpOnly authentication cookie + CSRF protection]
                               |
                               v
+-------------------------------------------------------------+
|             Unified FastAPI Backend (Port 8000)             |
|  - /api/v1/auth        : Secure httpOnly Cookie + CSRF Auth |
|  - /api/v1/legal       : 10-Section Grounded Legal Engine   |
|  - /api/v1/government  : Scheme Eligibility & Procedures    |
|  - /api/v1/documents   : 7-Stage Document AI Pipeline       |
|  - /api/v1/knowledge   : Hybrid RAG & Neo4j Subgraph APIs   |
|  - /api/v1/cases       : IDOR-Protected Case Workspace      |
|  - /api/v1/agents      : Specialist Multi-Agent Coordination|
|  - /api/v1/audit       : Tamper-Evident Observability & Logs|
+--------------+---------------+---------------+--------------+
               |               |               |
               v               v               v
    +--------------------+  +-------+  +--------------------+
    | PostgreSQL 16 DB   |  | Neo4j |  | Redis 7 & MinIO S3 |
    | + pgvector         |  | Graph |  | - Cache & Tokens   |
    | - Users, Cases     |  | - Acts|  | - Encrypted PDFs   |
    | - Audit Events     |  | - Secs|  +--------------------+
    +--------------------+  +-------+
```

## 2. Active Runtime Independence & Legacy Removal
The production system runtime is strictly consolidated:
- **Backend Runtime**: Solely executes via `backend/app/main.py` (FastAPI).
- **Frontend Runtime**: Solely executes via `apps/web/` (Next.js 14 App Router).
- **Legacy Directories**: `server/`, `client/`, `Civicsphere/`, and `evaluator.js` have been deleted from the repository.
- **Database Dependency**: MongoDB has been fully replaced by canonical PostgreSQL 16 (`backend/app/common/database.py`) with zero MongoDB drivers or connection dependencies in the codebase.

## 3. Core Architectural Invariants
1. **Zero Statutory Hallucination**: Fallback fail-safe triggers if similarity is insufficient (`FailSafeState.INSUFFICIENT_EVIDENCE`).
2. **Strict Parameterization**: Zero dynamic SQL or Cypher string concatenations.
3. **Defense-in-Depth**: Automatic PII masking, SSRF protection against cloud metadata (169.254.169.254), and prompt injection isolation boundaries (`<RETRIEVED_DOCUMENT is_untrusted_data='true'>`).
4. **IDOR Prevention**: All case and document records enforce strict ownership checks via `AuthContext`.
5. **Agent Security Pipeline**: Specialist agent tool calls are mediated through `ToolRegistry` with schema validation, permission checks, timeouts, and structured audit logs.
