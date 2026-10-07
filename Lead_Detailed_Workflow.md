# IncidentIQ — Lead Developer / Integration Owner Master Workflow

## Role
**Lead Developer + Integration Owner**

## Project
**IncidentIQ — AI-powered operational incident investigation and evidence-intelligence platform**

## Build model
**Lead-first integrated build**

## Primary objective
Build the **single coherent IncidentIQ application end-to-end** during the permitted 24-hour hackathon implementation window, then validate, deploy, harden, document, and freeze it for submission.

---

# 0. READ THIS FIRST

This document is the Lead's operating manual.

You own the integrated product:

- frontend
- backend
- investigation agent
- retrieval
- evidence model
- reasoning
- database
- authentication
- deployment
- final integration

The QA teammate and Product/Docs teammate contribute around your integrated build at stable checkpoints.

Do not create a second architecture just because an AI agent suggests one.

The repository's permanent engineering rules state that IncidentIQ must remain one coherent application, use the approved stack, keep important conclusions traceable to evidence, distinguish temporal association from causation, distinguish similar from identical incidents, surface contradictions, and allow insufficient-evidence outcomes. fileciteturn7file19

---

# 1. THE PROJECT IN ONE SENTENCE

> **IncidentIQ is an AI-powered operational incident investigation system that searches and connects evidence across an organization's internal operational document corpus, uses discovered information to perform follow-up searches, and returns an evidence-backed conclusion or explicitly reports insufficient evidence.**

---

# 2. THE PROBLEM YOU ARE IMPLEMENTING

The operational evidence corpus can contain:

- incident reports
- deployment notes
- architecture documents
- troubleshooting guides
- customer complaints
- engineering discussions
- post-incident reviews / postmortems

The official challenge says the answer to an investigation may not be in one document. It may require connecting multiple sources, handling different terminology, old guidance, contradictions, newer documents, and incomplete evidence. fileciteturn6file8

Therefore, the product must not behave like a simple single-document chatbot.

The target investigation loop is:

```text
Natural-language question
        ↓
Question understanding
        ↓
Initial retrieval
        ↓
Evidence extraction
        ↓
Investigation state update
        ↓
"What else do I need to know?"
        ↓
Follow-up search
        ↓
More evidence
        ↓
Cross-document comparison
        ↓
Date/version/contradiction/history analysis
        ↓
Evidence-backed conclusion
OR
Insufficient evidence
```

---

# 3. THE EVIDENCE CORPUS MODEL

For the hackathon, use a **controlled Option A evidence corpus**.

Conceptually:

```text
data/
├── incidents/
├── deployments/
├── troubleshooting/
├── postmortems/
├── architecture/
└── other operational evidence types as needed
```

The exact repository folder names may differ if the implementation chooses a clean equivalent.

The important thing is:

> **The documents are the evidence source.**

They should be ingested and indexed into:

```text
Document
↓
metadata validation
↓
chunking
↓
embeddings
↓
Supabase/PostgreSQL + pgvector
↓
searchable evidence layer
```

Useful metadata:

```text
document_id
type
service
date
version
title
content
```

The repository rules explicitly require semantic + metadata-aware retrieval and recommend those metadata fields. fileciteturn7file19

---

# 4. NORMAL USER EXPERIENCE

A normal user should not need to upload a document for every question.

The expected flow is:

```text
Login
  ↓
Dashboard
  ↓
New Investigation
  ↓
Natural-language question
  ↓
Start Investigation
  ↓
Search internal operational corpus
  ↓
See investigation progress
  ↓
See evidence
  ↓
See follow-up searches / investigation steps
  ↓
See timeline / relationships / conflicts
  ↓
See final conclusion
  ↓
See document identifiers
  ↓
History
```

Optional upload/import can exist, but it should not replace the connected/preloaded evidence corpus model.

---

# 5. APPROVED TECHNOLOGY STACK

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- React Router
- TanStack Query

## Backend

- Python
- FastAPI
- Pydantic
- Uvicorn

## AI

- Cloud LLM API
- Embedding API/model
- structured outputs where useful
- bounded investigation workflow

## Data/Auth

- Supabase
- PostgreSQL
- pgvector
- Supabase Auth
- Row Level Security

## Deployment

- Vercel or equivalent frontend
- Railway or Render backend
- Supabase hosted services

**Ollama is not part of the runtime architecture.**

Do not add:

- a second primary vector database
- a second authentication provider
- a second primary LLM runtime
- unnecessary infrastructure

unless the human Lead explicitly changes the architecture.

---

# 6. DETERMINISTIC VS LLM RESPONSIBILITIES

## Prefer deterministic code for

- IDs
- metadata filters
- date comparisons
- version metadata/comparison where practical
- event/state bookkeeping
- evidence linkage
- authorization
- API validation
- investigation limits
- timeouts
- retries

## Prefer the LLM for

- natural-language understanding
- question decomposition
- semantic interpretation
- claim/fact extraction
- follow-up query generation
- explanation composition

The repository rules explicitly recommend this split. fileciteturn7file19

Core principle:

> If a decision can be reliably enforced by code, do not make the LLM the sole authority for it.

---

# 7. EVIDENCE RULES YOU MUST NEVER BREAK

## Rule 1 — Evidence first

Important conclusions must be traceable to actual evidence/document IDs.

## Rule 2 — Temporal association is not causation

If deployment happened before incident, that supports a temporal relationship.

It does **not automatically prove** that the deployment caused the incident.

## Rule 3 — Similar is not identical

Do not classify incidents as exact matches merely because names, symptoms, or embeddings are similar.

Compare:

- service
- symptom
- failure type
- cause
- version
- context
- available incident metadata

## Rule 4 — Contradictions must be surfaced

Do not silently merge conflicting guidance.

Compare:

- subject
- action
- condition/context
- date
- version
- applicability

## Rule 5 — Insufficient evidence is a valid result

Never force an answer.

A legitimate result is:

> "The available evidence is insufficient to establish the requested claim."

These rules are explicitly part of the project control guidance. fileciteturn7file19

---

# 8. INVESTIGATION STATE

The investigation state should contain, as appropriate:

```text
question
entities
subquestions
facts
retrieved_documents
evidence_claims
relationships
contradictions
follow_up_queries
open_questions
status
events/timestamps
```

Every investigation must have practical bounds:

```text
maximum iterations
maximum retrieved documents
timeouts
retries
```

Every follow-up search should be explainable by:

```text
a discovered fact
OR
an unresolved question
```

This is required by the repository's Investigation Agent rules. fileciteturn7file19

---

# 9. LEAD'S MASTER AGENT PROMPT

Use this at the beginning of the hackathon implementation window.

```text
You are the primary implementation agent for IncidentIQ.
I am the human Lead Developer and Integration Owner.

IMPORTANT:
This is the main integrated application. Preserve one coherent architecture.
Do not create a second architecture because of agent preference.
Do not introduce unnecessary frameworks or infrastructure.
Do not use Ollama in the runtime architecture.

Before implementation, read:
1. AGENTS.md
2. ARCHITECTURE.md
3. IMPLEMENTATION.md
4. CURRENT_PHASE.md
5. TEAM_WORKFLOW.md
6. MASTER_ANTIGRAVITY_PROMPT.md

Treat:
- AGENTS.md as mandatory project rules
- ARCHITECTURE.md as the approved technical blueprint
- IMPLEMENTATION.md as the phase roadmap
- CURRENT_PHASE.md as the coordination state
- actual source code/tests/runtime behavior as implementation truth

Product objective:
Build IncidentIQ as a professional AI-powered operational incident investigation and evidence-intelligence platform.

The user must be able to:
- authenticate
- open dashboard
- ask a natural-language operational incident question
- start an investigation
- see investigation progress
- see evidence across documents
- see follow-up searches driven by discovered information
- see date/version reasoning
- see contradictions
- compare historical incidents
- see insufficient-evidence outcomes
- inspect evidence/document identifiers
- view investigation history
- use the deployed application end-to-end

Approved stack:
React + TypeScript + Vite + Tailwind + shadcn/ui + Lucide + React Router + TanStack Query
FastAPI + Pydantic + Uvicorn
Supabase + PostgreSQL + pgvector + Supabase Auth + RLS
Cloud LLM + Embeddings
Vercel + Railway/Render + Supabase

Engineering rules:
- important conclusions must link to evidence/document IDs
- temporal association is not causation
- similar is not exact
- contradictions must be surfaced
- insufficient evidence is valid
- deterministic logic should handle IDs/metadata/dates/versions/state/auth/validation/limits
- LLM should handle language understanding/decomposition/semantic interpretation/follow-up query generation/explanation
- bound the investigation loop
- never expose secrets
- never commit credentials
- run tests after meaningful changes
- inspect before editing
- make small, reversible changes

Implementation model:
Lead owns core implementation and integration.
QA teammate owns tests and release validation.
Product/Docs teammate owns documentation and demo material.
Do not turn teammates into parallel rewrites of core implementation.

Work phase-by-phase.
At the end of every phase:
1. run focused tests
2. run relevant regression tests
3. verify runtime behavior
4. update CURRENT_PHASE.md
5. show me changed files
6. show me exact test commands/results
7. explain remaining risks
8. do not claim completion without evidence

Do not move to the next phase if the current phase gate is failing.
```

---

# 10. HOW TO OPERATE ANTIGRAVITY / VS CODE AS THE LEAD

## Before every phase

Do this:

```text
1. Read CURRENT_PHASE.md
2. Read relevant architecture section
3. Inspect existing code
4. Inspect tests
5. Inspect env/config names
6. Identify exact phase scope
7. Implement only that scope
8. Run focused tests
9. Run build/lint/type checks where appropriate
10. Verify runtime
11. Update CURRENT_PHASE.md
12. Commit
13. Push
14. Notify teammates
```

Do not ask the agent to "build everything at once" after the initial planning step.

Phase boundaries exist to reduce integration risk.

---

# 11. RECOMMENDED GIT CHECKPOINT PROCEDURE

At every stable checkpoint:

```bash
git status
git branch --show-current
git log -1 --oneline
```

Review:

```bash
git diff
```

Then:

```bash
git add <specific-files>
git commit -m "feat: complete phase X <short description>"
git push origin main
```

Only push after:

- feature implemented
- tests run
- no known blocker
- no secrets
- diff reviewed

Then tell teammates:

> "Phase X checkpoint is stable on main. QA and Docs can pull latest main."

---

# 12. PHASE 0 — FOUNDATION

## Goal

Create the actual application foundation during the permitted implementation window.

The current implementation roadmap defines Phase 0 as:

- initialize repository/application
- React/Vite frontend
- FastAPI backend
- environment configuration
- Supabase connection
- AI connection
- database connection
- Auth configuration
- `/health`
- frontend/backend communication

The gate is that frontend starts, backend starts, health works, communication works, and configuration has no obvious blocker. fileciteturn6file0

---

## 12.1 Lead tasks

### Step 1 — Confirm workspace

Open:

```text
C:\Users\sidar\OneDrive\Desktop\IncidentIQ
```

Confirm the Git root is this repository.

Run:

```bash
git rev-parse --show-toplevel
git remote -v
git status
```

Expected:

- correct GitHub remote
- clean or understood working tree

---

## Step 2 — Read project control files

Read:

```text
AGENTS.md
ARCHITECTURE.md
IMPLEMENTATION.md
CURRENT_PHASE.md
TEAM_WORKFLOW.md
```

---

## Step 3 — Scaffold frontend

Create the React/Vite application according to the approved stack.

Verify:

```text
frontend starts
frontend build works
TypeScript works
```

---

## Step 4 — Scaffold backend

Create FastAPI application.

Provide:

```text
GET /health
```

Return a small structured health response.

---

## Step 5 — Configure environment

Use local environment variables.

Create:

```text
.env
.env.example
```

Ensure:

```text
.env
```

is ignored by Git.

Never commit:

- API keys
- service role keys
- passwords
- access tokens

---

## Step 6 — Connect Supabase

Configure:

- project URL
- anon/public key where required
- server-side secret only on backend where needed
- database connectivity

---

## Step 7 — Connect Cloud AI

Configure:

- cloud LLM provider
- model
- embedding provider/model

Do not hard-code credentials.

---

## Step 8 — Connect frontend to backend

Create the minimum useful API client.

Verify:

```text
Browser → FastAPI → response
```

---

## 12.2 Phase 0 lead prompt

```text
Implement IncidentIQ Phase 0 only.

First inspect:
- AGENTS.md
- ARCHITECTURE.md
- IMPLEMENTATION.md
- CURRENT_PHASE.md
- TEAM_WORKFLOW.md

Build:
- React/Vite application shell
- FastAPI backend
- environment configuration
- Supabase connection
- cloud LLM connection
- embedding configuration
- database connection
- GET /health
- initial frontend/backend API communication

Rules:
- preserve approved architecture
- no Ollama runtime
- no unnecessary dependencies
- keep secrets in environment variables
- create .env.example without secret values
- inspect before editing
- test every meaningful integration

Verification required:
- frontend starts
- frontend build succeeds
- backend starts
- /health works
- frontend can communicate with backend
- Supabase configuration is valid
- AI connection is valid
- no obvious configuration blocker

At the end:
- show files changed
- show commands run
- show test/build output summary
- update CURRENT_PHASE.md
- list any remaining risks
- do not claim complete if a gate is failing
```

---

## 12.3 Phase 0 done means

```text
[ ] frontend starts
[ ] frontend build succeeds
[ ] backend starts
[ ] /health works
[ ] frontend/backend communication works
[ ] Supabase connected
[ ] AI configured
[ ] secrets safe
[ ] .env.example exists
[ ] no obvious blocker
[ ] CURRENT_PHASE.md updated
[ ] stable commit pushed
```

---

## 12.4 Teammate activation

After your Phase 0 checkpoint:

```text
QA:
- smoke-test foundation
- create basic test coverage

Docs:
- document real setup
- README skeleton
```

You continue to Phase 1 unless they find a blocking issue.

---

# 13. PHASE 1 — PROFESSIONAL UI + AUTH

## Goal

Turn the foundation into a usable product shell.

The roadmap requires:

- login/logout
- protected routes
- dashboard
- navigation
- new investigation screen
- history
- responsive layout
- loading/error/empty states

The gate is working auth/navigation and a coherent responsive UI. fileciteturn6file0

---

## 13.1 Lead tasks

### Step 1 — Authentication

Implement:

```text
login
logout
session handling
protected routes
```

Use Supabase Auth.

Do not expose privileged credentials to the browser.

---

## Step 2 — Application shell

Build:

```text
App shell
Navigation
Sidebar/top navigation as appropriate
Main content area
User/session controls
```

---

## Step 3 — Dashboard

Include useful project status information without inventing operational results.

---

## Step 4 — New Investigation

Create the user entry point:

```text
question input
validation
start investigation
```

At this stage the exact agent may not yet exist.

Do not fake investigation results as real functionality.

---

## Step 5 — History

Create a historical investigations page that can later consume persisted investigation records.

---

## Step 6 — UX states

Implement:

```text
loading
error
empty
success
```

---

## Step 7 — Responsive UI

Verify desktop and smaller viewport behavior.

---

## 13.2 Phase 1 prompt

```text
Implement IncidentIQ Phase 1 only.

Read project control files first.

Build:
- Supabase login
- logout
- session handling
- protected routes
- application shell
- navigation
- dashboard
- New Investigation page
- History page
- loading/error/empty states
- responsive layout

Rules:
- preserve backend/API architecture
- keep UI professional and evidence-centric
- do not fabricate investigation data
- do not introduce unrelated features
- use accessible controls and sensible loading/error behavior
- do not expose privileged credentials

Verification:
- valid login works
- invalid login handled
- logout works
- protected pages are blocked without auth
- navigation works
- dashboard works
- New Investigation screen works
- History screen works
- responsive layout works
- no critical console/runtime blocker

At end:
- run tests
- run build
- update CURRENT_PHASE.md
- show exact changed files
- show verification evidence
```

---

## 13.3 Phase 1 done means

```text
[ ] login works
[ ] logout works
[ ] protected routes work
[ ] dashboard works
[ ] navigation works
[ ] new investigation screen works
[ ] history works
[ ] loading/error/empty states work
[ ] responsive layout acceptable
[ ] no critical console errors
[ ] stable commit pushed
```

---

# 14. PHASE 2 — DOCUMENT INTELLIGENCE

## Goal

Create the actual searchable operational evidence corpus.

The roadmap requires:

- schema
- migrations
- ingestion
- metadata validation
- chunking
- embeddings
- pgvector
- document APIs

Acceptance requires sample documents to ingest, metadata/chunks/vectors to persist, and documents to be retrievable. fileciteturn6file0

---

## 14.1 Lead tasks

### Step 1 — Define document model

At minimum support:

```text
document_id
type
service
date
version
title
content
```

Add safe internal timestamps/ownership fields as needed.

---

## Step 2 — Define tables

Core conceptual data model includes:

```text
documents
document_chunks
```

and later:

```text
investigations
investigation_documents
investigation_events
evidence_claims
profiles
```

Do not overbuild every table before it is needed.

---

## Step 3 — Build ingestion

Input:

```text
controlled document corpus
```

Pipeline:

```text
raw document
↓
validate metadata
↓
store document
↓
chunk content
↓
generate embeddings
↓
store vectors
```

---

## Step 4 — Seed controlled hackathon corpus

Use the challenge fixtures:

```text
INC-1042
DEP-882
PM-211
GUIDE-12
GUIDE-41
INC-300
INC-301
```

You can add more realistic operational documents later.

Do not hardcode final answers; hardcode **evidence data**.

---

## Step 5 — Implement document APIs

The planned API set includes:

```text
GET /api/documents
GET /api/documents/{document_id}
```

Add ingestion/admin APIs as needed.

---

## 14.2 Phase 2 prompt

```text
Implement IncidentIQ Phase 2 only.

Read:
- AGENTS.md
- ARCHITECTURE.md
- IMPLEMENTATION.md
- CURRENT_PHASE.md

Build:
- database schema/migrations for document intelligence
- documents model
- document_chunks model
- metadata validation
- document ingestion pipeline
- chunking
- embedding generation
- pgvector persistence
- document list/detail APIs
- controlled hackathon evidence corpus seed

Required metadata:
document_id
type
service
date
version
title
content

Use the challenge evidence fixtures for:
INC-1042
DEP-882
PM-211
GUIDE-12
GUIDE-41
INC-300
INC-301

Rules:
- preserve evidence exactly enough for acceptance scenarios
- do not hardcode final answers
- do not put privileged secrets in client code
- validate metadata
- handle duplicate/invalid ingestion reasonably
- keep IDs and metadata deterministic
- test persistence

Verification:
- sample docs ingest
- metadata persists
- chunks exist
- embeddings exist
- document APIs work
- document detail is accurate
- invalid input is handled
```

---

## 14.3 Phase 2 done means

```text
[ ] schema/migrations work
[ ] sample corpus ingests
[ ] metadata correct
[ ] chunks created
[ ] embeddings created
[ ] pgvector storage works
[ ] document list works
[ ] document detail works
[ ] invalid ingestion handled
[ ] stable commit pushed
```

---

# 15. PHASE 3 — HYBRID RETRIEVAL

## Goal

Turn the corpus into a useful investigation search system.

The roadmap requires:

- query embeddings
- vector similarity
- metadata filtering
- lexical fallback if useful
- ranking
- top-k controls
- no-result handling

Acceptance requires semantic retrieval and service/date/version/type filtering, plus graceful no-result behavior. fileciteturn6file0

---

## 15.1 Lead tasks

### Step 1 — Query understanding input

Accept natural-language investigation text.

---

## Step 2 — Semantic search

Embed the query.

Retrieve vector-similar chunks/documents.

---

## Step 3 — Metadata-aware retrieval

Support filters for:

```text
service
date
version
type
```

Use deterministic filtering where practical.

---

## Step 4 — Ranking

Merge/rank results.

Keep top-k bounded.

---

## Step 5 — Lexical fallback

Only add if useful for robust retrieval.

---

## Step 6 — No-result handling

A search returning nothing should be an explicit state.

Do not force the LLM to invent evidence.

---

## 15.2 Phase 3 prompt

```text
Implement IncidentIQ Phase 3 only.

Build:
- query embedding
- vector similarity search
- metadata-aware filters
- lexical fallback if useful
- result merging/ranking
- top-k controls
- no-result behavior

Required metadata filters:
- service
- date
- version
- document type

Test semantic equivalents, not only exact keyword matches.

Required behavior:
- semantic equivalents should find relevant evidence
- filters should narrow results correctly
- irrelevant results should be reduced
- no-result should be explicit and safe

Do not let the LLM invent a document when retrieval returns none.

At the end:
- add focused tests
- run retrieval tests
- run regression
- show sample queries and retrieved document IDs
- update CURRENT_PHASE.md
```

---

## 15.3 Phase 3 done means

```text
[ ] vector retrieval works
[ ] semantic equivalents work
[ ] service filter works
[ ] date filter works
[ ] version filter works
[ ] type filter works
[ ] ranking/top-k bounded
[ ] no-result safe
[ ] retrieval evidence inspectable
[ ] stable commit pushed
```

---

# 16. PHASE 4 — INVESTIGATION AGENT

## Goal

This is the core differentiation phase.

The roadmap requires:

- question analysis
- subquestions
- investigation state
- evidence extraction
- follow-up queries
- bounded loop
- investigation events
- persistence
- structured final response

The gate is demonstrating that newly discovered information can trigger another search. fileciteturn6file0

---

# 16.1 The investigation loop you must implement

```text
USER QUESTION
      ↓
QUESTION ANALYZER
      ↓
ENTITIES + SUBQUESTIONS
      ↓
INITIAL RETRIEVAL
      ↓
EVIDENCE EXTRACTION
      ↓
INVESTIGATION STATE UPDATE
      ↓
OPEN QUESTIONS?
   /          \
 YES           NO
  ↓             ↓
FOLLOW-UP      REASONING
SEARCH             ↓
  ↓            FINAL RESULT
STATE UPDATE
  ↓
(loop, bounded)
```

---

## 16.2 Lead tasks

### Step 1 — Question analyzer

Extract:

```text
service
date
version
symptom
requested investigation goals
subquestions
```

Use the LLM for language interpretation.

---

## Step 2 — Investigation record

Create persisted investigation state.

---

## Step 3 — Initial search

Start with the user's question/subquestions.

---

## Step 4 — Evidence extraction

Turn retrieved content into structured facts/claims where useful.

---

## Step 5 — Decide what to search next

Use discovered facts to produce follow-up searches.

Example:

```text
Found:
version = v2.8.1
service = orders-api
incident date = 2026-09-16

Follow-up:
Search deployments for orders-api + v2.8.1 around incident date
```

---

## Step 6 — Bound the loop

Use:

```text
MAX_ITERATIONS
MAX_RETRIEVED_DOCUMENTS
TIMEOUT
RETRY_LIMIT
```

Do not allow open-ended agent loops.

---

## Step 7 — Persist events

Store useful events such as:

```text
investigation_started
query_analyzed
search_executed
documents_found
evidence_extracted
follow_up_generated
follow_up_executed
reasoning_started
completed
insufficient_evidence
failed
```

---

## Step 8 — Structured result

Return:

```text
status
conclusion
evidence
relationships
uncertainty
contradictions
historical comparisons
investigation trace
```

---

## 16.3 Phase 4 prompt

```text
Implement IncidentIQ Phase 4 only.

This phase must make the product a real investigation agent rather than one-shot RAG.

Build:
- natural-language question analyzer
- entities/subquestions
- persisted investigation state
- initial retrieval
- evidence/fact extraction
- follow-up search generation
- bounded investigation loop
- investigation events
- persistence
- structured result

Critical requirement:
Newly discovered information must be able to trigger a follow-up search.

Example:
Initial retrieval discovers service=orders-api and version=v2.8.1.
The system should use those discovered facts to search deployment evidence.

Every follow-up query should be explainable by:
- a discovered fact
OR
- an unresolved question.

Use deterministic handling for:
- IDs
- metadata
- state persistence
- event persistence
- bounds/limits
- authorization
- validation

Use the LLM for:
- question understanding
- decomposition
- semantic interpretation
- fact extraction
- follow-up query generation
- explanation

Add:
- max iterations
- max documents
- timeout
- retry limits

Verification:
- initial search works
- discovered facts update state
- follow-up search executes
- events persist
- evidence links to document IDs
- investigation stops within configured bounds
- final structured result exists

Demonstrate the investigation trace on Test A.
```

---

## 16.4 Phase 4 done means

```text
[ ] question analyzer works
[ ] subquestions/entities work
[ ] investigation state persists
[ ] initial retrieval works
[ ] evidence extraction works
[ ] follow-up search is real
[ ] follow-up reason is traceable
[ ] bounds/timeout/retry exist
[ ] events persist
[ ] evidence links exist
[ ] structured result exists
[ ] stable commit pushed
```

---

# 17. PHASE 5 — ADVANCED REASONING / A-B-C

## Goal

Implement the challenge-specific reasoning that makes IncidentIQ strong.

The roadmap defines:

- date reasoning
- version reasoning
- contradiction detection
- historical comparison
- insufficient-evidence behavior

and requires running A/B/C before moving on to optional polish. fileciteturn6file2

This is a **critical milestone**.

---

# 17.1 Test A — Deployment Investigation

Prompt:

> "Why did the Order API become slow on September 16? Check whether the deployment was related and whether we have seen this before."

Expected evidence:

```text
INC-1042
DEP-882
PM-211
```

Reasoning:

```text
INC-1042:
incident on Sept 16
orders-api
v2.8.1
latency spike
incident began shortly after deployment

DEP-882:
deployment of v2.8.1
orders-api
Sept 15 at 18:10 UTC

PM-211:
previous latency incident
orders-api
v2.6.0
DB connection saturation during schema migration
```

Correct reasoning:

```text
Deployment preceded incident.
Same service/version relationship exists.
There is a previous latency incident.
But the evidence shown does not by itself prove:
"v2.8.1 deployment caused the Sept 16 incident."
```

Do not overclaim.

---

# 17.2 Test B — Contradictory Guidance

Prompt:

> "The service is failing after a deployment. What should the on-call engineer do first?"

Evidence:

```text
GUIDE-12
2024 / v1
Restart Service A when latency remains high.

GUIDE-41
2026 / v3
Do not restart Service A during dependency failures.
Check dependency health first.
```

The system should surface the contradiction and reason about:

```text
date
version
context
applicability
```

It should not blindly merge both instructions.

---

# 17.3 Test C — Exact vs Similar

Prompt:

> "Did this exact failure happen before?"

Evidence:

```text
INC-300
catalog-api
latency
database saturation

INC-301
orders-api
request failures
expired certificate
```

The system must not force an exact-match answer.

---

# 17.4 Advanced reasoning implementation

Implement deterministic helpers where practical:

```text
date comparison
version comparison
same service check
incident similarity dimensions
evidence status
contradiction record
```

Then use LLM interpretation only where semantic understanding is needed.

---

# 17.5 Evidence classifications

The project can use classifications such as:

```text
DIRECT
CORROBORATED
TEMPORAL
INFERRED
CONTRADICTED
INSUFFICIENT
```

Do not use these just as decorative labels.

Their meaning should be consistent.

---

# 17.6 Phase 5 prompt

```text
Implement and harden IncidentIQ Phase 5.

Read:
- AGENTS.md
- ARCHITECTURE.md
- IMPLEMENTATION.md
- EVALUATOR_TEST_GUIDE.md
- CURRENT_PHASE.md

Build:
- date reasoning
- version reasoning
- contradiction detection
- historical comparison
- insufficient-evidence behavior
- evidence classification/status where appropriate

Hard rules:
1. Temporal association is not causation.
2. Similar is not exact.
3. Contradictions must be surfaced.
4. Insufficient evidence is a valid final result.
5. Important conclusions must reference evidence/document IDs.

Test A:
Connect incident + version + deployment + history without falsely asserting causation.

Test B:
Detect conflicting guidance and use date/version/context/applicability.

Test C:
Compare candidate incidents and distinguish exact/similar/unrelated/insufficient.

Do not hardcode the exact final text of A/B/C.
Hardcode only the evidence fixtures needed for the tests.

Verification required:
- run A
- run B
- run C
- capture retrieved evidence IDs
- capture investigation trace
- verify conclusions against the actual corpus
- verify no unsupported claims
- verify insufficient evidence works

Do not move to optional UI polish if A/B/C has a critical failure.
```

---

# 17.7 Phase 5 done means

```text
[ ] A passes
[ ] B passes
[ ] C passes
[ ] dates handled
[ ] versions handled
[ ] contradiction detection works
[ ] historical comparison works
[ ] exact vs similar works
[ ] insufficient evidence works
[ ] evidence IDs correct
[ ] no unsupported causation
[ ] stable commit pushed
```

---

# 18. PHASE 6 — EXPLAINABILITY + VISUAL POLISH

## Goal

Make the investigation understandable to a judge.

The roadmap calls for:

- timeline
- evidence cards
- document detail drawer
- evidence relationship visualization
- contradiction comparison
- historical comparison
- confidence/uncertainty
- investigation progress states

The acceptance goal is that a judge can understand what was searched, what was discovered, which documents support the answer, where conflict exists, and why evidence may be insufficient. fileciteturn6file2

---

# 18.1 Lead tasks

## Investigation timeline

Show major events in chronological/causal investigation order.

Example:

```text
Investigation started
↓
Initial search
↓
INC-1042 discovered
↓
v2.8.1 identified
↓
DEP-882 searched
↓
deployment relationship found
↓
historical search
↓
PM-211 discovered
↓
reasoning
↓
conclusion
```

---

## Evidence cards

Each card can show:

```text
document ID
document type
title
date
version
service
relevant excerpt
evidence classification
relation to conclusion
```

---

## Document drawer/detail

Let the evaluator inspect the underlying source.

---

## Evidence relationship map

Example:

```text
INC-1042
   │
   ├── same service ── DEP-882
   │
   ├── same version ── DEP-882
   │
   └── historical relation ── PM-211
```

Do not visualize relationships that are not backed by the state/evidence.

---

## Contradiction visualization

For Test B:

```text
GUIDE-12
older guidance
restart

      VS

GUIDE-41
newer guidance
check dependency health first
```

---

## Historical comparison

Show comparison dimensions:

```text
Service
Symptom
Cause
Version
Date
Context
```

---

# 18.2 Phase 6 prompt

```text
Implement IncidentIQ Phase 6 only.

Build:
- investigation timeline
- evidence cards
- document detail drawer
- relationship visualization
- contradiction comparison
- historical comparison
- investigation progress
- confidence/uncertainty presentation
- responsive polish

Requirements:
- every displayed evidence item must correspond to actual evidence/state
- source/document IDs must be correct
- timeline must match actual investigation events
- contradiction UI must reflect actual contradictions
- historical comparison must use actual retrieved candidates
- uncertainty must reflect actual evidence sufficiency

Do not fabricate data for visual polish.

Keep backend evidence semantics unchanged unless an actual integration bug requires a targeted fix.

Verification:
- run a complete investigation
- verify every visual element against backend state
- check responsive behavior
- check loading/error/empty states
- check browser console
```

---

# 18.3 Phase 6 done means

```text
[ ] timeline works
[ ] evidence cards work
[ ] source/document detail works
[ ] relationship visualization works
[ ] contradictions visible
[ ] historical comparison works
[ ] uncertainty visible
[ ] progress is accurate
[ ] responsive UI stable
[ ] no critical UI blocker
```

---

# 19. PHASE 7 — SECURITY + HARDENING

## Goal

Protect users, evidence, credentials, APIs, and runtime.

The roadmap requires review of:

- auth
- RLS
- CORS
- API validation
- secret handling
- timeout/retry
- error handling
- user-level access

The gate is no obvious credential exposure or unauthorized data path. fileciteturn6file2

---

# 19.1 Lead security checklist

## Authentication

Verify:

```text
login
session
logout
protected API
protected routes
```

---

## Authorization / RLS

Verify that a user cannot access another user's private investigation data.

Use test users in a safe environment.

---

## CORS

Allow only intended frontend origins.

Do not use permissive CORS in production without reason.

---

## API validation

Validate:

```text
required fields
data types
length limits
allowed values
IDs
filters
```

---

## Secret handling

Never expose:

```text
service-role key
database password
LLM secret key
embedding secret
private tokens
```

to the frontend.

---

## Error handling

Do not expose internal stack traces or secrets in user responses.

---

## Timeouts/retries

Make external AI/vector/API dependencies bounded and recoverable.

---

# 19.2 Phase 7 prompt

```text
Implement and harden IncidentIQ Phase 7.

Audit:
- Supabase Auth
- protected API routes
- RLS/user-level access
- CORS
- request validation
- secret handling
- server/client environment boundaries
- timeout behavior
- retry behavior
- graceful errors
- logging

Security rules:
- no secrets committed
- no privileged key client-side
- no password/token logging
- no authorization bypass
- no test shortcut that weakens security

Add or update tests for:
- unauthenticated API access
- unauthorized resource access
- invalid payloads
- invalid IDs
- long input
- failed dependencies
- safe error responses

At the end:
- report security findings by severity
- run tests
- verify no obvious credential exposure
- update CURRENT_PHASE.md
```

---

# 19.3 Phase 7 done means

```text
[ ] auth enforced
[ ] protected API enforced
[ ] user-level isolation verified
[ ] RLS reviewed
[ ] CORS reviewed
[ ] validation enforced
[ ] secrets server-side
[ ] failures graceful
[ ] timeouts/retries bounded
[ ] no critical security issue
```

---

# 20. PHASE 8 — DEPLOYMENT

## Goal

Make the actual product accessible end-to-end.

The implementation roadmap expects:

- frontend deployment
- backend deployment
- Supabase production configuration
- AI credentials
- CORS
- frontend API configuration
- production health check

The final deployed system must load, authenticate, start investigations, retrieve evidence, produce conclusions, and persist investigation history. fileciteturn6file2

---

# 20.1 Deployment sequence

## Step 1 — Production config

Set:

```text
frontend environment
backend environment
Supabase production
LLM provider
embedding provider
CORS origins
API URL
```

---

## Step 2 — Deploy backend

Verify:

```text
/health
```

from the deployed environment.

---

## Step 3 — Deploy frontend

Verify it points to the production backend.

---

## Step 4 — Connect production Supabase

Verify:

```text
auth
database
pgvector
investigations
evidence
```

---

## Step 5 — Verify AI from production backend

Do not expose AI secrets in the frontend.

---

## Step 6 — Run full production investigation

Use Test A.

Then B.

Then C.

---

# 20.2 Phase 8 prompt

```text
Deploy IncidentIQ Phase 8.

Before deployment, verify local integrated build.

Deploy:
- React frontend
- FastAPI backend
- Supabase production configuration
- cloud LLM credentials
- embedding credentials
- CORS
- frontend API configuration

Verify production:
- frontend loads
- backend health works
- login works
- dashboard works
- investigation starts
- retrieval works
- follow-up search works
- evidence displays
- conclusion displays
- investigation persists
- history works
- logout works

Do not expose secrets in logs or output.

Do not claim deployed success until the complete user flow has been exercised against the deployed system.
```

---

# 20.3 Phase 8 done means

```text
[ ] frontend deployed
[ ] backend deployed
[ ] production health works
[ ] auth works
[ ] database works
[ ] vectors work
[ ] AI works
[ ] investigation works
[ ] follow-up search works
[ ] conclusion works
[ ] persistence works
[ ] CORS correct
[ ] no secret exposure
```

---

# 21. PHASE 9 — FINAL E2E + FREEZE

## Goal

Convert the working prototype into a submission candidate and stop unnecessary changes.

The roadmap explicitly says after final E2E:

- stop unnecessary refactors
- stop major feature additions
- make targeted bug fixes
- rerun regression
- freeze the submission

and requires A/B/C plus production/build/runtime/documentation readiness. fileciteturn6file2

---

# 21.1 FINAL USER FLOW

Run this without skipping steps:

```text
Login
→ Dashboard
→ New Investigation
→ Enter question
→ Start
→ Investigation progress
→ Retrieval
→ Follow-up Search
→ Evidence
→ Reasoning
→ Conclusion
→ History
→ Logout
```

---

# 21.2 FINAL TEST SET

## Mandatory

```text
Test A
Test B
Test C
```

## Strong internal QA

Also test:

```text
unseen operational question
insufficient-evidence scenario
empty question
very long question
invalid request
fresh browser/session
authentication boundary
```

---

# 21.3 FINAL MASTER PROMPT

```text
Perform FINAL RELEASE INTEGRATION for IncidentIQ.

Treat the current implementation as a release candidate.

First inspect:
- AGENTS.md
- ARCHITECTURE.md
- IMPLEMENTATION.md
- CURRENT_PHASE.md
- TEAM_WORKFLOW.md
- EVALUATOR_TEST_GUIDE.md

Do not introduce a new architecture.
Do not perform broad refactors.
Do not add optional features unless required to fix a release blocker.

Run:
1. full frontend build
2. backend startup/health
3. final regression suite
4. production E2E flow
5. Test A
6. Test B
7. Test C
8. one unseen operational question
9. insufficient-evidence scenario
10. auth/security smoke

Verify:
- evidence IDs
- dates
- versions
- follow-up searches
- contradictions
- historical comparison
- uncertainty
- persistence
- deployment
- browser/runtime errors

At the end return:
RELEASE READY
or
RELEASE BLOCKED

Include:
- tests run
- pass/fail
- known issues
- severity
- exact files changed
- exact remaining blockers
- final deployment status

Do not claim RELEASE READY if a critical gate is failing.
```

---

# 22. FINAL RELEASE CHECKLIST

## Product

```text
[ ] Login
[ ] Dashboard
[ ] New Investigation
[ ] Investigation progress
[ ] Evidence
[ ] Timeline
[ ] Relationships
[ ] Contradictions
[ ] Historical comparison
[ ] Conclusion
[ ] History
[ ] Logout
```

## Backend

```text
[ ] Health
[ ] Auth
[ ] Documents
[ ] Retrieval
[ ] Investigation orchestration
[ ] Evidence state
[ ] Events
[ ] Persistence
```

## Data

```text
[ ] Corpus seeded
[ ] Metadata correct
[ ] Chunks correct
[ ] Vectors present
[ ] Document IDs stable
```

## AI

```text
[ ] question understanding
[ ] decomposition
[ ] evidence extraction
[ ] follow-up query generation
[ ] bounded loop
[ ] final explanation
```

## Reasoning

```text
[ ] dates
[ ] versions
[ ] contradiction
[ ] exact vs similar
[ ] insufficiency
[ ] evidence linkage
```

## Security

```text
[ ] no secret in Git
[ ] no secret in frontend
[ ] auth protected
[ ] user-level access protected
[ ] validation
[ ] CORS
[ ] safe errors
```

## Deployment

```text
[ ] frontend live
[ ] backend live
[ ] database live
[ ] auth live
[ ] AI live
[ ] vectors live
[ ] production investigation works
```

## Documentation

```text
[ ] README
[ ] architecture
[ ] user flow
[ ] corpus explanation
[ ] investigation explanation
[ ] A/B/C
[ ] screenshots
[ ] demo script
[ ] deployment notes
```

---

# 23. TEAMMATE CHECKPOINT PROTOCOL

After every stable phase:

## Lead

```text
1. Implement
2. Test
3. Review diff
4. Commit/push
5. Update CURRENT_PHASE.md
6. Tell QA
7. Tell Docs
8. Continue unless they find a blocking issue
```

## QA teammate

```text
1. Pull latest main
2. Run QA agent
3. Test current phase
4. Record failures
5. Create tests/fixtures/QA report
6. Commit real QA work
7. PR
8. Retest after Lead fix
```

## Product/Docs teammate

```text
1. Pull latest main
2. Run docs agent
3. Inspect actual implementation
4. Update docs/screenshots/demo
5. Commit real documentation work
6. PR
```

The repository implementation roadmap uses this checkpoint model: Lead implements and pushes stable checkpoints, QA validates them, and Product/Docs updates material from the actual implementation. fileciteturn6file0

---

# 24. WHAT SHOULD MAKE YOU STOP AND FIX BEFORE MOVING ON?

Treat these as blockers:

```text
authentication failure
data corruption
wrong evidence/document linkage
follow-up search absent
A/B/C failure
false causal conclusion
false exact-match conclusion
contradiction hidden
insufficient evidence not supported
unauthorized data path
credential exposure
production deployment cannot run core investigation
```

Do not block progress for every cosmetic issue.

---

# 25. WHAT NOT TO DO DURING THE 24 HOURS

Do not:

- rebuild the architecture repeatedly
- switch databases without a critical reason
- replace Supabase midway
- add a second vector database
- add a second auth system
- switch LLM strategy because of agent preference
- rewrite working modules unnecessarily
- polish UI before A/B/C works
- create massive abstractions with no immediate value
- hardcode final answers to A/B/C
- fabricate evidence
- claim completion without tests
- commit secrets
- spend hours making every teammate edit the same files
- optimize for source-code volume instead of product quality

---

# 26. WHEN A BUG APPEARS

Use this decision process:

```text
Bug appears
   ↓
Is it a local/test/config problem?
   ├── YES → fix narrowly
   └── NO
        ↓
Is it a core implementation issue?
        ↓
Reproduce
        ↓
Identify smallest safe fix
        ↓
Fix
        ↓
Focused tests
        ↓
Regression
        ↓
Re-run affected acceptance test
```

Do not immediately refactor the whole module.

---

# 27. EMERGENCY DEBUGGING MASTER PROMPT

Use this with any AI coding agent when you are stuck:

```text
You are debugging IncidentIQ with me as the Lead Developer.

First read:
- AGENTS.md
- ARCHITECTURE.md
- IMPLEMENTATION.md
- CURRENT_PHASE.md

Do not redesign the project.

My current phase:
[PHASE]

My goal:
[TASK]

Exact error:
[PASTE ERROR]

Command/action:
[PASTE COMMAND]

Expected behavior:
[EXPECTED]

Actual behavior:
[ACTUAL]

Relevant files:
[FILE PATHS]

Recent changes:
[RECENT CHANGES]

Please:
1. Inspect the relevant files before proposing a fix.
2. Diagnose the most likely root cause.
3. Explain the issue simply.
4. Propose the smallest safe fix.
5. Do not change unrelated architecture.
6. Preserve evidence semantics.
7. Preserve existing passing tests.
8. Show exact code/file changes.
9. Show exact verification commands.
10. Tell me what could regress.
11. Do not fabricate project behavior.

After the fix:
- run focused tests
- run relevant regression tests
- report exact results
- report remaining risks
```

---

# 28. HOW TO ASK AN AGENT TO IMPLEMENT A PHASE

Use this structure:

```text
Read project control files first.

Current phase:
PHASE X

Goal:
[ONE SENTENCE]

Required features:
[FEATURES]

Do not:
[OUT OF SCOPE]

Acceptance criteria:
[CHECKLIST]

Implementation constraints:
[STACK + ARCHITECTURE RULES]

Verification:
[TESTS]

Finish by:
- showing changed files
- running tests
- updating CURRENT_PHASE.md
- listing remaining risks
- not claiming completion without evidence
```

This is safer than:

> "Build Phase 4 completely."

---

# 29. HOW TO KEEP THE 24-HOUR SPRINT UNDER CONTROL

## Priority 1 — Core correctness

```text
Phase 0
Phase 1
Phase 2
Phase 3
Phase 4
Phase 5
```

## Priority 2 — Judge comprehension

```text
Phase 6
```

## Priority 3 — Release safety

```text
Phase 7
Phase 8
Phase 9
```

Do not swap this priority order because of cosmetic pressure.

---

# 30. PRACTICAL "IF WE ARE RUNNING OUT OF TIME" RULE

If the sprint is behind schedule:

## Protect these first

```text
1. working corpus
2. retrieval
3. investigation loop
4. A/B/C correctness
5. evidence traceability
6. authentication
7. deployable end-to-end flow
```

## Simplify before sacrificing

```text
advanced visualization
extra document types
optional features
non-essential animations
secondary dashboards
```

Never sacrifice:

```text
evidence correctness
A/B/C
auth/security
end-to-end deployment
```

---

# 31. FINAL EVALUATOR EXPLANATION

Memorize this:

> **"IncidentIQ investigates operational software incidents inside an organization's internal evidence corpus. The company has incident reports, deployments, troubleshooting guides, architecture documents and postmortems spread across many documents. An engineer asks a natural-language question. IncidentIQ retrieves evidence, learns from what it finds, performs follow-up searches, connects evidence across document types, checks dates and software versions, detects contradictions, compares historical incidents, and produces an evidence-backed conclusion with source document IDs. When the evidence is not sufficient, it explicitly says so."**

---

# 32. IF THE EVALUATOR ASKS "HOW IS THIS CONNECTED TO COMPANY DOCUMENTS?"

Answer:

> **"The operational documents are ingested into our evidence layer. We validate their metadata, split the text into searchable chunks, generate embeddings, and store the documents/chunks/vectors in Supabase/PostgreSQL with pgvector. When an engineer asks a question, IncidentIQ retrieves from this connected operational evidence corpus and investigates the evidence it finds."**

For the hackathon, our controlled corpus is the practical implementation of that evidence layer.

---

# 33. IF THE EVALUATOR ASKS "IS THIS JUST RAG?"

Answer:

> **"No. Traditional RAG retrieves evidence for the initial question and generates an answer. IncidentIQ performs an investigation loop: it retrieves evidence, extracts what it learned, uses those discoveries to perform follow-up searches, connects multiple documents, compares dates and versions, surfaces contradictions, compares historical incidents, and can conclude that evidence is insufficient."**

---

# 34. IF THE EVALUATOR ASKS "WHY SHOULD I TRUST THE ANSWER?"

Answer:

> **"Important conclusions are tied to evidence and document IDs. Metadata such as dates, versions and service context are handled explicitly. Contradictions are surfaced instead of silently merged, temporal association is not treated as automatic causation, and the system can return insufficient evidence instead of inventing a conclusion."**

---

# 35. FINAL LEAD DEFINITION OF DONE

You are done only when:

```text
[ ] The integrated application works locally
[ ] The evidence corpus is real and searchable
[ ] Natural-language investigation works
[ ] Multi-document retrieval works
[ ] Follow-up searches work
[ ] Investigation state works
[ ] Evidence is traceable
[ ] Dates/versions work
[ ] Contradictions work
[ ] Historical comparison works
[ ] Insufficient evidence works
[ ] A/B/C pass
[ ] UI explains investigation
[ ] Auth/security are acceptable
[ ] Production deployment works
[ ] Full E2E passes
[ ] README/docs/demo are complete
[ ] No known critical blocker remains
[ ] Repository is frozen for submission
```

---

# 36. FINAL MENTAL MODEL FOR YOU AS LEAD

Always think:

```text
          ┌─────────────────────────┐
          │  INTERNAL EVIDENCE      │
          │  CORPUS                 │
          └────────────┬────────────┘
                       ↓
              ┌─────────────────┐
              │    RETRIEVAL    │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │  INVESTIGATION  │
              │      LOOP       │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │     EVIDENCE    │
              │ + RELATIONSHIPS │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │    REASONING    │
              └────────┬────────┘
                       ↓
              ┌─────────────────┐
              │   CONCLUSION    │
              │ + SOURCES       │
              │ + UNCERTAINTY   │
              └─────────────────┘
```

The Lead's job is to make every box real, connected, tested, and demonstrable.

---

# END — INCIDENTIQ LEAD MASTER WORKFLOW
