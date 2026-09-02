---
title: CivicSphere AI Unified Backend
emoji: 🏛️
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
---

# CivicSphere AI — National Civic & Legal Intelligence Platform

[![CI/CD Pipeline](https://github.com/Khushbu112005/Finalyear_MajorProject/actions/workflows/ci.yml/badge.svg)](https://github.com/Khushbu112005/Finalyear_MajorProject/actions)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 14](https://img.shields.io/badge/next.js-14.2-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2Bpgvector-336791.svg)](https://www.postgresql.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.x-008CC1.svg)](https://neo4j.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

CivicSphere AI is a verified, evidence-grounded civic and statutory intelligence platform engineered to empower Indian citizens with instant, accurate, and non-hallucinatory guidance on Indian Central & State Acts, Government Schemes, Grievance Procedures, and Document AI processing.

---

## 🏛️ Architecture Overview

CivicSphere AI is structured as a **high-performance modular monolith**:

```
                       ┌──────────────────────────────────────┐
                       │   Consolidated Web App (Next.js 14)  │
                       │   • Universal Civic Header & Search  │
                       │   • 10-Section Legal Guidance UI     │
                       │   • Scheme Navigator & Wizard        │
                       │   • Document AI Drag & Drop          │
                       │   • Multi-Agent Chat Interface       │
                       │   • Case Workspace & Admin Center    │
                       └──────────────────┬───────────────────┘
                                          │
      [Secure httpOnly authentication cookie + CSRF protection]
                                          │
                                          ▼
                       ┌──────────────────────────────────────┐
                       │      Unified FastAPI Backend         │
                       │   • Module A: Legal Guidance Engine  │
                       │   • Module B: Government Navigator   │
                       │   • Module C: Knowledge & Graph RAG  │
                       │   • Module D: Document AI Processing │
                       │   • Module Cases: Workspace & IDOR   │
                       │   • Phase 6: Multi-Agent Orchestrator│
                       │   • Phase 7: Security Guardrails     │
                       │   • Phase 10: Audit & Observability  │
                       └──────┬───────────┬────────────┬──────┘
                              │           │            │
            ┌─────────────────┴─┐   ┌─────┴─────┐   ┌──┴───────────────┐
            │ PostgreSQL 16 DB  │   │  Neo4j 5  │   │     Redis 7      │
            │ + pgvector        │   │ Knowledge │   │ Rate Limit &     │
            │ Users, Cases, Docs│   │ Graph RAG │   │ Real-time Cache  │
            └───────────────────┘   └───────────┘   └──────────────────┘
```

---

## 🚀 Key Modules & Capabilities

1. **Module A — Legal Guidance Engine (`/legal`)**
   - Delivers grounded legal guidance across **10 structured sections** (Understanding, Legal Basis, General Meaning, Application, Recommended Next Steps, Evidence Needed, Competent Desks, Verified Citations, Warnings, Statutory Limitation).
   - Strict anti-hallucination fail-safe (`FailSafeState.INSUFFICIENT_EVIDENCE`).

2. **Module B — Government Service Navigator (`/government`)**
   - Natural language civic situation analysis.
   - Dynamic citizen eligibility evaluation with multi-parameter verification (income, social category, state).
   - Step-by-step application procedures and required document checklists.

3. **Module C — Knowledge & Neo4j Graph Engine (`/knowledge`)**
   - Hybrid multi-modal retrieval (Reciprocal Rank Fusion of Vector + BM25 + Graph Depth-2 traversal).
   - Verified statutory sources with tamper-proof Gazette citations.

4. **Module D — Intelligent Document AI (`/documents`)**
   - 7-stage document state machine (`UPLOADED` → `VALIDATING` → `SECURITY_SCANNING` → `PROCESSING` → `ANALYZING` → `LINKING_KNOWLEDGE` → `READY`).
   - Active byte-stream PDF malware scanner detecting embedded JavaScript exploits.
   - Automatic entity extraction and Knowledge Graph linking.

5. **Multi-Agent Orchestrator (`/agents`)**
   - Multi-agent coordination with specialized agents (Legal Specialist, Government Navigator, Knowledge Agent).
   - Bounded reasoning loop with a strict step budget (max 5 iterations) and tool sandboxing.

6. **Security & Privacy Guardrails**
   - `httpOnly` secure session cookies with double-submit CSRF tokens.
   - Strict IDOR prevention on all user-owned cases and documents.
   - PII sanitization (Aadhaar, PAN, phone numbers masked before logs/external calls).
   - SSRF protection blocking loopback, link-local, and cloud metadata addresses (`169.254.169.254`).
   - Prompt injection defense with structural `<data_boundary>` isolation.
   - Token-bucket rate limiting per IP / User.

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional for containerized deployment)

### 2. Local Environment Setup

Clone repository and install dependencies:
```bash
# Clone
git clone https://github.com/Khushbu112005/Finalyear_MajorProject.git
cd Finalyear_MajorProject

# Setup Python Virtual Environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Backend & Shared Schemas
pip install -e ".[dev]"

# Install Frontend Dependencies
cd apps/web && npm install && cd ../..
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `JWT_SECRET_KEY` and `NEO4J_PASSWORD` are set.

### 4. Run with Docker Compose
To spin up all services (PostgreSQL, Neo4j, Redis, MinIO, Backend, Next.js Web):
```bash
docker-compose up --build
```
- **Web Portal**: `http://localhost:3000`
- **FastAPI Documentation**: `http://localhost:8000/docs`
- **Neo4j Browser**: `http://localhost:7474`

---

## 🧪 Test Suites & Quality Verification

Run the entire automated verification test suite:
```bash
python -m pytest -p no:pytest_ethereum backend/tests/ -v
```

Run the standalone evaluation benchmark harness:
```bash
python infrastructure/scripts/run_benchmarks.py
```

### Benchmark Results
- **Evaluated Test Cases**: 10 (Standard, Adversarial, Held-Out)
- **Pass Rate**: 100.0%
- **Mean MRR (Mean Reciprocal Rank)**: 1.0000 (Target >= 0.85)
- **Adversarial Jailbreak Block Rate**: 100.0% (Target 100%)
- **Average Retrieval Latency**: 1.39 ms

---

## 📚 Documentation
- [Traceability Matrix](docs/TRACEABILITY_MATRIX.md)
- [Security Threat Model & Defenses](docs/SECURITY_THREAT_MODEL.md)

---

## ⚖️ Statutory Disclaimer
CivicSphere AI is an informational technology platform engineered to assist citizens in discovering published laws, regulations, and government schemes. Generated outputs do not constitute formal legal representation. For courtroom proceedings, please consult a qualified advocate or the Legal Aid Clinic.