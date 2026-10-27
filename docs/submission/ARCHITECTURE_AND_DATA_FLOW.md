# CivicSphere AI — Architecture & Data Flow Specification

**Document Version:** 2.0  
**Project:** CivicSphere AI (Final Year Major Project)  
**Standard:** Google Deepmind Advanced Agentic Engineering Standard  
**Date:** October 28, 2026  

---

## 1. System Topology & High-Level Architecture

CivicSphere AI is architected as a **high-performance modular monolith** paired with a unified Next.js 14/16 App Router web frontend. The platform centralizes civic intelligence, statutory reasoning, scheme navigation, and document AI into a cohesive, secure, and observable backend.

```mermaid
flowchart TD
    subgraph Client["Client Tier (Consolidated Web Portal)"]
        Browser["Citizen / Legal Professional Browser"]
        NextApp["Next.js App Router (apps/web)<br/>28 Pre-rendered & Dynamic Routes<br/>Tailwind CSS & shadcn/ui"]
        Browser -->|"HTTPS / Cookie Auth"| NextApp
    end

    subgraph SecurityGate["Edge & Ingress Security Layer"]
        CORS["Strict CORS Allowlist (No Wildcards)"]
        CSRF["Double-Submit CSRF Validation (X-CSRF-Token)"]
        RateLimit["Distributed Token-Bucket Rate Limiter"]
        AuthMid["httpOnly JWT Session Middleware"]
    end

    subgraph BackendCore["FastAPI Unified Modular Monolith (backend/app)"]
        RouterHub["API Router Hub (/api/v1)"]
        ModA["Module A: Legal Guidance Engine"]
        ModB["Module B: Government Navigator"]
        ModC["Module C: Knowledge & Hybrid RAG"]
        ModD["Module D: Document AI Processing"]
        ModCases["Case Workspace (IDOR Protected)"]
        ModAgents["Specialist Multi-Agent Orchestrator"]
        AuditEngine["Tamper-Evident Audit & Security Engine"]
    end

    subgraph StorageTier["Persistence & Data Tier"]
        PG["PostgreSQL 16/17 + pgvector<br/>(Users, Cases, Audit Events, Embeddings)"]
        RelGraph["Relational Knowledge Graph<br/>(Entities & Directed Relationships)"]
        Neo4j["Neo4j 5.x Graph DB<br/>(Optional Enterprise Remote Adapter)"]
        Storage["Object Storage<br/>(Supabase Private Bucket / MinIO S3)"]
        Redis["Redis 7 Cache<br/>(Token Bucket & Ephemeral Cache)"]
    end

    NextApp -->|"REST API Requests"| CORS
    CORS --> CSRF --> RateLimit --> AuthMid --> RouterHub

    RouterHub --> ModA
    RouterHub --> ModB
    RouterHub --> ModC
    RouterHub --> ModD
    RouterHub --> ModCases
    RouterHub --> ModAgents
    RouterHub --> AuditEngine

    ModA --> ModC
    ModB --> ModC
    ModD --> ModC
    ModD --> Storage
    ModCases --> PG
    ModAgents --> ModA & ModB & ModC

    ModC --> PG
    ModC --> RelGraph
    ModC -.->|"Optional"| Neo4j
    RateLimit --> Redis
    AuditEngine -->|"Async Writes"| PG
```

---

## 2. Ingestion & Knowledge Construction Pipeline

The ingestion pipeline converts raw statutory acts, gazette notifications, and rules into structured, searchable semantic units and knowledge graph subgraphs.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Knowledge Editor / Admin
    participant Pipe as IngestionPipeline
    participant Parser as StructuralLegalParser
    participant Chunker as StatutoryChunker
    participant Emb as Multi-Provider Embedding Engine
    participant VecStore as PersistentVectorStore (pgvector)
    participant Linker as GraphWriter (Relational Graph)
    participant Registry as SourceRegistry (PostgreSQL)
    participant Audit as AuditManager

    Admin->>Pipe: Ingest Source (Title, Raw Text, Gazette Metadata)
    Pipe->>Registry: Register Source (PENDING status, SHA-256 Hash)
    Pipe->>Parser: Parse Legal Structure (Preamble, Chapters, Sections)
    Parser-->>Pipe: Parsed Hierarchy (Sections with Titles & Body)
    Pipe->>Chunker: Chunk Text (Token Window ~512, Overlap 64)
    Chunker-->>Pipe: Statutory Chunks with Section Metadata
    Pipe->>Emb: Generate Embeddings (OpenAI / Gemini / HuggingFace / Mock)
    Emb-->>Pipe: 384-dimensional Normalized Vector Embeddings
    Pipe->>VecStore: Store Chunks & Vector Embeddings (knowledge_embeddings)
    Pipe->>Linker: Extract Entities & Write Directed Graph Edges
    Linker->>VecStore: Store Chunk-to-Entity Mappings
    Pipe->>Registry: Mark Source ACTIVE (with Chunk & Entity Counts)
    Pipe->>Audit: Emit KNOWLEDGE_INGESTION_COMPLETED Audit Event
    Audit-->>Admin: Ingestion Success (Entities, Chunks, Embeddings persisted)
```

---

## 3. Hybrid Multi-Channel Retrieval & Statutory RAG

Statutory queries require extreme precision to eliminate hallucination. CivicSphere AI executes three distinct retrieval channels in parallel and fuses them using **Reciprocal Rank Fusion (RRF)**.

```mermaid
flowchart TD
    Query["Citizen Legal Query<br/>'What are the rules and timelines for filing a first appeal under Section 19 of RTI Act?'"] --> Pre["Security & Sanitization<br/>• PII Masking<br/>• Prompt Injection Guard"]
    
    Pre --> ParFork{"Parallel Execution Fork"}

    subgraph Channel1["Channel 1: Vector Semantic Search"]
        EmbGen["Generate Embedding (384-dim)"]
        PGVec["pgvector Cosine Distance Query (<=>)<br/>knowledge_embeddings Table"]
        EmbGen --> PGVec
    end

    subgraph Channel2["Channel 2: Lexical BM25 Search"]
        Tokenize["BM25 Tokenizer & Stemmer"]
        InvertedIndex["Inverted Index Matching<br/>Exact Statutory Term Overlap"]
        Tokenize --> InvertedIndex
    end

    subgraph Channel3["Channel 3: Graph Traversal Search"]
        EntityRec["Entity Recognition (RTI Act, Sec 19)"]
        GraphHop["Bidirectional Depth-2 Graph Traversal<br/>Connected Sections & Appellate Authorities"]
        EntityRec --> GraphHop
    end

    ParFork --> Channel1
    ParFork --> Channel2
    ParFork --> Channel3

    PGVec --> Fuse["Reciprocal Rank Fusion (RRF)<br/>Score = SUM( 1 / (60 + Rank_i) )"]
    InvertedIndex --> Fuse
    GraphHop --> Fuse

    Fuse --> Rerank["Cross-Encoder Reranker & Evidence Pack Assembly"]
    
    Rerank --> Check{"Confidence >= 0.75 ?"}
    Check -->|"Yes: Strong Evidence (0.98)"| Synth["10-Section Legal Guidance Synthesizer<br/>Strict Grounding in Evidence Pack"]
    Check -->|"No: Insufficient Evidence (< 0.50)"| CircuitBreaker["Anti-Hallucination Circuit Breaker<br/>FailSafeState.INSUFFICIENT_EVIDENCE<br/>(Zero Speculative Text)"]

    Synth --> Output["Structured Output with Official Gazette Citations"]
    CircuitBreaker --> Output
```

---

## 4. Intelligent Document AI 7-Stage State Machine

When a citizen uploads an official order, charge sheet, or contract, it transitions through a formal 7-stage state machine with strict security inspection.

```mermaid
stateDiagram-v2
    [*] --> UPLOADED: Citizen uploads file via /api/v1/documents/upload
    
    UPLOADED --> VALIDATING: Inspect MIME type (application/pdf) & size (<= 5MB)
    VALIDATING --> REJECTED: Invalid MIME or file exceeds size
    
    VALIDATING --> SECURITY_SCANNING: Run Active PDF Malware Scanner
    SECURITY_SCANNING --> QUARANTINED: Embedded JavaScript, /Launch, or exploit detected
    
    SECURITY_SCANNING --> PROCESSING: OCR & Structural Text Extraction
    PROCESSING --> ANALYZING: Legal Entity Extraction & Risk Classification
    
    ANALYZING --> LINKING_KNOWLEDGE: Link Extracted Entities to Knowledge Graph
    LINKING_KNOWLEDGE --> READY: Persist Document Record & Metadata
    
    READY --> [*]
    REJECTED --> [*]
    QUARANTINED --> [*]
```

---

## 5. Multi-Agent Orchestration & Sandboxed Reasoning

The multi-agent system orchestrates specialized autonomous agents with a bounded reasoning loop to resolve complex, multi-domain civic situations.

```mermaid
flowchart TD
    UserMsg["Citizen Civic Request"] --> Coord["Multi-Agent Coordinator<br/>(Budget: Max 5 Iterations)"]
    
    Coord --> Plan["Decompose Task & Select Specialist Agent"]
    
    subgraph Specialists["Specialist Agent Fleet"]
        LegAg["Legal Specialist Agent<br/>(Statutory rights, penalties, limitation periods)"]
        GovAg["Government Navigator Agent<br/>(Schemes, eligibility, administrative desks)"]
        DocAg["Document AI Agent<br/>(OCR, document verification, evidence gaps)"]
        KGAg["Knowledge Agent<br/>(Hybrid RAG & subgraph queries)"]
    end

    Plan --> LegAg & GovAg & DocAg & KGAg

    LegAg --> ToolBox{"Tool Registry (Sandboxed)"}
    GovAg --> ToolBox
    DocAg --> ToolBox
    KGAg --> ToolBox

    subgraph Sandbox["Tool Sandbox & Guardrails"]
        T1["search_statutes(query, act)"]
        T2["evaluate_eligibility(criteria)"]
        T3["verify_document_evidence(doc_id)"]
        T4["query_knowledge_graph(entity, depth)"]
    end

    ToolBox --> T1 & T2 & T3 & T4

    T1 & T2 & T3 & T4 --> Safety["Safety & Citation Verification Agent"]
    Safety -->|"Verify Citations against Registry"| Agg["Synthesize Multi-Agent Answer"]
    Agg --> Final["Final Grounded Response to Citizen"]
```

---

## 6. Relational Database Schema & Entity Relationships

The canonical persistence layer is modeled with PostgreSQL and SQLAlchemy, incorporating `pgvector` for semantic embeddings.

```mermaid
erDiagram
    USERS ||--o{ CASES : "owns"
    USERS ||--o{ DOCUMENTS : "owns"
    USERS ||--o{ AUDIT_EVENTS : "triggers"
    CASES ||--o{ DOCUMENTS : "contains"
    
    KNOWLEDGE_SOURCES ||--|{ KNOWLEDGE_CHUNKS : "contains"
    KNOWLEDGE_CHUNKS ||--|| KNOWLEDGE_EMBEDDINGS : "has_vector"
    
    KNOWLEDGE_GRAPH_NODES ||--o{ KNOWLEDGE_GRAPH_EDGES : "source_of"
    KNOWLEDGE_GRAPH_NODES ||--o{ KNOWLEDGE_GRAPH_EDGES : "target_of"

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string role
        string totp_secret
        boolean is_totp_enabled
        timestamp created_at
    }

    CASES {
        uuid id PK
        uuid user_id FK
        string title
        string status
        jsonb metadata
        timestamp created_at
    }

    DOCUMENTS {
        uuid id PK
        uuid user_id FK
        uuid case_id FK
        string filename
        string storage_path
        string processing_status
        jsonb extracted_entities
        timestamp created_at
    }

    KNOWLEDGE_SOURCES {
        string source_id PK
        string title
        string authority_level
        string verification_status
        string content_sha256
        int chunk_count
        timestamp created_at
    }

    KNOWLEDGE_CHUNKS {
        string chunk_id PK
        string source_id FK
        text chunk_text
        string section_number
        int token_count
    }

    KNOWLEDGE_EMBEDDINGS {
        string chunk_id PK
        vector_384 embedding
        string model_name
        timestamp created_at
    }

    KNOWLEDGE_GRAPH_NODES {
        string id PK
        string name
        string node_type
        jsonb metadata
    }

    KNOWLEDGE_GRAPH_EDGES {
        string id PK
        string source_id FK
        string target_id FK
        string edge_type
        float weight
        jsonb metadata
    }

    AUDIT_EVENTS {
        uuid event_id PK
        string event_type
        string actor_id
        string role
        string action
        string resource_type
        jsonb details
        timestamp timestamp
    }
```

---

## 7. Security Architecture & Defense-in-Depth

| Security Domain | Defense Mechanism | Implementation Location |
| :--- | :--- | :--- |
| **Authentication** | `httpOnly`, `Secure`, `SameSite` JWT cookies + 24hr expiry | `backend/app/auth/routes.py` |
| **CSRF Defense** | Double-submit CSRF cookie + `X-CSRF-Token` header verification | `backend/app/auth/routes.py`, `backend/app/common/security.py` |
| **Privilege Defense** | Server-authoritative role decorators (`@require_role`) + Public Admin Registration Block | `backend/app/auth/services.py` |
| **Object Authorization** | User-owned case/document IDOR protection via `AuthContext` | `backend/app/cases/routes.py`, `backend/app/documents/routes.py` |
| **Data Boundary Isolation** | Retrieved untrusted data isolated in `<data_boundary is_untrusted_data="true">` | `backend/app/knowledge/security/prompt_injection.py` |
| **Network Defense** | SSRF blocker rejecting private subnets, localhost, and `169.254.169.254` | `backend/app/knowledge/security/ssrf.py` |
| **Privacy Preservation** | Regex masking of Aadhaar, PAN, and phone numbers before logs or LLM calls | `backend/app/knowledge/security/sanitization.py` |
| **Malware Defense** | Active binary stream byte scanner detecting `/JavaScript`, `/Launch`, `/EmbeddedFiles` | `backend/app/documents/services/security_scanner.py` |
| **SQL / Cypher Security**| Strict parameterization with zero dynamic string concatenations | `backend/app/knowledge/graph/repository.py`, `backend/app/common/database.py` |
| **Denial of Service** | Distributed Token-Bucket rate limiter per IP and user ID | `backend/app/common/rate_limiter.py` |
