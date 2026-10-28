# Chapter 04 — Complete Backend API Catalogue

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  
**Base URLs:**  
- **Production (Vercel Serverless):** `https://civicsphere-backend.vercel.app`  
- **Local Development:** `http://127.0.0.1:8000` (or `http://localhost:8000`)  
- **API Prefix:** `/api/v1`  

---

## 1. Master API Route Registration Table

The CivicSphere Unified Backend registers **32 distinct endpoint routes** mounted in [`backend/app/main.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/main.py).

| # | HTTP Method | Registered Endpoint Path | Router Module | Auth Required | User Roles Permitted | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `GET` | `/health` | Core | None | Public | **RUNTIME-VERIFIED** |
| **2** | `GET` | `/healthz` | Core | None | Public | **RUNTIME-VERIFIED** |
| **3** | `GET` | `/readyz` | Core | None | Public | **RUNTIME-VERIFIED** |
| **4** | `GET` | `/api/v1/health` | Core | None | Public | **RUNTIME-VERIFIED** |
| **5** | `GET` | `/api/v1/health/ready` | Core | None | Public | **RUNTIME-VERIFIED** |
| **6** | `POST` | `/api/v1/auth/register` | `auth_router` | None | Public (Citizen/Researcher) | **RUNTIME-VERIFIED** |
| **7** | `POST` | `/api/v1/auth/login` | `auth_router` | None | Public | **RUNTIME-VERIFIED** |
| **8** | `POST` | `/api/v1/auth/logout` | `auth_router` | None | Public | **RUNTIME-VERIFIED** |
| **9** | `GET` | `/api/v1/auth/me` | `auth_router` | Cookie / JWT | Any authenticated | **RUNTIME-VERIFIED** |
| **10** | `PUT` | `/api/v1/auth/profile` | `auth_router` | Cookie / JWT | Any authenticated | **TEST-VERIFIED** |
| **11** | `POST` | `/api/v1/auth/mfa/setup` | `auth_router` | Cookie / JWT | Any authenticated | **SOURCE-VERIFIED** |
| **12** | `POST` | `/api/v1/auth/mfa/verify` | `auth_router` | Cookie / JWT | Any authenticated | **SOURCE-VERIFIED** |
| **13** | `POST` | `/api/v1/auth/mfa/disable`| `auth_router` | Cookie / JWT | Any authenticated | **SOURCE-VERIFIED** |
| **14** | `POST` | `/api/v1/legal/query` | `legal_router` | None (Optional) | Public / Any | **RUNTIME-VERIFIED** |
| **15** | `GET` | `/api/v1/legal/acts` | `legal_router` | None | Public | **RUNTIME-VERIFIED** |
| **16** | `POST` | `/api/v1/government/analyze` | `government_router` | None | Public | **TEST-VERIFIED** |
| **17** | `GET` | `/api/v1/government/services` | `government_router` | None | Public | **TEST-VERIFIED** |
| **18** | `GET` | `/api/v1/government/services/{service_id}` | `government_router` | None | Public | **TEST-VERIFIED** |
| **19** | `POST` | `/api/v1/government/check-eligibility` | `government_router` | None | Public | **TEST-VERIFIED** |
| **20** | `GET` | `/api/v1/cases` | `cases_router` | Cookie / JWT | Any authenticated | **TEST-VERIFIED** |
| **21** | `POST` | `/api/v1/cases` | `cases_router` | Cookie / JWT | Any authenticated | **TEST-VERIFIED** |
| **22** | `GET` | `/api/v1/cases/{case_id}` | `cases_router` | Cookie / JWT | Owner / Assigned / Admin | **TEST-VERIFIED** |
| **23** | `PUT` | `/api/v1/cases/{case_id}` | `cases_router` | Cookie / JWT | Owner / Assigned / Admin | **TEST-VERIFIED** |
| **24** | `DELETE`| `/api/v1/cases/{case_id}` | `cases_router` | Cookie / JWT | Owner / Admin | **TEST-VERIFIED** |
| **25** | `POST` | `/api/v1/documents/upload` | `documents_router` | Cookie / JWT | Any authenticated | **TEST-VERIFIED** |
| **26** | `GET` | `/api/v1/documents` | `documents_router` | Cookie / JWT | Any authenticated | **TEST-VERIFIED** |
| **27** | `GET` | `/api/v1/documents/{document_id}` | `documents_router` | Cookie / JWT | Owner / Admin | **TEST-VERIFIED** |
| **28** | `POST` | `/api/v1/document-processing/process` | `document_processing_router` | AuthContext | Citizen, Admin, System | **TEST-VERIFIED** |
| **29** | `POST` | `/api/v1/knowledge/search` | `search_router` | AuthContext | Any authenticated | **TEST-VERIFIED** |
| **30** | `GET` | `/api/v1/knowledge/sources`| `sources_router` | AuthContext | Any authenticated | **RUNTIME-VERIFIED** |
| **31** | `GET` | `/api/v1/knowledge/sources/{source_id}` | `sources_router` | AuthContext | Any authenticated | **RUNTIME-VERIFIED** |
| **32** | `GET` | `/api/v1/knowledge/entities/{entity_id}` | `graph_router` | AuthContext | Any authenticated | **RUNTIME-VERIFIED** |
| **33** | `GET` | `/api/v1/knowledge/entities/{entity_id}/relationships` | `graph_router` | AuthContext | Any authenticated | **RUNTIME-VERIFIED** |
| **34** | `POST` | `/api/v1/knowledge/ingestion/jobs` | `ingestion_router` | RBAC | Admin, System only | **TEST-VERIFIED** |
| **35** | `GET` | `/api/v1/knowledge/ingestion/jobs/{job_id}` | `ingestion_router` | RBAC | Admin, System only | **TEST-VERIFIED** |
| **36** | `GET` | `/api/v1/knowledge/admin/overview` | `admin_router` | RBAC | Admin, System only | **TEST-VERIFIED** |
| **37** | `GET` | `/api/v1/knowledge/admin/audit-logs` | `admin_router` | RBAC | Admin, System only | **TEST-VERIFIED** |
| **38** | `POST` | `/api/v1/agents/chat` | `agents_router` | None (Optional) | Public / Any | **TEST-VERIFIED** |
| **39** | `GET` | `/api/v1/agents/tools` | `agents_router` | None | Public | **TEST-VERIFIED** |
| **40** | `GET` | `/api/v1/audit/events` | `audit_router` | RBAC | Admin only | **TEST-VERIFIED** |
| **41** | `GET` | `/api/v1/audit/security-events` | `audit_router` | RBAC | Admin only | **TEST-VERIFIED** |

---

## 2. In-Depth Endpoint Specifications

### 2.1 Health & Liveness
#### `GET /api/v1/health`
- **Handler:** `backend/app/main.py::health_check`
- **Purpose:** Cloud liveness probe verifying ASGI server execution.
- **Request:** None
- **Response Schema:**
  ```json
  {
    "status": "HEALTHY",
    "service": "civicsphere_unified_backend",
    "timestamp": 1793129331.364
  }
  ```
- **Status Codes:** 200 OK

#### `GET /api/v1/health/ready`
- **Handler:** `backend/app/main.py::readiness_check`
- **Purpose:** Readiness probe verifying vector embeddings, knowledge graph nodes, and database connectivity.
- **Response Schema:**
  ```json
  {
    "ready": true,
    "graph_nodes": 34,
    "vector_records": 12,
    "persistence": "postgresql_pgvector"
  }
  ```
- **Status Codes:** 200 OK

---

### 2.2 Authentication & Profile
#### `POST /api/v1/auth/register`
- **Handler:** `backend/app/auth/routes.py::register`
- **Purpose:** Creates a new citizen or legal researcher account.
- **Security Rule:** Blocks public registration with `role="ADMIN"` or `"SYSTEM"` when `ENVIRONMENT=production`.
- **Request Body:**
  ```json
  {
    "name": "Aditi Sharma",
    "email": "aditi.sharma@example.com",
    "password": "SecurePassword123!",
    "role": "CITIZEN",
    "phone": "+919876543210"
  }
  ```
- **Response (200 OK):**
  - Sets httpOnly `access_token` cookie (JWT).
  - Sets readable `csrf_token` cookie.
  - Returns sanitized user dictionary without password hash or MFA secret.

#### `POST /api/v1/auth/login`
- **Handler:** `backend/app/auth/routes.py::login`
- **Purpose:** Authenticates user via email/password and handles TOTP challenge if MFA is enabled.
- **Request Body:**
  ```json
  {
    "email": "aditi.sharma@example.com",
    "password": "SecurePassword123!",
    "mfa_code": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_b94a821e",
        "email": "aditi.sharma@example.com",
        "name": "Aditi Sharma",
        "role": "CITIZEN",
        "mfa_enabled": false
      },
      "csrf_token": "a1f8e43...",
      "mfa_required": false
    },
    "confidence": 1.0
  }
  ```

---

### 2.3 Legal Guidance Engine
#### `POST /api/v1/legal/query`
- **Handler:** `backend/app/legal/routes.py::execute_legal_query`
- **Purpose:** Submits natural-language query and returns 10-section structured legal guidance.
- **Request Body:**
  ```json
  {
    "query": "What is the maximum time limit for a Public Information Officer to respond to an RTI application?",
    "jurisdiction": "IN",
    "case_id": null
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "query": "What is the maximum time limit...",
      "overview": "Under the Right to Information Act, 2005, the Central or State Public Information Officer is mandated to respond within 30 days...",
      "applicable_provisions": [
        "Right to Information Act, 2005 — Section 7(1)",
        "Right to Information Act, 2005 — Section 7(1) Proviso (Life & Liberty: 48 Hours)"
      ],
      "citizen_rights": [
        "Right to receive information within 30 calendar days",
        "Right to receive information within 48 hours if concerning life or liberty"
      ],
      "procedural_steps": [
        "File Form A with fee of Rs 10",
        "Obtain acknowledgment receipt with date"
      ],
      "deadlines": "30 days standard; 48 hours for life/liberty matters; 30 days for First Appeal",
      "competent_authorities": ["Central Public Information Officer", "First Appellate Authority"],
      "documentation_required": ["Application Form", "Proof of Fee Payment"],
      "penalties": "Rs 250 per day up to Rs 25,000 under Section 20",
      "appeal_mechanism": "First appeal to officer senior in rank within 30 days; Second appeal to CIC within 90 days",
      "disclaimer": "This guidance is statutory intelligence and does not substitute for formal legal representation.",
      "confidence": 0.98,
      "citations": [
        {
          "act_title": "Right to Information Act, 2005",
          "section": "Section 7(1)",
          "official_url": "https://www.indiacode.nic.in/handle/123456789/2065"
        }
      ]
    },
    "confidence": 0.98
  }
  ```

---

### 2.4 Document Processing
#### `POST /api/v1/documents/upload`
- **Handler:** `backend/app/documents/routes.py::upload_and_process_document`
- **Purpose:** Multipart PDF document upload, active malware scanning, OCR extraction, and case linkage.
- **Content-Type:** `multipart/form-data`
- **Request Form:**
  - `file`: PDF binary data (`%PDF-` signature required)
  - `case_id`: Optional UUID string
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "doc_8f12a9c4b310",
      "original_filename": "rti_application_receipt.pdf",
      "status": "READY",
      "file_size_bytes": 142080,
      "mime_type": "application/pdf",
      "analysis": {
        "document_type": "RTI_RECEIPT",
        "extracted_entities": ["Public Authority", "Filing Date", "Application Fee"],
        "confidence": 0.96
      }
    },
    "confidence": 0.96
  }
  ```

---

### 2.5 Multi-Agent System
#### `POST /api/v1/agents/chat`
- **Handler:** `backend/app/agents/routes.py::agent_chat`
- **Purpose:** Invokes the Multi-Agent Orchestrator for coordinated multi-step reasoning.
- **Request Body:**
  ```json
  {
    "query": "My consumer complaint against an e-commerce seller was rejected. What are my appeal options and which forms do I need?",
    "context": {"state": "Maharashtra"}
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "plan": [
        "Step 1: Consult Knowledge Specialist for Consumer Protection Act 2019 appeal sections",
        "Step 2: Consult Legal Specialist for State Commission pecuniary limits",
        "Step 3: Synthesize evidence and cite Consumer Protection Act 2019"
      ],
      "execution_log": [
        {"agent": "LegalAgent", "action": "search_knowledge", "status": "SUCCESS"},
        {"agent": "CitationAgent", "action": "verify_citations", "status": "SUCCESS"}
      ],
      "final_response": "Under Section 47 of the Consumer Protection Act, 2019, an appeal against an order of the District Commission lies to the State Commission within 45 days...",
      "status": "COMPLETED"
    },
    "confidence": 0.95
  }
  ```
