## CivicSphere AI — Pull Request Template

### 📋 Description & Spec Traceability
- **Spec Section**: <!-- e.g., Module A Legal Engine Section 4.2 -->
- **Traceability ID**: <!-- e.g., P5.1 Legal Guidance Grounding -->
- **Summary of Changes**: 

### 🛡️ Security & Guardrails Checklist
- [ ] No hardcoded secrets or API keys introduced
- [ ] All Cypher/SQL queries parameterized (0 raw string formatting)
- [ ] IDOR authorization checked on resource lookup
- [ ] Double-submit CSRF validated on mutating endpoints
- [ ] PII masked in all log statements

### 🧪 Testing & Verification
- [ ] Backend tests passing (`python -m pytest -p no:pytest_ethereum backend/tests/ packages/schemas/ -v`)
- [ ] Evaluation benchmarks passing (`python infrastructure/scripts/run_benchmarks.py`)
- [ ] All contract schemas match `packages/schemas/contracts.py`
