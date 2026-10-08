# IncidentIQ — CURRENT_PHASE.md

## Current State

Phase: 6 — Final Reasoning / Evidence-backed Conclusion
Status: COMPLETE

Lead: Siddarth
QA: QA/Testing Co-Hacker
Docs: Product/Documentation Co-Hacker

## Coordination Rule

The lead owns the integrated application.

QA and Docs become active when a stable checkpoint is available. They may prepare work earlier, but test/document the actual repository state.

## Phase Update Template

```text
Phase: 6 — Final Reasoning / Evidence-backed Conclusion
Status: COMPLETE

Lead:
- Defined InvestigationConclusion, InvestigationFinding, TimelineEvent, and SourceReference models (`backend/app/schemas/conclusion.py`).
- Created `20261008000600_phase6_conclusion_schema.sql` migration for the conclusion tables and RLS policies.
- Pushed the migration to the live Supabase instance.
- Implemented `ConclusionRepository` (`backend/app/repositories/conclusion_repo.py`) for persistence.
- Built `ReasoningService` (`backend/app/services/reasoning_service.py`) to construct a deterministic timeline, identify sources, and perform a single bounded LLM synthesis call.
- Enforced hard no-fabrication and causation-softening gates in the reasoning service.
- Extended `POST /api/investigations` and `GET /api/investigations/{id}` to return the final conclusion (`InvestigationStateWithConclusion`).
- Added a new `POST /api/investigations/{id}/conclude` endpoint to explicitly trigger or re-run reasoning.

QA:
- Implemented extensive deterministic and mocked-LLM unit tests in `backend/tests/test_reasoning.py` covering timeline extraction, causation mitigation, contradiction handling, and the provider-limited fallback.
- Validated all 92/92 tests pass.
- Verified prior phase regressions (Phase 2, 3, 4, 5).
- Live Gemini API calls were explicitly omitted to conserve quota as instructed; behavior verified via mocked responses mirroring expected outputs.

Docs:
- Updated CURRENT_PHASE.md.

Acceptance / Verification Notes:
- Traceability: Findings without evidence references are automatically downgraded to INFERRED with LOW confidence.
- Causation vs Temporal: Causal phrases (e.g. "caused by") in LLM outputs are deterministically rewritten to temporal phrases (e.g. "temporally associated with") unless explicitly supported.
- Contradictions: Preserves all sources and contexts without arbitrary overrides.
- Provider Failures: Safely falls back to a deterministic finding extraction if the LLM call fails (e.g., 503 UNAVAILABLE), preserving the investigation state and generating a PROVIDER_LIMITED conclusion.

Known Blockers:
- None. Live tests deferred to save quota.

Latest Stable Commit:
Ready for Phase 6 Checkpoint Commit
```

## Status Values
- NOT STARTED
- IN PROGRESS
- READY FOR QA
- QA BLOCKED
- QA PASS
- DOCS READY
- COMPLETE

## Source of Truth
Actual source code, tests, and runtime behavior are the implementation truth. This file is coordination metadata only.
