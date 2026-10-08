from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, date
from uuid import UUID

# Shared enums using Literal for simplicity
from typing import Literal

EvidenceClassification = Literal[
    "DIRECT",
    "CORROBORATED",
    "TEMPORAL",
    "INFERRED",
    "CONTRADICTED",
    "INSUFFICIENT"
]

RelationshipType = Literal[
    "TEMPORAL_BEFORE",
    "TEMPORAL_AFTER",
    "SAME_SERVICE",
    "SAME_FAILURE_TYPE",
    "SAME_VERSION",
    "DIFFERENT_VERSION",
    "SIMILAR_INCIDENT",
    "POSSIBLE_RELATION",
    "CONTRADICTS",
    "CORROBORATES"
]

class InvestigationQuestionAnalysis(BaseModel):
    normalized_question: str
    entities: List[str] = []
    services: List[str] = []
    dates: List[date] = []
    software_versions: List[str] = []
    investigation_intent: str
    subquestions: List[str] = []

class InvestigationEvidenceClaim(BaseModel):
    id: Optional[UUID] = None
    evidence_id: Optional[UUID] = None
    claim_text: str
    classification: EvidenceClassification
    confidence: Optional[float] = None

class InvestigationEvidence(BaseModel):
    id: Optional[UUID] = None
    document_id: UUID
    chunk_id: UUID
    claims: List[InvestigationEvidenceClaim] = []
    source_text: Optional[str] = None # Text of the chunk
    source: Optional[str] = None # Document source reference (e.g. INC-1042)

class InvestigationRelationship(BaseModel):
    id: Optional[UUID] = None
    source_evidence_id: UUID
    target_evidence_id: UUID
    relationship_type: RelationshipType
    explanation: Optional[str] = None
    confidence: Optional[float] = None

class InvestigationContradiction(BaseModel):
    id: Optional[UUID] = None
    evidence_1_id: UUID
    evidence_2_id: UUID
    conflicting_claims: str
    context_info: Optional[str] = None
    status: str = "OPEN"

class InvestigationOpenQuestion(BaseModel):
    id: Optional[UUID] = None
    question: str
    reason: Optional[str] = None
    related_evidence_id: Optional[UUID] = None # legacy reference
    why_it_matters: Optional[str] = None
    supporting_evidence_ids: List[UUID] = []
    status: str = "OPEN" # OPEN, RESOLVED, UNRESOLVED, SKIPPED, BLOCKED
    generated_at: Optional[datetime] = None
    resolved_by_evidence_ids: List[UUID] = []
    resolution_reason: Optional[str] = None

class InvestigationFollowUpQuery(BaseModel):
    id: Optional[UUID] = None
    question_id: Optional[UUID] = None
    query_text: str
    reason: Optional[str] = None
    supporting_evidence_ids: List[UUID] = []
    priority: Optional[str] = None
    status: str = "PENDING" # PENDING, EXECUTED, SKIPPED, FAILED, NO_RESULTS
    iteration: int = 1
    retrieved_result_ids: List[UUID] = []

class InvestigationEvent(BaseModel):
    id: Optional[UUID] = None
    event_type: str
    details: Optional[str] = None
    timestamp: Optional[datetime] = None

class InvestigationState(BaseModel):
    investigation_id: Optional[UUID] = None
    original_question: str
    analysis: Optional[InvestigationQuestionAnalysis] = None
    retrieved_evidence: List[InvestigationEvidence] = []
    relationships: List[InvestigationRelationship] = []
    contradictions: List[InvestigationContradiction] = []
    open_questions: List[InvestigationOpenQuestion] = []
    follow_up_queries: List[InvestigationFollowUpQuery] = []
    events: List[InvestigationEvent] = []
    iteration_count: int = 1
    status: str = "IN_PROGRESS"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class InvestigationCreate(BaseModel):
    question: str

# Forward reference — conclusion lives in conclusion.py to avoid circular imports.
# InvestigationState exposes it as optional Any to keep schemas decoupled.
from typing import Any as _Any

class InvestigationStateWithConclusion(InvestigationState):
    """Extended state returned by the API that includes the final conclusion."""
    conclusion: Optional[_Any] = None  # InvestigationConclusion when available
