from typing import List, Dict, Any, Optional
from uuid import UUID

from app.schemas.investigation import (
    InvestigationState, InvestigationQuestionAnalysis, InvestigationEvidence,
    InvestigationEvidenceClaim, InvestigationRelationship, InvestigationContradiction,
    InvestigationEvent, EvidenceClassification, RelationshipType
)
from app.schemas.search import SearchRequest
from app.repositories.investigation_repo import InvestigationRepository
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService

from pydantic import BaseModel
import datetime

class ExtractedClaims(BaseModel):
    claims: List[InvestigationEvidenceClaim]

class ExtractedRelationships(BaseModel):
    relationships: List[InvestigationRelationship]

class ExtractedContradictions(BaseModel):
    contradictions: List[InvestigationContradiction]

class InvestigationService:
    def __init__(self, repo: InvestigationRepository, retrieval: RetrievalService, llm: LLMService):
        self.repo = repo
        self.retrieval = retrieval
        self.llm = llm

    def analyze_question(self, question: str) -> InvestigationQuestionAnalysis:
        prompt = f"""
You are an expert site reliability engineer (SRE).
Analyze the following investigation question and extract the necessary details.
The intent should be one of: TROUBLESHOOTING, HISTORICAL_COMPARISON, EXACT_MATCH, CAUSAL_INVESTIGATION, TEMPORAL_INVESTIGATION.
Break complex questions into explicit subquestions (at most 3).

Question: "{question}"
"""
        return self.llm.generate_structured(prompt, InvestigationQuestionAnalysis)

    def extract_claims(self, chunk_text: str, question: str) -> List[InvestigationEvidenceClaim]:
        prompt = f"""
You are an expert SRE. Extract factual claims from the evidence text that are relevant to the investigation question.
Evidence text: "{chunk_text}"
Investigation Question: "{question}"

Rules for claims:
- Do not invent missing facts.
- Provide a concise text for the claim.
- Classify the claim precisely. If it explicitly states the fact, use DIRECT. If it establishes timing/order (not causation), use TEMPORAL. If it requires a reasonable inference, use INFERRED. If available evidence does not support a reliable conclusion, use INSUFFICIENT. (Allowed values: DIRECT, CORROBORATED, TEMPORAL, INFERRED, CONTRADICTED, INSUFFICIENT)

If the text does not contain relevant claims, return an empty list or INSUFFICIENT.
"""
        res = self.llm.generate_structured(prompt, ExtractedClaims)
        return res.claims

    def analyze_relationships_and_contradictions(self, state: InvestigationState) -> None:
        # For this phase, we compare claims against each other
        if not state.retrieved_evidence:
            return

        evidence_blocks = []
        for ev in state.retrieved_evidence:
            for c in ev.claims:
                evidence_blocks.append(
                    f"Evidence ID: {ev.id} | Document Source: {ev.source} | Claim: {c.claim_text}"
                )

        if len(evidence_blocks) < 2:
            return

        evidence_text = "\n".join(evidence_blocks)
        
        rel_prompt = f"""
You are an expert SRE. Analyze the following evidence claims and identify any relationships between them.
Relationships can be: TEMPORAL_BEFORE, TEMPORAL_AFTER, SAME_SERVICE, SAME_FAILURE_TYPE, SAME_VERSION, DIFFERENT_VERSION, SIMILAR_INCIDENT, POSSIBLE_RELATION, CONTRADICTS, CORROBORATES.

Do NOT assert CAUSATION (e.g. caused by deployment) unless explicitly supported by strong evidence. Use POSSIBLE_RELATION or TEMPORAL_BEFORE instead.

Evidence Claims:
{evidence_text}

Original Question: {state.original_question}
"""
        rel_res = self.llm.generate_structured(rel_prompt, ExtractedRelationships)
        state.relationships.extend(rel_res.relationships)

        contra_prompt = f"""
You are an expert SRE. Analyze the following evidence claims and identify any contradictions (where two valid pieces of evidence disagree).
For example, older guidance vs newer guidance.
Do not invent contradictions.

Evidence Claims:
{evidence_text}

Original Question: {state.original_question}
"""
        contra_res = self.llm.generate_structured(contra_prompt, ExtractedContradictions)
        state.contradictions.extend(contra_res.contradictions)

    def run_initial_investigation(self, question: str) -> InvestigationState:
        # 1. Initialize State
        state = self.repo.create_investigation(question)
        state.events.append(InvestigationEvent(event_type="INVESTIGATION_STARTED", details="Created new investigation."))

        # 2. Analyze Question
        try:
            analysis = self.analyze_question(question)
            state.analysis = analysis
            state.events.append(InvestigationEvent(event_type="QUESTION_ANALYZED", details=f"Intent: {analysis.investigation_intent}"))
        except Exception as e:
            state.status = "FAILED"
            state.events.append(InvestigationEvent(event_type="ERROR", details=f"Question analysis failed: {str(e)}"))
            self.repo.persist_state(state)
            return state

        # 3. Retrieve Evidence
        search_req = SearchRequest(query=question, top_k=5) # initial bounded retrieval
        search_res = self.retrieval.search(search_req)

        # 4. Process Evidence & Claims
        if search_res.insufficient_evidence or not search_res.results:
            state.events.append(InvestigationEvent(event_type="EVIDENCE_RETRIEVAL", details="No relevant evidence found or insufficient."))
            state.status = "INSUFFICIENT_EVIDENCE"
            # Add a placeholder INSUFFICIENT claim
            dummy_ev = InvestigationEvidence(
                document_id=UUID(int=0), chunk_id=UUID(int=0),
                claims=[InvestigationEvidenceClaim(claim_text="No sufficient evidence found.", classification="INSUFFICIENT", confidence=1.0)]
            )
            state.retrieved_evidence.append(dummy_ev)
            self.repo.persist_state(state)
            return state

        for r in search_res.results:
            ev = InvestigationEvidence(
                document_id=r.document_id,
                chunk_id=r.chunk_id,
                source_text=r.content,
                source=r.source
            )
            state.retrieved_evidence.append(ev)

        # We must persist once to get Evidence IDs generated, because claims and relationships need them
        state = self.repo.persist_state(state)

        for ev in state.retrieved_evidence:
            try:
                claims = self.extract_claims(ev.source_text, question)
                # Keep only valid claims
                valid_claims = []
                for c in claims:
                    # Enforce bounded classification
                    if c.classification not in ["DIRECT", "CORROBORATED", "TEMPORAL", "INFERRED", "CONTRADICTED", "INSUFFICIENT"]:
                        c.classification = "INFERRED"
                    valid_claims.append(c)
                ev.claims.extend(valid_claims)
            except Exception as e:
                state.events.append(InvestigationEvent(event_type="ERROR", details=f"Claim extraction failed for {ev.chunk_id}: {str(e)}"))

        state.events.append(InvestigationEvent(event_type="CLAIMS_EXTRACTED", details=f"Extracted claims from {len(state.retrieved_evidence)} chunks."))

        # Persist again to get claim IDs
        state = self.repo.persist_state(state)

        # 5. Relationships and Contradictions
        try:
            self.analyze_relationships_and_contradictions(state)
            # Filter relationships to ensure source and target IDs are valid
            valid_ev_ids = [str(ev.id) for ev in state.retrieved_evidence]
            state.relationships = [r for r in state.relationships if str(r.source_evidence_id) in valid_ev_ids and str(r.target_evidence_id) in valid_ev_ids]
            state.contradictions = [c for c in state.contradictions if str(c.evidence_1_id) in valid_ev_ids and str(c.evidence_2_id) in valid_ev_ids]
        except Exception as e:
            state.events.append(InvestigationEvent(event_type="ERROR", details=f"Relationship extraction failed: {str(e)}"))

        state.events.append(InvestigationEvent(event_type="RELATIONSHIPS_ANALYZED", details=f"Found {len(state.relationships)} relationships, {len(state.contradictions)} contradictions."))

        # 6. Finalize
        state.status = "COMPLETED"
        self.repo.persist_state(state)

        return state

def get_investigation_service(
    repo: InvestigationRepository,
    retrieval: RetrievalService,
    llm: LLMService
) -> InvestigationService:
    return InvestigationService(repo, retrieval, llm)
