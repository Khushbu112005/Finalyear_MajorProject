"""
Automated Regression Test Suite for CivicSphere AI Remediation (LIVE-001 through LIVE-017).
Validates fixes across:
- LIVE-002: Document upload stability & serverless temp directory fallback
- LIVE-003 & LIVE-004: Multi-step agent execution with verified tool calls
- LIVE-005 & LIVE-010: Legal query validation (422) & out-of-domain insufficient evidence gate
- LIVE-006 & LIVE-014: 12 official government schemes seeded & context parameter sanitization
- LIVE-007: Knowledge graph contract reconciliation (/graph/neighborhood & /entities/.../relationships)
- LIVE-011: Production security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- LIVE-013: Actionable procedural steps in legal answers
- LIVE-016: Statutory corpus expansion (at least 8 verified Acts)
"""

import io
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.knowledge.sources.registry import source_registry
from backend.app.government.services.ai_service import GovernmentAIService
from backend.app.legal.services.legal_engine import LegalGuidanceEngine
from backend.app.agents.core.base_agent import BaseAgent
from packages.schemas.contracts import FailSafeState


@pytest.fixture
def client():
    return TestClient(app)


# --- LIVE-002: Document Upload 500 Elimination & Fallback ---
def test_live_002_document_upload_success_or_handled(client):
    """LIVE-002: Document upload must handle local fallback cleanly and never return 500."""
    fake_pdf = io.BytesIO(b"%PDF-1.4 test document content for remediation verification")
    files = {"file": ("test_audit_remediation.pdf", fake_pdf, "application/pdf")}
    
    response = client.post(
        "/api/v1/documents/upload",
        files=files,
        headers={"X-User-Id": "usr_remediation_test"},
    )
    assert response.status_code in (200, 201), f"Upload returned unexpected status: {response.status_code} - {response.text}"
    data = response.json()
    assert data.get("success") is True or "id" in data.get("data", {})


# --- LIVE-003 & LIVE-004: Multi-step Autonomous Agent Execution ---
@pytest.mark.anyio
async def test_live_003_004_agent_multistep_execution():
    """LIVE-003/004: Agent must execute multi-step tool calls and not emit canned single-step text."""
    agent = BaseAgent(
        name="Legal Research Specialist",
        system_prompt="Analyze citizen legal rights with verifiable evidence",
        allowed_tools=["search_knowledge", "graph_lookup", "check_eligibility"],
    )
    result = await agent.execute(query="Tenant facing illegal eviction without notice under Rent Control Act")
    assert result["steps_executed"] >= 2, f"Expected >=2 steps executed, got {result['steps_executed']}"
    assert len(result.get("tool_calls", [])) >= 1, "Expected at least 1 verified tool call"
    assert "eviction" in result["response"].lower() or "tenant" in result["response"].lower() or "verified" in result["response"].lower()


# --- LIVE-005 & LIVE-010: Legal Query Validation & Out-of-Domain Circuit Breaker ---
def test_live_005_legal_query_length_validation(client):
    """LIVE-005: Query shorter than 3 characters must return 422 with INVALID_QUERY_LENGTH."""
    response = client.post(
        "/api/v1/legal/query",
        json={"query": "a "},
        headers={"X-User-Id": "usr_remediation_test"},
    )
    assert response.status_code == 422
    assert "INVALID_QUERY_LENGTH" in response.text or "at least 3" in response.text


@pytest.mark.anyio
async def test_live_010_out_of_domain_insufficient_evidence():
    """LIVE-010: Out-of-domain questions (e.g. US Green Card) must trigger Gate 2 INSUFFICIENT_EVIDENCE."""
    query = "How do I renew my US Green Card in California under alien immigration law?"
    res = await LegalGuidanceEngine.process_legal_query(query)
    
    assert res.fail_safe_state == "INSUFFICIENT_EVIDENCE" or res.fail_safe_state == FailSafeState.INSUFFICIENT_EVIDENCE
    assert res.confidence == 0.0
    assert len(res.sources) == 0, "Out-of-domain query must not hallucinate Indian statutory sources"


# --- LIVE-006 & LIVE-014: Government Schemes Catalog & Context Extraction ---
def test_live_006_government_schemes_catalog_populated(client):
    """LIVE-006: Catalog service must return at least 12 verified official Indian government schemes."""
    response = client.get("/api/v1/government/services")
    assert response.status_code == 200
    res_data = response.json()
    services = res_data.get("data", [])
    assert len(services) >= 12, f"Expected at least 12 government schemes, found {len(services)}"


@pytest.mark.anyio
async def test_live_014_parameter_extraction_excludes_provided_context():
    """LIVE-014: Parameter extraction must not ask for parameters already present in citizen_context."""
    analysis = await GovernmentAIService.analyze_problem(
        problem_text="I am a small farmer seeking PM KISAN financial assistance",
        citizen_context={
            "annual_income": 120000,
            "state_of_residence": "Uttar Pradesh",
            "is_landholder": True,
        },
    )
    missing = analysis.get("missing_parameters", [])
    assert "annual_income" not in missing
    assert "state_of_residence" not in missing


# --- LIVE-007: Knowledge Graph Dual Contract Reconciliation ---
def test_live_007_graph_api_contract_compatibility(client):
    """LIVE-007: Both /graph/neighborhood and /entities/{id}/relationships must respond with node/edge structure."""
    from backend.app.knowledge.graph.repository import graph_repository
    if not graph_repository._nodes:
        from backend.app.knowledge.domain.graph import EntityDomainModel, EntityType
        test_node = EntityDomainModel(
            entity_id="ENT_TEST_RTI",
            name="Right to Information Act",
            entity_type=EntityType.STATUTE,
            jurisdiction="IN"
        )
        graph_repository.insert_entity(test_node)
        entity_id = "ENT_TEST_RTI"
    else:
        entity_id = next(iter(graph_repository._nodes.keys()))

    res1 = client.get(f"/api/v1/knowledge/graph/neighborhood/{entity_id}?max_depth=2")
    assert res1.status_code == 200
    data1 = res1.json().get("data", {})
    assert "nodes" in data1 and "edges" in data1
    
    res2 = client.get(f"/api/v1/knowledge/entities/{entity_id}/relationships?depth=2")
    assert res2.status_code == 200
    data2 = res2.json().get("data", {})
    assert "nodes" in data2 and "edges" in data2


# --- LIVE-011: Production Security Headers ---
def test_live_011_security_headers_present(client):
    """LIVE-011: Server responses must include essential hardening headers."""
    response = client.get("/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert "Content-Security-Policy" in headers
    assert "Permissions-Policy" in headers


# --- LIVE-013: Actionable Procedural Steps in Legal Answer ---
@pytest.mark.anyio
async def test_live_013_legal_answer_actionable_procedural_steps():
    """LIVE-013: Legal answer must contain formatted procedural steps."""
    query = "How to file an RTI application for public school admission delay?"
    res = await LegalGuidanceEngine.process_legal_query(query)
    
    assert res.how_it_may_help_or_steps is not None
    assert len(res.what_you_may_consider_doing) > 0
    assert "1." in res.how_it_may_help_or_steps or len(res.what_you_may_consider_doing) >= 2


# --- LIVE-016: Statutory Corpus Expansion ---
def test_live_016_statutory_corpus_expansion(client):
    """LIVE-016: Statutory registry must contain at least 8 verified Indian Acts."""
    sources = source_registry.list_sources()
    assert len(sources) >= 8, f"Expected >= 8 Acts in statutory registry, found {len(sources)}"
    
    titles = [s.title for s in sources]
    assert any("Domestic Violence" in t for t in titles)
    assert any("Real Estate" in t or "RERA" in t for t in titles)
    assert any("Information Technology" in t for t in titles)

    # Also verify via API endpoint
    response = client.get("/api/v1/legal/acts")
    assert response.status_code == 200
    acts = response.json().get("data", [])
    assert len(acts) >= 8
