# CivicSphere AI — Developer Guide & Contribution Standards

## 1. Local Development Workflow

```bash
# 1. Activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
source venv/bin/activate  # Linux/macOS

# 2. Install backend & shared packages in editable mode
pip install -e ".[dev]"

# 3. Install frontend dependencies
cd apps/web && npm install && cd ../..

# 4. Run backend tests
python -m pytest -p no:pytest_ethereum backend/tests/ packages/schemas/ -v

# 5. Run evaluation benchmarks
python infrastructure/scripts/run_benchmarks.py

# 6. Run concurrent load tests
python infrastructure/scripts/run_load_test.py
```

## 2. Coding Standards
- **Zero Secrets**: Never commit plaintext API keys or passwords.
- **Strict Parameterization**: Use dictionary parameters for all Cypher/SQL queries.
- **Traceability**: All new endpoints must map to a domain contract in `packages/schemas/contracts.py`.
