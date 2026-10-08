import pytest
from unittest.mock import MagicMock
from uuid import uuid4
from datetime import datetime, timezone
from fastapi.testclient import TestClient
import os

# Set dummy environment variables so pydantic-settings doesn't fail on import during tests
os.environ["SUPABASE_URL"] = "https://dummy.supabase.co"
os.environ["SUPABASE_SECRET_KEY"] = "dummy_secret"
os.environ["OPENAI_API_KEY"] = "dummy_openai"
os.environ["GEMINI_API_KEY"] = "dummy_gemini"

from app.schemas.document import DocumentResponse, DocumentChunkResponse, DocumentCreate, IngestionResponse
from main import app

# Mock instances for dependency overrides
mock_repo = MagicMock()
mock_embeddings = MagicMock()

# Dependency overrides
from app.api.endpoints.documents import get_document_repo, get_embedding_service, get_current_user

def override_get_document_repo():
    return mock_repo

def override_get_embedding_service():
    return mock_embeddings

def override_get_current_user():
    return {"id": "test-user", "token": "dummy"}

app.dependency_overrides[get_document_repo] = override_get_document_repo
app.dependency_overrides[get_embedding_service] = override_get_embedding_service
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app, raise_server_exceptions=False)

@pytest.fixture(autouse=True)
def reset_mocks():
    mock_repo.reset_mock()
    mock_embeddings.reset_mock()

def test_list_documents_empty():
    mock_repo.list_documents.return_value = []
    response = client.get("/api/documents")
    assert response.status_code == 200
    assert response.json() == []

def test_list_documents():
    doc_id = uuid4()
    mock_repo.list_documents.return_value = [
        DocumentResponse(
            id=doc_id,
            document_type="incident_report",
            title="Test Doc",
            source="TEST-1",
            content="test content",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
    ]
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["source"] == "TEST-1"

def test_get_document_not_found():
    mock_repo.get_document_by_id.return_value = None
    response = client.get(f"/api/documents/{uuid4()}")
    assert response.status_code == 404

def test_ingest_document_success():
    doc_id = uuid4()
    mock_repo.get_document_by_source.return_value = None
    
    mock_repo.create_document.return_value = DocumentResponse(
        id=doc_id,
        document_type="incident_report",
        title="Valid Doc",
        source="TEST-2",
        content="This is enough content to generate a chunk.",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    mock_embeddings.generate_embeddings.return_value = [[0.1] * 1536]
    
    mock_repo.create_chunks.return_value = [
        DocumentChunkResponse(
            id=uuid4(),
            document_id=doc_id,
            chunk_index=0,
            content="This is enough content to generate a chunk.",
            created_at=datetime.now(timezone.utc)
        )
    ]

    payload = {
        "document_type": "incident_report",
        "title": "Valid Doc",
        "source": "TEST-2",
        "content": "This is enough content to generate a chunk."
    }
    response = client.post("/api/documents/ingest", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["chunks_created"] == 1
    assert data["document_id"] == str(doc_id)

def test_ingest_duplicate_document():
    doc_id = uuid4()
    # Mocking that the document already exists
    mock_repo.get_document_by_source.return_value = DocumentResponse(
        id=doc_id,
        document_type="incident_report",
        title="Duplicate",
        source="TEST-3",
        content="duplicate",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    payload = {
        "document_type": "incident_report",
        "title": "Duplicate",
        "source": "TEST-3",
        "content": "duplicate content"
    }
    response = client.post("/api/documents/ingest", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "skipped_duplicate"
    assert data["chunks_created"] == 0
    assert data["document_id"] == str(doc_id)

def test_ingest_invalid_metadata():
    payload = {
        "document_type": "incident_report",
        "title": "", # Invalid title
        "source": "TEST-4",
        "content": "content"
    }
    response = client.post("/api/documents/ingest", json=payload)
    assert response.status_code == 400 # Our manual validation returns 400

def test_ingest_empty_content():
    payload = {
        "document_type": "incident_report",
        "title": "Title",
        "source": "TEST-5",
        "content": "   " # Empty content string
    }
    response = client.post("/api/documents/ingest", json=payload)
    assert response.status_code == 400
    assert "content cannot be empty" in response.json()["detail"].lower()

def test_embedding_failure_handled():
    mock_repo.get_document_by_source.return_value = None
    mock_repo.create_document.return_value = DocumentResponse(
        id=uuid4(),
        document_type="incident_report",
        title="Valid Doc",
        source="TEST-FAIL",
        content="Valid content.",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    # Simulate embedding API failure
    mock_embeddings.generate_embeddings.side_effect = Exception("Gemini API Down")

    payload = {
        "document_type": "incident_report",
        "title": "Valid Doc",
        "source": "TEST-FAIL",
        "content": "Valid content."
    }
    response = client.post("/api/documents/ingest", json=payload)
    assert response.status_code == 500
    assert "embeddings" in response.json()["detail"].lower()
