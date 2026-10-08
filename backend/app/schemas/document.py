from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import date, datetime
from uuid import UUID

class DocumentBase(BaseModel):
    document_type: str = Field(..., description="The type of the document (e.g. incident_report, postmortem, troubleshooting)")
    service: Optional[str] = Field(None, description="The service this document relates to")
    document_date: Optional[date] = Field(None, description="The date the document was authored or the incident occurred")
    software_version: Optional[str] = Field(None, description="Software version relevant to the document")
    title: str = Field(..., description="Title of the document")
    source: str = Field(..., description="Unique source identifier (e.g. INC-1042)")
    content: str = Field(..., description="The raw content of the document")

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentChunkBase(BaseModel):
    chunk_index: int
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class DocumentChunkCreate(DocumentChunkBase):
    document_id: UUID
    embedding: List[float]

class DocumentChunkResponse(DocumentChunkBase):
    id: UUID
    document_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IngestionResponse(BaseModel):
    document_id: UUID
    chunks_created: int
    status: str
