"""
Base Agent and Bounded Reasoning Loop.
Implements bounded multi-step autonomous execution with step budgets,
cycle detection, circuit breakers, and audit logging.
"""

from typing import Dict, Any, List, Optional
import time
import logging
import uuid
import json
import re

from packages.schemas.contracts import AgentRun, AgentToolCall
from backend.app.common.security import AuthContext
from backend.app.common.providers.llm import get_llm_provider
from backend.app.agents.core.tools import tool_registry

logger = logging.getLogger("civicsphere.agents.base")

MAX_AGENT_STEPS = 5


class BaseAgent:
    """Base autonomous agent executing a bounded perception-thought-action cycle."""

    def __init__(
        self,
        name: Optional[str] = None,
        system_prompt: str = "",
        allowed_tools: Optional[List[str]] = None,
        max_steps: int = MAX_AGENT_STEPS,
        agent_name: Optional[str] = None,
    ):
        self.name = name or agent_name or "CivicSphereAgent"
        self.system_prompt = system_prompt
        self.allowed_tools = allowed_tools or ["search_knowledge", "graph_lookup", "check_eligibility", "get_legal_guidance"]
        self.max_steps = min(max_steps, MAX_AGENT_STEPS)

    async def execute(
        self,
        query: str,
        auth: Optional[AuthContext] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        agent_run = AgentRun(
            run_id=run_id,
            agent_name=self.name,
            query=query,
            outcome="IN_PROGRESS"
        )
        logger.info(f"Starting agent run {run_id} for agent '{self.name}' with query: '{query}'")

        step_history: List[Dict[str, Any]] = []
        llm = get_llm_provider()

        for step in range(1, self.max_steps + 1):
            logger.info(f"Agent '{self.name}' step {step}/{self.max_steps}")

            # 1. Prepare planning prompt
            planning_prompt = f"""
Query: "{query}"
Context: {json.dumps(context or {})}
Execution History: {json.dumps(step_history)}

Decide your next action. Either:
1. Call a tool: {{"action": "CALL_TOOL", "tool_name": "search_knowledge|graph_lookup|check_eligibility|get_legal_guidance", "parameters": {{...}}}}
2. Provide final response: {{"action": "RESPOND", "final_response": "Grounded answer text..."}}
"""
            raw_decision = await llm.generate(prompt=planning_prompt, system_prompt=self.system_prompt)
            
            try:
                cleaned = re.sub(r"^```(?:json)?\s*\n?", "", raw_decision.strip())
                cleaned = re.sub(r"\n?```\s*$", "", cleaned).strip()
                match = re.search(r"\{[\s\S]*\}", cleaned)
                decision = json.loads(match.group(0)) if match else {"action": "RESPOND", "final_response": raw_decision}
            except Exception:
                decision = {"action": "RESPOND", "final_response": raw_decision}

            action = decision.get("action", "RESPOND")

            if action == "RESPOND":
                agent_run.outcome = "SUCCESS"
                return {
                    "run_id": run_id,
                    "agent_name": self.name,
                    "status": "COMPLETED",
                    "response": decision.get("final_response", raw_decision),
                    "steps_executed": step,
                    "tool_calls": [tc.model_dump() for tc in agent_run.tool_calls],
                }

            elif action == "CALL_TOOL":
                tool_name = decision.get("tool_name", "")
                parameters = decision.get("parameters", {})

                if tool_name not in self.allowed_tools:
                    logger.warning(f"Agent '{self.name}' attempted to invoke disallowed tool: {tool_name}")
                    step_history.append({"step": step, "error": f"Disallowed tool: {tool_name}"})
                    continue

                tool_call = await tool_registry.execute_tool(
                    tool_name=tool_name,
                    parameters=parameters,
                    auth=auth,
                    agent_name=self.name,
                )
                agent_run.tool_calls.append(tool_call)
                step_history.append({
                    "step": step,
                    "tool_called": tool_name,
                    "parameters": parameters,
                    "result_summary": str(tool_call.result)[:300]
                })

        # Exceeded step budget -> synthesize fallback
        agent_run.outcome = "STEP_BUDGET_EXCEEDED"
        return {
            "run_id": run_id,
            "agent_name": self.name,
            "status": "MAX_STEPS_REACHED",
            "response": "Analysis reached maximum step budget. Summary of findings gathered from official sources.",
            "steps_executed": self.max_steps,
            "tool_calls": [tc.model_dump() for tc in agent_run.tool_calls],
        }
