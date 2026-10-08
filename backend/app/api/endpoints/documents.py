from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from uuid import UUID

from app.schemas.document import DocumentResponse, DocumentCreate, IngestionResponse
from app.repositories.document_repo import get_document_repo, DocumentRepository
from app.services.embedding_service import get_embedding_service, EmbeddingService
from app.services.ingestion_service import get_ingestion_service, IngestionService
from app.api.deps import get_current_user

router = APIRouter()

def get_ingestion(
    repo: DocumentRepository = Depends(get_document_repo),
    embeddings: EmbeddingService = Depends(get_embedding_service)
) -> IngestionService:
    return get_ingestion_service(repo, embeddings)

@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: DocumentRepository = Depends(get_document_repo),
    # Require authentication (via dependency, although this might just be a dummy wrapper for now)
    user = Depends(get_current_user)
):
    """
    List operational documents in the knowledge base.
    """
    return repo.list_documents(limit=limit, offset=offset)

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    repo: DocumentRepository = Depends(get_document_repo),
    user = Depends(get_current_user)
):
    """
    Retrieve a specific document by its ID.
    """
    doc = repo.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("/ingest", response_model=IngestionResponse)
def ingest_document(
    document: DocumentCreate,
    ingestion: IngestionService = Depends(get_ingestion),
    # Restrict ingestion to authenticated users
    user = Depends(get_current_user)
):
    """
    Ingest a new document into the knowledge base.
    Validates, chunks, embeds, and persists the content.
    """
    return ingestion.ingest_document(document)
