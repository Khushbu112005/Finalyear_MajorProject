"""
Tests for Phase 6 Agent System & Tool Infrastructure.
Verifies multi-agent orchestration, bounded reasoning loops, tool sandboxing, and security boundaries.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.agents.core.tools import tool_registry, AgentTool
from backend.app.common.errors import SecurityBlockedException

client = TestClient(app)


def test_agent_chat_endpoint(citizen_auth_headers):
    payload = {
        "query": "How do I file a consumer complaint against an e-commerce platform for non-delivery under the Consumer Protection Act?",
        "context": {"claim_amount": 50000},
        "jurisdiction": "IN"
    }
    resp = client.post("/api/v1/agents/chat", json=payload, headers=citizen_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["status"] in ("COMPLETED", "MAX_STEPS_REACHED")
    assert "response" in data
    assert data["steps_executed"] <= 5


def test_list_agent_tools_endpoint():
    resp = client.get("/api/v1/agents/tools")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]) >= 4
    tool_names = [t["name"] for t in body["data"]]
    assert "search_knowledge" in tool_names
    assert "graph_lookup" in tool_names
    assert "check_eligibility" in tool_names
    assert "get_legal_guidance" in tool_names


def test_tool_sandbox_blocks_unregistered_tool():
    import asyncio
    async def _run():
        with pytest.raises(SecurityBlockedException):
            await tool_registry.execute_tool(
                tool_name="unregistered_malicious_tool",
                parameters={"cmd": "whoami"}
            )
    asyncio.run(_run())


def test_specialist_agents_execution():
    import asyncio
    from backend.app.agents.legal_agent import LegalResearchAgent
    from backend.app.agents.government_agent import GovernmentServiceAgent
    from backend.app.agents.document_agent import DocumentAnalysisAgent
    from backend.app.agents.knowledge_agent import KnowledgeGraphAgent
    from backend.app.agents.citation_agent import CitationVerificationAgent
    from backend.app.agents.safety_agent import SafetyAgent

    async def _run():
        # 1. Legal Research Agent
        legal_agent = LegalResearchAgent()
        legal_res = await legal_agent.execute_research("RTI Section 7 time limit", jurisdiction="IN")
        assert legal_res is not None
        assert len(legal_res.what_you_may_consider_doing) > 0

        # 2. Government Service Agent
        gov_agent = GovernmentServiceAgent()
        elig = gov_agent.check_service_eligibility(
            rules=[{"rule_id": "r1", "condition_type": "MIN_AGE", "field_name": "age", "operator": ">=", "threshold_value": 18}],
            citizen_context={"age": 25}
        )
        assert elig.is_eligible is True

        # 3. Document Analysis Agent
        doc_agent = DocumentAnalysisAgent()
        scan = doc_agent.scan_security(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF")
        assert scan["is_safe"] is True

        # 4. Knowledge Graph Agent
        kg_agent = KnowledgeGraphAgent()
        evidence = await kg_agent.search_and_traverse("Right to Information Act", top_k=2)
        assert evidence is not None

        # 5. Citation Verification Agent
        cit_agent = CitationVerificationAgent()
        verif = cit_agent.verify_citation("Right to Information Act, 2005", "7")
        assert verif.verdict.value in ("SUPPORTED", "UNVERIFIED")

        # 6. Safety Agent
        safety = SafetyAgent()
        is_safe, text, _ = safety.screen_input("My Aadhaar is 1234-5678-9012")
        assert is_safe is True
        assert "[AADHAAR_MASKED]" in text

    asyncio.run(_run())
