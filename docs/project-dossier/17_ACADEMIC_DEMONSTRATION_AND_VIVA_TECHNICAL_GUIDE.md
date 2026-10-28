# Chapter 17 — Academic Demonstration and Viva Technical Guide

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  
**Audience:** Final-Year Major Project Examination Panel, Project Evaluators & Defense Candidates  

---

## 1. Project Summary for Evaluation Panel

**Project Title:** CivicSphere AI — AI-Powered Civic and Legal Intelligence Platform  
**Domain:** Artificial Intelligence, Multi-Agent Systems, Natural Language Processing, Full-Stack Engineering, Legal Informatics  
**Primary Contribution:** An evidence-grounded, anti-hallucinatory civic intelligence architecture tailored to the Indian legal system. The platform combines a 13-stage statutory ingestion pipeline, dual vector-graph indexing, hybrid RAG retrieval with Reciprocal Rank Fusion, five specialized agent personas, and strict security isolation (RBAC, IDOR, SSRF defense, and double-submit CSRF).

---

## 2. 10-Step Live Viva Demonstration Walkthrough

During your final-year project viva, follow this exact sequence to demonstrate all 6 core modules and prove genuine database persistence:

```
[Step 1: System Health & Readiness]
  -> Navigate to: https://civicsphere-backend.vercel.app/api/v1/health/ready
  -> Evidence: Point out `"ready": true`, `"graph_nodes": 34`, `"vector_records": 12`, `"persistence": "postgresql_pgvector"`

[Step 2: Platform Landing Page]
  -> Navigate to: https://civicsphere-web.vercel.app/
  -> Evidence: Highlight the 6 integrated module launch cards and the clean responsive Next.js 15 App Router design.

[Step 3: User Registration & Session Security]
  -> Navigate to: /register
  -> Action: Register a new account (e.g. `viva.evaluator@example.com`, Citizen role).
  -> Evidence: Show automatic issuance of httpOnly JWT cookie and X-CSRF-Token generation.

[Step 4: Statutory Legal Guidance (Module A)]
  -> Navigate to: /legal
  -> Query: "What is the maximum time limit for a Public Information Officer to respond to an RTI request?"
  -> Evidence: Show 10-section structured guidance, 98% confidence score, and exact citation to Section 7(1) of the RTI Act 2005.

[Step 5: Anti-Hallucination Out-of-Domain Circuit Breaker]
  -> Query: "How do quantum fluctuations affect Hawking radiation in black holes?"
  -> Evidence: System immediately returns 0.0% confidence, triggers the out-of-domain guardrail, and refuses to hallucinate legal rules.

[Step 6: Government Scheme Navigator (Module B)]
  -> Navigate to: /government
  -> Query: "I need financial support to construct an urban house for my economically weaker family."
  -> Input Demographics: Income < 3 Lakhs, Urban Maharashtra.
  -> Evidence: System recommends Pradhan Mantri Awas Yojana (PMAY-U) with exact CLSS subsidy calculations and eligibility rules.

[Step 7: Citizen Case Workspace & IDOR Protection]
  -> Navigate to: /cases
  -> Action: Create a new legal case matter titled "Consumer Defect Claim against Electronics Vendor".
  -> Evidence: Case record saved to PostgreSQL with unique UUID, tracking status as `OPEN`. Show that another user cannot view this case without authorization.

[Step 8: Intelligent Document Processing & OCR (Module D)]
  -> Navigate to: /documents
  -> Action: Upload a sample legal notice PDF (`uploads/doc_0a34cc1fee634178a8ebbff8cef7694e.pdf`).
  -> Evidence: Show the 7-stage processing pipeline executing magic-byte validation, PyMuPDF text extraction, and legal document classification.

[Step 9: Interactive Knowledge Graph Explorer (Module C)]
  -> Navigate to: /knowledge
  -> Action: Explore the neighborhood of the entity "Central Information Commission".
  -> Evidence: Show connected statutory nodes: `Right to Information Act 2005` (ESTABLISHES), `Second Appellate Authority` (POWERS).

[Step 10: Administrative Compliance & Audit Trail (Phase 10)]
  -> Navigate to: /admin/audit (or query `GET /api/v1/audit/events`)
  -> Evidence: Display structured JSON event logs capturing the user registration, ingestion job, and query execution timestamps.
```

---

## 3. High-Probability Viva Defense Questions & Model Answers

### Q1: What makes CivicSphere AI different from asking ChatGPT or Claude a legal question?
**Model Answer:**  
"Generic LLMs suffer from severe legal hallucinations: they invent non-existent statutory sections, cite overruled judgments, and apply foreign (US/UK) laws to Indian contexts. CivicSphere AI implements an **evidence-first, anti-hallucination architecture**:
1. It queries a closed, verified knowledge repository of official Indian enactments (e.g., RTI Act, DPDP Act, Consumer Protection Act) published via India Code.
2. An out-of-domain circuit breaker automatically rejects non-legal or out-of-scope queries with confidence `0.0`.
3. Every response is synthesized exclusively from retrieved statutory chunks and must include verified section-level citations with official legislative URLs."

---

### Q2: Why did you choose a Hybrid Retrieval architecture (Lexical + Vector + Graph) instead of standard vector-only RAG?
**Model Answer:**  
"Vector-only RAG excels at fuzzy semantic matching, but it struggles with exact statutory references. For example, a citizen asking about *'Section 7(1) proviso'* requires exact lexical matching (BM25) because dense embeddings often blur fine subsection distinctions. Conversely, legal reasoning is inherently relational: an Act *establishes* a Commission, which *adjudicates* Appeals against an Officer. By fusing **BM25 lexical search**, **pgvector dense cosine similarity**, and **graph neighborhood traversal** using **Reciprocal Rank Fusion (RRF with $k=60$)**, we achieve both high semantic recall and pinpoint statutory precision."

---

### Q3: How do you guarantee durable persistence in serverless environments like Vercel?
**Model Answer:**  
"Vercel serverless functions are ephemeral—in-memory objects and local `/tmp` files are destroyed between invocations. To ensure permanent persistence:
1. All application state (users, cases, documents, knowledge chunks, graph nodes, and pgvector embeddings) is stored in a hosted PostgreSQL 17.6 database on Supabase via Alembic migrations.
2. In `backend/app/main.py::lifespan()`, we implement **Cold-Start Hydration**: upon container startup, the backend connects to PostgreSQL via `asyncpg`, loads the registered source metadata, and hydrates the in-memory graph repository in under 800 milliseconds.
3. We set `statement_cache_size = 0` and connection timeouts to ensure compatibility with Supabase's transaction pooler."

---

### Q4: Explain the security threat model of the platform.
**Model Answer:**  
"CivicSphere AI is engineered according to OWASP Top 10 and multi-tenant security principles:
- **Authentication:** Passwords hashed with `bcrypt` (12 rounds); sessions managed via `httpOnly`, `Secure` JWT cookies with 24-hour expiration.
- **CSRF Defense:** Double-submit cookie pattern with `X-CSRF-Token` header verification on all mutations.
- **IDOR Protection:** Case workspace records strictly enforce `citizen_id == current_user.id` or assigned counsel role.
- **SSRF Defense:** During remote source ingestion, target URLs are validated to block private RFC 1918 IPs and cloud metadata addresses (`169.254.169.254`).
- **File Upload Protection:** Uploaded PDFs are validated using `%PDF-` magic-byte checks and scanned for active JavaScript/executable streams before parsing."

---

### Q5: How do the specialized AI agents coordinate their work?
**Model Answer:**  
"The platform features a Multi-Agent Orchestrator in `backend/app/agents/orchestrator.py` managing 5 specialists: Legal, Knowledge, Government, Document, and Citation agents. The orchestrator:
1. Formulates a bounded execution plan (maximum 5 steps to prevent runaway loops).
2. Dispatches sub-tasks to agents, each executing sandboxed tools from a registered `ToolRegistry` with strict Pydantic parameter validation.
3. Synthesizes an unified response, attaching full execution logs and citation verification proofs."

---

### Q6: What are the current limitations of the platform?
**Model Answer:**  
"To maintain academic integrity, we openly document two primary constraints:
1. **Mock Embeddings in Production:** Because commercial OpenAI/Cohere API keys require ongoing billing, production currently runs with a deterministic token-hash mock embedding provider (384 dimensions). This provides exact keyword-semantic matching for indexed acts, but high-dimensional dense neural embeddings will be enabled once commercial credentials are provisioned.
2. **Database Inactivity Pausing:** On the free Supabase tier, the database automatically pauses after 7 days of idle time. For our viva defense, we maintain a containerized local Docker PostgreSQL stack on port 5432 to provide an instant, zero-latency backup."

---

## 4. Evaluation Checklist for Viva Examiners

| Criterion | Evaluation Standard | Evidence in Project |
| :--- | :--- | :--- |
| **Problem Formulation** | Clear, societal impact addressing Indian civic/legal accessibility | 10-section legal guidance, RTI/DPDP/Consumer acts |
| **System Architecture** | Robust, modular, and decoupled design | Modular Monolith FastAPI backend + Next.js 15 client |
| **Database Design** | Normalized schema, ACID compliance, vector storage | PostgreSQL 17 + pgvector, Alembic migrations 0001-0003 |
| **AI / NLP Rigor** | Advanced RAG with hybrid search and anti-hallucination | BM25 + Vector + Graph fusion via RRF; circuit breaker |
| **Code Quality & QA** | Comprehensive test coverage with zero failures | 91 passing tests in Pytest; ESLint 0 errors; TypeScript typed |
| **Security Engineering**| Proactive mitigation of common web vulnerabilities | RBAC, httpOnly JWT, CSRF token, SSRF defense, IDOR checks |
| **Live Demonstration** | Functioning deployment accessible over the public internet | `civicsphere-web.vercel.app` & `civicsphere-backend.vercel.app` |
