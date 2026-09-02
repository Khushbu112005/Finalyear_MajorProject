# CivicSphere AI — Repository Cleanup & File Discovery Audit
**Phase**: DISCOVERY ONLY (No files modified or deleted)

## 1. Executive Summary & Inventory
This document identifies all active, legacy, duplicate, and obsolete components across the CivicSphere repository.

```
Total Repository Files (excluding .git/caches): 440
Total Directories:                             175
Active Canonical Architecture:                 FastAPI (backend/) + Next.js 14 (apps/web/) + packages/
Legacy / Inactive Runtimes:                    server/, client/, Civicsphere/, uploads/
```

---

## 2. Project / Application Inventory & Classification

| Directory / Component | Technology | Role / Entry Point | Active in Canonical Runtime? | Classification | Recommended Action | Reason |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `backend/` | Python 3.11 / FastAPI | Canonical Monolith API (`backend/app/main.py`) | **YES** | **KEEP** | Maintain | Core active production backend. |
| `apps/web/` | TypeScript / Next.js 14 | Canonical Web Application (`apps/web/src/app/`) | **YES** | **KEEP** | Maintain | Core active production frontend. |
| `packages/schemas/` | Python / TypeScript | Shared Domain Contracts & Schemas | **YES** | **KEEP** | Maintain | Canonical contract definitions shared across repo. |
| `data/seed/` | Python / JSON | Official Statutory Gazette Seed Snapshots | **YES** | **KEEP** | Maintain | Verified ground-truth statutory snapshots. |
| `data/evaluation/` | JSON | Ground-Truth Benchmark Test Datasets | **YES** | **KEEP** | Maintain | 10-case retrieval and reasoning evaluation suite. |
| `docs/` | Markdown | Architecture, Security, API & Audit Docs | **YES** | **KEEP** | Maintain | Authoritative specifications and verification trails. |
| `infrastructure/` | Docker / Python | Docker Compose, Dockerfiles, Load/Bench Scripts | **YES** | **KEEP** | Maintain | Production orchestration & container definitions. |
| `.github/` | GitHub Actions YAML | CI/CD Workflows (`ci.yml`, `security.yml`, PR template) | **YES** | **KEEP** | Maintain | Automated regression, linting, and secret checks. |
| `server/` | Node.js / Express / Mongoose | Legacy Backend (`server/src/server.js`) | **NO** | **DELETE-CANDIDATE** | Archive / Remove | Replaced entirely by FastAPI backend; uses deprecated MongoDB. |
| `client/` | React / Vite / Tailwind | Legacy Single-Page App (`client/src/main.jsx`) | **NO** | **DELETE-CANDIDATE** | Archive / Remove | Replaced entirely by Next.js 14 App Router. |
| `Civicsphere/` | Node.js + React Vite | Legacy Duplicate Fullstack Workspace | **NO** | **DELETE-CANDIDATE** | Archive / Remove | Abandoned duplicate prototype containing legacy backend/frontend. |
| `uploads/` | Raw PDF Files | Local Test PDF Upload Directory | **NO** | **REVIEW / ARCHIVE** | Move to `.gitignore` / Test fixtures | Contains temporary uploaded test PDFs from local executions. |
| `data/evaluation/evaluator.js` | Node.js / Mongoose | Legacy JavaScript Benchmark Evaluator | **NO** | **DELETE-CANDIDATE** | Remove | Legacy Node script depending on `server/` and `mongoose`. Replaced by `run_benchmarks.py`. |

---

## 3. Detailed Unwanted File & Directory Analysis

| Path | Type | Current Purpose | Active? | Referenced by Canonical Runtime? | Duplicate? | Candidate Category | Confidence | Rationale |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- |
| `server/` | Directory (40 files) | Legacy Express backend | **REMOVED** | **NO** | Yes (vs `backend/`) | **DELETED** | 100% | Deleted during cleanup. |
| `client/` | Directory (17 files) | Legacy Vite frontend | **REMOVED** | **NO** | Yes (vs `apps/web/`) | **DELETED** | 100% | Deleted during cleanup. |
| `Civicsphere/` | Directory (84 files) | Legacy duplicate fullstack app | **REMOVED** | **NO** | Yes (vs `backend/` & `apps/web/`) | **DELETED** | 100% | Deleted during cleanup. |
| `uploads/*.pdf`| Files | Local PDF storage | **REMOVED** | **NO** | No | **IGNORED & CLEANED** | 100% | Added to .gitignore; directory preserved with .gitkeep. |
| `data/evaluation/evaluator.js` | File (JavaScript) | Legacy Mongo-based evaluator | **REMOVED** | **NO** | Yes (vs `run_benchmarks.py`) | **DELETED** | 100% | Deleted during cleanup. |
| `civicsphere.db` | File (SQLite) | Local dev SQLite database | **REMOVED** | **NO** | No | **IGNORED & CLEANED** | 100% | Added to .gitignore. |

---

## 4. Dead & Duplicate Code Analysis

1. **Authentication & Session Handling**:
   - *Canonical*: `backend/app/auth/routes.py` (FastAPI + httpOnly cookies + CSRF + TOTP MFA).
   - *Duplicate / Dead*: `server/src/controllers/authController.js` and `Civicsphere/backend/controllers/authController.js` (Express + JWT in request body).
   - *Impact*: 0 impact on active runtime. Safe to remove.

2. **Government Navigator Services**:
   - *Canonical*: `backend/app/government/routes.py` & `backend/app/government/services/`.
   - *Duplicate / Dead*: `server/src/controllers/governmentController.js`, `server/src/services/government/aiService.js`, `server/src/services/government/recommendationEngine.js`.
   - *Impact*: 0 impact on active runtime. Safe to remove.

3. **Document Ingestion & Pipeline**:
   - *Canonical*: `backend/app/documents/` (7-stage state machine + PDF malware scanner + OCR extractor + graph linker).
   - *Duplicate / Dead*: `server/src/controllers/documentController.js` & `Civicsphere/backend/controllers/documentController.js`.
   - *Impact*: 0 impact on active runtime. Safe to remove.

4. **Evaluation Benchmarks**:
   - *Canonical*: `infrastructure/scripts/run_benchmarks.py` + `backend/tests/evaluation/test_benchmarks.py`.
   - *Duplicate / Dead*: `data/evaluation/evaluator.js`.
   - *Impact*: 0 impact on active runtime. Safe to remove.
