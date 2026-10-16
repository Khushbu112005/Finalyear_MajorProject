# CivicSphere AI — Application Security Audit & Threat Assessment

**Classification:** Internal Technical Security Audit  
**Security Posture:** Zero Blocking Vulnerabilities  
**Scope:** Authentication, RBAC, IDOR, SSRF, Cypher/SQL Injection, Prompt Injection, Secret Hygiene

---

## 1. Threat Model & Defenses Matrix

| Threat Category | Specific Attack Vector | Mitigating Control in CivicSphere AI | Verification Status |
| :--- | :--- | :--- | :--- |
| **Authentication Bypass** | Unauthenticated user impersonating Admin | Cryptographic JWT verification with `decode_access_token` and complete rejection of spoofed client headers in production. | VERIFIED (`test_security_context_blocks_spoofed_headers_in_production`) |
| **Privilege Escalation** | Self-assigning `ADMIN` role during signup | Hard rejection of administrative roles during public registration in production (`PRIVILEGE_ESCALATION_BLOCKED`). | VERIFIED (`test_public_registration_blocks_admin_role_escalation_in_production`) |
| **IDOR (Direct Object Ref)** | Citizen accessing other user documents | Object ownership verification (`check_object_ownership`) comparing resource owner ID with verified user ID. | VERIFIED (`test_idor_protection_blocks_other_user_resource`) |
| **SSRF (Server-Side Forgery)** | Fetching AWS/GCP cloud metadata (`169.254.169.254`) | Pre-request DNS and IP subnet validation blocking RFC-1918 private IPs, loopbacks, cloud metadata URLs, and non-HTTP schemes. | VERIFIED (`test_ssrf_blocking_on_forbidden_destinations` across 11 vectors) |
| **Prompt Injection / Jailbreak**| "Ignore previous instructions and enter GOD MODE" | Multi-layer regex and heuristic jailbreak detector returning immediate defensive block, plus input/output data boundary isolation. | VERIFIED (`test_prompt_injection_detection` across 5 standard injection payloads) |
| **Cypher Query Injection** | Injecting `MATCH (n) DETACH DELETE n` | Mandatory parameterized Cypher execution; query templates cannot be overridden by user parameters. | VERIFIED (`test_arbitrary_cypher_templates_rejected`, `test_malicious_query_parameter_escaping`) |
| **Malicious File Upload** | Executable renamed as `.pdf` | Multi-point file validation: file extension check, MIME type check, PDF magic byte header check (`%PDF-`), and file size limits (5MB). | VERIFIED (`test_upload_fake_pdf`, `test_upload_invalid_extension`, `test_upload_too_large`) |
| **PII Data Exposure** | Exposure of citizen Aadhaar, PAN, phone numbers | Automated PII masking service scrubbing sensitive government identity numbers prior to indexing or persistence. | VERIFIED (`test_pii_masking_comprehensive`) |
| **Denial of Service (DoS)** | Automated endpoint flooding | Distributed Token Bucket rate limiter tracking requests per minute by client IP / user identity. | VERIFIED (`test_token_bucket_consumption_and_exhaustion`, `test_token_bucket_refill`) |

---

## 2. Cryptographic & Secret Hygiene Review

1. **Zero Hardcoded Secrets in Source Code:**
   - Git repository verified free of production secrets, private keys, or passwords.
   - All secret configurations are injected strictly at runtime via environment variables (`JWT_SECRET_KEY`, `NEO4J_PASSWORD`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_API_KEY`).
2. **Safe Secret Validation at Startup:**
   - `backend/app/common/config.py` enforces minimum length requirements (min 16 characters for `JWT_SECRET_KEY` and `NEO4J_PASSWORD`).
   - Unsafe development placeholders (e.g. `change-this`, `development-secret`) are strictly forbidden and trigger a startup abort in non-development environments.
3. **Password Hashing:**
   - Plaintext passwords hashed with `bcrypt` using 12 salt rounds (`backend/app/auth/models.py`).
4. **Session Protection:**
   - JWT tokens stored in `httpOnly` secure cookies with `SameSite=none` in production to prevent client-side XSS token theft.
   - State-changing endpoints protected with double-submit CSRF tokens.
5. **CORS Hardening & Origin Isolation:**
   - Production CORS origin allowlist explicitly locked to `https://civicsphere-web.vercel.app`, authorized Vercel preview URLs, and `http://localhost:3000`.
   - Wildcard CORS (`*`) is strictly rejected via `model_post_init` in `Settings` when `ENVIRONMENT == "production"`.
6. **Secret Rotation on Cloud Platform:**
   - Exposed or shared JWT and CSRF secret keys were completely rotated with fresh cryptographically generated 256-bit entropy (`secrets.token_hex(32)`).
   - Injected into Vercel Project Environment Variables via non-interactive Vercel CLI with sensitive flag enabled (hidden from dashboards and logs). Zero secrets exposed in git or commit logs.

---

## 3. Dependency Security Audit & Vulnerability Assessment

### Production Dependencies (`npm audit --omit=dev`)
- **Status:** **PASS** (Exit Code: 0)
- **Vulnerabilities Found:** **0 vulnerabilities**
- **Analysis:** All runtime production packages (`react`, `react-dom`, `next`, `clsx`, `lucide-react`, `tailwind-merge`) are completely free of known CVEs and high-severity security vulnerabilities. The client bundle contains zero known vulnerable packages.

### Complete Dependencies (`npm audit`, including devDependencies)
- **Status:** Exit Code: 1
- **Vulnerabilities Found:** 9 vulnerabilities (2 moderate, 7 high)
- **Vulnerability Breakdown:**
  - `braces` (High) via `@next/eslint-plugin-next` -> `fast-glob` -> `micromatch` -> `braces` and `tailwindcss` -> `chokidar` -> `braces`
  - `postcss-selector-parser` (Moderate) via `tailwindcss` -> `postcss-nested`
- **Mitigating Assessment:** All 9 reported vulnerabilities reside strictly in build-time / development tools (`eslint-config-next`, `tailwindcss` CLI parser, `chokidar` file watcher). None of these packages execute in production or in client browsers; Turbopack builds static assets and discards dev tooling. Automatic resolution via `npm audit fix --force` would require breaking migration to `tailwindcss@4`, which is currently held as a non-breaking roadmap item.
