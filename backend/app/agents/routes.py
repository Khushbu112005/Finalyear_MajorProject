"""
Agent System API Routes (Phase 6).
Provides agentic multi-step reasoning, tool execution, and specialist coordination.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from packages.schemas.contracts import ApiResponse
from backend.app.common.security import AuthContext
from backend.app.auth.models import UserModel
from backend.app.auth.dependencies import get_current_user_optional
from backend.app.agents.core.tools import tool_registry
from backend.app.agents.orchestrator import orchestrator

router = APIRouter(prefix="/agents", tags=["Agent System & Orchestration"])


class AgentChatRequest(BaseModel):
    query: str = Field(min_length=3, description="Citizen inquiry")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    jurisdiction: Optional[str] = "IN"


@router.post("/chat", response_model=ApiResponse[Dict[str, Any]])
async def agent_chat(
    payload: AgentChatRequest,
    current_user: Optional[UserModel] = Depends(get_current_user_optional),
):
    """
    Submits a query to the multi-agent orchestrator for bounded autonomous reasoning and evidence synthesis.
    """
    auth = None
    if current_user:
        auth = AuthContext(
            user_id=current_user.id,
            email=current_user.email,
            role=current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
            is_authenticated=True
        )

    result = await orchestrator.route_and_execute(
        query=payload.query,
        auth=auth,
        context=payload.context or {}
    )

    return ApiResponse(
        data=result,
        confidence=0.95 if result.get("status") == "COMPLETED" else 0.70,
    )


@router.get("/tools", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_agent_tools():
    """Returns the catalog of registered and sandboxed agent tools."""
    tools = tool_registry.list_tools()
    return ApiResponse(data=tools, confidence=1.0)
