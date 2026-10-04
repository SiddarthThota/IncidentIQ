# IncidentIQ — IMPLEMENTATION.md

## Strategy
Use a **Lead-First Integrated Build**.

The lead owns the complete integrated application. QA and Product/Docs agents work on stable checkpoints and release validation rather than independently building core modules.

## Phase 0 — Initialization
Lead:
- initialize repository
- create frontend/backend foundation
- configure environment
- create/configure Supabase
- configure AI provider
- connect database
- create `/health`

QA:
- prepare test structure/smoke plan

Docs:
- README skeleton
- product overview skeleton

## Phase 1 — Professional UI + Authentication
Lead:
- login/logout
- protected routes
- dashboard
- navigation
- investigation page
- history
- responsive states

QA:
- auth/navigation smoke tests

Docs:
- user workflow
- UI documentation
- screenshots once real and stable

## Phase 2 — Documents + Data
Lead:
- schema/migrations
- ingestion
- metadata validation
- chunking
- embeddings
- pgvector
- document APIs

QA:
- ingestion/document regression tests

Docs:
- data model
- ingestion flow

## Phase 3 — Hybrid Retrieval
Lead:
- semantic retrieval
- metadata filters
- ranking
- lexical fallback if needed

QA:
- semantic matching
- service/date/version/type filters
- empty results
- regression

Docs:
- retrieval architecture
- search explanation

## Phase 4 — Investigation Agent
Lead:
- question analysis
- subquestions
- investigation state
- evidence extraction
- follow-up search
- bounded loop
- event logging
- persistence
- structured result

QA:
- investigation tests
- follow-up search tests
- state/evidence tests

Docs:
- agent lifecycle
- investigation trace

## Phase 5 — Advanced Reasoning / A-B-C

### A
- connect incident, version, deployment, historical evidence
- establish temporal association where supported
- do not overclaim causation

### B
- detect conflicting recommendations
- compare context/date/version
- explain newer/applicable guidance

### C
- compare historical candidates
- exact vs similar
- insufficient evidence when exactness is not established

QA:
- complete A/B/C suite
- edge cases
- regression

Docs:
- A/B/C behavior
- reasoning documentation
- demo explanations

## Phase 6 — Explainability + Visualization
Lead:
- evidence cards
- investigation timeline
- contradiction visualization
- historical comparison
- responsive/loading/error polish

QA:
- browser/E2E validation

Docs:
- screenshots
- demo flow
- architecture visualization

## Phase 7 — Security + Hardening
Lead:
- auth validation
- RLS review
- CORS
- secret handling
- timeout/retry policy
- graceful errors

QA:
- security smoke + regression

Docs:
- security/deployment notes

## Phase 8 — Deployment
Lead:
- frontend deployment
- backend deployment
- production environment
- database/AI connectivity

QA:
- deployed end-to-end testing

Docs:
- deployment documentation
- final demo URL

## Phase 9 — Final Freeze
All:
- A/B/C
- full E2E
- production verification
- README
- demo
- architecture documentation
- final submission assets

## Checkpoint Protocol

Lead:
1. implement phase
2. run focused tests
3. push stable checkpoint
4. update `CURRENT_PHASE.md`
5. notify teammates

QA:
1. pull latest main
2. use QA agent
3. run tests
4. report failures
5. commit real QA work
6. PR
7. retest after fixes

Docs:
1. pull latest main
2. use Docs agent
3. inspect actual implementation
4. update docs/demo
5. commit real work
6. PR

Lead:
1. review teammate PRs
2. run regression
3. merge
4. mark phase complete

## Time Priority
1. working core
2. A/B/C correctness
3. evidence quality
4. deployment
5. professional UI
6. optional enhancements

If time is tight, cut optional polish before core investigation/evidence/reasoning.
