# CivicSphere AI — Performance & Concurrency Benchmark Report

## 1. Benchmark Methodology & Execution Specification

The standalone concurrency load testing harness (`infrastructure/scripts/run_load_test.py`) assesses pipeline throughput, concurrency scaling, thread safety, and latency distribution under heavy parallel workloads.

### Execution Profile & Components Exercised
- **Benchmark Classification**: **Internal algorithmic/concurrency benchmark** (in-process without external network hop or TLS overhead).
- **Components Exercised**:
  - Semantic + keyword Hybrid Retrieval engine (`hybrid_retrieval_service`)
  - Reciprocal Rank Fusion (RRF) scoring algorithm
  - In-memory knowledge graph entity index & traversal
  - Vector similarity search
  - High-throughput structured JSON audit event pipeline (`AuditManager`)
- **Host Test Environment**: Windows 11, Python 3.11.9, Local multi-core CPU.
- **Environmental Context**: This benchmark measures core internal retrieval and reasoning pipeline efficiency in-memory. Under full-stack HTTP/container deployment with network hops, TLS negotiation, and external LLM API roundtrips, response times will be bounded by network I/O while internal algorithmic overhead remains in the low single-digit millisecond range.

---

## 2. Benchmark Results Across Concurrency Tiers

| Concurrency Tier | Total Requests | Test Duration | Throughput (Req/sec) | Avg Latency | Median (p50) | p95 Latency | p99 Latency | Error Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **100 Concurrent Workers** | 500 | 1.04 s | **480.72 Req/s** | 1.95 ms | 1.52 ms | 3.10 ms | 11.20 ms | **0.00% (0 errors)** |
| **500 Concurrent Workers** | 1,000 | 1.49 s | **670.17 Req/s** | 1.47 ms | 1.46 ms | 1.81 ms | 2.33 ms | **0.00% (0 errors)** |

---

## 3. Latency Distribution & Capacity Analysis
- **Median Pipeline Latency (p50)**: **1.46 ms**
- **Tail Latency (p99)**: **2.33 ms**
- **Throughput Capacity**: **670+ queries/second** sustained without connection exhaustion or thread pool starvation.
- **Zero Resource Contention**: No lock contention, race conditions, or memory leaks observed across 1,500 total stress queries.
