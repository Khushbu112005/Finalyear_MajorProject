# Chapter 09 — Authentication, Authorization and Security Architecture

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. Authentication & Session Architecture

CivicSphere AI implements a defense-in-depth authentication framework built upon **JSON Web Tokens (JWT)** delivered via **secure, httpOnly cookies** combined with **Double-Submit CSRF Token protection**.

```
[Citizen Browser]                                          [FastAPI Backend]
       |                                                           |
       |--- 1. POST /api/v1/auth/login (email, password) --------->|
       |                                                           |-- Validate password (bcrypt, 12 rounds)
       |                                                           |-- If MFA enabled: request TOTP challenge
       |                                                           |-- Generate JWT (HS256, 24h expiry)
       |                                                           |-- Generate random CSRF token (32 bytes hex)
       |<-- 2. HTTP 200 OK ----------------------------------------|
       |       Set-Cookie: access_token=... (httpOnly, Secure)     |
       |       Set-Cookie: csrf_token=...   (Readable by JS)       |
       |                                                           |
       |--- 3. State-Changing Request (POST /api/v1/cases) ------->|
       |       Cookie: access_token=...                            |
       |       Header: X-CSRF-Token: <csrf_token_value>            |-- Verify access_token signature & expiry
       |                                                           |-- Verify X-CSRF-Token matches cookie
       |<-- 4. HTTP 200 / 201 Response ----------------------------|
```

### 1.1 Password Hashing & Salt Security
- **Algorithm:** `bcrypt` with automatic salt generation using **12 work rounds**.
- **Implementation:** [`backend/app/auth/models.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/auth/models.py):
  ```python
  @staticmethod
  def hash_password(password: str) -> str:
      salt = bcrypt.gensalt(rounds=12)
      return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
  ```

### 1.2 Cookie Security Configuration
To protect against Cross-Site Scripting (XSS) credential theft:
- The `access_token` cookie is marked **`httpOnly=True`**, rendering it inaccessible to client JavaScript.
- In production (`ENVIRONMENT="production"`), cookies are marked **`secure=True`** (HTTPS only) with **`samesite="none"`** to support cross-origin web portal requests from `civicsphere-web.vercel.app` to `civicsphere-backend.vercel.app`.
- In development, cookies use `samesite="lax"` and `secure=False` for local loopback testing.

### 1.3 CSRF Protection
To prevent Cross-Site Request Forgery:
- The backend issues a readable cookie named `csrf_token`.
- The frontend client ([`apps/web/src/lib/api-client.ts`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/lib/api-client.ts)) extracts this value and transmits it in the `X-CSRF-Token` HTTP header on all `POST`, `PUT`, `DELETE`, and `PATCH` requests.

### 1.4 Multi-Factor Authentication (TOTP)
- **Standard:** RFC 6238 Time-based One-Time Password algorithm via [`backend/app/auth/totp.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/auth/totp.py).
- **Features:**
  - Setup endpoint (`POST /api/v1/auth/mfa/setup`) returns Base32 secret and `otpauth://` provisioning URI for Google Authenticator / Authy.
  - Verification endpoint (`POST /api/v1/auth/mfa/verify`) validates the initial 6-digit code before activating `mfa_enabled = True` in the database.
  - Disable endpoint (`POST /api/v1/auth/mfa/disable`) mandates both current account password and live TOTP token.

---

## 2. Role-Based Access Control (RBAC)

CivicSphere AI defines 5 canonical user roles via [`UserRole`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/auth/models.py):

| Role Identifier | Description & System Permissions |
| :--- | :--- |
| **`CITIZEN`** | Default self-registered user. Can query legal guidance, check scheme eligibility, upload documents, and manage own cases. |
| **`RESEARCHER`** | Legal researcher or paralegal. Permitted to access unassigned open cases and provide counsel annotations. |
| **`REVIEWER`** | Senior legal reviewer. Permitted to review citizen guidance drafts and suggest edits to scheme procedural steps. |
| **`KNOWLEDGE_EDITOR`** | Statutory knowledge curator. Permitted to submit ingestion jobs and modify scheme eligibility rules. |
| **`ADMIN`** | System administrator. Permitted to view audit logs, security telemetry, trigger re-indexing, and manage accounts. |

### 2.1 Privilege Escalation Guardrail
In [`backend/app/auth/routes.py::register`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/auth/routes.py):
```python
requested_role = (payload.role or "CITIZEN").upper()
if settings.ENVIRONMENT == "production" and requested_role in ("ADMIN", "SYSTEM"):
    raise CivicSphereException(
        code="PRIVILEGE_ESCALATION_BLOCKED",
        message="Public self-registration for administrative roles is disabled.",
        status_code=403
    )
```

---

## 3. Data Isolation & IDOR Protection

CivicSphere AI enforces strict Insecure Direct Object Reference (IDOR) controls on case management and document retrieval:

- **Case Ownership:** In `backend/app/cases/routes.py::get_cases`, queries are filtered by role:
  - Citizens can *only* query records where `CaseModel.citizen_id == current_user.id`.
  - Researchers can query cases where `CaseModel.counsel_id == current_user.id` or `(counsel_id is None and status == "OPEN")`.
- **Single Record IDOR Validation:** In `backend/app/cases/routes.py::get_case_by_id`:
  - An explicit check verifies ownership before returning docket details. If a citizen attempts to access another user's `case_id`, the system raises HTTP 403 Forbidden.

---

## 4. Ingestion Security & SSRF Defense

When statutory knowledge is ingested via remote URL (`fetch_remote=True`), the pipeline enforces strict Server-Side Request Forgery (SSRF) checks ([`backend/app/knowledge/ingestion/fetcher.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/knowledge/ingestion/fetcher.py)):

1. **Protocol Whitelisting:** Restricts requests strictly to `http` and `https`. Schemes like `file://`, `ftp://`, or `gopher://` are rejected.
2. **DNS & Private IP Resolution:** Resolves target hostname prior to HTTP connection. If the target resolves to an RFC 1918 private IP (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1/8`) or cloud metadata endpoints (`169.254.169.254`), the request is blocked.
3. **Audit Logging:** Every SSRF attempt triggers `AuditManager.record_security_event(threat_type="SSRF_INGESTION_ATTEMPT", severity="HIGH")`.

---

## 5. Document Upload & File Inspection Safeguards

In [`backend/app/documents/routes.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/documents/routes.py) and `backend/app/document_processing/api/upload.py`:
- **Size Limit:** Maximum file size enforced at 10 MB.
- **Magic-Byte Signature:** File content must begin with `%PDF-` (`PDF_MAGIC_BYTES = b"%PDF-"`). Renamed executables (`.exe`, `.bat`, `.sh`) are rejected.
- **Malware & Active Script Scanning:** Uploaded PDF streams are scanned for embedded JavaScript (`/JavaScript`, `/JS`), launch actions (`/Launch`), or embedded executable streams before passing to PyMuPDF.

---

## 6. Rate Limiting Middleware

CivicSphere AI includes an in-memory token bucket rate limiter ([`backend/app/common/rate_limiter.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/common/rate_limiter.py)) registered in `main.py`:
- **Default Capacity:** 200 tokens per client IP.
- **Refill Rate:** 5.0 tokens per second.
- **Headers Returned:**
  - `X-RateLimit-Limit: 200`
  - `X-RateLimit-Remaining: <current_tokens>`
- **Exceeded Behavior:** Returns HTTP 429 Too Many Requests with `Retry-After` header.
