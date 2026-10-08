"""
Phase 6 — Final Reasoning Unit Tests

All tests use mocked LLM and mocked repo.
No live Gemini calls are required.
"""
import pytest
from unittest.mock import Mock, MagicMock
from uuid import uuid4, UUID
from datetime import date

from app.schemas.investigation import (
    InvestigationState, InvestigationQuestionAnalysis,
    InvestigationEvidence, InvestigationEvidenceClaim,
    InvestigationRelationship, InvestigationContradiction,
    InvestigationOpenQuestion, InvestigationEvent
)
from app.schemas.conclusion import InvestigationConclusion, InvestigationFinding
from app.services.reasoning_service import (
    ReasoningService, LLMSynthesis, LLMFinding,
    build_timeline, build_source_references, build_evidence_package,
    assess_conclusion_status, assess_overall_confidence,
    _flag_causation, _sanitize_classification, _sanitize_confidence
)
from app.repositories.conclusion_repo import ConclusionRepository
from app.services.llm_service import LLMService


# ────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────

def _make_ev(source: str, text: str, classification: str = "DIRECT") -> InvestigationEvidence:
    ev_id = uuid4()
    doc_id = uuid4()
    chunk_id = uuid4()
    ev = InvestigationEvidence(
        id=ev_id,
        document_id=doc_id,
        chunk_id=chunk_id,
        source=source,
        source_text=text,
        claims=[InvestigationEvidenceClaim(
            evidence_id=ev_id,
            claim_text=f"Claim from {source}",
            classification=classification,
            confidence=0.9
        )]
    )
    return ev


def _make_state(evidence=None, contradictions=None, open_questions=None) -> InvestigationState:
    inv_id = uuid4()
    state = InvestigationState(
        investigation_id=inv_id,
        original_question="Why did the Order API become slow on September 16?",
        analysis=InvestigationQuestionAnalysis(
            normalized_question="Order API slow September 16",
            investigation_intent="CAUSAL_INVESTIGATION",
            subquestions=[]
        ),
        retrieved_evidence=evidence or [],
        contradictions=contradictions or [],
        open_questions=open_questions or [],
        status="COMPLETED"
    )
    return state


@pytest.fixture
def mock_conclusion_repo():
    repo = Mock(spec=ConclusionRepository)
    repo.get_conclusion.return_value = None  # No prior conclusion
    repo.save_conclusion.side_effect = lambda c: c
    return repo


@pytest.fixture
def mock_llm():
    llm = Mock(spec=LLMService)
    def gen_structured(prompt, schema):
        if schema.__name__ == "LLMSynthesis":
            return LLMSynthesis(
                summary="The Order API experienced latency. A deployment was temporally associated with the incident window.",
                findings=[
                    LLMFinding(
                        statement="INC-1042 reports Order API latency starting September 16.",
                        classification="DIRECT",
                        confidence="HIGH",
                        reasoning_basis="INC-1042 explicitly documents the latency event.",
                        evidence_source_labels=["INC-1042"]
                    ),
                    LLMFinding(
                        statement="DEP-882 records v2.8.1 deployment on September 15, preceding the incident window.",
                        classification="TEMPORAL",
                        confidence="MEDIUM",
                        reasoning_basis="DEP-882 records deployment before the incident.",
                        evidence_source_labels=["DEP-882"]
                    ),
                ],
                uncertainty_notes="Causation between deployment and latency not established.",
                unresolved_questions=["Was the latency caused by a specific code change in v2.8.1?"]
            )
        return None
    llm.generate_structured.side_effect = gen_structured
    return llm


@pytest.fixture
def reasoning_service(mock_conclusion_repo, mock_llm):
    return ReasoningService(mock_conclusion_repo, mock_llm)


# ────────────────────────────────────────────────
# Deterministic Helper Tests
# ────────────────────────────────────────────────

def test_causation_flag_detects_caused_by():
    assert _flag_causation("The outage was caused by the deployment.")

def test_causation_flag_detects_resulted_from():
    assert _flag_causation("The incident resulted from a misconfiguration.")

def test_causation_flag_allows_temporal_language():
    assert not _flag_causation("The deployment preceded the incident.")
    assert not _flag_causation("Temporally associated with the outage.")

def test_sanitize_classification_valid():
    assert _sanitize_classification("DIRECT") == "DIRECT"
    assert _sanitize_classification("direct") == "DIRECT"

def test_sanitize_classification_invalid_falls_back():
    assert _sanitize_classification("CAUSED") == "INFERRED"

def test_sanitize_confidence_valid():
    assert _sanitize_confidence("HIGH") == "HIGH"
    assert _sanitize_confidence("low") == "LOW"

def test_sanitize_confidence_invalid_falls_back():
    assert _sanitize_confidence("VERY_HIGH") == "LOW"


# ────────────────────────────────────────────────
# Timeline Tests
# ────────────────────────────────────────────────

def test_timeline_extracts_dates():
    ev = _make_ev("INC-1042", "The incident began on 2024-09-16 around 18:30 UTC.")
    state = _make_state(evidence=[ev])
    timeline = build_timeline(state)
    assert len(timeline) == 1
    assert "INC-1042" in timeline[0].event_label
    assert "2024-09-16" in timeline[0].event_label

def test_timeline_no_date():
    ev = _make_ev("PM-211", "Previous latency incident observed on the orders service.")
    state = _make_state(evidence=[ev])
    timeline = build_timeline(state)
    assert len(timeline) == 1
    assert "no explicit date" in timeline[0].event_label

def test_timeline_ordering_is_set():
    ev1 = _make_ev("INC-1042", "Incident on 2024-09-16.")
    ev2 = _make_ev("DEP-882", "Deployment on 2024-09-15.")
    state = _make_state(evidence=[ev1, ev2])
    timeline = build_timeline(state)
    assert len(timeline) == 2
    assert timeline[0].ordering < timeline[1].ordering

def test_document_date_not_assumed_as_event_date():
    # The chunk text has NO explicit date — timeline must not invent one
    ev = _make_ev("GUIDE-12", "Restart Service A when latency remains high.")
    state = _make_state(evidence=[ev])
    timeline = build_timeline(state)
    assert timeline[0].event_date is None


# ────────────────────────────────────────────────
# Source Reference Tests
# ────────────────────────────────────────────────

def test_source_references_built():
    ev1 = _make_ev("INC-1042", "text")
    ev2 = _make_ev("DEP-882", "text")
    state = _make_state(evidence=[ev1, ev2])
    refs = build_source_references(state)
    labels = {r.source_label for r in refs}
    assert "INC-1042" in labels
    assert "DEP-882" in labels

def test_source_references_deduplicated():
    ev1 = _make_ev("INC-1042", "chunk 1")
    ev2 = _make_ev("INC-1042", "chunk 2")
    ev2.id = uuid4()
    state = _make_state(evidence=[ev1, ev2])
    refs = build_source_references(state)
    assert len([r for r in refs if r.source_label == "INC-1042"]) == 1


# ────────────────────────────────────────────────
# Status/Confidence Assessment Tests
# ────────────────────────────────────────────────

def test_insufficient_status_when_no_evidence():
    state = _make_state(evidence=[])
    status = assess_conclusion_status(state, [])
    assert status == "INSUFFICIENT"

def test_supported_when_direct_finding():
    findings = [InvestigationFinding(statement="X", classification="DIRECT", confidence="HIGH")]
    state = _make_state(evidence=[_make_ev("INC-1042", "text")])
    status = assess_conclusion_status(state, findings)
    assert status == "SUPPORTED"

def test_partially_supported_when_contradiction_present():
    findings = [
        InvestigationFinding(statement="X", classification="DIRECT", confidence="HIGH"),
        InvestigationFinding(statement="Y", classification="CONTRADICTED", confidence="LOW"),
    ]
    state = _make_state(evidence=[_make_ev("INC-1042", "text")])
    status = assess_conclusion_status(state, findings)
    assert status == "PARTIALLY_SUPPORTED"

def test_confidence_high():
    findings = [
        InvestigationFinding(statement="X", classification="DIRECT", confidence="HIGH"),
        InvestigationFinding(statement="Y", classification="CORROBORATED", confidence="HIGH"),
    ]
    assert assess_overall_confidence(findings) == "HIGH"

def test_confidence_low_empty():
    assert assess_overall_confidence([]) == "LOW"


# ────────────────────────────────────────────────
# No-fabrication Gate Tests
# ────────────────────────────────────────────────

def test_direct_finding_without_evidence_downgraded(mock_conclusion_repo, mock_llm):
    """LLM claims DIRECT for an unrecognized source — must be downgraded to INFERRED."""
    def gen_struct(prompt, schema):
        if schema.__name__ == "LLMSynthesis":
            return LLMSynthesis(
                summary="Test",
                findings=[LLMFinding(
                    statement="Some claim about PHANTOM-999.",
                    classification="DIRECT",
                    confidence="HIGH",
                    evidence_source_labels=["PHANTOM-999"]  # not in evidence
                )],
            )
        return None
    mock_llm.generate_structured.side_effect = gen_struct

    ev = _make_ev("INC-1042", "Real evidence text.")
    state = _make_state(evidence=[ev])
    svc = ReasoningService(mock_conclusion_repo, mock_llm)
    conclusion = svc.generate_conclusion(state)

    phantom_findings = [f for f in conclusion.findings if "PHANTOM" in f.statement]
    for f in phantom_findings:
        assert f.classification == "INFERRED"
        assert f.confidence == "LOW"


# ────────────────────────────────────────────────
# Causation Softening Test
# ────────────────────────────────────────────────

def test_causation_language_softened(mock_conclusion_repo, mock_llm):
    def gen_struct(prompt, schema):
        if schema.__name__ == "LLMSynthesis":
            return LLMSynthesis(
                summary="Test",
                findings=[LLMFinding(
                    statement="The deployment caused by a misconfiguration resulted in latency.",
                    classification="INFERRED",
                    confidence="MEDIUM",
                    evidence_source_labels=["INC-1042"]
                )],
            )
        return None
    mock_llm.generate_structured.side_effect = gen_struct

    ev = _make_ev("INC-1042", "text")
    state = _make_state(evidence=[ev])
    svc = ReasoningService(mock_conclusion_repo, mock_llm)
    conclusion = svc.generate_conclusion(state)

    for f in conclusion.findings:
        assert "caused by" not in f.statement.lower()
        assert "resulted from" not in f.statement.lower()


# ────────────────────────────────────────────────
# Insufficient Evidence Test
# ────────────────────────────────────────────────

def test_insufficient_conclusion_when_no_evidence(reasoning_service):
    state = _make_state(evidence=[])
    conclusion = reasoning_service.generate_conclusion(state)
    assert conclusion.conclusion_status == "INSUFFICIENT"
    assert len(conclusion.findings) == 1
    assert conclusion.findings[0].classification == "INSUFFICIENT"
    assert conclusion.confidence == "LOW"


# ────────────────────────────────────────────────
# Provider-Limited Fallback Test
# ────────────────────────────────────────────────

def test_provider_limited_fallback(mock_conclusion_repo):
    """When LLM raises, deterministic fallback findings must still be produced."""
    llm = Mock(spec=LLMService)
    llm.generate_structured.side_effect = Exception("503 UNAVAILABLE")

    ev = _make_ev("INC-1042", "Latency observed on orders service on 2024-09-16.")
    state = _make_state(evidence=[ev])
    svc = ReasoningService(mock_conclusion_repo, llm)
    conclusion = svc.generate_conclusion(state)

    assert conclusion is not None
    # Should have at least one deterministic finding
    assert len(conclusion.findings) >= 1
    assert conclusion.conclusion_status in ("SUPPORTED", "PARTIALLY_SUPPORTED", "PROVIDER_LIMITED")


# ────────────────────────────────────────────────
# Contradiction Handling Test
# ────────────────────────────────────────────────

def test_contradiction_preserved_in_conclusion(mock_conclusion_repo, mock_llm):
    def gen_struct(prompt, schema):
        if schema.__name__ == "LLMSynthesis":
            return LLMSynthesis(
                summary="Contradiction found between GUIDE-12 and GUIDE-41.",
                findings=[
                    LLMFinding(
                        statement="GUIDE-12 says restart Service A when latency is high.",
                        classification="DIRECT",
                        confidence="HIGH",
                        evidence_source_labels=["GUIDE-12"]
                    ),
                    LLMFinding(
                        statement="GUIDE-41 (newer, 2024) says do NOT restart during dependency failures; check health first. GUIDE-41 is newer and specifically addresses dependency failures, but GUIDE-12 remains applicable in non-dependency scenarios.",
                        classification="CONTRADICTED",
                        confidence="MEDIUM",
                        evidence_source_labels=["GUIDE-41"]
                    ),
                ],
                uncertainty_notes="The correct action depends on whether the failure is dependency-related.",
            )
        return None
    mock_llm.generate_structured.side_effect = gen_struct

    ev_g12 = _make_ev("GUIDE-12", "Restart Service A when latency remains high.")
    ev_g41 = _make_ev("GUIDE-41", "Do not restart Service A during dependency failures.")
    state = _make_state(evidence=[ev_g12, ev_g41])

    svc = ReasoningService(mock_conclusion_repo, mock_llm)
    conclusion = svc.generate_conclusion(state)

    classifications = {f.classification for f in conclusion.findings}
    assert "CONTRADICTED" in classifications
    stmts = " ".join(f.statement for f in conclusion.findings)
    assert "GUIDE-41" in stmts
    assert "GUIDE-12" in stmts
    # Must not simply declare one winner
    assert "newer" in stmts or "dependency" in stmts


# ────────────────────────────────────────────────
# Existing conclusion — no re-generation
# ────────────────────────────────────────────────

def test_existing_conclusion_returned_without_llm_call(mock_conclusion_repo, mock_llm):
    existing = InvestigationConclusion(
        id=uuid4(),
        investigation_id=uuid4(),
        summary="Pre-existing conclusion",
        conclusion_status="SUPPORTED",
        confidence="HIGH"
    )
    mock_conclusion_repo.get_conclusion.return_value = existing

    state = _make_state(evidence=[_make_ev("INC-1042", "text")])
    state.investigation_id = existing.investigation_id

    svc = ReasoningService(mock_conclusion_repo, mock_llm)
    result = svc.generate_conclusion(state)

    assert result.summary == "Pre-existing conclusion"
    mock_llm.generate_structured.assert_not_called()


# ────────────────────────────────────────────────
# Persistence Test
# ────────────────────────────────────────────────

def test_conclusion_saved(mock_conclusion_repo, mock_llm):
    ev = _make_ev("INC-1042", "Latency observed.")
    state = _make_state(evidence=[ev])
    svc = ReasoningService(mock_conclusion_repo, mock_llm)
    svc.generate_conclusion(state)
    mock_conclusion_repo.save_conclusion.assert_called_once()


# ────────────────────────────────────────────────
# API Integration Smoke
# ────────────────────────────────────────────────

def test_api_import():
    from app.api.endpoints.investigations import router
    assert router is not None
