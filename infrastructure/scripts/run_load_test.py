"""
CivicSphere Concurrent Load & Stress Testing Benchmark.
Simulates concurrent user load (100 to 1000 simulated requests) against
the retrieval and legal reasoning pipeline.
Measures throughput (req/s), p50, p95, p99 latencies, and error rates.
"""

import os
import sys
import time
import asyncio
import statistics
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("JWT_SECRET_KEY", "civicsphere_load_test_jwt_key_2026_secure")
os.environ.setdefault("NEO4J_PASSWORD", "civicsphere_load_test_neo4j_password_2026_secure")

from backend.app.knowledge.domain.retrieval import RetrievalRequest, FilterCriteria
from backend.app.knowledge.retrieval.hybrid import hybrid_retrieval_service
from data.seed.seed_data import seed_knowledge_base

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("civicsphere.loadtest")

QUERIES = [
    "What is the statutory time limit under Section 7 of the RTI Act?",
    "How to file a first appeal under Section 19 of the RTI Act?",
    "What are the penalties for Public Information Officers under Section 20?",
    "What is the definition of Personal Data Breach under DPDP Act 2023?",
    "What are citizen rights to grievance redressal under DPDP Act?",
    "What is the procedure for filing a consumer complaint under Section 35?",
]


async def simulate_worker(worker_id: int, num_requests: int, latencies: list, errors: list):
    for i in range(num_requests):
        query = QUERIES[(worker_id + i) % len(QUERIES)]
        start = time.perf_counter()
        try:
            req = RetrievalRequest(query=query, filters=FilterCriteria(jurisdiction="IN"), top_k=3)
            res = await hybrid_retrieval_service.retrieve(req)
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            latencies.append(elapsed_ms)
        except Exception as e:
            errors.append(str(e))


async def run_load_benchmark(concurrent_users: int, requests_per_user: int = 5):
    total_requests = concurrent_users * requests_per_user
    logger.info(f"Starting Load Benchmark: {concurrent_users} concurrent workers, {total_requests} total requests...")

    latencies = []
    errors = []

    start_total = time.perf_counter()
    tasks = [
        simulate_worker(uid, requests_per_user, latencies, errors)
        for uid in range(concurrent_users)
    ]
    await asyncio.gather(*tasks)
    total_duration_sec = time.perf_counter() - start_total

    throughput_rps = total_requests / total_duration_sec if total_duration_sec > 0 else 0
    p50 = statistics.median(latencies) if latencies else 0
    p95 = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else p50
    p99 = statistics.quantiles(latencies, n=100)[98] if len(latencies) >= 100 else p95
    avg_latency = statistics.mean(latencies) if latencies else 0
    error_rate = (len(errors) / total_requests) * 100.0 if total_requests > 0 else 0.0

    logger.info("==================================================================")
    logger.info(f"    LOAD TEST RESULTS: {concurrent_users} CONCURRENT WORKERS      ")
    logger.info("==================================================================")
    logger.info(f"Total Requests Completed : {len(latencies)} / {total_requests}")
    logger.info(f"Total Test Duration      : {total_duration_sec:.2f} seconds")
    logger.info(f"Throughput               : {throughput_rps:.2f} requests/second")
    logger.info(f"Average Latency          : {avg_latency:.2f} ms")
    logger.info(f"Median Latency (p50)     : {p50:.2f} ms")
    logger.info(f"95th Percentile (p95)    : {p95:.2f} ms")
    logger.info(f"99th Percentile (p99)    : {p99:.2f} ms")
    logger.info(f"Error Rate               : {error_rate:.2f}% ({len(errors)} errors)")
    logger.info("==================================================================")

    return {
        "concurrent_users": concurrent_users,
        "total_requests": total_requests,
        "duration_sec": round(total_duration_sec, 2),
        "throughput_rps": round(throughput_rps, 2),
        "avg_latency_ms": round(avg_latency, 2),
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "error_rate_pct": round(error_rate, 2),
    }


async def main():
    await seed_knowledge_base()
    # 1. 100 Concurrent Users
    await run_load_benchmark(concurrent_users=100, requests_per_user=5)
    # 2. 500 Concurrent Users
    await run_load_benchmark(concurrent_users=500, requests_per_user=2)


if __name__ == "__main__":
    asyncio.run(main())
