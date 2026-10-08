# IncidentIQ — CURRENT_PHASE.md

## Current State

Phase: 7 — Frontend Investigation Experience
Status: CHECKPOINTED

Lead: Siddarth
QA: QA/Testing Co-Hacker
Docs: Product/Documentation Co-Hacker

## Coordination Rule

The lead owns the integrated application.

QA and Docs become active when a stable checkpoint is available. They may prepare work earlier, but test/document the actual repository state.

## Phase Update Template

```text
Phase: 7 — Frontend Investigation Experience
Status: CHECKPOINTED

Lead:
- Implemented comprehensive TypeScript data models matching backend Pydantic contracts (`frontend/src/types/investigation.ts`).
- Created unified API service layer (`frontend/src/lib/api.ts`) connecting to `/api/investigations`, `/api/documents`, and `/api/search` with TanStack Query caching and Supabase fallback.
- Added `GET /api/investigations` list endpoint to backend API and `InvestigationRepository`.
- Built rich Investigation Detail workspace (`frontend/src/pages/InvestigationDetail.tsx`):
  * InvestigationHeader: Question title, status badge, iteration count, copy ID button, conclude action.
  * InvestigationProgress: Deterministic 6-stage step flow driven by persisted events.
  * ConclusionPanel: Status banners (SUPPORTED, PARTIALLY_SUPPORTED, INSUFFICIENT, CONTRADICTED, PROVIDER_LIMITED), confidence levels, executive summary, explicit causation warning, insufficient evidence explanation, and source reference tags.
  * FindingsList: Plain-language findings with classification badges (DIRECT, CORROBORATED, TEMPORAL, INFERRED, CONTRADICTED, INSUFFICIENT) and evidence links.
  * TimelineView: Strict chronological evidence events distinguishing Event Date from Document Publication Date.
  * EvidenceExplorer: Chunk excerpts (expandable), claims with classifications and confidence scores.
  * FollowUpSection: Phase 5 differentiator showing iterative follow-up query loops, hypotheses, and retrieved results.
  * OpenQuestionsList: Inquiry tracking with status badges (OPEN, RESOLVED, UNRESOLVED) and resolution reasons.
  * ContradictionsSection: Neutral side-by-side comparison of conflicting operational guidance.
  * HistoricalComparison: Pattern correlation distinguishing Similar Incident from Exact Match.
  * DocumentModal: Modal drawer to view verified source document text and metadata on demand.
- Upgraded New Investigation page (`frontend/src/pages/NewInvestigation.tsx`) with character limits, click-to-populate example inquiries, and multi-stage loading feedback.
- Upgraded Dashboard (`frontend/src/pages/Dashboard.tsx`) with clear product messaging, quick CTAs, and recent investigations.
- Upgraded History page (`frontend/src/pages/History.tsx`) with search, status filters, conclusion badges, and direct links.
- Enhanced AppLayout with mobile navigation drawer, responsive design, and accessible controls.

QA:
- Installed and configured Vitest and React Testing Library (`frontend/src/test/investigation.test.tsx`).
- Created 16 unit and integration tests covering login, new investigation validation, submission, detail rendering, loading, error, evidence, contradictions, conclusion, causation warning, insufficient evidence, provider-limited states, and history navigation.
- All 16 frontend tests PASS (16/16).
- Frontend production build (`tsc -b && vite build`) PASS.
- Full backend regression test suite PASS (49/49 unit tests pass; 92/92 prior live/schema tests verified).
- Security verification PASS (no secrets committed or exposed).

Docs:
- Updated CURRENT_PHASE.md to CHECKPOINTED.

Acceptance / Verification Notes:
- Presentation Layer Rule: Frontend faithfully presents backend state without fabricating reasoning or hardcoding acceptance answers.
- Real investigation API integrated across all flows.
- Evidence, follow-up, timeline, contradiction, and conclusion UI fully implemented.
- Causation Warning: Actively warns that temporal association is not causal proof whenever temporal findings are detected.
- Insufficient Evidence: Graceful, clear state explaining knowledge deficits as valid outcomes.
- Provider Failures: Preserves prior evidence and explains provider unavailability clearly without breaking UI.
- No secrets tracked in repository.

Known Blockers:
- None. Phase 7 is CHECKPOINTED.

Latest Stable Commit:
feat: complete investigation frontend experience
```

## Status Values
- NOT STARTED
- IN PROGRESS
- READY FOR QA
- QA BLOCKED
- QA PASS
- DOCS READY
- COMPLETE
- CHECKPOINTED

## Source of Truth
Actual source code, tests, and runtime behavior are the implementation truth. This file is coordination metadata only.
