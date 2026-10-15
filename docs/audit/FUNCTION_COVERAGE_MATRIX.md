# CivicSphere AI — Function-Level Coverage & Verification Matrix

**Assessment Scope:** Core Business Logic, Data Repositories, Security Interceptors, and Ingestion Workers  
**Automated Pytest Tests:** 92 Passing  
**Quality Benchmarks:** 10 Evaluation Scenarios (Standard, Adversarial, Held-Out) Passing 100%

---

## Module Coverage Breakdown

### 1. Authentication & Security Context (`backend/app/auth/`, `backend/app/common/`)
| Function / Method | File Location | Purpose | Input / Output Validation | Test Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `create_access_token` | `backend/app/auth/services.py` | Generate signed JWT | User ID, role -> JWT string | `test_register_and_login_flow`, `test_security_context_authenticates_signed_jwt` |
| `decode_access_token` | `backend/app/auth/services.py` | Cryptographically verify JWT | JWT string -> payload dict | `test_security_context_authenticates_signed_jwt` |
| `register_user` | `backend/app/auth/services.py` | Register citizen with hashed password | Details -> (UserModel, token) | `test_register_and_login_flow`, `test_public_registration_blocks_admin_role_escalation_in_production` |
| `authenticate_user` | `backend/app/auth/services.py` | Validate login credentials & MFA | Email, pass, MFA code -> user | `test_register_and_login_flow`, `test_totp_mfa_lifecycle` |
| `get_current_user_context` | `backend/app/common/security.py` | Extract server-verified AuthContext | Request -> AuthContext | `test_security_context_blocks_spoofed_headers_in_production` |
| `check_object_ownership` | `backend/app/common/security.py` | Enforce IDOR protection on resources | Auth, owner_id -> None | `test_idor_protection_blocks_other_user_resource`, `test_admin_bypass_for_maintenance` |
| `TOTPManager.generate_secret` | `backend/app/auth/totp.py` | Base32 TOTP secret creation | None -> base32 string | `test_totp_mfa_lifecycle` |
| `TOTPManager.verify_token` | `backend/app/auth/totp.py` | Constant-time TOTP verification | Secret, 6-digit code -> bool | `test_totp_mfa_lifecycle` |

### 2. Knowledge Retrieval & RAG Pipeline (`backend/app/knowledge/retrieval/`)
| Function / Method | File Location | Purpose | Input / Output Validation | Test Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `hybrid_retrieval_service.retrieve` | `retrieval/hybrid.py` | Multi-engine RAG retrieval | RetrievalRequest -> EvidencePack | `test_hybrid_retrieval_rti_appeal`, `test_search_api_endpoint` |
| `vector_retrieval_service.search` | `retrieval/vector.py` | Dense vector similarity search | Embedding, top_k -> Chunks | `test_hybrid_retrieval_rti_appeal` |
| `keyword_retrieval_service.search` | `retrieval/keyword.py` | BM25 lexical keyword matching | Query tokens -> Ranked chunks | `test_hybrid_retrieval_rti_appeal` |
| `graph_retrieval_service.expand` | `retrieval/graph.py` | Multi-hop statutory entity expansion | Entity names -> Graph context | `test_knowledge_graph_agent_execution` |
| `reciprocal_rank_fusion` | `retrieval/reranker.py` | RRF score combination | Vector & BM25 ranks -> Unified | `test_rrf_scoring_and_authority_boost` |

### 3. Ingestion & Quality Controls (`backend/app/knowledge/ingestion/`)
| Function / Method | File Location | Purpose | Input / Output Validation | Test Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `chunk_document` | `ingestion/chunker.py` | Structure-preserving legal chunker | Statutory text -> Chunks with Section metadata | `test_chunker_preserves_section_structure` |
| `extract_entities` | `ingestion/entity_extractor.py` | Extract statutory definitions & nodes | Legal chunk -> Entity nodes | `test_entity_and_relationship_extraction` |
| `extract_relationships` | `ingestion/relationship_extractor.py` | Extract statutory cross-references | Entity pairs -> Typed edges | `test_entity_and_relationship_extraction` |
| `IngestionPipeline.run` | `ingestion/pipeline.py` | Full document-to-index pipeline | Raw text -> Vector & Graph persistence | `test_full_ingestion_pipeline` |

### 4. Security Defenses & Guardrails (`backend/app/knowledge/security/`)
| Function / Method | File Location | Purpose | Input / Output Validation | Test Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `detect_prompt_injection` | `security/prompt_injection.py` | Regex & heuristic jailbreak defense | Untrusted prompt -> bool | `test_prompt_injection_detection` (5 parameterized test vectors) |
| `sanitize_pii` | `security/sanitization.py` | Mask Aadhaar, PAN, emails, phones | Raw text -> Sanitized text | `test_pii_masking_comprehensive` |
| `validate_ssrf_destination` | `security/fetcher.py` | Block internal IP & cloud metadata | URL string -> bool | `test_ssrf_blocking_on_forbidden_destinations` (11 forbidden IP/scheme vectors) |
| `TokenBucketRateLimiter.consume` | `security/rate_limiter.py` | Distributed rate limiting | IP / User key -> bool | `test_token_bucket_consumption_and_exhaustion`, `test_token_bucket_refill` |
| `sanitize_cypher_parameters` | `graph/queries.py` | Escape malicious Cypher injection | Parameters dict -> Cleaned dict | `test_arbitrary_cypher_templates_rejected`, `test_malicious_query_parameter_escaping` |

### 5. Document AI & Storage (`backend/app/document_processing/`)
| Function / Method | File Location | Purpose | Input / Output Validation | Test Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `validate_document_upload` | `document_processing/validation.py` | Magic byte, MIME & size check | Bytes, filename -> bool | `test_upload_invalid_extension`, `test_upload_fake_pdf`, `test_upload_too_large` |
| `SupabaseStorageBackend.save_file` | `document_processing/storage.py` | Secure file upload to Supabase bucket | Path, bytes -> URI | `test_supabase_storage_save_file`, `test_supabase_storage_save_file_error_no_secret_leak` |
| `LocalStorageBackend.save_file` | `document_processing/storage.py` | Local filesystem fallback | Path, bytes -> Local URI | `test_local_storage_backend_lifecycle` |
