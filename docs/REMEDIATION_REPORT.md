# CivicSphere AI — Security Remediation & Verification Log

## Remediation Actions Executed

1. **Secret & Credential Hardening**:
   - Eliminated all default fallback strings in `backend/app/common/config.py`.
   - Added startup validation raising `ValueError` if `JWT_SECRET_KEY` or `NEO4J_PASSWORD` is absent in non-test environments.

2. **Access Control & Session Hardening**:
   - Replaced localStorage token storage with Secure httpOnly authentication cookie + CSRF protection.
   - Introduced double-submit CSRF token validation on all mutating routes.

3. **Malicious File Neutralization**:
   - Added `SecurityScanner` to scan PDF byte streams for `/JavaScript`, `/JS`, `/Launch`, `/SubmitForm`, and `/EmbeddedFiles`.
   - Malicious files are immediately flagged with `is_malicious=True` and halted before OCR.

4. **Query Parameterization**:
   - Refactored `GraphRepository` Cypher queries to use native dictionary parameters (`$entity_name`, `$chunk_id`), preventing Cypher injection.
