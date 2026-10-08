"""
Phase 6 — Final Reasoning Service

Converts a persisted InvestigationState into an InvestigationConclusion.

Design rules:
- ONE bounded LLM call per investigation (synthesis).
- All deterministic reasoning (timeline, version comparison, contradiction detection)
  is done in Python before the LLM call.
- The LLM only synthesizes evidence into human-readable findings; it cannot invent sources.
- Temporal ordering ≠ causation.
- Similar incident ≠ exact incident.
- Uncertainty must be surfaced.
- Provider failures must be safe.
"""
from __future__ import annotations

import logging
import re
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.conclusion import (
    InvestigationConclusion,
    InvestigationFinding,
    TimelineEvent,
    SourceReference,
    ConclusionStatus,
    ConfidenceLevel,
)
from app.schemas.investigation import (
    InvestigationState,
    InvestigationEvidence,
    InvestigationContradiction,
    InvestigationRelationship,
)
from app.repositories.conclusion_repo import ConclusionRepository
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────
# LLM output schema for the single synthesis call
# ──────────────────────────────────────────────────────────────────

class LLMFinding(BaseModel):
    statement: str
    classification: str          # DIRECT | CORROBORATED | TEMPORAL | INFERRED | CONTRADICTED | INSUFFICIENT
    confidence: str              # HIGH | MEDIUM | LOW
    reasoning_basis: Optional[str] = None
    evidence_source_labels: List[str] = []  # e.g. ["INC-1042", "DEP-882"]

class LLMSynthesis(BaseModel):
    summary: str
    findings: List[LLMFinding]
    uncertainty_notes: Optional[str] = None
    unresolved_questions: List[str] = []


# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────

_DATE_PATTERN = re.compile(
    r"\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b",
    re.I
)

_VERSION_PATTERN = re.compile(r"\bv?(\d+\.\d+(?:\.\d+)?)\b", re.I)

_VALID_CLASSIFICATIONS = {"DIRECT", "CORROBORATED", "TEMPORAL", "INFERRED", "CONTRADICTED", "INSUFFICIENT"}
_VALID_CONFIDENCE = {"HIGH", "MEDIUM", "LOW"}
_CAUSATION_PHRASES = re.compile(
    r"\b(caused by|because of|resulted from|led to|triggered by)\b", re.I
)


def _sanitize_classification(val: str) -> str:
    val = val.upper().strip()
    return val if val in _VALID_CLASSIFICATIONS else "INFERRED"


def _sanitize_confidence(val: str) -> str:
    val = val.upper().strip()
    return val if val in _VALID_CONFIDENCE else "LOW"


def _flag_causation(text: str) -> bool:
    """Returns True if the text makes an unsupported causal assertion."""
    return bool(_CAUSATION_PHRASES.search(text))


def _extract_dates_from_text(text: str) -> List[str]:
    return _DATE_PATTERN.findall(text)


def _extract_versions_from_text(text: str) -> List[str]:
    return list(set(_VERSION_PATTERN.findall(text)))


# ──────────────────────────────────────────────────────────────────
# Timeline builder (deterministic)
# ──────────────────────────────────────────────────────────────────

def build_timeline(state: InvestigationState) -> List[TimelineEvent]:
    """
    Build a deterministic timeline from evidence text.
    Event date ≠ document date unless explicitly stated.
    """
    events: List[TimelineEvent] = []
    seen: set = set()

    for ev in state.retrieved_evidence:
        text = ev.source_text or ""
        source = ev.source or "UNKNOWN"

        # Extract dates mentioned in the chunk text
        dates = _extract_dates_from_text(text)
        versions = _extract_versions_from_text(text)
        version = versions[0] if versions else None

        if dates:
            for d in dates[:1]:   # take the first explicit date per chunk
                key = (source, d)
                if key in seen:
                    continue
                seen.add(key)
                label = f"{source}: event on {d}"
                events.append(TimelineEvent(
                    event_label=label,
                    source_label=source,
                    software_version=version,
                    evidence_id=ev.id,
                    ordering=0,  # will be sorted below
                ))
        else:
            # No explicit date — record without date
            key = (source, "no-date")
            if key not in seen:
                seen.add(key)
                events.append(TimelineEvent(
                    event_label=f"{source}: evidence (no explicit date in text)",
                    source_label=source,
                    software_version=version,
                    evidence_id=ev.id,
                    ordering=0,
                ))

    # Sort: items with dates first (alphabetically for ISO dates), then undated
    def sort_key(e: TimelineEvent) -> str:
        if e.event_date:
            return e.event_date.isoformat()
        # Try to extract from label
        m = _DATE_PATTERN.search(e.event_label)
        return m.group(0) if m else "9999"

    events.sort(key=sort_key)
    for i, e in enumerate(events):
        e.ordering = i

    return events


# ──────────────────────────────────────────────────────────────────
# Source reference builder (deterministic)
# ──────────────────────────────────────────────────────────────────

def build_source_references(state: InvestigationState) -> List[SourceReference]:
    seen: set = set()
    refs: List[SourceReference] = []
    for ev in state.retrieved_evidence:
        label = ev.source or str(ev.document_id)
        if label not in seen:
            seen.add(label)
            refs.append(SourceReference(
                source_label=label,
                document_id=ev.document_id,
                evidence_id=ev.id,
            ))
    return refs


# ──────────────────────────────────────────────────────────────────
# Evidence package builder (for LLM synthesis)
# ──────────────────────────────────────────────────────────────────

def build_evidence_package(state: InvestigationState) -> str:
    """
    Builds a compact, structured text block to feed into the LLM.
    Only uses evidence already in the investigation state.
    """
    lines = [
        f"INVESTIGATION QUESTION: {state.original_question}",
        "",
        "=== EVIDENCE ===",
    ]
    for ev in state.retrieved_evidence:
        claims_text = "; ".join([f"[{c.classification}] {c.claim_text}" for c in ev.claims]) or "(no claims extracted)"
        lines.append(f"Source: {ev.source} | Evidence ID: {ev.id}")
        lines.append(f"  Text: {(ev.source_text or '')[:300]}")
        lines.append(f"  Claims: {claims_text}")
        lines.append("")

    if state.relationships:
        lines.append("=== RELATIONSHIPS ===")
        for rel in state.relationships:
            lines.append(f"  {rel.source_evidence_id} --[{rel.relationship_type}]--> {rel.target_evidence_id}")
            if rel.explanation:
                lines.append(f"    Explanation: {rel.explanation}")
        lines.append("")

    if state.contradictions:
        lines.append("=== CONTRADICTIONS ===")
        for contra in state.contradictions:
            lines.append(f"  Evidence {contra.evidence_1_id} CONTRADICTS Evidence {contra.evidence_2_id}")
            lines.append(f"    {contra.conflicting_claims}")
            if contra.context_info:
                lines.append(f"    Context: {contra.context_info}")
        lines.append("")

    if state.open_questions:
        unresolved = [q for q in state.open_questions if q.status in ("OPEN", "UNRESOLVED")]
        if unresolved:
            lines.append("=== UNRESOLVED QUESTIONS ===")
            for q in unresolved:
                lines.append(f"  - {q.question}")
            lines.append("")

    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────
# Deterministic sufficiency check
# ──────────────────────────────────────────────────────────────────

def assess_conclusion_status(state: InvestigationState, findings: List[InvestigationFinding]) -> ConclusionStatus:
    if not state.retrieved_evidence:
        return "INSUFFICIENT"
    classifications = [f.classification for f in findings]
    if not classifications:
        return "INSUFFICIENT"
    if all(c == "INSUFFICIENT" for c in classifications):
        return "INSUFFICIENT"
    has_positive = any(c in ("DIRECT", "CORROBORATED") for c in classifications)
    has_contradicted = "CONTRADICTED" in classifications
    if has_positive:
        if has_contradicted:
            return "PARTIALLY_SUPPORTED"
        return "SUPPORTED"
    # Only contradictions, no positive findings
    if has_contradicted:
        return "CONTRADICTED"
    return "PARTIALLY_SUPPORTED"


def assess_overall_confidence(findings: List[InvestigationFinding]) -> ConfidenceLevel:
    if not findings:
        return "LOW"
    levels = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    avg = sum(levels.get(f.confidence, 1) for f in findings) / len(findings)
    if avg >= 2.5:
        return "HIGH"
    if avg >= 1.5:
        return "MEDIUM"
    return "LOW"


# ──────────────────────────────────────────────────────────────────
# Reasoning Service
# ──────────────────────────────────────────────────────────────────

class ReasoningService:
    def __init__(self, repo: ConclusionRepository, llm: LLMService):
        self.repo = repo
        self.llm = llm

    def generate_conclusion(self, state: InvestigationState) -> InvestigationConclusion:
        """
        Main entry point. Deterministic logic runs first, then one LLM synthesis call.
        """
        assert state.investigation_id is not None

        # Check if a conclusion already exists for this investigation
        existing = self.repo.get_conclusion(state.investigation_id)
        if existing:
            return existing

        # ── 1. Deterministic: build timeline ──
        timeline = build_timeline(state)

        # ── 2. Deterministic: build source references ──
        source_refs = build_source_references(state)

        # ── 3. Check for INSUFFICIENT (no evidence at all) ──
        if not state.retrieved_evidence:
            conclusion = InvestigationConclusion(
                investigation_id=state.investigation_id,
                summary="Insufficient evidence was found to answer this question. The corpus did not contain relevant information.",
                conclusion_status="INSUFFICIENT",
                confidence="LOW",
                uncertainty_notes="No evidence was retrieved during investigation.",
                findings=[InvestigationFinding(
                    statement="No evidence was retrieved. The question cannot be answered with the available corpus.",
                    classification="INSUFFICIENT",
                    confidence="LOW",
                    reasoning_basis="Zero evidence chunks retrieved during all iteration attempts.",
                )],
                timeline=timeline,
                source_references=source_refs,
                unresolved_questions=[q.question for q in state.open_questions if q.status in ("OPEN", "UNRESOLVED")],
            )
            return self.repo.save_conclusion(conclusion)

        # ── 4. Build compact evidence package for LLM ──
        evidence_package = build_evidence_package(state)

        # ── 5. Single LLM synthesis call ──
        synthesis: Optional[LLMSynthesis] = None
        provider_limited = False

        synthesis_prompt = f"""
You are an expert Site Reliability Engineer (SRE) writing a final investigation report.

Below is a structured evidence package gathered during an automated investigation.
Your job is to synthesize this evidence into a structured conclusion.

STRICT RULES:
1. DO NOT invent facts, sources, or references not present in the evidence package.
2. DO NOT assert causation ("caused by", "because of", "resulted from") unless the evidence explicitly establishes it.
   - Use "temporally associated", "preceded", "consistent with" instead.
3. For historical comparison: use SIMILAR_INCIDENT only if the symptoms, service, and failure type align. 
   Use NOT_AN_EXACT_MATCH if important differences exist.
4. If guidance conflicts across documents (e.g. GUIDE-12 vs GUIDE-41):
   - Preserve both sources with their IDs.
   - Explain the applicable context for each.
   - Do NOT simply declare one winner.
5. If evidence is insufficient to answer part of the question, say so explicitly (classification=INSUFFICIENT).
6. Confidence levels: HIGH = strongly evidenced, MEDIUM = partially evidenced, LOW = inferred or thin.

{evidence_package}

Generate a structured LLMSynthesis containing:
- summary: 2-4 sentence executive summary of what is known and what is uncertain
- findings: list of key findings, each with statement, classification, confidence, reasoning_basis, evidence_source_labels
- uncertainty_notes: what remains uncertain, what was not proven
- unresolved_questions: questions that could not be answered from available evidence
"""

        try:
            synthesis = self.llm.generate_structured(synthesis_prompt, LLMSynthesis)
        except Exception as e:
            logger.error(f"Reasoning LLM synthesis failed: {e}")
            provider_limited = True

        # ── 6. Build findings from synthesis (or fallback) ──
        findings: List[InvestigationFinding] = []

        if synthesis and synthesis.findings:
            # Map LLM findings back to deterministic evidence IDs
            source_to_ev: dict = {(ev.source or "").upper(): ev for ev in state.retrieved_evidence}

            for llm_finding in synthesis.findings:
                # Hard gate: reject causation language if evidence doesn't support it
                stmt = llm_finding.statement
                if _flag_causation(stmt):
                    # Soften the language
                    stmt = _CAUSATION_PHRASES.sub(
                        lambda m: {
                            "caused by": "temporally associated with",
                            "because of": "consistent with",
                            "resulted from": "preceded by",
                            "led to": "temporally preceded",
                            "triggered by": "temporally associated with",
                        }.get(m.group(0).lower(), "associated with"),
                        stmt
                    )
                    logger.warning("Causation language softened in finding: %s", stmt)

                classification = _sanitize_classification(llm_finding.classification)
                confidence = _sanitize_confidence(llm_finding.confidence)

                # Resolve evidence IDs from source labels
                ev_ids, doc_ids, chunk_ids = [], [], []
                for label in llm_finding.evidence_source_labels:
                    ev = source_to_ev.get(label.upper())
                    if ev:
                        if ev.id:
                            ev_ids.append(ev.id)
                        if ev.document_id:
                            doc_ids.append(ev.document_id)
                        if ev.chunk_id:
                            chunk_ids.append(ev.chunk_id)

                # No-fabrication gate: if finding claims DIRECT/CORROBORATED but has no source linkage, downgrade
                if classification in ("DIRECT", "CORROBORATED") and not ev_ids:
                    classification = "INFERRED"
                    confidence = "LOW"
                    logger.warning("Finding downgraded to INFERRED (no traceable evidence): %s", stmt[:60])

                findings.append(InvestigationFinding(
                    statement=stmt,
                    classification=classification,
                    confidence=confidence,
                    reasoning_basis=llm_finding.reasoning_basis,
                    evidence_ids=list(set(ev_ids)),
                    document_ids=list(set(doc_ids)),
                    chunk_ids=list(set(chunk_ids)),
                ))
        else:
            # Provider-limited fallback: deterministic findings from raw claims
            source_to_ev = {ev.source: ev for ev in state.retrieved_evidence if ev.source}
            claim_based: dict = {}  # source -> best claim
            for ev in state.retrieved_evidence:
                for claim in ev.claims:
                    if ev.source not in claim_based or claim.classification == "DIRECT":
                        claim_based[ev.source] = (ev, claim)

            for source, (ev, claim) in claim_based.items():
                findings.append(InvestigationFinding(
                    statement=f"[{source}] {claim.claim_text}",
                    classification=_sanitize_classification(claim.classification),
                    confidence="LOW",
                    reasoning_basis="Deterministic fallback — LLM synthesis was provider-limited.",
                    evidence_ids=[ev.id] if ev.id else [],
                    document_ids=[ev.document_id],
                    chunk_ids=[ev.chunk_id],
                ))

        # ── 7. Determine overall status + confidence ──
        if provider_limited and not findings:
            status: ConclusionStatus = "PROVIDER_LIMITED"
        else:
            status = assess_conclusion_status(state, findings)

        overall_confidence = assess_overall_confidence(findings)

        uncertainty = (synthesis.uncertainty_notes if synthesis else None) or (
            "LLM synthesis was unavailable (provider rate-limited). Findings are based on deterministic claim extraction only."
            if provider_limited else None
        )

        unresolved = (synthesis.unresolved_questions if synthesis else []) + [
            q.question for q in state.open_questions if q.status in ("OPEN", "UNRESOLVED")
        ]
        # Deduplicate
        seen_q: set = set()
        deduped_unresolved = []
        for q in unresolved:
            if q not in seen_q:
                seen_q.add(q)
                deduped_unresolved.append(q)

        summary = (synthesis.summary if synthesis else
                   f"Investigation completed with {len(findings)} finding(s) derived from {len(state.retrieved_evidence)} evidence chunk(s). "
                   f"LLM synthesis was {'provider-limited' if provider_limited else 'unavailable'}.")

        conclusion = InvestigationConclusion(
            investigation_id=state.investigation_id,
            summary=summary,
            conclusion_status=status,
            confidence=overall_confidence,
            uncertainty_notes=uncertainty,
            findings=findings,
            timeline=timeline,
            source_references=source_refs,
            unresolved_questions=deduped_unresolved,
        )

        return self.repo.save_conclusion(conclusion)


def get_reasoning_service(repo: ConclusionRepository, llm: LLMService) -> ReasoningService:
    return ReasoningService(repo, llm)
