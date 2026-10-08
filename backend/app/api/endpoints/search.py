from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.search import SearchRequest, SearchResponse
from app.services.embedding_service import get_embedding_service, EmbeddingService
from app.repositories.search_repo import get_search_repo, SearchRepository
from app.services.retrieval_service import RetrievalService

router = APIRouter()

def get_retrieval_service(
    repo: SearchRepository = Depends(get_search_repo),
    embedding_service: EmbeddingService = Depends(get_embedding_service)
) -> RetrievalService:
    return RetrievalService(repo, embedding_service)

@router.post("/", response_model=SearchResponse, status_code=status.HTTP_200_OK)
def search_documents(
    request: SearchRequest,
    service: RetrievalService = Depends(get_retrieval_service)
):
    """
    Search for document chunks using vector similarity and optional metadata filters.
    """
    try:
        return service.search(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval failed: {str(e)}"
        )
