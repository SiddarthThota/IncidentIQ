import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import TypeVar, Type

from app.core.config import settings
from app.core.logger import logger

T = TypeVar('T', bound=BaseModel)

class LLMService:
    def __init__(self):
        # We rely on GEMINI_API_KEY env var
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set.")
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash"
        
    def generate_structured(self, prompt: str, schema: Type[T]) -> T:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.1
                )
            )
            return schema.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"LLM generate_structured failed: {e}")
            raise e

def get_llm_service() -> LLMService:
    return LLMService()
