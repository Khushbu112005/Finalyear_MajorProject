# CivicSphere AI — Complete API Specification & Endpoint Authorization Matrix

All API endpoints are mounted under `/api/v1` (with root Kubernetes probes) and conform to the canonical JSON response envelope: `{ success: bool, data: T, confidence: float, request_id: str, warnings: List[str], timestamp: str }`.

---

## 1. Explicit Endpoint Authorization Classification

| Endpoint | HTTP Method | Authorization Class | Permitted Roles / Ownership | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/health` / `/healthz` / `/api/v1/health` | `GET` | **PUBLIC** | All | Liveness probe returning service health & timestamp. |
| `/health/ready` / `/readyz` | `GET` | **PUBLIC** | All | Readiness probe validating graph & vector store availability. |
| `/api/v1/auth/register` | `POST` | **PUBLIC** | All | Registers new account, issues httpOnly token & CSRF cookie. |
| `/api/v1/auth/login` | `POST` | **PUBLIC** | All | Authenticates credentials with optional TOTP MFA challenge. |
| `/api/v1/auth/logout` | `POST` | **AUTHENTICATED** | Any authenticated user | Clears authentication and CSRF session cookies. |
| `/api/v1/auth/me` | `GET` | **AUTHENTICATED** | Any authenticated user | Returns profile and active role of authenticated user. |
| `/api/v1/auth/profile` | `PUT` | **AUTHENTICATED** | Any authenticated user | Updates name, phone, bio, specialization, and password. |
| `/api/v1/auth/mfa/setup` | `POST` | **AUTHENTICATED** | Any authenticated user | Generates TOTP secret and QR provisioning URI. |
| `/api/v1/auth/mfa/verify` | `POST` | **AUTHENTICATED** | Any authenticated user | Verifies initial TOTP code to activate account MFA. |
| `/api/v1/auth/mfa/disable` | `POST` | **AUTHENTICATED** | Any authenticated user | Disables MFA with password & TOTP verification. |
| `/api/v1/legal/query` | `POST` | **AUTHENTICATED** | Any authenticated user | Generates grounded 10-section structured legal guidance. |
| `/api/v1/legal/acts` | `GET` | **PUBLIC** | All | Lists indexed statutory acts and gazette references. |
| `/api/v1/government/services` | `GET` | **PUBLIC** | All | Catalogs verified citizen public services & portals. |
| `/api/v1/government/analyze` | `POST` | **AUTHENTICATED** | Any authenticated user | Classifies citizen problem statement and recommends schemes. |
| `/api/v1/government/check-eligibility`| `POST` | **AUTHENTICATED** | Any authenticated user | Evaluates dynamic multi-parameter scheme eligibility rules. |
| `/api/v1/documents/upload` | `POST` | **AUTHENTICATED** | Any authenticated user | 7-stage document processing with active malware scan. |
| `/api/v1/documents` | `GET` | **RESOURCE_OWNER** | Uploader or Admin | Lists documents owned by authenticated user. |
| `/api/v1/documents/{id}` | `GET` | **RESOURCE_OWNER** | Uploader or Admin | Retrieves document OCR analysis and graph links (IDOR protected). |
| `/api/v1/documents/{id}` | `DELETE` | **RESOURCE_OWNER** | Uploader or Admin | Deletes document and cleans associated storage. |
| `/api/v1/cases` | `GET` | **RESOURCE_OWNER** | Case Owner or Admin | Lists cases owned by the authenticated citizen. |
| `/api/v1/cases` | `POST` | **AUTHENTICATED** | Any authenticated user | Creates a new Case Workspace. |
| `/api/v1/cases/{id}` | `GET` / `PUT` / `DELETE` | **RESOURCE_OWNER** | Case Owner or Admin | IDOR-enforced case management and timeline retention. |
| `/api/v1/knowledge/search` | `POST` | **PUBLIC** | All | Hybrid semantic + lexical + graph statutory retrieval. |
| `/api/v1/knowledge/sources` | `GET` | **PUBLIC** | All | Lists active verified legal source records. |
| `/api/v1/knowledge/sources` | `POST` | **ROLE_RESTRICTED** | `KNOWLEDGE_EDITOR`, `ADMIN` | Registers new primary statute or secondary source. |
| `/api/v1/knowledge/graph/neighborhood/{id}` | `GET` | **PUBLIC** | All | Retrieves depth-2 graph neighborhood for entity visualization. |
| `/api/v1/agents/chat` | `POST` | **AUTHENTICATED** | Any authenticated user | Coordinates multi-agent bounded reasoning. |
| `/api/v1/agents/tools` | `GET` | **PUBLIC** | All | Returns sandboxed agent tool catalog and schemas. |
| `/api/v1/admin/overview` | `GET` | **ADMIN_ONLY** | `ADMIN` | Returns system-wide telemetry, user count, and storage metrics. |
| `/api/v1/admin/evaluation-metrics`| `GET` | **ADMIN_ONLY** | `ADMIN` | Returns current benchmark scorecard and accuracy metrics. |
| `/api/v1/admin/security-threats` | `GET` | **ADMIN_ONLY** | `ADMIN` | Returns security event audit log and threat detections. |
| `/api/v1/audit/events` | `GET` | **ADMIN_ONLY** | `ADMIN` | Retrieves tamper-evident structured audit event trail. |
