from typing import List, Optional
from google import genai
from google.genai import types
from app.core.config import settings
from app.core.logger import logger

class EmbeddingService:
    def __init__(self, api_key: Optional[str] = None, model: str = None):
        self.api_key = api_key or settings.gemini_api_key
        self.model = model or settings.embedding_model or "gemini-embedding-2"
        self.dimension = settings.embedding_dimension
        
        # We only instantiate the client if we have an API key, to allow mocking/tests without it
        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a list of string chunks.
        """
        if not texts:
            return []
            
        if not self.client:
            raise RuntimeError("Embedding client not initialized (missing API key).")
            
        try:
            # Call Gemini to get embeddings for the batch
            response = self.client.models.embed_content(
                model=self.model,
                contents=texts,
                config=types.EmbedContentConfig(output_dimensionality=self.dimension)
            )
            
            # The SDK returns embeddings in the same order as the input
            if not response.embeddings:
                return []
                
            return [item.values for item in response.embeddings]
            
        except Exception as e:
            logger.error(f"Gemini API Error during embedding generation: {e}")
            raise

def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()

