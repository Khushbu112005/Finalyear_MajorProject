"""
Tests for Module A Legal Guidance API.
Verifies grounded 10-section answers, citation provenance, fail-safe states, and statutory disclaimer enforcement.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_legal_query_verified_statutory_grounding(citizen_auth_headers):
    payload = {
        "query": "What is the timeline and procedure to dispose of an RTI application under Section 7?",
        "jurisdiction": "IN",
    }
    resp = client.post("/api/v1/legal/query", json=payload, headers=citizen_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    answer = body["data"]

    # Verify 10 Required Sections
    assert answer["what_i_understood"] is not None
    assert len(answer["relevant_legal_basis"]) > 0
    assert answer["what_it_generally_means"] is not None
    assert answer["how_it_may_relate"] is not None
    assert len(answer["what_you_may_consider_doing"]) > 0
    assert len(answer["evidence_that_may_help"]) > 0
    assert len(answer["where_to_go"]) > 0
    assert len(answer["sources"]) > 0
    assert len(answer["warnings"]) > 0
    assert "does not constitute formal legal counsel" in answer["important_limitation"]

    # Verify Citation Provenance
    top_citation = answer["sources"][0]
    assert top_citation["is_verified"] is True
    assert top_citation["official_url"].startswith("https://")
    assert top_citation["source_id"] is not None


def test_legal_query_insufficient_evidence_fail_safe(citizen_auth_headers):
    # Query completely outside the knowledge base scope
    payload = {
        "query": "What is the tax rate on quantum teleporters in Antarctica under Martian colonial law?",
        "jurisdiction": "IN",
    }
    resp = client.post("/api/v1/legal/query", json=payload, headers=citizen_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    answer = body["data"]

    # Fail-safe must trigger without hallucinating fake legal citations
    assert answer["fail_safe_state"] == "INSUFFICIENT_EVIDENCE"
    assert answer["confidence"] == 0.0
    assert len(answer["sources"]) == 0


def test_list_indexed_acts():
    resp = client.get("/api/v1/legal/acts")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 3  # RTI, DPDP, CPA
    titles = [a["title"] for a in body["data"]]
    assert "Right to Information Act, 2005" in titles
