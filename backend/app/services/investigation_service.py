from typing import List, Dict, Any, Optional
from uuid import UUID
import datetime
import logging

from app.schemas.investigation import (
    InvestigationState, InvestigationQuestionAnalysis, InvestigationEvidence,
    InvestigationEvidenceClaim, InvestigationRelationship, InvestigationContradiction,
    InvestigationEvent, EvidenceClassification, RelationshipType,
    InvestigationOpenQuestion, InvestigationFollowUpQuery
)
from app.schemas.search import SearchRequest
from app.repositories.investigation_repo import InvestigationRepository
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService

from pydantic import BaseModel

logger = logging.getLogger(__name__)

class IterationAssessment(BaseModel):
    claims: List[InvestigationEvidenceClaim]
    relationships: List[InvestigationRelationship]
    contradictions: List[InvestigationContradiction]
    new_open_questions: List[InvestigationOpenQuestion]
    follow_up_queries: List[InvestigationFollowUpQuery]
    resolved_question_ids: List[UUID] = []

class InvestigationService:
    def __init__(self, repo: InvestigationRepository, retrieval: RetrievalService, llm: LLMService):
        self.repo = repo
        self.retrieval = retrieval
        self.llm = llm
        self.max_iterations = 3
        self.max_queries_per_iteration = 2
        self.max_total_retrieval_results = 20

    def analyze_question(self, question: str) -> InvestigationQuestionAnalysis:
        prompt = f"""
You are an expert site reliability engineer (SRE).
Analyze the following investigation question and extract the necessary details.
The intent should be one of: TROUBLESHOOTING, HISTORICAL_COMPARISON, EXACT_MATCH, CAUSAL_INVESTIGATION, TEMPORAL_INVESTIGATION.
Break complex questions into explicit subquestions (at most 3).

Question: "{question}"
"""
        return self.llm.generate_structured(prompt, InvestigationQuestionAnalysis)

    def assess_evidence(self, state: InvestigationState, new_evidence: List[InvestigationEvidence]) -> IterationAssessment:
        all_ev_text = "\n".join([f"ID: {e.id} | Source: {e.source} | Text: {e.source_text}" for e in state.retrieved_evidence])
        new_ev_text = "\n".join([f"ID: {e.id} | Source: {e.source} | Text: {e.source_text}" for e in new_evidence])
        open_qs_text = "\n".join([f"ID: {q.id} | Q: {q.question}" for q in state.open_questions if q.status == "OPEN"])

        prompt = f"""
You are an expert SRE. Analyze the NEW EVIDENCE in the context of the ORIGINAL QUESTION and ALL PRIOR EVIDENCE.
Original Question: "{state.original_question}"

ALL EVIDENCE (For context and relationships):
{all_ev_text}

NEW EVIDENCE (Extract claims from these):
{new_ev_text}

CURRENT OPEN QUESTIONS:
{open_qs_text}

Tasks:
1. Extract factual claims from the NEW EVIDENCE (Classify: DIRECT, CORROBORATED, TEMPORAL, INFERRED, CONTRADICTED, INSUFFICIENT). Set evidence_id to the exact ID of the source chunk.
2. Identify new relationships between ANY evidence (new or old). Use their exact IDs.
3. Identify new contradictions between ANY evidence. Use their exact IDs.
4. Review CURRENT OPEN QUESTIONS. If any are now resolved by evidence, list their IDs in resolved_question_ids.
5. Generate new open questions if critical information is missing. (Set status="OPEN").
6. Generate follow-up queries to resolve open questions. (Max 2 queries). Provide query_text and reason. (Set status="PENDING").

Be concise. Do not invent facts or UUIDs. Only use IDs from the provided evidence or questions.
"""
        try:
            return self.llm.generate_structured(prompt, IterationAssessment)
        except Exception as e:
            raise RuntimeError(f"LLM assessment failed: {e}")

    def run_initial_investigation(self, question: str) -> InvestigationState:
        # Initial logic delegates to the iterative logic now
        return self.run_iterative_investigation(question)

    def run_iterative_investigation(self, question: str) -> InvestigationState:
        state = self.repo.create_investigation(question)
        state.events.append(InvestigationEvent(event_type="INVESTIGATION_CREATED", details="Created new investigation."))

        try:
            analysis = self.analyze_question(question)
            state.analysis = analysis
            state.events.append(InvestigationEvent(event_type="INITIAL_ANALYSIS_COMPLETED", details=f"Intent: {analysis.investigation_intent}"))
        except Exception as e:
            state.status = "INVESTIGATION_PROVIDER_FAILURE"
            state.events.append(InvestigationEvent(event_type="INVESTIGATION_PROVIDER_FAILURE", details=f"Question analysis failed: {str(e)}"))
            return self.repo.persist_state(state)

        # Generate Initial Follow-Up Queries based on subquestions or main question
        queries_to_add = []
        q1 = InvestigationFollowUpQuery(
            query_text=question,
            reason="Initial question",
            priority="HIGH",
            status="PENDING",
            iteration=1
        )
        queries_to_add.append(q1)

        if analysis.subquestions:
            for sq in analysis.subquestions[:2]:
                queries_to_add.append(InvestigationFollowUpQuery(
                    query_text=sq,
                    reason="Extracted subquestion",
                    priority="MEDIUM",
                    status="PENDING",
                    iteration=1
                ))
        
        state.follow_up_queries.extend(queries_to_add)

        # Execute iterative loop
        while state.iteration_count <= self.max_iterations and state.status not in ["COMPLETED", "INSUFFICIENT", "INVESTIGATION_PROVIDER_FAILURE"]:
            pending_queries = [q for q in state.follow_up_queries if q.status == "PENDING"]
            if not pending_queries:
                state.events.append(InvestigationEvent(event_type="NO_NEW_EVIDENCE", details="No pending follow-up queries remaining."))
                state.status = "COMPLETED"
                break
                
            queries_to_run = pending_queries[:self.max_queries_per_iteration]
            for q in queries_to_run:
                q.status = "EXECUTED"
            
            query_texts = [q.query_text for q in queries_to_run]
            state.events.append(InvestigationEvent(event_type="FOLLOW_UP_SEARCH_EXECUTED", details=f"Executing {len(query_texts)} queries."))
            
            self._execute_iteration(state, queries_to_run)
            
            if state.status == "IN_PROGRESS":
                state.iteration_count += 1

        if state.status == "IN_PROGRESS":
            if state.iteration_count > self.max_iterations:
                state.events.append(InvestigationEvent(event_type="INVESTIGATION_MAX_ITERATIONS", details="Reached max iterations."))
            state.status = "COMPLETED"

        # Check for insufficient state
        if not state.retrieved_evidence:
            state.status = "INSUFFICIENT"
            
        for oq in state.open_questions:
            if oq.status == "OPEN":
                oq.status = "UNRESOLVED"

        return self.repo.persist_state(state)

    def _execute_iteration(self, state: InvestigationState, executed_queries: List[InvestigationFollowUpQuery]):
        new_evidence = []
        for fq in executed_queries:
            req = SearchRequest(query=fq.query_text, top_k=3)
            res = self.retrieval.search(req)
            if res.results:
                for r in res.results:
                    # Novelty check
                    existing = any(e.chunk_id == r.chunk_id for e in state.retrieved_evidence)
                    if not existing:
                        ev = InvestigationEvidence(document_id=r.document_id, chunk_id=r.chunk_id, source_text=r.content, source=r.source)
                        new_evidence.append(ev)
                        state.retrieved_evidence.append(ev)
                        fq.retrieved_result_ids.append(r.chunk_id)

        # Persist to get IDs for new evidence
        state = self.repo.persist_state(state)

        if not new_evidence:
            state.events.append(InvestigationEvent(event_type="NO_NEW_EVIDENCE", details="Iteration produced no novel evidence."))
            return

        state.events.append(InvestigationEvent(event_type="NEW_EVIDENCE_FOUND", details=f"Found {len(new_evidence)} novel chunks."))

        try:
            assessment = self.assess_evidence(state, new_evidence)
            
            # Map claims back to evidence based on evidence_id
            for claim in assessment.claims:
                if claim.classification not in ["DIRECT", "CORROBORATED", "TEMPORAL", "INFERRED", "CONTRADICTED", "INSUFFICIENT"]:
                    claim.classification = "INFERRED"
                for ev in state.retrieved_evidence:
                    if str(ev.id) == str(claim.evidence_id):
                        ev.claims.append(claim)
                        break

            # Filter valid relationships and contradictions
            valid_ev_ids = {str(ev.id) for ev in state.retrieved_evidence}
            valid_rels = [r for r in assessment.relationships if str(r.source_evidence_id) in valid_ev_ids and str(r.target_evidence_id) in valid_ev_ids]
            valid_contras = [c for c in assessment.contradictions if str(c.evidence_1_id) in valid_ev_ids and str(c.evidence_2_id) in valid_ev_ids]
            
            state.relationships.extend(valid_rels)
            state.contradictions.extend(valid_contras)
            
            # Resolve questions
            for q_id in assessment.resolved_question_ids:
                for oq in state.open_questions:
                    if str(oq.id) == str(q_id):
                        oq.status = "RESOLVED"
                        state.events.append(InvestigationEvent(event_type="QUESTION_RESOLVED", details=f"Resolved question {oq.id}"))
                        
            # Add new questions and queries
            if assessment.new_open_questions:
                state.events.append(InvestigationEvent(event_type="OPEN_QUESTION_CREATED", details=f"Added {len(assessment.new_open_questions)} open questions."))
                state.open_questions.extend(assessment.new_open_questions)
                
            if assessment.follow_up_queries:
                # Deduplicate queries by naive text matching
                existing_texts = {q.query_text.lower().strip() for q in state.follow_up_queries}
                unique_queries = []
                for q in assessment.follow_up_queries:
                    t = q.query_text.lower().strip()
                    if t not in existing_texts:
                        q.iteration = state.iteration_count + 1
                        q.status = "PENDING"
                        unique_queries.append(q)
                        existing_texts.add(t)
                state.events.append(InvestigationEvent(event_type="FOLLOW_UP_QUERY_GENERATED", details=f"Generated {len(unique_queries)} novel queries."))
                state.follow_up_queries.extend(unique_queries)
                
            state.events.append(InvestigationEvent(event_type="EVIDENCE_EXTRACTED", details="Extracted claims and relationships."))
            
        except Exception as e:
            logger.error(f"Assessment error: {e}")
            state.events.append(InvestigationEvent(event_type="INVESTIGATION_PROVIDER_FAILURE", details=f"Evidence assessment failed: {str(e)}"))
            state.status = "INVESTIGATION_PROVIDER_FAILURE"

        state.events.append(InvestigationEvent(event_type="ITERATION_COMPLETED", details=f"Completed iteration {state.iteration_count}"))

def get_investigation_service(repo: InvestigationRepository, retrieval: RetrievalService, llm: LLMService) -> InvestigationService:
    return InvestigationService(repo, retrieval, llm)
