from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID

from typing import Literal

ConclusionStatus = Literal[
    "SUPPORTED",
    "PARTIALLY_SUPPORTED",
    "INSUFFICIENT",
    "CONTRADICTED",
    "PROVIDER_LIMITED"
]

ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]

FindingClassification = Literal[
    "DIRECT",
    "CORROBORATED",
    "TEMPORAL",
    "INFERRED",
    "CONTRADICTED",
    "INSUFFICIENT"
]

class TimelineEvent(BaseModel):
    id: Optional[UUID] = None
    event_label: str
    event_date: Optional[date] = None
    event_timestamp: Optional[datetime] = None
    document_date: Optional[date] = None
    source_label: Optional[str] = None
    software_version: Optional[str] = None
    service: Optional[str] = None
    evidence_id: Optional[UUID] = None
    ordering: int = 0

class SourceReference(BaseModel):
    id: Optional[UUID] = None
    source_label: str
    document_id: Optional[UUID] = None
    evidence_id: Optional[UUID] = None

class InvestigationFinding(BaseModel):
    id: Optional[UUID] = None
    statement: str
    classification: FindingClassification
    confidence: ConfidenceLevel
    reasoning_basis: Optional[str] = None
    evidence_ids: List[UUID] = []
    document_ids: List[UUID] = []
    chunk_ids: List[UUID] = []

class InvestigationConclusion(BaseModel):
    id: Optional[UUID] = None
    investigation_id: UUID
    summary: str
    conclusion_status: ConclusionStatus
    confidence: ConfidenceLevel
    uncertainty_notes: Optional[str] = None
    findings: List[InvestigationFinding] = []
    timeline: List[TimelineEvent] = []
    source_references: List[SourceReference] = []
    unresolved_questions: List[str] = []
    generated_at: Optional[datetime] = None
