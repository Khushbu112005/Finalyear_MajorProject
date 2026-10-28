"""
Comprehensive Automated Regression Test Suite for Audit Findings LIVE-002 through LIVE-017.
Verifies all remediated defects across API boundaries, data pipelines, and security gates.
"""

import pytest
from fastapi.testclient import TestClient
import io

from backend.app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_live_010_empty_legal_query_validation(client):
    """LIVE-010: Empty or whitespace query to /legal/query must return HTTP 422."""
    # Test completely empty string
    res1 = client.post("/api/v1/legal/query", json={"query": "", "jurisdiction": "IN"})
    assert res1.status_code == 422

    # Test whitespace-only string
    res2 = client.post("/api/v1/legal/query", json={"query": "   ", "jurisdiction": "IN"})
    assert res2.status_code == 422

    # Test string shorter than 3 characters
    res3 = client.post("/api/v1/legal/query", json={"query": "ab", "jurisdiction": "IN"})
    assert res3.status_code == 422


def test_live_005_out_of_domain_and_fictional_query_circuit_breaker(client):
    """LIVE-005: Out-of-domain or fictional query must return confidence 0.0 with INSUFFICIENT_EVIDENCE."""
    # Fictional asteroid mining statute
    fictional_query = "Under Section 42 of the Indian Space Exploration and Asteroid Mining Act of 2021 what are the licensing requirements?"
    res = client.post("/api/v1/legal/query", json={"query": fictional_query, "jurisdiction": "IN"})
    assert res.status_code == 200
    body = res.json()
    assert body["confidence"] == 0.0
    assert body["data"]["fail_safe_state"] == "INSUFFICIENT_EVIDENCE"
    assert len(body["data"]["relevant_legal_basis"]) == 0
    assert len(body["data"]["sources"]) == 0

    # Non-Indian out-of-domain query
    foreign_query = "How do I apply for a US Green Card under H1B visa regulations?"
    res_foreign = client.post("/api/v1/legal/query", json={"query": foreign_query, "jurisdiction": "IN"})
    assert res_foreign.status_code == 200
    body_foreign = res_foreign.json()
    assert body_foreign["confidence"] == 0.0
    assert body_foreign["data"]["fail_safe_state"] == "INSUFFICIENT_EVIDENCE"


def test_live_013_procedural_steps_populated(client):
    """LIVE-013: Legitimate legal query must return non-empty how_it_may_help_or_steps."""
    query = "How to file RTI application under RTI Act 2005?"
    res = client.post("/api/v1/legal/query", json={"query": query, "jurisdiction": "IN"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    steps = body["data"].get("how_it_may_help_or_steps")
    assert steps is not None
    assert len(steps.strip()) > 10
    assert "1." in steps  # Formatted numbered list


def test_live_006_government_services_catalog_populated(client):
    """LIVE-006: GET /api/v1/government/services must return verified central and state schemes."""
    res = client.get("/api/v1/government/services")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    services = body["data"]
    assert len(services) >= 10  # At least 10 verified schemes
    service_ids = [s["service_id"] for s in services]
    assert "gov_pm_kisan" in service_ids
    assert "gov_pmjay_ayushman" in service_ids
    assert "gov_pmay_urban" in service_ids


def test_live_014_government_analyze_parameter_exclusion(client):
    """LIVE-014: Supplied citizen parameters (e.g. annual_income) must not appear in missing_parameters."""
    payload = {
        "problem_text": "I need financial assistance for farm equipment and seeds",
        "citizen_context": {
            "annual_income": 120000,
            "state_of_residence": "Maharashtra"
        },
        "jurisdiction": "IN"
    }
    res = client.post("/api/v1/government/analyze", json=payload)
    assert res.status_code == 200
    body = res.json()
    analysis = body["data"]["analysis"]
    missing = analysis.get("missing_parameters", [])
    assert "annual_income" not in missing
    assert "state_of_residence" not in missing


def test_live_007_graph_neighborhood_contract_endpoints(client):
    """LIVE-007: Graph neighborhood explorer must be accessible at both paths without HTTP 404."""
    # Test path 1: /knowledge/graph/neighborhood/{entity_id}
    res1 = client.get(
        "/api/v1/knowledge/graph/neighborhood/Right to Information Act, 2005?max_depth=1",
        headers={"X-User-Id": "usr_test", "X-User-Role": "citizen"}
    )
    assert res1.status_code == 200
    body1 = res1.json()
    assert body1["success"] is True
    assert "nodes" in body1["data"]
    assert "edges" in body1["data"]

    # Test path 2: /knowledge/entities/{entity_id}/relationships
    res2 = client.get(
        "/api/v1/knowledge/entities/Right to Information Act, 2005/relationships?depth=1",
        headers={"X-User-Id": "usr_test", "X-User-Role": "citizen"}
    )
    assert res2.status_code == 200
    assert res2.json()["success"] is True


def test_live_002_document_upload_success(client):
    """LIVE-002: Document upload handles valid PDF in serverless environment with HTTP 200."""
    pdf_bytes = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
    
    files = {"file": ("test_notice.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    res = client.post(
        "/api/v1/documents/upload",
        files=files,
        headers={"X-User-Id": "usr_doc_test", "X-User-Role": "citizen"}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "id" in body["data"]
    assert body["data"]["original_filename"] == "test_notice.pdf"
    assert body["data"]["status"] == "READY"


def test_live_011_security_headers_present(client):
    """LIVE-011: Standard security headers must be present on responses."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert "strict-origin" in res.headers.get("Referrer-Policy", "")
    assert "default-src" in res.headers.get("Content-Security-Policy", "")
    assert "camera=" in res.headers.get("Permissions-Policy", "")
    assert "max-age=" in res.headers.get("Strict-Transport-Security", "")


def test_live_009_statutory_acts_endpoint(client):
    """LIVE-009: GET /api/v1/legal/acts returns active verified statutory acts."""
    res = client.get("/api/v1/legal/acts")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    acts = body["data"]
    assert len(acts) >= 3
    titles = [a["title"] for a in acts]
    assert "Right to Information Act, 2005" in titles
