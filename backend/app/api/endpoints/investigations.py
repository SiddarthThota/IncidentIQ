from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from uuid import UUID

from app.schemas.investigation import InvestigationCreate, InvestigationState, InvestigationStateWithConclusion
from app.schemas.conclusion import InvestigationConclusion
from app.services.investigation_service import InvestigationService, get_investigation_service
from app.repositories.investigation_repo import InvestigationRepository, get_investigation_repo
from app.repositories.conclusion_repo import ConclusionRepository, get_conclusion_repo
from app.services.retrieval_service import RetrievalService
from app.repositories.search_repo import SearchRepository, get_search_repo
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.services.llm_service import LLMService, get_llm_service
from app.services.reasoning_service import ReasoningService, get_reasoning_service

router = APIRouter()


def get_investigation_svc(
    repo: InvestigationRepository = Depends(get_investigation_repo),
    search_repo: SearchRepository = Depends(get_search_repo),
    embedding: EmbeddingService = Depends(get_embedding_service),
    llm: LLMService = Depends(get_llm_service)
) -> InvestigationService:
    retrieval = RetrievalService(search_repo, embedding)
    return InvestigationService(repo, retrieval, llm)


def get_reasoning_svc(
    conclusion_repo: ConclusionRepository = Depends(get_conclusion_repo),
    llm: LLMService = Depends(get_llm_service)
) -> ReasoningService:
    return get_reasoning_service(conclusion_repo, llm)


@router.post("", response_model=InvestigationStateWithConclusion)
def create_investigation(
    req: InvestigationCreate,
    service: InvestigationService = Depends(get_investigation_svc),
    reasoning: ReasoningService = Depends(get_reasoning_svc)
) -> Any:
    """
    Submit a natural-language operational investigation question.
    Runs iterative investigation then generates a final evidence-backed conclusion.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    state = service.run_initial_investigation(req.question)

    # Run final reasoning (Phase 6) — only if investigation reached evidence
    conclusion = None
    if state.investigation_id and state.status not in ("INVESTIGATION_PROVIDER_FAILURE",):
        try:
            conclusion = reasoning.generate_conclusion(state)
        except Exception as e:
            # Reasoning failure must not break the API — return state without conclusion
            pass

    return InvestigationStateWithConclusion(**state.model_dump(), conclusion=conclusion)


@router.get("/{investigation_id}", response_model=InvestigationStateWithConclusion)
def get_investigation(
    investigation_id: UUID,
    service: InvestigationService = Depends(get_investigation_svc),
    reasoning: ReasoningService = Depends(get_reasoning_svc)
) -> Any:
    """
    Retrieve persisted investigation state including any final conclusion.
    """
    state = service.repo.get_investigation(investigation_id)
    if not state:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    conclusion = None
    try:
        conclusion = reasoning.repo.get_conclusion(investigation_id)
    except Exception:
        pass

    return InvestigationStateWithConclusion(**state.model_dump(), conclusion=conclusion)


@router.post("/{investigation_id}/conclude", response_model=InvestigationConclusion)
def conclude_investigation(
    investigation_id: UUID,
    service: InvestigationService = Depends(get_investigation_svc),
    reasoning: ReasoningService = Depends(get_reasoning_svc)
) -> Any:
    """
    Explicitly trigger final reasoning on an existing investigation.
    Useful for re-running reasoning after additional evidence or provider recovery.
    """
    state = service.repo.get_investigation(investigation_id)
    if not state:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    conclusion = reasoning.generate_conclusion(state)
    return conclusion
