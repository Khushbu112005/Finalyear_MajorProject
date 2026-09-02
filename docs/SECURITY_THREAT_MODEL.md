# CivicSphere AI — Security Threat Model & Defense Architecture

## 1. Threat Landscape & Security Boundary Overview
CivicSphere AI is designed for mission-critical civic and legal guidance for Indian citizens. The platform processes sensitive civic inquiries, legal notices, and user identifiers.

```
                    Internet / Citizen Client
                               │
                      [HTTPS / TLS 1.3]
                               ▼
        ┌──────────────────────────────────────────────┐
        │        Edge / Reverse Proxy & CORS           │
        │  • Strict Origin Whitelisting                │
        │  • Rate Limiting (Token Bucket)              │
        │  • Security Headers (CSP, nosniff, DENY)     │
        └──────────────────────┬───────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │         CivicSphere FastAPI Backend          │
        │  • httpOnly Secure Auth Cookies (JWT)        │
        │  • Double-Submit CSRF Token Validation       │
        │  • IDOR Ownership Validation                 │
        │  • Prompt Injection Detection (Data Boundary)│
        │  • PII Sanitization (Aadhaar / PAN / Phone)  │
        │  • SSRF Link-Local & Metadata Defense        │
        └──────┬──────────────────────┬─────────┬──────┘
               │                      │         │
               ▼                      ▼         ▼
     [PostgreSQL + pgvector]       [Neo4j]   [Redis]
     Parameterized Queries       Parameterized  Cache
```

## 2. Threat Vector Mitigations

| Threat Category | Attack Vector | CivicSphere Mitigation & Defense | Tested By |
| :--- | :--- | :--- | :--- |
| **Authentication / IDOR** | Direct object reference manipulation to inspect another citizen's case or document | Strict ownership verification in `check_object_ownership` & dependency `check_ownership`. Returns HTTP 403 / 404 for unowned resources. | `test_idor_and_auth.py` |
| **Cross-Site Request Forgery (CSRF)** | Malicious third-party origin submitting state-changing POST requests using browser cookies | Double-submit CSRF cookie & header validation (`X-CSRF-Token`). Validated on all mutation endpoints. | `test_auth_api.py` |
| **Prompt Injection / Jailbreak** | "Ignore all previous instructions", system prompt theft, or malicious data injection | Multi-layer regex heuristics + automatic `<data_boundary>` structural isolation around all external text. | `test_prompt_injection.py` |
| **Cypher / SQL Injection** | Malicious payloads in search terms or entity lookups | 100% Parameterized Cypher query generation via `query_params` dictionary. Zero raw string concatenation. | `test_cypher_injection.py` |
| **Server-Side Request Forgery (SSRF)** | Requests targeting AWS/GCP instance metadata (`169.254.169.254`), `localhost`, or private subnets | `SSRFDefender` with IP validation blocking private subnets, loopbacks, and cloud metadata endpoints. | `test_ssrf_defense.py` |
| **Privacy / PII Leakage** | Aadhaar numbers (12 digits), PAN cards (10 alphanumeric), phone numbers leaking into LLM logs | `PIISanitizer` regex masker replaces sensitive numbers with `[AADHAAR_MASKED]`, `[PAN_MASKED]`, etc. | `test_pii_sanitization.py` |
| **Active Document Malware** | PDF files with embedded JavaScript (`/JavaScript`, `/JS`, `/Launch`, `/SubmitForm`) | `SecurityScanner` scans raw byte stream for active exploit primitives before OCR ingestion. | `test_document_pipeline_api.py` |
| **Citation Hallucination / Tampering** | LLMs hallucinating nonexistent sections or fabricated laws | Hybrid retrieval with RRF + Neo4j verification. Fail-safe state triggered if statutory similarity falls below confidence bar. | `test_poisoning_defense.py` |
