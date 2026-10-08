from supabase import Client
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4

from app.services.supabase_client import get_supabase_client
from app.schemas.investigation import (
    InvestigationState, InvestigationQuestionAnalysis, InvestigationEvidence,
    InvestigationEvidenceClaim, InvestigationRelationship, InvestigationContradiction,
    InvestigationOpenQuestion, InvestigationEvent
)

class InvestigationRepository:
    def __init__(self, client: Client = None):
        self.client = client or get_supabase_client()

    def create_investigation(self, question: str) -> InvestigationState:
        data = {
            "original_question": question,
            "status": "INITIALIZED"
        }
        res = self.client.table("investigations").insert(data).execute()
        inv_data = res.data[0]
        
        return InvestigationState(
            investigation_id=UUID(inv_data["id"]),
            original_question=inv_data["original_question"],
            status=inv_data["status"],
            created_at=inv_data["created_at"],
            updated_at=inv_data["updated_at"]
        )

    def persist_state(self, state: InvestigationState) -> InvestigationState:
        inv_id = str(state.investigation_id)
        
        # 1. Update investigation row
        inv_data = {
            "status": state.status,
            "iteration_count": state.iteration_count
        }
        if state.analysis:
            inv_data["normalized_question"] = state.analysis.normalized_question
            inv_data["investigation_intent"] = state.analysis.investigation_intent
            
        self.client.table("investigations").update(inv_data).eq("id", inv_id).execute()
        
        # 2. Subquestions
        # Delete existing for simplicity, then insert
        self.client.table("investigation_subquestions").delete().eq("investigation_id", inv_id).execute()
        if state.analysis and state.analysis.subquestions:
            sq_data = [{"investigation_id": inv_id, "question": sq} for sq in state.analysis.subquestions]
            self.client.table("investigation_subquestions").insert(sq_data).execute()
            
        # 3. Evidence
        # We need to carefully insert evidence and keep track of DB IDs, because relationships use them
        for ev in state.retrieved_evidence:
            if not ev.id:
                # Try to find existing
                existing = self.client.table("investigation_evidence") \
                    .select("id") \
                    .eq("investigation_id", inv_id) \
                    .eq("chunk_id", str(ev.chunk_id)) \
                    .execute()
                
                if existing.data:
                    ev.id = UUID(existing.data[0]["id"])
                else:
                    res = self.client.table("investigation_evidence").insert({
                        "investigation_id": inv_id,
                        "document_id": str(ev.document_id),
                        "chunk_id": str(ev.chunk_id)
                    }).execute()
                    ev.id = UUID(res.data[0]["id"])
            
            # Claims
            for claim in ev.claims:
                if not claim.id:
                    res = self.client.table("investigation_claims").insert({
                        "investigation_id": inv_id,
                        "evidence_id": str(ev.id),
                        "claim_text": claim.claim_text,
                        "classification": claim.classification,
                        "confidence": claim.confidence
                    }).execute()
                    claim.id = UUID(res.data[0]["id"])

        # 4. Relationships
        for rel in state.relationships:
            if not rel.id:
                res = self.client.table("investigation_relationships").insert({
                    "investigation_id": inv_id,
                    "source_evidence_id": str(rel.source_evidence_id),
                    "target_evidence_id": str(rel.target_evidence_id),
                    "relationship_type": rel.relationship_type,
                    "explanation": rel.explanation,
                    "confidence": rel.confidence
                }).execute()
                rel.id = UUID(res.data[0]["id"])
                
        # 5. Contradictions
        for contra in state.contradictions:
            if not contra.id:
                res = self.client.table("investigation_contradictions").insert({
                    "investigation_id": inv_id,
                    "evidence_1_id": str(contra.evidence_1_id),
                    "evidence_2_id": str(contra.evidence_2_id),
                    "conflicting_claims": contra.conflicting_claims,
                    "context_info": contra.context_info,
                    "status": contra.status
                }).execute()
                contra.id = UUID(res.data[0]["id"])
                
        # 5a. Open Questions
        for oq in state.open_questions:
            data = {
                "investigation_id": inv_id,
                "question": oq.question,
                "reason": oq.reason,
                "related_evidence_id": str(oq.related_evidence_id) if oq.related_evidence_id else None,
                "why_it_matters": oq.why_it_matters,
                "supporting_evidence_ids": [str(x) for x in oq.supporting_evidence_ids],
                "status": oq.status,
                "resolved_by_evidence_ids": [str(x) for x in oq.resolved_by_evidence_ids],
                "resolution_reason": oq.resolution_reason
            }
            if not oq.id:
                res = self.client.table("investigation_open_questions").insert(data).execute()
                oq.id = UUID(res.data[0]["id"])
            else:
                self.client.table("investigation_open_questions").update(data).eq("id", str(oq.id)).execute()
                
        # 5b. Follow-up queries
        for fq in state.follow_up_queries:
            data = {
                "investigation_id": inv_id,
                "question_id": str(fq.question_id) if fq.question_id else None,
                "query_text": fq.query_text,
                "reason": fq.reason,
                "supporting_evidence_ids": [str(x) for x in fq.supporting_evidence_ids],
                "priority": fq.priority,
                "status": fq.status,
                "iteration": fq.iteration,
                "retrieved_result_ids": [str(x) for x in fq.retrieved_result_ids]
            }
            if not fq.id:
                res = self.client.table("investigation_followup_queries").insert(data).execute()
                fq.id = UUID(res.data[0]["id"])
            else:
                self.client.table("investigation_followup_queries").update(data).eq("id", str(fq.id)).execute()
                
        # 6. Events
        for event in state.events:
            if not event.id:
                res = self.client.table("investigation_events").insert({
                    "investigation_id": inv_id,
                    "event_type": event.event_type,
                    "details": event.details
                }).execute()
                event.id = UUID(res.data[0]["id"])

        return state

    def get_investigation(self, investigation_id: UUID) -> Optional[InvestigationState]:
        inv_res = self.client.table("investigations").select("*").eq("id", str(investigation_id)).execute()
        if not inv_res.data:
            return None
            
        inv_data = inv_res.data[0]
        
        # We fetch related records to reconstruct state.
        state = InvestigationState(
            investigation_id=UUID(inv_data["id"]),
            original_question=inv_data["original_question"],
            iteration_count=inv_data.get("iteration_count", 1),
            status=inv_data["status"],
            created_at=inv_data["created_at"],
            updated_at=inv_data["updated_at"]
        )
        
        # Subquestions
        sq_res = self.client.table("investigation_subquestions").select("*").eq("investigation_id", str(investigation_id)).execute()
        
        analysis = InvestigationQuestionAnalysis(
            normalized_question=inv_data.get("normalized_question") or "",
            investigation_intent=inv_data.get("investigation_intent") or "",
            subquestions=[r["question"] for r in sq_res.data]
        )
        state.analysis = analysis
        
        # Evidence & Claims
        ev_res = self.client.table("investigation_evidence").select("*").eq("investigation_id", str(investigation_id)).execute()
        cl_res = self.client.table("investigation_claims").select("*").eq("investigation_id", str(investigation_id)).execute()
        
        claims_by_ev = {}
        for c in cl_res.data:
            eid = c["evidence_id"]
            if eid not in claims_by_ev:
                claims_by_ev[eid] = []
            claims_by_ev[eid].append(InvestigationEvidenceClaim(
                id=UUID(c["id"]),
                claim_text=c["claim_text"],
                classification=c["classification"],
                confidence=c["confidence"]
            ))
            
        for e in ev_res.data:
            state.retrieved_evidence.append(InvestigationEvidence(
                id=UUID(e["id"]),
                document_id=UUID(e["document_id"]),
                chunk_id=UUID(e["chunk_id"]),
                claims=claims_by_ev.get(e["id"], [])
            ))
            
        # Relationships
        rel_res = self.client.table("investigation_relationships").select("*").eq("investigation_id", str(investigation_id)).execute()
        for r in rel_res.data:
            state.relationships.append(InvestigationRelationship(
                id=UUID(r["id"]),
                source_evidence_id=UUID(r["source_evidence_id"]),
                target_evidence_id=UUID(r["target_evidence_id"]),
                relationship_type=r["relationship_type"],
                explanation=r["explanation"],
                confidence=r["confidence"]
            ))
            
        # Contradictions
        contra_res = self.client.table("investigation_contradictions").select("*").eq("investigation_id", str(investigation_id)).execute()
        for c in contra_res.data:
            state.contradictions.append(InvestigationContradiction(
                id=UUID(c["id"]),
                evidence_1_id=UUID(c["evidence_1_id"]),
                evidence_2_id=UUID(c["evidence_2_id"]),
                conflicting_claims=c["conflicting_claims"],
                context_info=c["context_info"],
                status=c["status"]
            ))
            
        # Open Questions
        oq_res = self.client.table("investigation_open_questions").select("*").eq("investigation_id", str(investigation_id)).execute()
        for o in oq_res.data:
            state.open_questions.append(InvestigationOpenQuestion(
                id=UUID(o["id"]),
                question=o["question"],
                reason=o.get("reason"),
                related_evidence_id=UUID(o["related_evidence_id"]) if o.get("related_evidence_id") else None,
                why_it_matters=o.get("why_it_matters"),
                supporting_evidence_ids=[UUID(x) for x in (o.get("supporting_evidence_ids") or [])],
                status=o.get("status", "OPEN"),
                generated_at=o.get("generated_at"),
                resolved_by_evidence_ids=[UUID(x) for x in (o.get("resolved_by_evidence_ids") or [])],
                resolution_reason=o.get("resolution_reason")
            ))

        # Follow-up queries
        fq_res = self.client.table("investigation_followup_queries").select("*").eq("investigation_id", str(investigation_id)).execute()
        from app.schemas.investigation import InvestigationFollowUpQuery
        for f in fq_res.data:
            state.follow_up_queries.append(InvestigationFollowUpQuery(
                id=UUID(f["id"]),
                question_id=UUID(f["question_id"]) if f.get("question_id") else None,
                query_text=f["query_text"],
                reason=f.get("reason"),
                supporting_evidence_ids=[UUID(x) for x in (f.get("supporting_evidence_ids") or [])],
                priority=f.get("priority"),
                status=f["status"],
                iteration=f["iteration"],
                retrieved_result_ids=[UUID(x) for x in (f.get("retrieved_result_ids") or [])]
            ))
            
        # Events
        evt_res = self.client.table("investigation_events").select("*").eq("investigation_id", str(investigation_id)).execute()
        for e in evt_res.data:
            state.events.append(InvestigationEvent(
                id=UUID(e["id"]),
                event_type=e["event_type"],
                details=e["details"],
                timestamp=e["created_at"]
            ))
            
        return state

def get_investigation_repo() -> InvestigationRepository:
    return InvestigationRepository()
