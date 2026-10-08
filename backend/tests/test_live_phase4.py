import pytest
from app.services.investigation_service import get_investigation_service
from app.repositories.investigation_repo import get_investigation_repo
from app.repositories.search_repo import get_search_repo
from app.services.retrieval_service import RetrievalService
from app.services.embedding_service import get_embedding_service
from app.services.llm_service import get_llm_service

@pytest.fixture
def live_investigation_service():
    repo = get_investigation_repo()
    search_repo = get_search_repo()
    embedding = get_embedding_service()
    llm = get_llm_service()
    retrieval = RetrievalService(search_repo, embedding)
    return get_investigation_service(repo, retrieval, llm)

@pytest.mark.skip(reason="Live LLM tests are slow, uncomment to run manually")
def test_acceptance_a(live_investigation_service):
    question = "Why did the Order API become slow on September 16? Check whether the deployment was related and whether we have seen this before."
    state = live_investigation_service.run_initial_investigation(question)
    
    assert state.status == "COMPLETED"
    assert len(state.retrieved_evidence) > 0
    # Must retrieve INC-1042, DEP-882, PM-211 somehow, but chunk IDs/doc IDs are dynamic in test
    sources = [ev.source for ev in state.retrieved_evidence if ev.source]
    assert "INC-1042" in sources
    assert "DEP-882" in sources
    assert "PM-211" in sources

@pytest.mark.skip(reason="Live LLM tests are slow, uncomment to run manually")
def test_acceptance_b(live_investigation_service):
    question = "The service is failing after a deployment. What should the on-call engineer do first?"
    state = live_investigation_service.run_initial_investigation(question)
    
    assert state.status == "COMPLETED"
    sources = [ev.source for ev in state.retrieved_evidence if ev.source]
    assert "GUIDE-12" in sources
    assert "GUIDE-41" in sources
    
    # We expect a contradiction to be extracted
    assert len(state.contradictions) > 0

@pytest.mark.skip(reason="Live LLM tests are slow, uncomment to run manually")
def test_acceptance_c(live_investigation_service):
    question = "Did this exact failure happen before?"
    state = live_investigation_service.run_initial_investigation(question)
    assert state.status == "COMPLETED"
    
@pytest.mark.skip(reason="Live LLM tests are slow, uncomment to run manually")
def test_no_fabrication(live_investigation_service):
    question = "What is the secret recipe for Krabby Patties in the codebase?"
    state = live_investigation_service.run_initial_investigation(question)
    assert state.status == "INSUFFICIENT_EVIDENCE"
    assert state.retrieved_evidence[0].claims[0].classification == "INSUFFICIENT"

def test_api_integration():
    pass
