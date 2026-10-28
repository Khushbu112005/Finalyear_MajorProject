# Chapter 06 — AI/ML, RAG, Agents and Prompt Architecture

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. AI Provider Inventory & Abstraction Layer

CivicSphere AI implements clean, vendor-agnostic provider abstractions in `backend/app/common/providers/` allowing seamless runtime switching between local offline execution, mock benchmarking, and commercial LLM APIs.

| Provider Type | Abstract Interface | Concrete Implementations | Default (Development) | Production Configured |
| :--- | :--- | :--- | :--- | :--- |
| **Embeddings** | `EmbeddingProvider` | `MockEmbeddingProvider`, `OpenAIEmbeddingProvider`, `GeminiEmbeddingProvider`, `HuggingFaceEmbeddingProvider` | `mock` (384 dims) | `mock` (Commercial key pending) |
| **Language Models** | `LLMProvider` | `MockLLMProvider`, `AnthropicLLMProvider`, `OpenAILLMProvider`, `GoogleLLMProvider` | `mock` | `mock` (Commercial key pending) |
| **Reranker** | `RerankerProvider` | `HeuristicReranker`, `CohereReranker`, `CrossEncoderReranker` | `heuristic` | `heuristic` |
| **OCR & Vision** | — | PyMuPDF structural parser (`fitz`) | PyMuPDF | PyMuPDF |
| **Graph Reasoning** | — | `GraphTraversalService` & `PersistentGraphRepository` | In-memory + PostgreSQL | PostgreSQL Relational Graph |

### 1.1 Embedding Generation Architecture (`backend/app/common/providers/embedding.py`)
- **Target Vector Dimension:** 384 dimensions (enforced across all providers).
- **Mock Embedding Strategy:** Deterministic feature-hash embedding provider using MD5 token hashing and stopword filtering (`STOPWORDS` list). This provides exact semantic matching for legal queries during offline testing without external network calls.
- **L2 Normalization:** All embeddings (mock or real) are normalized using $\hat{v} = \frac{v}{\|v\|_2}$ ensuring cosine similarity corresponds directly to the inner dot product: $\text{sim}(u, v) = u \cdot v$.

---

## 2. 13-Stage Knowledge Ingestion Pipeline

The knowledge ingestion pipeline ([`backend/app/knowledge/ingestion/pipeline.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/knowledge/ingestion/pipeline.py)) processes raw legal acts into dual-indexed knowledge representation:

```
[1. Source Text / URL]
          |
          v
[2. Source Fetcher & SSRF Validation]
          |
          v
[3. Trust & Verification Evaluator] (OFFICIAL_LEGISLATION, GAZETTE, JUDICIAL_RECORD)
          |
          v
[4. Source Registry Registration] (Status: PROCESSING)
          |
          v
[5. Cryptographic Hashing] (SHA-256 Content Hash)
          |
          v
[6. Content Cleaner & Legal Parser] (Section headers, punctuation normalization)
          |
          v
[7. Deterministic Chunker] (Section-aware, 300-500 words per chunk)
          |
          v
[8. Entity Extractor] (Extracts: Sections, Rights, Public Authorities, Penalties)
          |
          v
[9. Relationship Extractor] (Extracts: ESTABLISHES, ENFORCES, APPEALS_TO, AMENDS)
          |
          v
[10. Chunk Embedder] (Generates 384-dimensional vector embeddings)
          |
          v
[11. Graph Writer] (Persists nodes and edges into PostgreSQL / Neo4j)
          |
          v
[12. Vector Writer] (Persists vectors into `knowledge_embeddings` / pgvector)
          |
          v
[13. Source Finalization & Audit Trail] (Status: COMPLETED, Audit Event logged)
```

---

## 3. End-to-End Hybrid RAG Pipeline

When a citizen submits a legal question, the query passes through a multi-stage retrieval and validation pipeline before answer synthesis:

```
Citizen Query ("What are the timelines for an RTI appeal?")
                     |
                     v
   [1. Prompt Injection & Poisoning Filter] (RegEx & Threat Scanner)
                     |
                     v
   [2. Out-of-Domain Circuit Breaker] (Pre-check for legal & civic relevance)
                     |
                     +---> [If Irrelevant]: Return 0.0 Confidence & "Out of Scope"
                     |
                     +---> [If Relevant]: Continue
                     v
   [3. Query Preprocessing & Vectorization] (Generate 384-d normalized query vector)
                     |
                     v
   [4. Hybrid Retrieval Engine]
        |---> Lexical Retrieval (BM25 token-match on section titles & text)
        |---> Vector Retrieval (Cosine similarity search over pgvector chunks)
        |---> Graph Retrieval (1-to-2 hop neighborhood traversal from seed entities)
                     |
                     v
   [5. Reciprocal Rank Fusion (RRF)]
        RRF_Score(d) = \sum_{m \in \{lexical, vector, graph\}} \frac{1}{k + rank_m(d)}, with k = 60
                     |
                     v
   [6. Metadata & Jurisdiction Filtering] (Status: ACTIVE, Country: IN)
                     |
                     v
   [7. Evidence Pack Assembly] (Top 5 chunks with source attribution & section numbers)
                     |
                     v
   [8. LLM Synthesis & Grounding] (10-Section Structured Answer Generation)
                     |
                     v
   [9. Anti-Hallucination Citation Verification] (Checks citations against source registry)
                     |
                     v
   [10. Response Envelope Delivery] (Confidence Score: 0.98 + Warning flags)
```

---

## 4. Multi-Agent Orchestrator (Phase 6)

In addition to direct RAG retrieval, CivicSphere AI features a **Multi-Agent Orchestrator** ([`backend/app/agents/orchestrator.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/agents/orchestrator.py)) coordinating five specialized AI agents.

### 4.1 Specialist Agents
1. **Legal Agent (`LegalAgent`):** Analyzes statutory provisions, identifies applicable legal doctrines, and calculates limitation periods.
2. **Knowledge Agent (`KnowledgeAgent`):** Interacts with the hybrid retrieval engine and executes graph neighborhood queries.
3. **Government Agent (`GovernmentAgent`):** Analyzes citizen welfare problems and checks multi-variable scheme eligibility.
4. **Document Agent (`DocumentAgent`):** Analyzes extracted OCR text from user-uploaded PDFs and extracts evidentiary claims.
5. **Citation Agent (`CitationAgent`):** Verifies that all cited sections exist in the indexed statutory acts registry.
6. **Safety Agent (`SafetyAgent`):** Enforces PII sanitization, checks for prompt injection attempts, and prevents unauthorized privilege escalation.

### 4.2 Bounded Execution & Loop Prevention
To guarantee predictable execution and prevent runaway costs in agentic workflows:
- **Maximum Step Limit:** Hard limit of 5 steps per task plan.
- **Deterministic Tool Calling:** Agents invoke sandboxed tools from [`ToolRegistry`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/agents/core/tools.py) with validated JSON schemas.
- **Traceability:** Every agent action, input parameters, and tool return value is captured in the execution log returned in the API response envelope.

---

## 5. Anti-Hallucination & Safety Safeguards

1. **Circuit Breaker for Unsupported Queries:**
   - Evaluated in `LegalGuidanceEngine::process_legal_query`.
   - If an input query (e.g., "What is the mass of Jupiter?", "Quantum gravity in black holes") shares zero statutory keywords or semantic proximity with registered acts, the system immediately returns an out-of-scope response with confidence `0.0`.
2. **Tamper-Evident Source Provenance:**
   - Every chunk record maintains a direct cryptographic relationship:
     $$\text{Chunk Hash} = \text{SHA256}(\text{source\_id} + \text{section\_number} + \text{text})$$
   - Chunks without an ACTIVE, verified parent source in `knowledge_sources` are excluded from retrieval.
3. **Prompt Injection Defense (`backend/app/knowledge/security/prompt_injection.py`):**
   - Detects jailbreak patterns ("ignore previous instructions", "system prompt reveal", "roleplay as judge").
   - Suspicious inputs trigger an automatic `PROMPT_INJECTION_DETECTED` security audit event and are sanitized before embedding.
