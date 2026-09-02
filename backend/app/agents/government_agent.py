"""
Government Service & Scheme Specialist Agent.
Analyzes citizen civic situations, evaluates multi-parameter scheme eligibility,
and constructs procedural steps for public services.
"""

from typing import Dict, Any, List, Optional
from backend.app.agents.core.base_agent import BaseAgent
from backend.app.government.services.ai_service import analyze_civic_problem
from backend.app.government.services.eligibility import evaluate_eligibility
from packages.schemas.contracts import EligibilityResult


class GovernmentServiceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="GovernmentServiceAgent",
            system_prompt=(
                "You are the CivicSphere Government Service Navigator Agent. "
                "Your role is to analyze citizen civic situations and match them with "
                "verified Indian public schemes, subsidies, and procedural pathways."
            ),
            allowed_tools=["check_eligibility", "search_knowledge"],
            max_steps=5
        )

    async def analyze_and_match(
        self,
        problem_text: str,
        citizen_context: Optional[Dict[str, Any]] = None,
        jurisdiction: str = "IN"
    ) -> Dict[str, Any]:
        """Analyzes a citizen's situation and matches with verified services."""
        return await analyze_civic_problem(
            problem_text=problem_text,
            citizen_context=citizen_context,
            jurisdiction=jurisdiction
        )

    def check_service_eligibility(
        self,
        rules: List[Dict[str, Any]],
        citizen_context: Dict[str, Any]
    ) -> EligibilityResult:
        """Evaluates dynamic eligibility rules for a specific scheme."""
        return evaluate_eligibility(rules=rules, citizen_context=citizen_context)
