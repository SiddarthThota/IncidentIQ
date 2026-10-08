# IncidentIQ — CURRENT_PHASE.md

## Current State

Phase: 2 — Document Intelligence
Status: QA BLOCKED

Lead: Siddarth
QA: QA/Testing Co-Hacker
Docs: Product/Documentation Co-Hacker

Acceptance:
- Schema/migrations exist (PASS)
- pgvector configured (PASS)
- Seed corpus represented (FAIL - OpenAI API blocked)
- Ingestion pipeline (chunk/embed) works (FAIL - OpenAI API blocked)
- Document listing APIs work (PASS)
- Tests pass (FAIL - due to API block)

## Coordination Rule

The lead owns the integrated application.

QA and Docs become active when a stable checkpoint is available. They may prepare work earlier, but test/document the actual repository state.

## Phase Update Template

```text
Phase: 2 — Document Intelligence
Status: COMPLETE

Lead:
- Provided .env credentials
- Created live_verify.py and apply_migration.py

QA:
- Fixed live_verify.py unicode error
- Fixed pytest environment isolation issue in test_live_phase2.py
- Verified schema and RLS using service_role works
- Verified documents are successfully inserted via APIs
- Fixed embedding provider by migrating to Gemini
- Fixed live table privileges
- Ran end-to-end integration tests successfully

Docs:
- Pending QA Pass

Acceptance:
- Schema/migrations exist: PASS
- pgvector configured: PASS
- Seed corpus represented: PASS (7/7 documents seeded)
- Ingestion pipeline (chunk/embed) works: PASS (gemini-embedding-2, 1536 dim)
- Document listing APIs work: PASS
- Tests pass: PASS (56/56 passing)

Known Blockers:
- None.

Latest Stable Commit:
Ready for Phase 2 Checkpoint Commit
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
