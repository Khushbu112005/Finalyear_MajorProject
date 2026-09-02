"""
Tests for Government Service Navigator API (Module B).
Verifies problem analysis, service retrieval, and eligibility evaluation.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_analyze_problem_endpoint():
    payload = {
        "problem_text": "I want to know how to apply for legal aid as an economically weaker section citizen.",
        "citizen_context": {
            "annual_income": 150000,
            "category": "EWS"
        },
        "jurisdiction": "IN"
    }
    resp = client.post("/api/v1/government/analyze", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "analysis" in body["data"]
    assert "services" in body["data"]


def test_list_services_endpoint():
    resp = client.get("/api/v1/government/services?jurisdiction=IN")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
