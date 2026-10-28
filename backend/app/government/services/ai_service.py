"""
AI Problem Analysis Service for Government Navigator.
Uses LLM provider abstraction to extract citizen intent, required parameters, and match relevant services.
"""

from typing import Dict, Any, List, Optional
import json
import logging
import re

from backend.app.common.providers.llm import get_llm_provider

logger = logging.getLogger("civicsphere.government.ai")

_ANALYSIS_PROMPT = """\
You are an expert Government Scheme and Service Advisor for CivicSphere.
Analyze the citizen's civic or legal issue and return a structured JSON response.

Input Problem:
"{problem_text}"

Citizen Profile Context:
{context_json}

Return ONLY a JSON object with:
{{
    "detected_intent": "string summary of intent",
    "category": "string (e.g. Welfare, Revenue, Identity, Health, Housing, Legal)",
    "jurisdiction": "IN",
    "extracted_parameters": {{}},
    "missing_parameters": ["list of questions or missing fields needed to confirm eligibility"],
    "suggested_actions": ["concrete action steps citizen can take"]
}}
"""


class GovernmentAIService:
    """Provides LLM-driven civic problem analysis and parameter extraction."""

    @staticmethod
    async def analyze_problem(
        problem_text: str,
        citizen_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        supplied_keys = {k.lower() for k in (citizen_context or {}).keys()}

        def is_supplied(param: str) -> bool:
            p_clean = param.lower().replace(" ", "_").replace("-", "_")
            for k in supplied_keys:
                k_clean = k.lower().replace(" ", "_").replace("-", "_")
                if p_clean == k_clean or p_clean in k_clean or k_clean in p_clean:
                    return True
            return False

        llm = get_llm_provider()
        prompt = _ANALYSIS_PROMPT.format(
            problem_text=problem_text,
            context_json=json.dumps(citizen_context or {})
        )

        try:
            raw = await llm.generate(prompt=prompt, system_prompt="You are a government services reasoning assistant.")
            cleaned = re.sub(r"^```(?:json)?\s*\n?", "", raw.strip())
            cleaned = re.sub(r"\n?```\s*$", "", cleaned).strip()
            match = re.search(r"\{[\s\S]*\}", cleaned)
            if match:
                parsed = json.loads(match.group(0))
                if "missing_parameters" in parsed and isinstance(parsed["missing_parameters"], list):
                    parsed["missing_parameters"] = [p for p in parsed["missing_parameters"] if not is_supplied(p)]
                if "extracted_parameters" not in parsed or not parsed["extracted_parameters"]:
                    parsed["extracted_parameters"] = dict(citizen_context or {})
                else:
                    parsed["extracted_parameters"].update(citizen_context or {})
                return parsed
        except Exception as e:
            logger.warning(f"AI analysis parsing fallback: {e}")

        # Deterministic analysis honoring supplied citizen_context
        candidate_missing = ["state_of_residence", "annual_income", "caste_category", "landholding_acres"]
        missing_params = [p for p in candidate_missing if not is_supplied(p)]

        return {
            "detected_intent": f"Assistance regarding: {problem_text[:80]}...",
            "category": "General Welfare & Services",
            "jurisdiction": "IN",
            "extracted_parameters": dict(citizen_context or {}),
            "missing_parameters": missing_params,
            "suggested_actions": [
                "Verify required identity and residence documents",
                "Apply through official government single-window portal"
            ]
        }


async def analyze_civic_problem(
    problem_text: str,
    citizen_context: Optional[Dict[str, Any]] = None,
    jurisdiction: str = "IN"
) -> Dict[str, Any]:
    return await GovernmentAIService.analyze_problem(problem_text, citizen_context)
