import pytest
from uuid import uuid4
from datetime import date
from unittest.mock import Mock, MagicMock

from app.schemas.search import SearchRequest, SearchFilter, SearchResponse, SearchResult
from app.services.retrieval_service import RetrievalService
from app.repositories.search_repo import SearchRepository
from app.services.embedding_service import EmbeddingService

@pytest.fixture
def mock_embedding_service():
    mock = Mock(spec=EmbeddingService)
    mock.generate_embeddings.return_value = [[0.1] * 1536]
    return mock

@pytest.fixture
def mock_search_repo():
    mock = Mock(spec=SearchRepository)
    # Default return value for search_chunks
    doc1 = uuid4()
    doc2 = uuid4()
    mock.search_chunks.return_value = [
        {
            "chunk_id": uuid4(),
            "document_id": doc1,
            "chunk_index": 0,
            "content": "chunk 0 of doc 1",
            "similarity": 0.85,
            "document_type": "incident",
            "service": "orders-api",
            "document_date": date(2026, 9, 16),
            "software_version": "v1.0.0",
            "title": "Incident 1",
            "source": "INC-1"
        },
        {
            "chunk_id": uuid4(),
            "document_id": doc1,
            "chunk_index": 1,
            "content": "chunk 1 of doc 1",
            "similarity": 0.82,
            "document_type": "incident",
            "service": "orders-api",
            "document_date": date(2026, 9, 16),
            "software_version": "v1.0.0",
            "title": "Incident 1",
            "source": "INC-1"
        },
        {
            "chunk_id": uuid4(),
            "document_id": doc1,
            "chunk_index": 2,
            "content": "chunk 2 of doc 1",
            "similarity": 0.80,
            "document_type": "incident",
            "service": "orders-api",
            "document_date": date(2026, 9, 16),
            "software_version": "v1.0.0",
            "title": "Incident 1",
            "source": "INC-1"
        },
        {
            "chunk_id": uuid4(),
            "document_id": doc2,
            "chunk_index": 0,
            "content": "chunk 0 of doc 2",
            "similarity": 0.75,
            "document_type": "guide",
            "service": "payments-api",
            "document_date": date(2025, 1, 1),
            "software_version": "v2.0.0",
            "title": "Guide 1",
            "source": "GUIDE-1"
        }
    ]
    return mock

@pytest.fixture
def retrieval_service(mock_search_repo, mock_embedding_service):
    # Set threshold lower for testing
    svc = RetrievalService(mock_search_repo, mock_embedding_service)
    svc.similarity_threshold = 0.5
    return svc

def test_semantic_retrieval(retrieval_service, mock_embedding_service, mock_search_repo):
    req = SearchRequest(query="latency test")
    resp = retrieval_service.search(req)
    
    assert resp.query == "latency test"
    assert resp.retrieval_method == "hybrid_vector"
    mock_embedding_service.generate_embeddings.assert_called_once_with(["latency test"])
    mock_search_repo.search_chunks.assert_called_once()
    
def test_duplicate_chunk_suppression(retrieval_service):
    """Ensure we do not return more than 2 chunks from the same document"""
    req = SearchRequest(query="test", top_k=5)
    resp = retrieval_service.search(req)
    
    # doc1 has 3 chunks in mock, doc2 has 1 chunk.
    # Should only return 2 chunks from doc1, plus 1 chunk from doc2.
    assert len(resp.results) == 3
    doc1_count = sum(1 for r in resp.results if r.source == "INC-1")
    assert doc1_count == 2
    doc2_count = sum(1 for r in resp.results if r.source == "GUIDE-1")
    assert doc2_count == 1
    
    # Ensure ranked correctly (0.85, 0.82, 0.75)
    assert resp.results[0].similarity == 0.85
    assert resp.results[1].similarity == 0.82
    assert resp.results[2].similarity == 0.75

def test_metadata_filtering(retrieval_service, mock_search_repo):
    req = SearchRequest(
        query="test",
        filters=SearchFilter(
            service="orders-api",
            document_type="incident",
            date_from=date(2026, 9, 1),
            date_to=date(2026, 9, 30),
            software_version="v1.0.0",
            document_id=uuid4()
        )
    )
    retrieval_service.search(req)
    
    # Verify the kwargs passed to search_chunks
    kwargs = mock_search_repo.search_chunks.call_args.kwargs
    assert kwargs["filter_service"] == "orders-api"
    assert kwargs["filter_document_type"] == "incident"
    assert kwargs["filter_date_from"] == date(2026, 9, 1)
    assert kwargs["filter_date_to"] == date(2026, 9, 30)
    assert kwargs["filter_software_version"] == "v1.0.0"
    assert "filter_document_id" in kwargs

def test_no_results(retrieval_service, mock_search_repo):
    mock_search_repo.search_chunks.return_value = []
    resp = retrieval_service.search(SearchRequest(query="nothing here"))
    assert len(resp.results) == 0
    assert resp.insufficient_evidence is True

def test_top_k_bounds(retrieval_service, mock_search_repo):
    # Mock many results
    mock_search_repo.search_chunks.return_value = [
        {
            "chunk_id": uuid4(), "document_id": uuid4(), "chunk_index": 0, "content": f"content {i}",
            "similarity": 0.9, "document_type": "doc", "service": "svc", "source": f"SRC-{i}", "title": "T"
        }
        for i in range(10)
    ]
    req = SearchRequest(query="test", top_k=3)
    resp = retrieval_service.search(req)
    assert len(resp.results) == 3

def test_retrieval_failure_handling(retrieval_service, mock_embedding_service, mock_search_repo):
    mock_embedding_service.generate_embeddings.return_value = []
    mock_search_repo.fallback_search_chunks.return_value = []
    resp = retrieval_service.search(SearchRequest(query="test"))
    assert len(resp.results) == 0
    assert resp.insufficient_evidence is True
