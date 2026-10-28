# Chapter 07 — Datasets, Knowledge Base and External Data Sources

**Document Version:** 1.0.0  
**Repository:** `Khushbu112005/Finalyear_MajorProject`  
**Current Baseline Commit:** [`b566c93`](https://github.com/Khushbu112005/Finalyear_MajorProject/commit/b566c93)  
**Investigation Date:** October 28, 2026  

---

## 1. Master Knowledge Inventory

CivicSphere AI maintains a strictly curated corpus of verified Indian statutory enactments, scheme guidelines, and evaluation test cases.

| Source ID / File | Name / Title | Format | Authority / Publisher | Scope & Contents | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src_2005_rti` | **Right to Information Act, 2005** | Text / JSON (`seed_data.py`) | Ministry of Law and Justice (India Code) | Sections 4, 6, 7, 19: Public authority obligations, RTI requests, 30-day/48-hour disposal limits, First & Second Appeals. | **ACTIVE / HYDRATED** |
| `src_2023_dpdp` | **Digital Personal Data Protection Act, 2023** | Text / JSON (`seed_data.py`) | Ministry of Electronics and Information Technology (MeitY) | Sections 4, 6, 8, 19: Lawful processing grounds, consent withdrawal, data fiduciary breach intimations, Data Protection Board of India. | **ACTIVE / HYDRATED** |
| `src_2019_cpa` | **Consumer Protection Act, 2019** | Text / JSON (`seed_data.py`) | Department of Consumer Affairs | Sections 2(7), 34, 47, 58: Definition of consumer, pecuniary limits (District < 50L, State 50L-2Cr, National > 2Cr). | **ACTIVE / HYDRATED** |
| `pmay_u_guidelines`| **PMAY-Urban Housing Scheme Guidelines** | JSON (`GovernmentServiceModel`) | Ministry of Housing and Urban Affairs | Credit Linked Subsidy Scheme (CLSS), income eligibility criteria (EWS, LIG, MIG), interest subsidies. | **ACTIVE / HYDRATED** |
| `data/evaluation/dataset.json` | **Consolidated Evaluation Benchmark** | JSON | Project QA & Evaluation Team | 100+ annotated ground-truth civic and legal queries with expected section citations and confidence thresholds. | **TEST-VERIFIED** |
| `data/evaluation/standard/test_cases.json` | **Standard Retrieval Test Cases** | JSON | Project QA Team | Standard citizen queries testing exact lexical and semantic recall across RTI, DPDP, and Consumer forums. | **TEST-VERIFIED** |
| `data/evaluation/adversarial/test_cases.json` | **Adversarial Security Test Cases** | JSON | Security Audit Team | Malicious prompts, Cypher injection payloads, prompt injection, and hallucination stress tests. | **TEST-VERIFIED** |
| `data/evaluation/conflict/test_cases.json` | **Statutory Conflict Test Cases** | JSON | Legal Research Team | Edge cases where statutory provisions overlap or have overriding clauses (e.g., RTI Section 8 vs. Official Secrets Act). | **TEST-VERIFIED** |
| `data/evaluation/held_out/test_cases.json` | **Held-Out Evaluation Cases** | JSON | Evaluation Team | Unseen test cases for verifying that retrieval confidence scoring does not overfit to seed examples. | **TEST-VERIFIED** |
| `uploads/*.pdf` | **Synthetic Demo Case Documents** | PDF (36 files) | Synthetic Test Fixtures | Pre-generated legal notice templates, RTI filing receipts, and complaint drafts used for IDP pipeline testing. | **LOCAL / FIXTURE** |

---

## 2. Statutory Acts Text Extraction Details

### 2.1 Right to Information Act, 2005
- **Official URL:** `https://www.indiacode.nic.in/handle/123456789/2065`
- **Key Sections Indexed:**
  - *Section 4:* Proactive public disclosure within 120 days of enactment.
  - *Section 6:* Procedure for request submission; no requirement to justify reasons for seeking information.
  - *Section 7:* Strict timeline: 30 days for general requests; 48 hours when information concerns the life or liberty of an individual.
  - *Section 19:* Appellate framework: First appeal to senior departmental officer within 30 days; Second appeal to Central/State Information Commission within 90 days.

### 2.2 Digital Personal Data Protection Act, 2023
- **Official URL:** `https://www.meity.gov.in/content/digital-personal-data-protection-act-2023`
- **Key Sections Indexed:**
  - *Section 4:* Processing limited to lawful purposes with valid consent or legitimate uses.
  - *Section 6:* Consent must be free, specific, informed, unconditional, and unambiguous; right to withdraw consent with ease.
  - *Section 8:* General obligations of Data Fiduciary; mandatory intimation of personal data breach to Data Protection Board of India and affected Data Principals.
  - *Section 19:* Establishment and powers of the Data Protection Board of India as an adjudicatory body.

### 2.3 Consumer Protection Act, 2019
- **Official URL:** `https://consumeraffairs.nic.in/acts-and-rules/consumer-protection`
- **Key Sections Indexed:**
  - *Section 2(7):* Statutory definition of "consumer" covering buyers of goods or services for consideration.
  - *Section 34:* District Commission jurisdiction: complaints where value of goods/services does not exceed ₹50,00,000 (Fifty Lakh Rupees).
  - *Section 47:* State Commission jurisdiction: complaints exceeding ₹50,00,000 but not exceeding ₹2,00,00,000 (Two Crore Rupees).
  - *Section 58:* National Commission (NCDRC) jurisdiction: claims exceeding ₹2,00,00,000 (Two Crore Rupees).

---

## 3. Data Lineage & Ingestion Lifecycle

```
[Official Gazette / India Code / Ministry Portal]
                        |
                        v  (Manual verification / URL Fetch)
[Raw Statutory Text]
                        |
                        v  (ContentCleaner: normalize section symbols, fix ligatures)
[Cleaned Canonical Text]
                        |
                        v  (DeterministicChunker: section-level boundary splitting)
[Knowledge Chunks (300-500 words each)]
        |                                       |
        v                                       v
[Entity & Relation Extraction]         [Chunk Embedder (384-d)]
(Nodes: Authorities, Rights, Sections)  (Vectors: L2-normalized)
        |                                       |
        v                                       v
[PostgreSQL `knowledge_graph_*`]       [PostgreSQL `knowledge_embeddings`]
        \                                       /
         \                                     /
          v                                   v
       [Unified Hybrid Retrieval (BM25 + Vector + Graph)]
```

---

## 4. Distinction Between Data Classes

To preserve integrity and security, CivicSphere AI enforces strict data isolation across 4 distinct tiers:

1. **Tier 1: Authoritative Statutory Acts (Public Knowledge):**
   - High-trust official legislation, Central/State Acts, and Gazette notifications.
   - Immutable once verified; shared across all users and public searches.
2. **Tier 2: Government Scheme Rules (Public Knowledge):**
   - Operational guidelines, income thresholds, and document requirements.
   - Read-only for regular citizens; modifiable only by `KNOWLEDGE_EDITOR` or `ADMIN`.
3. **Tier 3: User Case Workspaces & Documents (Private Data):**
   - Citizen legal case descriptions, counsel notes, and uploaded PDF exhibits.
   - Strictly isolated by User ID and Case ID; protected by IDOR authorization rules; never indexed into public knowledge.
4. **Tier 4: Synthetic Evaluation Benchmarks (Test Data):**
   - Fixed JSON test cases used by automated CI/CD suites (`backend/tests/evaluation/`).
   - Kept in version control; isolated from production database records.
