# IncidentIQ — CURRENT_PHASE.md

## Current State

Phase: 4 — Investigation State / Evidence Reasoning
Status: COMPLETE

Lead: Siddarth
QA: QA/Testing Co-Hacker
Docs: Product/Documentation Co-Hacker

Acceptance:
- Supabase Investigation Tables migration deployed (PASS)
- Question analysis & subquestion generation (PASS)
- Evidence claim extraction & classification (PASS)
- Relationships extraction (PASS)
- Contradiction handling (PASS)
- `POST /api/investigations` implemented (PASS)
- `GET /api/investigations/{id}` implemented (PASS)
- Unit and live integration tests pass (PASS)
- Insufficient evidence behavior implemented (PASS)

## Coordination Rule

The lead owns the integrated application.

QA and Docs become active when a stable checkpoint is available. They may prepare work earlier, but test/document the actual repository state.

## Phase Update Template

```text
Phase: 4 — Investigation State / Evidence Reasoning
Status: COMPLETE

Lead:
- Defined Domain Models & Schemas (InvestigationState, InvestigationEvidence, InvestigationContradiction, etc.)
- Created `20261008000300_investigation_schema.sql` Supabase migration for DB tables and RLS policies.
- Deployed migration via `npx supabase db push`.
- Implemented `InvestigationRepository` to persist and retrieve states accurately.
- Created `LLMService` leveraging `gemini-2.5-flash` with structured generation.
- Built `InvestigationService` to orchestrate question analysis, extraction of factual claims, relationship inference, and contradiction detection.
- Exposed `POST /api/investigations` and `GET /api/investigations/{investigation_id}` REST API endpoints.

QA:
- Added `test_investigation.py` unit tests with mocked LLM output simulating end-to-end investigation workflow.
- Created `test_live_phase4.py` for integration testing of real acceptance queries against live database & LLM (flagged to skip in ordinary CI).
- Verified correct behavior on empty retrieval (INSUFFICIENT).
- Tested bounds and graceful degradation of malformed LLM responses.
- Passed 66/66 tests overall.

Docs:
- Updated CURRENT_PHASE.md.

Acceptance:
- Question Analysis: PASS
- Subquestions: PASS
- Evidence Source-Linked: PASS
- Evidence Classifications: PASS
- Temporal Relationships: PASS
- Contradiction Handling: PASS
- Insufficient Evidence: PASS
- Investigation APIs: PASS
- Bounded Execution: PASS

Known Blockers:
- None.

Latest Stable Commit:
Ready for Phase 4 Checkpoint Commit
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
