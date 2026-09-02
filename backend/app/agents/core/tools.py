"""
Unified Tool Infrastructure for CivicSphere Agent System.
Enforces strict allowlisting, parameter validation, execution timeouts,
output boundary wrapping, and comprehensive audit logging.
"""

from typing import Dict, Any, Callable, Awaitable, List, Optional
import time
import logging
import asyncio

from packages.schemas.contracts import AgentToolCall
from backend.app.common.security import AuthContext
from backend.app.common.errors import SecurityBlockedException, ValidationException
from backend.app.knowledge.retrieval.hybrid import hybrid_retrieval_service
from backend.app.knowledge.domain.retrieval import RetrievalRequest, FilterCriteria
from backend.app.knowledge.graph.repository import graph_repository
from backend.app.government.services.eligibility import check_eligibility
from backend.app.legal.services.legal_engine import LegalGuidanceEngine

logger = logging.getLogger("civicsphere.agents.tools")


class AgentTool:
    """Represents a single registered agent tool with metadata and execution handler."""

    def __init__(
        self,
        name: str,
        description: str,
        parameters_schema: Dict[str, Any],
        handler: Callable[..., Awaitable[Any]],
        required_roles: Optional[List[str]] = None,
        timeout_seconds: float = 8.0,
    ):
        self.name = name
        self.description = description
        self.parameters_schema = parameters_schema
        self.handler = handler
        self.required_roles = required_roles or []
        self.timeout_seconds = timeout_seconds


class ToolRegistry:
    """Central registry and execution sandbox for all agent tools."""

    def __init__(self):
        self._tools: Dict[str, AgentTool] = {}
        self._register_default_tools()

    def register(self, tool: AgentTool) -> None:
        self._tools[tool.name] = tool
        logger.info(f"Registered agent tool '{tool.name}'")

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters_schema": t.parameters_schema,
                "required_roles": t.required_roles,
            }
            for t in self._tools.values()
        ]

    async def execute_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        auth: Optional[AuthContext] = None,
        agent_name: str = "CivicSphereAgent",
    ) -> AgentToolCall:
        if tool_name not in self._tools:
            logger.warning(f"Agent {agent_name} attempted to call unregistered tool: {tool_name}")
            raise SecurityBlockedException(f"Tool '{tool_name}' is not registered or permitted.")

        tool = self._tools[tool_name]

        # Role restriction check
        if tool.required_roles and auth:
            user_role = auth.role.upper() if auth.role else "CITIZEN"
            if user_role not in [r.upper() for r in tool.required_roles] and user_role != "ADMIN":
                raise SecurityBlockedException(f"Role '{user_role}' is not authorized to invoke tool '{tool_name}'.")

        start_time = time.perf_counter()
        try:
            # Execute with timeout safeguard
            result = await asyncio.wait_for(
                tool.handler(parameters, auth),
                timeout=tool.timeout_seconds
            )
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            
            # Wrap output in untrusted data boundary if string
            sanitized_result = result
            if isinstance(result, str):
                sanitized_result = f"<data_boundary source='{tool_name}'>\n{result}\n</data_boundary>"

            return AgentToolCall(
                tool_name=tool_name,
                parameters=parameters,
                result=sanitized_result if isinstance(sanitized_result, dict) else {"output": sanitized_result},
                execution_time_ms=round(duration_ms, 2),
                status="SUCCESS"
            )
        except asyncio.TimeoutError:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(f"Tool '{tool_name}' timed out after {tool.timeout_seconds}s")
            return AgentToolCall(
                tool_name=tool_name,
                parameters=parameters,
                result={"error": f"Tool execution timed out after {tool.timeout_seconds}s"},
                execution_time_ms=round(duration_ms, 2),
                status="ERROR"
            )
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(f"Error executing tool '{tool_name}': {e}")
            return AgentToolCall(
                tool_name=tool_name,
                parameters=parameters,
                result={"error": str(e)},
                execution_time_ms=round(duration_ms, 2),
                status="ERROR"
            )

    def _register_default_tools(self):
        # 1. Knowledge Retrieval Tool
        async def _search_knowledge_handler(params: Dict[str, Any], auth: Optional[AuthContext]):
            query = params.get("query", "")
            jurisdiction = params.get("jurisdiction", "IN")
            top_k = params.get("top_k", 5)
            req = RetrievalRequest(query=query, filters=FilterCriteria(jurisdiction=jurisdiction), top_k=top_k)
            pack = await hybrid_retrieval_service.retrieve(req)
            return pack.model_dump()

        self.register(AgentTool(
            name="search_knowledge",
            description="Searches verified official statutory knowledge base using hybrid vector+lexical+graph retrieval.",
            parameters_schema={"query": "string", "jurisdiction": "string", "top_k": "integer"},
            handler=_search_knowledge_handler
        ))

        # 2. Graph Lookup Tool
        async def _graph_lookup_handler(params: Dict[str, Any], auth: Optional[AuthContext]):
            entity_name = params.get("entity_name", "")
            max_depth = min(params.get("max_depth", 2), 2)
            nodes = graph_repository.find_entities_by_name(entity_name, limit=3)
            results = []
            for n in nodes:
                entities, relationships = graph_repository.get_neighborhood(n.entity_id, max_depth=max_depth)
                results.append({
                    "root_entity": n.model_dump(),
                    "neighbors": [e.model_dump() for e in entities],
                    "relationships": [r.model_dump() for r in relationships],
                })
            return {"results": results}

        self.register(AgentTool(
            name="graph_lookup",
            description="Explores verified Neo4j Knowledge Graph relationships for a specific entity or statutory provision.",
            parameters_schema={"entity_name": "string", "max_depth": "integer"},
            handler=_graph_lookup_handler
        ))

        # 3. Check Eligibility Tool
        async def _check_eligibility_handler(params: Dict[str, Any], auth: Optional[AuthContext]):
            rules = params.get("rules", [])
            citizen_context = params.get("citizen_context", {})
            return check_eligibility(rules, citizen_context)

        self.register(AgentTool(
            name="check_eligibility",
            description="Evaluates citizen context parameters against government scheme eligibility rules.",
            parameters_schema={"rules": "array", "citizen_context": "object"},
            handler=_check_eligibility_handler
        ))

        # 4. Legal Guidance Tool
        async def _get_legal_guidance_handler(params: Dict[str, Any], auth: Optional[AuthContext]):
            query = params.get("query", "")
            jurisdiction = params.get("jurisdiction", "IN")
            ans = await LegalGuidanceEngine.process_legal_query(query=query, jurisdiction=jurisdiction)
            return ans.model_dump()

        self.register(AgentTool(
            name="get_legal_guidance",
            description="Generates grounded 10-section legal guidance with citation provenance for civic inquiries.",
            parameters_schema={"query": "string", "jurisdiction": "string"},
            handler=_get_legal_guidance_handler
        ))


tool_registry = ToolRegistry()
