from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    supabase_url: str
    supabase_secret_key: str
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    llm_model: str = "gemini-3.5-flash"
    embedding_model: str = "gemini-embedding-2"
    embedding_dimension: int = 1536
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

try:
    settings = Settings()
except Exception as e:
    # Fail fast if required configuration is missing
    raise RuntimeError(f"Failed to load backend configuration: {e}")
