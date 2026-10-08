import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.schemas.investigation import (
    InvestigationState, InvestigationCreate, InvestigationQuestionAnalysis,
    InvestigationEvidenceClaim, InvestigationRelationship, InvestigationContradiction,
    InvestigationEvent, InvestigationEvidence, InvestigationOpenQuestion, InvestigationFollowUpQuery
)
from app.services.investigation_service import InvestigationService, IterationAssessment
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
    
    def mock_persist(state):
        # Assign IDs to evidence so tests work
        for ev in state.retrieved_evidence:
            if not ev.id:
                ev.id = uuid4()
        return state

    repo.create_investigation.side_effect = create_inv
    repo.persist_state.side_effect = mock_persist
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
    def gen_struct(prompt, schema):
        if schema.__name__ == 'InvestigationQuestionAnalysis':
            return InvestigationQuestionAnalysis(
                normalized_question="Test Question",
                investigation_intent="TROUBLESHOOTING",
                subquestions=["Sub 1", "Sub 2"]
            )
        elif schema.__name__ == 'IterationAssessment':
            # We want to match whatever evidence was provided in the prompt to attach claims
            # but since this is a dumb mock, we'll just parse the IDs from the prompt if possible,
            # or just return a dummy claim with no evidence_id (which means it won't be attached)
            # Actually, let's try to extract IDs from the prompt to make it realistic.
            import re
            ids = re.findall(r'ID: ([a-f0-9\-]{36})', prompt)
            
            claims = []
            if ids:
                for idx in ids:
                    claims.append(InvestigationEvidenceClaim(claim_text="Claim 1", classification="DIRECT", evidence_id=idx, confidence=0.9))
            
            return IterationAssessment(
                claims=claims,
                relationships=[],
                contradictions=[],
                new_open_questions=[],
                follow_up_queries=[],
                resolved_question_ids=[]
            )
        return None
    llm.generate_structured.side_effect = gen_struct
    return llm

@pytest.fixture
def investigation_service(mock_investigation_repo, mock_retrieval_service, mock_llm_service):
    return InvestigationService(mock_investigation_repo, mock_retrieval_service, mock_llm_service)

def test_initial_investigation_flow(investigation_service):
    # Restrict iterations for testing
    investigation_service.max_iterations = 1
    
    state = investigation_service.run_initial_investigation("Why is the system slow?")
    
    assert state.status == "COMPLETED"
    assert state.analysis is not None
    assert state.analysis.investigation_intent == "TROUBLESHOOTING"
    assert len(state.analysis.subquestions) == 2
    
    # 3 initial queries execute (1 main, 2 sub)
    # The mock returns 2 chunks for each query. Because of the duplicate check on chunk_id (mock returns same chunks every time? No, uuid4 is called once when the fixture is created, so the same SearchResponse object with the same uuids is returned).
    # Since the first query adds the 2 chunks, subsequent queries will see them as existing!
    assert len(state.retrieved_evidence) == 2
    assert len(state.retrieved_evidence[0].claims) >= 1
    assert state.retrieved_evidence[0].claims[0].classification == "DIRECT"
    
    # Check events
    event_types = [e.event_type for e in state.events]
    assert "INVESTIGATION_CREATED" in event_types
    assert "INITIAL_ANALYSIS_COMPLETED" in event_types
    assert "EVIDENCE_EXTRACTED" in event_types

def test_insufficient_evidence_flow(investigation_service, mock_retrieval_service):
    # If no results retrieved
    mock_retrieval_service.search.return_value = SearchResponse(query="test", results=[], insufficient_evidence=True)
    state = investigation_service.run_initial_investigation("What is the meaning of life?")
    
    assert state.status == "INSUFFICIENT"
    assert len(state.retrieved_evidence) == 0
    
def test_malformed_question_fails_gracefully(investigation_service, mock_llm_service):
    mock_llm_service.generate_structured.side_effect = Exception("LLM Error")
    state = investigation_service.run_initial_investigation("Crash the LLM")
    
    assert state.status == "INVESTIGATION_PROVIDER_FAILURE"
    error_event = next((e for e in state.events if e.event_type == "INVESTIGATION_PROVIDER_FAILURE"), None)
    assert error_event is not None
    assert "LLM Error" in error_event.details
