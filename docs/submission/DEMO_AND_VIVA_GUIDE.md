# CivicSphere AI — Academic Demonstration & Viva Voce Guide

**Project Title:** CivicSphere AI — AI-Powered Civic and Legal Intelligence Platform  
**Academic Degree:** Bachelor of Engineering (Computer Engineering)  
**Academic Year:** 2025–2026 (Final Year Major Project)  
**Target Audience:** Academic Evaluation Committee, External Examiners, and Project Guides  

---

## 1. Project Abstract & Core Motivation

In the Indian legal and civic landscape, citizens encounter severe barriers to discovering statutory rights, assessing eligibility for government welfare schemes, and filing administrative grievances. Existing general-purpose Large Language Models (LLMs) frequently suffer from **statutory hallucinations**, fabricating non-existent sections, court precedents, and procedural timelines.

**CivicSphere AI** solves this critical challenge by providing an evidence-grounded, multi-modal civic intelligence platform. Built as a high-performance modular monolith with Next.js and FastAPI, CivicSphere introduces:
1. **Zero-Hallucination Statutory Guidance:** A 10-section structured legal guidance synthesizer backed by a strict anti-hallucination circuit breaker.
2. **Multi-Channel Hybrid Retrieval (RRF):** Combining pgvector cosine distance, lexical BM25 token matching, and bidirectional depth-2 knowledge graph traversals fused via Reciprocal Rank Fusion.
3. **Intelligent Document AI:** A 7-stage document state machine incorporating an active binary stream PDF malware scanner to neutralize JavaScript injection exploits.
4. **Specialist Multi-Agent Fleet:** Autonomous domain agents coordinated with bounded reasoning loops and sandboxed tool registries.
5. **Defense-in-Depth Security:** httpOnly double-submit CSRF auth, RFC 6238 TOTP MFA, strict IDOR prevention, PII sanitization, and SSRF cloud metadata blockers.

---

## 2. 10-Minute Viva Demonstration Script

### Walkthrough Timeline:
- **00:00 - 02:00:** Motivation, System Topology & Architecture
- **02:00 - 04:00:** Demo 1 & 2 — Statutory RAG & Anti-Hallucination Circuit Breaker
- **04:00 - 06:00:** Demo 3 — Government Scheme Eligibility Evaluation
- **06:00 - 07:30:** Demo 4 — Document AI & Active PDF Malware Protection
- **07:30 - 09:00:** Demo 5 — Multi-Agent Coordination & Case Workspace
- **09:00 - 10:00:** Security, Observability & Concluding Remarks

---

### Step-by-Step Demonstration Execution

#### Demo 1: Grounded Statutory Legal Guidance (`/legal`)
1. **Navigate to:** `https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app/legal` (or `http://localhost:3000/legal`)
2. **Input Query:**
   > *"What are the rules and timelines for filing a first appeal under Section 19 of the Right to Information Act 2005?"*
3. **Observe Results:**
   - Confidence score: **0.98** (High Grounding)
   - Fail-Safe State: **VERIFIED**
   - Renders 10 structured sections: Understanding, Statutory Legal Basis, General Meaning, Application, Recommended Next Steps, Evidence Checklist, Competent Desks, Official Gazette Citations, Statutory Limitations (30-day appeal window), and Warnings.
   - Click on the statutory citation to verify official government URL.

#### Demo 2: Anti-Hallucination Circuit Breaker Fail-Safe (`/legal`)
1. **Input Adversarial / Unindexed Query:**
   > *"What are the regulations and tax credits for deep-sea mining permits in Antarctica under Indian Maritime law?"*
2. **Observe Results:**
   - Confidence score: **0.0**
   - Fail-Safe State: **INSUFFICIENT_EVIDENCE**
   - The synthesizer suppresses speculative generation, explicitly stating that no authoritative statutory gazette record in the knowledge base validates the claim, and directs the user to authorized legal desks.

#### Demo 3: Government Scheme Navigator & Eligibility Evaluation (`/government`)
1. **Navigate to:** `https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app/government`
2. **Input Citizen Situation:**
   > *"I am a small farmer in Maharashtra with 1.5 hectares of land seeking agricultural equipment subsidies."*
3. **Execute Evaluation:**
   - Dynamic parameter extraction identifies: State = Maharashtra, Landholding = 1.5 ha (Small Farmer), Sector = Agriculture.
   - Evaluates citizen parameters against government welfare rules.
   - Outputs tailored scheme recommendation, eligibility score, required document checklist, and step-by-step grievance/application desk procedures.

#### Demo 4: Intelligent Document AI & Active Malware Scanning (`/documents`)
1. **Navigate to:** `https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app/documents`
2. **Upload Legitimate Document:**
   - Upload sample legal notice PDF (`<= 5MB`).
   - Observe visual 7-stage state machine progression: `UPLOADED` $\rightarrow$ `VALIDATING` $\rightarrow$ `SECURITY_SCANNING` $\rightarrow$ `PROCESSING` $\rightarrow$ `ANALYZING` $\rightarrow$ `LINKING_KNOWLEDGE` $\rightarrow$ `READY`.
   - Inspect extracted legal entities linked to knowledge graph nodes.
3. **Explain Security Malware Defense:**
   - Point out `DocumentSecurityScanner` byte-level inspection blocking malicious PDFs containing `/JavaScript` or `/Launch` exploit triggers before parsing.

#### Demo 5: Multi-Agent Specialist Coordination (`/assistant`)
1. **Navigate to:** `https://civicsphere-web-devanshparagsavla1709-6335s-projects.vercel.app/assistant`
2. **Execute Complex Civic Multi-Domain Query:**
   > *"My tenant has stopped paying rent for 6 months and is threatening me. What are my legal remedies and how do I file a police complaint?"*
3. **Observe Execution:**
   - Multi-agent coordinator decomposes query into legal obligations (Rent Control / Eviction law) and administrative action (Police grievance).
   - Involves Legal Specialist Agent and Government Navigator Agent.
   - Shows bounded iteration count (max 5 iterations) and sandboxed tool calls.

#### Demo 6: Privileged TOTP Multi-Factor Authentication (`/settings`)
1. **Navigate to:** `/settings`
2. **Demonstrate MFA Setup:**
   - Click "Enable Multi-Factor Authentication".
   - Shows RFC 6238 base32 secret and QR code.
   - Verifies 6-digit TOTP code via Google Authenticator or test harness.
   - Demonstrates that administrative actions now require MFA challenge.

#### Demo 7: Tamper-Evident Audit & Security Logs (`/admin/audit`)
1. **Navigate to:** `/admin/audit`
2. **Inspect Structured Audit Trail:**
   - Review live event stream capturing `KNOWLEDGE_RETRIEVAL_EXECUTED`, `USER_AUTHENTICATED`, and `SECURITY_EVENT`.
   - Demonstrate immutable fields: `event_id`, `actor_id`, `role`, `action`, `resource_id`, and exact UTC timestamps.

---

## 3. Frequently Asked Questions (Viva Voce & Technical Defense)

### Q1: How does CivicSphere AI prevent LLM hallucinations on statutory laws?
**Answer:**
We employ a multi-layered anti-hallucination architecture:
1. **Strict Evidence Gating:** Answers are generated strictly from the retrieved `EvidencePack` rather than open parametric LLM memory.
2. **Confidence Thresholding:** Every retrieval candidate is scored; if overall confidence falls below `0.50`, the system aborts synthesis and triggers `FailSafeState.INSUFFICIENT_EVIDENCE`.
3. **Citation Provenance Verification:** A dedicated Citation Verification Agent verifies every generated citation against the authoritative source registry. Unmatched citations are stripped.

### Q2: Why use Hybrid Retrieval (Vector + BM25 + Graph) rather than pure Vector Search?
**Answer:**
Pure vector embeddings struggle with exact legal citations (e.g., distinguishing "Section 19(1)" from "Section 19(2)") due to cosine similarity blurring exact alphanumeric tokens. BM25 guarantees precision on exact statutory keywords. Knowledge graph depth-2 traversal captures non-textual hierarchical relationships (such as Appellate Authorities linked to First Appellate Officers). Combining them via Reciprocal Rank Fusion (RRF) delivers an MRR of 1.0000 on our benchmarks.

### Q3: How does the system handle serverless cold-starts on Vercel without data loss?
**Answer:**
In `backend/app/main.py`, serverless container initialization executes `hydrate_from_db()`. When a container spins up, it queries PostgreSQL tables (`knowledge_sources`, `knowledge_chunks`, `knowledge_embeddings`, `knowledge_graph_nodes`, and `knowledge_graph_edges`) and populates the in-memory vector and graph index structures. If the external database is unreachable, the system falls back to pre-seeded statutory acts, ensuring uninterrupted availability.

### Q4: How is object-level security (IDOR) enforced across citizen cases and documents?
**Answer:**
In both `cases` and `documents` routers, every endpoint extracts the verified user identity from the server-authoritative `AuthContext` (derived from the decrypted httpOnly JWT cookie). When querying or mutating an object by ID, the SQLAlchemy query includes `WHERE id = :id AND user_id = :auth_user_id`. Any attempt by User A to access User B's record returns a `404 Not Found` or `403 Forbidden`.

### Q5: What is the benefit of the modular monolith design over microservices for this project?
**Answer:**
A modular monolith provides strict module boundary encapsulation (`/legal`, `/government`, `/knowledge`, `/documents`, `/agents`, `/cases`) while sharing a single unified runtime and process memory. This eliminates distributed transaction complexity, RPC network serialization overhead, and split-brain states, while retaining the freedom to decompose individual modules into microservices in the future.

### Q6: How are citizen privacy and personally identifiable information (PII) protected?
**Answer:**
Our `PIISanitizer` module intercepts all user inputs and document OCR streams before they are passed to retrieval engines, external LLM providers, or persistent audit logs. It applies deterministic regex masks for Indian PII formats, including 12-digit Aadhaar numbers (`XXXX-XXXX-1234`), 10-character PAN identifiers (`ABCDE****F`), and mobile telephone numbers.

---

## 4. Summary of Key Engineering Innovations

1. **Deterministic Anti-Hallucination Circuit Breaker** preventing inaccurate legal advice.
2. **Multi-Channel Reciprocal Rank Fusion** combining vector, lexical, and graph signals.
3. **Active Byte-Stream PDF Malware Defense** built specifically for citizen document portals.
4. **RFC 6238 TOTP Multi-Factor Authentication** with zero secret leakage in JSON serializations.
5. **Tamper-Evident Database-Backed Audit Engine** for regulatory compliance.
