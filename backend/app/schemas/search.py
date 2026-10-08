from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import date
from uuid import UUID

class SearchFilter(BaseModel):
    service: Optional[str] = None
    document_type: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    software_version: Optional[str] = None
    document_id: Optional[UUID] = None

class SearchRequest(BaseModel):
    query: str = Field(..., description="The natural language query to search for")
    top_k: int = Field(5, ge=1, le=50, description="Maximum number of results to return")
    filters: Optional[SearchFilter] = Field(None, description="Optional metadata filters")

class SearchResult(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    content: str
    similarity: float
    document_type: str
    service: Optional[str] = None
    document_date: Optional[date] = None
    software_version: Optional[str] = None
    title: str
    source: str

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    retrieval_method: str = "hybrid_vector"
    applied_filters: Optional[SearchFilter] = None
    insufficient_evidence: bool = False
