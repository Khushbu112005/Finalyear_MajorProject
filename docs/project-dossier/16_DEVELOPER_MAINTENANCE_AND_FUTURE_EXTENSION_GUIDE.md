# Chapter 16 — Developer Handover and Maintenance Guide

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. Core Codebase Modules to Understand First

When onboarding to the CivicSphere AI codebase, examine these core files in order:

1. **Backend Entrypoint & Lifespan:** [`backend/app/main.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/main.py)  
   *Why:* Understands CORS, security headers, database cold-start hydration, and router mounting.
2. **Configuration & Security Settings:** [`backend/app/common/config.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/common/config.py)  
   *Why:* Understands Pydantic Settings validation, required secret formats, and provider flags.
3. **Canonical Schemas & Contracts:** [`packages/schemas/contracts.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/packages/schemas/contracts.py)  
   *Why:* Defines the universal `ApiResponse[T]` envelope, `EvidencePack`, and `LegalAnswer` interfaces.
4. **Knowledge Ingestion Pipeline:** [`backend/app/knowledge/ingestion/pipeline.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/knowledge/ingestion/pipeline.py)  
   *Why:* Traces the 13-stage ingestion sequence from statutory text to dual vector/graph indexing.
5. **Universal Frontend API Client:** [`apps/web/src/lib/api-client.ts`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/lib/api-client.ts)  
   *Why:* Shows how the Next.js client propagates httpOnly cookies and `X-CSRF-Token` headers.

---

## 2. Step-by-Step Developer Extension Guides

### 2.1 How to Add a New Frontend Page
1. Create a new directory and `page.tsx` file in `apps/web/src/app/` (e.g. `apps/web/src/app/consumer-disputes/page.tsx`).
2. Mark the file with `"use client";` if utilizing React hooks (`useState`, `useEffect`).
3. Import the shared UI components and API client:
   ```tsx
   "use client";
   import React, { useState } from "react";
   import { api } from "@/lib/api-client";
   import { Card } from "@/components/ui/card";
   import { Button } from "@/components/ui/button";

   export default function ConsumerDisputesPage() {
     return (
       <div className="max-w-5xl mx-auto p-6">
         <h1 className="text-2xl font-bold">Consumer Dispute Navigator</h1>
       </div>
     );
   }
   ```
4. Add a navigation link in [`apps/web/src/components/Navigation.tsx`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/apps/web/src/components/Navigation.tsx).
5. Verify linting passes: `npm run lint --workspace=civicsphere-web`.

---

### 2.2 How to Add a New Backend API Endpoint
1. Open the relevant domain router under `backend/app/` (or create a new router file, e.g. `backend/app/consumer/routes.py`).
2. Define the Pydantic request model:
   ```python
   from fastapi import APIRouter, Depends
   from pydantic import BaseModel, Field
   from packages.schemas.contracts import ApiResponse
   from backend.app.auth.dependencies import get_current_user
   from backend.app.auth.models import UserModel

   router = APIRouter(prefix="/consumer", tags=["Consumer Protection"])

   class ClaimCalculationRequest(BaseModel):
       amount_inr: float = Field(ge=0, description="Total consideration paid in INR")

   @router.post("/calculate-forum", response_model=ApiResponse[dict])
   async def calculate_jurisdictional_forum(
       payload: ClaimCalculationRequest,
       current_user: UserModel = Depends(get_current_user),
   ):
       """Determines District, State, or National commission under Consumer Protection Act 2019."""
       if payload.amount_inr <= 5000000:
           forum = "District Consumer Disputes Redressal Commission (Section 34)"
       elif payload.amount_inr <= 20000000:
           forum = "State Consumer Disputes Redressal Commission (Section 47)"
       else:
           forum = "National Commission / NCDRC (Section 58)"
       return ApiResponse(data={"forum": forum, "amount": payload.amount_inr}, confidence=1.0)
   ```
3. Register the router in [`backend/app/main.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/main.py):
   ```python
   from backend.app.consumer.routes import router as consumer_router
   app.include_router(consumer_router, prefix=settings.API_PREFIX)
   ```
4. Write an automated test in `backend/tests/api/test_consumer_api.py`.

---

### 2.3 How to Add a New Database Model & Migration
1. Declare the SQLAlchemy model inheriting from `backend.app.common.database.Base`:
   ```python
   from sqlalchemy import Column, String, Float, DateTime
   from sqlalchemy.sql import func
   from backend.app.common.database import Base

   class ConsumerGrievanceModel(Base):
       __tablename__ = "consumer_grievances"

       id = Column(String(36), primary_key=True)
       claim_amount = Column(Float, nullable=False)
       forum_assigned = Column(String(255), nullable=False)
       created_at = Column(DateTime(timezone=True), server_default=func.now())
   ```
2. Generate an Alembic migration revision:
   ```bash
   alembic revision --autogenerate -m "add_consumer_grievances_table"
   ```
3. Inspect the generated migration script in `backend/migrations/versions/`.
4. Apply the migration:
   ```bash
   alembic upgrade head
   ```

---

### 2.4 How to Add a New Statutory Legal Source
1. Open [`data/seed/seed_data.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/data/seed/seed_data.py).
2. Append a dictionary to `SEED_SOURCES` with the verified statutory text:
   ```python
   {
       "title": "Arbitration and Conciliation Act, 1996",
       "publisher": "Ministry of Law and Justice",
       "official_url": "https://www.indiacode.nic.in/handle/123456789/2180",
       "jurisdiction": "IN",
       "source_type": "ACT",
       "trust_level": SourceTrustLevel.OFFICIAL_LEGISLATION,
       "publication_date": "1996-08-16",
       "effective_date": "1996-08-22",
       "raw_text": """
       Section 7. Arbitration agreement.
       (1) In this Part, "arbitration agreement" means an agreement by the parties to submit to arbitration all or certain disputes which have arisen or which may arise between them in respect of a defined legal relationship, whether contractual or not.
       (2) An arbitration agreement may be in the form of an arbitration clause in a contract or in the form of a separate agreement.
       (3) An arbitration agreement shall be in writing.
       """
   }
   ```
3. Trigger re-seeding via Python CLI:
   ```bash
   python -c "import asyncio; from data.seed.seed_data import seed_knowledge_base; asyncio.run(seed_knowledge_base())"
   ```
4. Verify the new act appears in `GET /api/v1/legal/acts` and is searchable in `/legal`.

---

### 2.5 How to Add a New AI Embedding or LLM Provider
1. Open [`backend/app/common/providers/embedding.py`](file:///c:/Users/Deepak%20Chheda/OneDrive/Desktop/23UF18356CM172/MAJORPROJECT/Finalyear_MajorProject/backend/app/common/providers/embedding.py).
2. Implement the `EmbeddingProvider` abstract base class:
   ```python
   class CohereEmbeddingProvider(EmbeddingProvider):
       def __init__(self, api_key: str, model: str = "embed-english-v3.0", dimension: int = 384):
           self.api_key = api_key
           self.model = model
           self._dimension = dimension

       def get_dimension(self) -> int:
           return self._dimension

       async def embed_text(self, text: str) -> List[float]:
           # Call Cohere async client and return L2-normalized vector
           ...
   ```
3. Update the factory function `get_embedding_provider()` to handle `provider_name == "cohere"`.
4. Add the corresponding environment variable `COHERE_API_KEY` to `backend/app/common/config.py`.

---

## 3. Important Invariants & Coding Conventions

- **Universal Response Envelope:** All API routes must return `ApiResponse[T]` (from `packages.schemas.contracts`). Never return raw unbound dictionaries directly from endpoints.
- **Never Log Sensitive Credentials:** Never print `JWT_SECRET_KEY`, database passwords, or auth cookies in log streams.
- **Strict Anti-Hallucination Disclaimers:** Any newly added AI guidance endpoint must include the statutory disclaimer clarifying that the output is civic statutory intelligence and not formal legal counsel.
- **Transaction Statement Cache:** When configuring asyncpg with Supabase, always maintain `statement_cache_size: 0` in `connect_args`.
