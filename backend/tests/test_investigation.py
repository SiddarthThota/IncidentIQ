import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.schemas.investigation import (
    InvestigationState, InvestigationCreate, InvestigationQuestionAnalysis,
    InvestigationEvidenceClaim, InvestigationRelationship, InvestigationContradiction,
    InvestigationEvent, InvestigationEvidence
)
from app.services.investigation_service import InvestigationService
from app.repositories.investigation_repo import InvestigationRepository
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService
from app.schemas.search import SearchResponse, SearchResult

@pytest.fixture
def mock_investigation_repo():
    repo = Mock(spec=InvestigationRepository)
    def create_inv(q):
        s = InvestigationState(investigation_id=uuid4(), original_question=q)
        return s
    repo.create_investigation.side_effect = create_inv
    repo.persist_state.side_effect = lambda s: s
    return repo

@pytest.fixture
def mock_retrieval_service():
    retrieval = Mock(spec=RetrievalService)
    retrieval.search.return_value = SearchResponse(
        query="test",
        results=[
            SearchResult(
                chunk_id=uuid4(), document_id=uuid4(), chunk_index=0,
                content="test content 1", similarity=0.9, document_type="doc", source="SRC-1", title="Title 1"
            ),
            SearchResult(
                chunk_id=uuid4(), document_id=uuid4(), chunk_index=0,
                content="test content 2", similarity=0.8, document_type="doc", source="SRC-2", title="Title 2"
            )
        ]
    )
    return retrieval

@pytest.fixture
def mock_llm_service():
    llm = Mock(spec=LLMService)
    # Mock structured generation
    def gen_struct(prompt, schema):
        if schema.__name__ == 'InvestigationQuestionAnalysis':
            return InvestigationQuestionAnalysis(
                normalized_question="Test Question",
                investigation_intent="TROUBLESHOOTING",
                subquestions=["Sub 1", "Sub 2"]
            )
        elif schema.__name__ == 'ExtractedClaims':
            class TmpClaims:
                claims = [InvestigationEvidenceClaim(claim_text="Claim 1", classification="DIRECT", confidence=0.9)]
            return TmpClaims()
        elif schema.__name__ == 'ExtractedRelationships':
            class TmpRel:
                relationships = [InvestigationRelationship(source_evidence_id=uuid4(), target_evidence_id=uuid4(), relationship_type="POSSIBLE_RELATION")]
            return TmpRel()
        elif schema.__name__ == 'ExtractedContradictions':
            class TmpContra:
                contradictions = [InvestigationContradiction(evidence_1_id=uuid4(), evidence_2_id=uuid4(), conflicting_claims="Conflict 1")]
            return TmpContra()
        return None
    llm.generate_structured.side_effect = gen_struct
    return llm

@pytest.fixture
def investigation_service(mock_investigation_repo, mock_retrieval_service, mock_llm_service):
    return InvestigationService(mock_investigation_repo, mock_retrieval_service, mock_llm_service)

def test_initial_investigation_flow(investigation_service):
    state = investigation_service.run_initial_investigation("Why is the system slow?")
    
    assert state.status == "COMPLETED"
    assert state.analysis is not None
    assert state.analysis.investigation_intent == "TROUBLESHOOTING"
    assert len(state.analysis.subquestions) == 2
    
    # We mocked 2 chunks returned by retrieval, and each gets 1 claim extracted
    assert len(state.retrieved_evidence) == 2
    assert len(state.retrieved_evidence[0].claims) == 1
    assert state.retrieved_evidence[0].claims[0].classification == "DIRECT"
    
    # Check events
    event_types = [e.event_type for e in state.events]
    assert "INVESTIGATION_STARTED" in event_types
    assert "QUESTION_ANALYZED" in event_types
    assert "CLAIMS_EXTRACTED" in event_types
    assert "RELATIONSHIPS_ANALYZED" in event_types

def test_insufficient_evidence_flow(investigation_service, mock_retrieval_service):
    # If no results retrieved
    mock_retrieval_service.search.return_value = SearchResponse(query="test", results=[], insufficient_evidence=True)
    state = investigation_service.run_initial_investigation("What is the meaning of life?")
    
    assert state.status == "INSUFFICIENT_EVIDENCE"
    assert len(state.retrieved_evidence) == 1
    assert state.retrieved_evidence[0].claims[0].classification == "INSUFFICIENT"
    
def test_malformed_question_fails_gracefully(investigation_service, mock_llm_service):
    mock_llm_service.generate_structured.side_effect = Exception("LLM Error")
    state = investigation_service.run_initial_investigation("Crash the LLM")
    
    assert state.status == "FAILED"
    error_event = next((e for e in state.events if e.event_type == "ERROR"), None)
    assert error_event is not None
    assert "LLM Error" in error_event.details
