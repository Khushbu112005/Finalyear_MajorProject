"""
LLM Provider Abstraction for CivicSphere AI.
Defines clean abstract interfaces for text generation and structured outputs,
isolating vendor SDKs (Gemini, Claude, OpenAI) behind internal contracts.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type, TypeVar
import json
import logging
import os
from pydantic import BaseModel

logger = logging.getLogger("civicsphere.providers.llm")

T = TypeVar("T", bound=BaseModel)


class LLMProvider(ABC):
    """Abstract base class for all Large Language Model providers."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 2048,
    ) -> str:
        """Generate freeform text response."""
        pass

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
    ) -> T:
        """Generate structured output validated against a Pydantic schema."""
        pass


class MockLLMProvider(LLMProvider):
    """
    Deterministic, offline mock LLM provider for testing and development.
    Never makes external network calls.
    """

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 2048,
    ) -> str:
        logger.debug(f"[MockLLMProvider] generate called with prompt length {len(prompt)}")
        return f"[MockLLM Response grounded on evidence]: Understanding verified for query."

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
    ) -> T:
        logger.debug(f"[MockLLMProvider] generate_structured called for schema {schema.__name__}")
        # Return a valid default instance if possible
        try:
            return schema.model_validate({})
        except Exception:
            # Construct empty dummy data for fields
            dummy_data = {}
            for field_name, field_info in schema.model_fields.items():
                if field_info.annotation in (str, Optional[str]):
                    dummy_data[field_name] = f"Mock {field_name}"
                elif field_info.annotation in (int, Optional[int]):
                    dummy_data[field_name] = 1
                elif field_info.annotation in (float, Optional[float]):
                    dummy_data[field_name] = 0.95
                elif field_info.annotation in (bool, Optional[bool]):
                    dummy_data[field_name] = True
                elif getattr(field_info.annotation, "__origin__", None) is list:
                    dummy_data[field_name] = []
                elif getattr(field_info.annotation, "__origin__", None) is dict:
                    dummy_data[field_name] = {}
                else:
                    dummy_data[field_name] = None
            return schema.model_validate(dummy_data)


class GoogleGeminiLLMProvider(LLMProvider):
    """Google Gemini LLM provider implementation."""

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        self.model_name = model_name
        if self.api_key:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 2048,
    ) -> str:
        if not self.api_key:
            return await MockLLMProvider().generate(prompt, system_prompt, temperature, max_tokens)
        import google.generativeai as genai
        model = genai.GenerativeModel(
            self.model_name,
            system_instruction=system_prompt if system_prompt else None,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
        )
        response = model.generate_content(prompt)
        return response.text

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
    ) -> T:
        if not self.api_key:
            return await MockLLMProvider().generate_structured(prompt, schema, system_prompt, temperature)
        import google.generativeai as genai
        model = genai.GenerativeModel(
            self.model_name,
            system_instruction=system_prompt if system_prompt else None,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=temperature,
            )
        )
        response = model.generate_content(prompt)
        data = json.loads(response.text)
        return schema.model_validate(data)


def get_llm_provider(provider_name: Optional[str] = None) -> LLMProvider:
    """Factory method to get configured LLM provider."""
    from backend.app.common.config import settings
    name = (provider_name or settings.LLM_PROVIDER).lower()
    if name == "google" or name == "gemini":
        return GoogleGeminiLLMProvider(model_name=settings.LLM_MODEL)
    return MockLLMProvider()
