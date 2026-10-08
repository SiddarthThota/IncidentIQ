from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from uuid import UUID

from app.schemas.investigation import InvestigationCreate, InvestigationState
from app.services.investigation_service import InvestigationService, get_investigation_service
from app.repositories.investigation_repo import InvestigationRepository, get_investigation_repo
from app.services.retrieval_service import RetrievalService
from app.repositories.search_repo import SearchRepository, get_search_repo
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.services.llm_service import LLMService, get_llm_service

router = APIRouter()

def get_investigation_svc(
    repo: InvestigationRepository = Depends(get_investigation_repo),
    search_repo: SearchRepository = Depends(get_search_repo),
    embedding: EmbeddingService = Depends(get_embedding_service),
    llm: LLMService = Depends(get_llm_service)
) -> InvestigationService:
    retrieval = RetrievalService(search_repo, embedding)
    return InvestigationService(repo, retrieval, llm)

@router.post("", response_model=InvestigationState)
def create_investigation(
    req: InvestigationCreate,
    service: InvestigationService = Depends(get_investigation_svc)
) -> Any:
    """
    Submit a natural-language operational investigation question and receive a structured investigation state.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    state = service.run_initial_investigation(req.question)
    return state

@router.get("/{investigation_id}", response_model=InvestigationState)
def get_investigation(
    investigation_id: UUID,
    service: InvestigationService = Depends(get_investigation_svc)
) -> Any:
    """
    Retrieve persisted investigation state.
    """
    state = service.repo.get_investigation(investigation_id)
    if not state:
        raise HTTPException(status_code=404, detail="Investigation not found.")
    return state
