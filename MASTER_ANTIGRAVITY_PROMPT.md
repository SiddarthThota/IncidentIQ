# IncidentIQ — MASTER ANTIGRAVITY IMPLEMENTATION PROMPT

## ROLE

You are the primary implementation agent for the IncidentIQ hackathon project.

The human operator is the Lead Developer and Integration Owner.

Your job is to build the complete IncidentIQ product end-to-end in this repository during the permitted hackathon implementation window.

## READ FIRST

Before making implementation changes, inspect:

1. `AGENTS.md`
2. `ARCHITECTURE.md`
3. `IMPLEMENTATION.md`
4. `CURRENT_PHASE.md`

Treat:
- `AGENTS.md` as mandatory rules.
- `ARCHITECTURE.md` as the approved technical blueprint.
- `IMPLEMENTATION.md` as the execution roadmap.
- `CURRENT_PHASE.md` as the current checkpoint.
- Actual source code, tests, and runtime behavior as implementation truth.

Do not invent a different architecture merely because another approach is fashionable.

---

# 1. PRODUCT OBJECTIVE

Build a professional AI-powered Incident Investigation and Evidence Intelligence platform.

A user should be able to:

1. authenticate
2. access a dashboard
3. ask a natural-language operational incident question
4. start an investigation
5. see investigation progress
6. see evidence discovered across multiple documents
7. see evidence-driven follow-up searches
8. see date/version reasoning
9. see contradictory guidance surfaced
10. compare historical incidents
11. see when evidence is insufficient
12. inspect document identifiers/evidence
13. view investigation history
14. use the deployed application end-to-end

The product must not behave like a simple ChatGPT clone.

---

# 2. APPROVED STACK

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- React Router
- TanStack Query

Backend:
- Python
- FastAPI
- Pydantic
- Uvicorn

AI:
- Cloud LLM API
- Embedding API/model
- structured outputs where useful
- bounded investigation workflow

Data/Auth:
- Supabase
- PostgreSQL
- pgvector
- Supabase Auth
- Row Level Security

Deployment:
- Vercel or equivalent for frontend
- Railway or Render for backend
- Supabase hosted services

Ollama is NOT part of the runtime architecture.

Do not introduce another primary vector database, auth provider, or runtime LLM without explicit approval.

---

# 3. LEAD-FIRST DEVELOPMENT MODEL

The Lead owns the core integrated application.

Core implementation includes:
- frontend
- backend
- AI/agent
- retrieval
- database
- authentication
- evidence model
- reasoning
- deployment

The two teammates contribute through controlled role agents:

QA teammate:
- tests
- fixtures
- regression
- A/B/C validation
- browser/E2E QA
- bug reproduction

Product/Docs teammate:
- README
- documentation
- screenshots
- architecture docs
- demo assets
- presentation support

Do not let role agents casually rewrite core modules.

---

# 4. ENGINEERING RULES

## Evidence first
Every important conclusion must be traceable to real evidence/document identifiers.

## Temporal association is not causation
A deployment preceding an incident does not prove the deployment caused it without supporting evidence.

## Similar is not exact
High semantic similarity is not enough to establish an identical historical incident.

Compare available:
- service
- symptom/failure type
- cause
- version
- context

## Insufficient evidence
When evidence does not establish the requested claim, return an explicit insufficient-evidence result.

## Contradictions
Do not silently merge conflicting guidance. Compare:
- subject
- action
- condition/context
- date
- version
- applicability

---

# 5. DETERMINISTIC VS LLM RESPONSIBILITIES

Prefer deterministic implementation for:
- IDs
- metadata filtering
- dates
- version comparison where practical
- evidence linkage
- event/state bookkeeping
- authorization
- API validation
- execution limits

Use the LLM for:
- natural-language understanding
- decomposition
- claim extraction
- semantic interpretation
- follow-up query generation
- explanation generation

Do not use the LLM where deterministic code can enforce the rule safely.

---

# 6. INVESTIGATION FLOW

Implement:

```text
Question
  ↓
Analyze
  ↓
Entities + Subquestions
  ↓
Initial Retrieval
  ↓
Evidence Extraction
  ↓
State Update
  ↓
Open Questions?
  ├── Yes → Follow-up Search → State Update
  └── No  → Reasoning
                   ↓
          dates / versions
          contradictions
          historical comparison
          evidence sufficiency
                   ↓
             Conclusion
                   ↓
              Frontend
```

Bound execution with:
- maximum iterations
- maximum documents
- timeout
- retry limits

Every follow-up search must have a discoverable reason.

---

# 7. RETRIEVAL

Use hybrid retrieval:

```text
Query
 ├── semantic retrieval
 ├── metadata filters
 └── lexical fallback where useful
          ↓
      merge/rank
          ↓
      top evidence
```

Useful metadata:
- document_id
- type
- service
- date
- version
- title

Do not over-fetch irrelevant content.

---

# 8. DOCUMENT PIPELINE

```text
Raw Document
    ↓
Validate metadata
    ↓
Store document
    ↓
Chunk text
    ↓
Generate embedding
    ↓
Store chunk + vector
```

Use Supabase/PostgreSQL/pgvector.

---

# 9. DATABASE

Use the approved core model:

- profiles
- documents
- document_chunks
- investigations
- investigation_documents
- investigation_events
- evidence_claims

Preserve ownership and access control.

Use RLS appropriately.

Never expose privileged Supabase credentials in the frontend.

---

# 10. API CONTRACT

Initial endpoints:

```text
GET  /health

POST /api/investigations
GET  /api/investigations
GET  /api/investigations/{id}
GET  /api/investigations/{id}/events
GET  /api/investigations/{id}/evidence

GET  /api/documents
GET  /api/documents/{document_id}
```

Avoid casual breaking changes.

Update tests and documentation if a deliberate contract change is necessary.

---

# 11. FRONTEND

Build an enterprise-style investigation console.

Required qualities:
- professional
- modern
- clean
- responsive
- accessible
- evidence-centric
- strong hierarchy
- clear primary actions
- useful loading/empty/error states

Pages:
1. Login
2. Dashboard
3. New Investigation
4. Investigation Detail
5. Documents
6. Investigation History
7. Settings/Profile

The visual design may evolve during implementation.

A reference screenshot supplied by the human operator should guide visual direction without changing the functional architecture.

---

# 12. VISUALIZATION

Use meaningful visualizations where they improve understanding:

### Investigation timeline
Show searches, documents, discoveries, follow-ups, reasoning and completion.

### Evidence relationships
Show relationships such as:
`Incident → Deployment → Historical Evidence`

### Contradiction comparison
Show older vs newer guidance with dates/versions/context.

### Historical comparison
Show:
- exact
- similar
- unrelated
- insufficient

### Evidence cards
Show document ID, source context and the role of the evidence.

Do not add visualizations merely for decoration.

---

# 13. TEST A

Connect:
- incident
- affected version
- deployment
- historical evidence

The agent should:
- find the incident
- discover the version
- search relevant deployment evidence
- search history
- explain supported relationships

Never convert temporal order into proven causation.

---

# 14. TEST B

For conflicting guidance:

1. retrieve relevant documents
2. extract recommendations
3. compare subject
4. compare action
5. compare conditions/context
6. compare dates/versions
7. detect contradiction
8. explain the conflict
9. identify newer/applicable guidance when supported

Never silently merge contradictory recommendations.

---

# 15. TEST C

For historical incident analysis:

1. retrieve candidates
2. compare service
3. compare symptom/failure type
4. compare cause
5. compare version/context
6. classify exact/similar/unrelated/insufficient
7. avoid unsupported exact-match claims

Insufficient evidence is a valid outcome.

---

# 16. STRUCTURED RESULT

Prefer a structured internal result like:

```json
{
  "conclusion": "...",
  "confidence": "...",
  "key_findings": [
    {
      "statement": "...",
      "evidence_ids": ["..."],
      "classification": "DIRECT"
    }
  ],
  "historical_analysis": {
    "status": "SIMILAR_NOT_EXACT",
    "document_ids": ["..."]
  },
  "contradictions": [],
  "uncertainty": []
}
```

Do not lose evidence provenance when composing the final answer.

---

# 17. IMPLEMENTATION PHASES

## Phase 0 — Foundation
- frontend shell
- backend shell
- environment configuration
- Supabase connection
- AI connection
- `/health`
- basic frontend/backend communication

Gate:
- frontend runs
- backend runs
- health works
- basic communication works

## Phase 1 — UI + Authentication
- login/logout
- protected routes
- dashboard
- navigation
- new investigation
- history
- responsive layout

Gate:
- auth works
- navigation works
- usable professional UI

## Phase 2 — Document Intelligence
- schema/migrations
- ingestion
- metadata
- chunking
- embeddings
- pgvector
- document APIs

Gate:
- documents ingest
- chunks persist
- vectors persist
- document detail works

## Phase 3 — Hybrid Retrieval
- semantic search
- metadata filters
- ranking/top-k
- lexical fallback if needed
- no-result state

Gate:
- semantic matches
- service/date/version/type filtering
- no-result behavior

## Phase 4 — Investigation Agent
- question analysis
- subquestions
- investigation state
- evidence extraction
- follow-up search
- bounded loop
- event logging
- persistence
- structured response

Gate:
- follow-up search works
- evidence is linked
- state is persisted
- bounded execution works

## Phase 5 — Advanced Reasoning
- dates
- versions
- contradictions
- historical comparison
- insufficiency

Gate:
- A PASS
- B PASS
- C PASS

Do not sacrifice this phase for optional polish.

## Phase 6 — Explainability + Visual Polish
- evidence cards
- investigation timeline
- contradiction visualization
- historical comparison
- progress state
- responsive polish

Gate:
A judge can understand why the result was produced.

## Phase 7 — Security + Hardening
- auth validation
- RLS
- CORS
- secret handling
- timeout/retry
- graceful errors
- user-level access

## Phase 8 — Deployment
- frontend
- backend
- production Supabase
- AI credentials
- CORS/API URL
- production health

Gate:
The deployed investigation flow works end-to-end.

## Phase 9 — Final E2E + Freeze
Run:

```text
Login
→ Dashboard
→ New Investigation
→ Question
→ Investigation
→ Retrieval
→ Follow-up Search
→ Evidence
→ Reasoning
→ Conclusion
→ History
→ Logout
```

Then verify:
- A
- B
- C
- frontend build
- backend startup
- deployed health
- browser errors
- API errors
- README
- documentation
- demo assets

After stable final build:
- no major refactors
- no framework changes
- no provider changes
- no unnecessary features
- only targeted bug fixes

---

# 18. CHECKPOINT PROTOCOL

At each stable phase:

1. run focused tests
2. run relevant regression
3. update `CURRENT_PHASE.md`
4. inspect `git diff`
5. commit the stable implementation
6. push to `main`
7. notify teammates

After notification:
- QA pulls the latest `main`
- Docs pulls the latest `main`
- their agents perform role work
- lead fixes core blockers
- teammate PRs are reviewed and merged

The lead may prepare the next phase while teammates test/document the released phase.

---

# 19. GIT

`main` is the stable integration branch.

Lead branches:
- `feature/*`
- `fix/*`

QA:
- `qa/*`

Docs:
- `docs/*`

Before work:

```bash
git status
git fetch origin
git switch main
git pull origin main
```

Before commit:

```bash
git status
git diff
```

Never:
- commit secrets
- commit `.env`
- force-push without approval
- create fake/empty commits
- overwrite teammate work without inspection

---

# 20. ERROR RECOVERY

When something fails:

1. isolate the smallest reproducible failure
2. inspect logs/output
3. identify the actual cause
4. make the smallest safe fix
5. rerun focused tests
6. rerun regression
7. continue

Do not rewrite the whole architecture to fix a local issue.

If an external service fails:
- give the user a graceful error
- preserve data/investigation state
- report the blocker

---

# 21. PERFORMANCE

The demo should feel responsive.

Use:
- bounded retrieval
- limited investigation iterations
- small relevant context
- parallelize independent retrieval where safe
- caching where useful
- visible progress

Do not sacrifice evidence quality just to reduce latency.

---

# 22. FINAL QUALITY BAR

Do not report "perfect" simply because code was generated.

A feature is done only when:
- implemented
- integrated
- tested
- exercised in the real application where relevant
- documented where appropriate
- no known regression

Final target:

**polished + reliable + evidence-backed + deployable + demo-ready**
