# Chapter 10 — System Architecture and End-to-End Data Flows

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. System Context Diagram (C4 Level 1)

```mermaid
flowchart TD
    Citizen["Indian Citizen / Public User"]
    Researcher["Legal Researcher / Paralegal"]
    Admin["System Administrator"]

    subgraph CivicSpherePlatform["CivicSphere AI Platform"]
        WebPortal["Next.js 15 Web Portal\n(App Router / Turbopack)"]
        BackendAPI["FastAPI Modular Monolith\n(Unified Backend / Python 3.12)"]
        PostgreSQL["Durable Database & Vector Index\n(PostgreSQL 17.6 + pgvector)"]
        Neo4j["Knowledge Graph\n(Neo4j 5.15 / Relational Graph)"]
    end

    ExternalIndiaCode["Official India Code\n(Legislative Dept, Law Ministry)"]
    ExternalMeitY["MeitY & Gov Portals\n(Gazette & Scheme Portals)"]

    Citizen -->|"Asks civic/legal queries,\nchecks schemes, uploads docs"| WebPortal
    Researcher -->|"Reviews open cases,\ninspects statutory graph"| WebPortal
    Admin -->|"Monitors audit telemetry,\ntriggers reindexing"| WebPortal

    WebPortal -->|"HTTPS REST API (/api/v1/*)\nwith Cookies + CSRF Header"| BackendAPI

    BackendAPI -->|"ACID Relational Writes\n& pgvector Similarity"| PostgreSQL
    BackendAPI -->|"Entity Traversal &\nNeighborhood Queries"| Neo4j
    BackendAPI -.->|"Fetches verified text\n(with SSRF checks)"| ExternalIndiaCode
    BackendAPI -.->|"Fetches gazette updates"| ExternalMeitY
```

### Narrative 1: System Context
The CivicSphere AI platform acts as a secure intermediary between ordinary citizens, legal professionals, and authoritative Indian statutory repositories. Users access the platform via a responsive web client hosted on Vercel. All state-changing and analytical requests flow to the FastAPI backend, which coordinates relational persistence in PostgreSQL, vector searches in pgvector, and graph traversals.

---

## 2. Frontend / Backend / Database Architecture (C4 Level 2)

```mermaid
flowchart LR
    subgraph ClientLayer["Client Layer (Browser)"]
        UI["React 19 Components\n(Assistant, Schemes, Cases)"]
        ApiClient["Universal ApiClient\n(api-client.ts)"]
    end

    subgraph EdgeLayer["Edge / Routing Layer (Vercel)"]
        NextServer["Next.js Server / Proxy\n(civicsphere-web.vercel.app)"]
    end

    subgraph BackendLayer["Backend Application Layer (FastAPI)"]
        MainApp["FastAPI Main App & Lifespan\n(backend/app/main.py)"]
        RateLimiter["TokenBucket RateLimiter"]
        SecurityMW["Security & Correlation MW"]
        
        subgraph Subsystems["Core Subsystems"]
            AuthMod["Auth Subsystem\n(JWT, RBAC, TOTP)"]
            LegalMod["Legal Guidance Engine\n(Module A)"]
            GovMod["Government Scheme Nav\n(Module B)"]
            DocMod["Document Processing\n(Module D, OCR)"]
            CaseMod["Case Workspace\n(Module Cases)"]
            KnowMod["Knowledge & Hybrid RAG\n(Module C)"]
            AgentMod["Multi-Agent System\n(Phase 6 Orchestrator)"]
        end
    end

    subgraph DataLayer["Persistence & Storage Layer"]
        PG["PostgreSQL 17.6 (Supabase)\n- users, cases, documents\n- knowledge_chunks\n- knowledge_embeddings (pgvector)\n- knowledge_graph_nodes\n- knowledge_graph_edges"]
        LocalDisk["Local File Storage / MinIO\n(uploads/*.pdf)"]
    end

    UI --> ApiClient
    ApiClient -->|"HTTPS JSON / FormData"| NextServer
    NextServer -->|"Proxy Rewrites"| MainApp
    MainApp --> RateLimiter --> SecurityMW
    SecurityMW --> Subsystems
    Subsystems -->|"Async Sessions (SQLAlchemy)"| PG
    DocMod -->|"PDF Binary Writes"| LocalDisk
```

### Narrative 2: Application Architecture
The architecture is designed as a **Modular Monolith**:
- Code is partitioned into strictly bounded domains (`auth`, `legal`, `government`, `knowledge`, `documents`, `cases`, `agents`, `audit`).
- Modules share a single async database connection pool, eliminating distributed transaction overhead while preserving domain boundaries.
- Cross-module communication is performed via clean Python service calls (e.g. `LegalGuidanceEngine` directly invokes `hybrid_retrieval_service.retrieve`).

---

## 3. End-to-End Legal Question-to-Answer Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen / User
    participant Web as Web Portal (/legal)
    participant API as FastAPI Router
    participant Engine as LegalGuidanceEngine
    participant Guard as CircuitBreaker / Security
    participant RAG as HybridRetrievalService
    participant PG as PostgreSQL (pgvector)
    participant Graph as GraphRepository

    Citizen->>Web: Enters query ("What is RTI appeal timeline?")
    Web->>API: POST /api/v1/legal/query { query, jurisdiction: "IN" }
    API->>Engine: process_legal_query(query)
    Engine->>Guard: evaluate_query_relevance(query)
    Guard-->>Engine: Status: ALLOWED (Relevance = High)
    
    Engine->>RAG: retrieve(RetrievalRequest)
    par Lexical Matching
        RAG->>RAG: Compute BM25 token scores on statutory sections
    and Vector Similarity
        RAG->>PG: Cosine similarity search over knowledge_chunks
        PG-->>RAG: Top vector candidate chunks
    and Graph Expansion
        RAG->>Graph: Traverse 1-hop neighborhood of extracted legal entities
        Graph-->>RAG: Connected statutory nodes (CIC, First Appellate)
    end

    RAG->>RAG: Combine candidates via Reciprocal Rank Fusion (k=60)
    RAG->>RAG: Assemble EvidencePack (Chunks, Sections, Citations)
    RAG-->>Engine: EvidencePack (Confidence: 0.98)
    
    Engine->>Engine: Synthesize 10-section structured legal guidance
    Engine->>Engine: Attach official India Code citations
    Engine-->>API: LegalAnswer (Confidence: 0.98, Citations: RTI Act Sec 19)
    API-->>Web: HTTP 200 ApiResponse[LegalAnswer]
    Web-->>Citizen: Renders 10 accordion cards & statutory badges
```

### Narrative 3: Legal Query Flow
1. Citizen inputs query in web interface.
2. The query is posted to `/api/v1/legal/query`.
3. The circuit breaker verifies legal and civic relevance.
4. The hybrid retrieval engine concurrently queries BM25 lexical index, pgvector embeddings, and knowledge graph neighborhood.
5. Reciprocal Rank Fusion merges rankings to select top 5 authoritative chunks.
6. A 10-section structured answer is assembled, citing specific sections and India Code URLs.
7. Web portal renders results with an overall confidence score (0.98).

---

## 4. Ingestion Pipeline Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Seed Runner
    participant Ingest as IngestionPipeline
    participant Fetcher as SourceFetcher
    participant Cleaner as ContentCleaner & Chunker
    participant Extractor as Entity & Relationship Extractor
    participant Embedder as ChunkEmbedder
    participant DB as PostgreSQL 17.6

    Admin->>Ingest: ingest_source(title, publisher, official_url, raw_text)
    Ingest->>Ingest: Check SSRF safety (blocks RFC1918 private IPs)
    Ingest->>DB: Register source in knowledge_sources (Status: PROCESSING)
    Ingest->>Cleaner: Clean text and split on section boundaries
    Cleaner-->>Ingest: Chunks (300-500 words per chunk)
    
    Ingest->>Extractor: Extract legal entities and relationships
    Extractor-->>Ingest: Entities (Acts, Sections, Bodies) & Edges (ESTABLISHES, APPEALS_TO)
    
    Ingest->>Embedder: embed_chunks(chunks)
    Embedder-->>Ingest: 384-dimensional normalized vectors
    
    par Persist Chunks & Vectors
        Ingest->>DB: INSERT into knowledge_chunks & knowledge_embeddings
    and Persist Graph
        Ingest->>DB: INSERT into knowledge_graph_nodes & knowledge_graph_edges
    end

    Ingest->>DB: UPDATE knowledge_sources (Status: COMPLETED, Version: 1)
    Ingest->>DB: INSERT into audit_events (Event: KNOWLEDGE_INGESTION_COMPLETED)
    Ingest-->>Admin: Ingestion summary (Chunks: 4, Entities: 9, Relationships: 8)
```

### Narrative 4: Ingestion Pipeline
When statutory acts are ingested:
1. Source URL is evaluated for trust level and SSRF safety.
2. The source record is created in `knowledge_sources` with a SHA-256 content hash.
3. The text is parsed into structured section chunks.
4. Entity and relationship extractors build graph nodes and edges.
5. The chunk embedder generates 384-dimensional dense vectors.
6. Chunks, vectors, graph nodes, and edges are committed in a single atomic database transaction.
7. An audit event is recorded for compliance.

---

## 5. Multi-Agent Orchestration Flow

```mermaid
flowchart TD
    UserQuery["User Query: Citizen Issue"] --> Orchestrator["Agent Orchestrator\n(orchestrator.py)"]
    
    Orchestrator --> SafetyCheck["SafetyAgent: Input Sanitization\n& PII Masking"]
    SafetyCheck --> Planner["Generate Bounded 5-Step Execution Plan"]
    
    Planner --> Step1["Step 1: Consult KnowledgeAgent\n(Execute Hybrid Retrieval)"]
    Step1 --> Step2["Step 2: Consult LegalAgent\n(Check Limitation Deadlines)"]
    Step2 --> Step3["Step 3: Consult CitationAgent\n(Verify Section Validity)"]
    
    Step3 --> Synthesizer["Synthesize Unified Agent Response"]
    Synthesizer --> AuditLog["Log Execution Trace & Tools Used"]
    AuditLog --> FinalResponse["Return ApiResponse to Client"]
```

### Narrative 5: Multi-Agent Coordination
The multi-agent orchestrator decomposes complex citizen requests into a bounded sequence of specialist agent tasks:
- `SafetyAgent` pre-screens inputs for prompt injection and PII.
- `KnowledgeAgent` retrieves grounded statutory evidence.
- `LegalAgent` analyzes procedural remedies and limitation periods.
- `CitationAgent` confirms that all cited enactments exist in the authoritative registry.
- Execution is strictly bounded to a maximum of 5 steps to prevent infinite execution loops.
