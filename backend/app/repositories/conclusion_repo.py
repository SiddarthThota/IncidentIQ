from supabase import Client
from typing import Optional
from uuid import UUID

from app.services.supabase_client import get_supabase_client
from app.schemas.conclusion import (
    InvestigationConclusion, InvestigationFinding, TimelineEvent, SourceReference
)


class ConclusionRepository:
    def __init__(self, client: Client = None):
        self.client = client or get_supabase_client()

    def get_conclusion(self, investigation_id: UUID) -> Optional[InvestigationConclusion]:
        res = self.client.table("investigation_conclusions") \
            .select("*").eq("investigation_id", str(investigation_id)).execute()
        if not res.data:
            return None
        row = res.data[0]
        conclusion_id = row["id"]

        findings = []
        f_res = self.client.table("investigation_findings") \
            .select("*").eq("conclusion_id", conclusion_id).execute()
        for f in f_res.data:
            findings.append(InvestigationFinding(
                id=UUID(f["id"]),
                statement=f["statement"],
                classification=f["classification"],
                confidence=f["confidence"],
                reasoning_basis=f.get("reasoning_basis"),
                evidence_ids=[UUID(x) for x in (f.get("evidence_ids") or [])],
                document_ids=[UUID(x) for x in (f.get("document_ids") or [])],
                chunk_ids=[UUID(x) for x in (f.get("chunk_ids") or [])],
            ))

        timeline = []
        t_res = self.client.table("investigation_timeline_events") \
            .select("*").eq("conclusion_id", conclusion_id).order("ordering").execute()
        for t in t_res.data:
            timeline.append(TimelineEvent(
                id=UUID(t["id"]),
                event_label=t["event_label"],
                event_date=t.get("event_date"),
                event_timestamp=t.get("event_timestamp"),
                document_date=t.get("document_date"),
                source_label=t.get("source_label"),
                software_version=t.get("software_version"),
                service=t.get("service"),
                evidence_id=UUID(t["evidence_id"]) if t.get("evidence_id") else None,
                ordering=t["ordering"],
            ))

        sources = []
        s_res = self.client.table("investigation_source_references") \
            .select("*").eq("conclusion_id", conclusion_id).execute()
        for s in s_res.data:
            sources.append(SourceReference(
                id=UUID(s["id"]),
                source_label=s["source_label"],
                document_id=UUID(s["document_id"]) if s.get("document_id") else None,
                evidence_id=UUID(s["evidence_id"]) if s.get("evidence_id") else None,
            ))

        return InvestigationConclusion(
            id=UUID(row["id"]),
            investigation_id=UUID(row["investigation_id"]),
            summary=row["summary"],
            conclusion_status=row["conclusion_status"],
            confidence=row["confidence"],
            uncertainty_notes=row.get("uncertainty_notes"),
            unresolved_questions=row.get("unresolved_questions") or [],
            findings=findings,
            timeline=timeline,
            source_references=sources,
            generated_at=row.get("generated_at"),
        )

    def save_conclusion(self, conclusion: InvestigationConclusion) -> InvestigationConclusion:
        inv_id = str(conclusion.investigation_id)

        # Upsert main conclusion row
        row = {
            "investigation_id": inv_id,
            "summary": conclusion.summary,
            "conclusion_status": conclusion.conclusion_status,
            "confidence": conclusion.confidence,
            "uncertainty_notes": conclusion.uncertainty_notes,
            "unresolved_questions": conclusion.unresolved_questions,
        }
        if conclusion.id:
            self.client.table("investigation_conclusions").update(row) \
                .eq("id", str(conclusion.id)).execute()
            conclusion_id = str(conclusion.id)
        else:
            res = self.client.table("investigation_conclusions").insert(row).execute()
            conclusion.id = UUID(res.data[0]["id"])
            conclusion_id = str(conclusion.id)

        # Findings
        for f in conclusion.findings:
            if not f.id:
                frow = {
                    "investigation_id": inv_id,
                    "conclusion_id": conclusion_id,
                    "statement": f.statement,
                    "classification": f.classification,
                    "confidence": f.confidence,
                    "reasoning_basis": f.reasoning_basis,
                    "evidence_ids": [str(x) for x in f.evidence_ids],
                    "document_ids": [str(x) for x in f.document_ids],
                    "chunk_ids": [str(x) for x in f.chunk_ids],
                }
                fres = self.client.table("investigation_findings").insert(frow).execute()
                f.id = UUID(fres.data[0]["id"])

        # Timeline events
        for idx, t in enumerate(conclusion.timeline):
            if not t.id:
                trow = {
                    "investigation_id": inv_id,
                    "conclusion_id": conclusion_id,
                    "event_label": t.event_label,
                    "event_date": t.event_date.isoformat() if t.event_date else None,
                    "event_timestamp": t.event_timestamp.isoformat() if t.event_timestamp else None,
                    "document_date": t.document_date.isoformat() if t.document_date else None,
                    "source_label": t.source_label,
                    "software_version": t.software_version,
                    "service": t.service,
                    "evidence_id": str(t.evidence_id) if t.evidence_id else None,
                    "ordering": t.ordering if t.ordering else idx,
                }
                tres = self.client.table("investigation_timeline_events").insert(trow).execute()
                t.id = UUID(tres.data[0]["id"])

        # Source references
        for s in conclusion.source_references:
            if not s.id:
                srow = {
                    "investigation_id": inv_id,
                    "conclusion_id": conclusion_id,
                    "source_label": s.source_label,
                    "document_id": str(s.document_id) if s.document_id else None,
                    "evidence_id": str(s.evidence_id) if s.evidence_id else None,
                }
                sres = self.client.table("investigation_source_references").insert(srow).execute()
                s.id = UUID(sres.data[0]["id"])

        return conclusion


def get_conclusion_repo() -> ConclusionRepository:
    return ConclusionRepository()
