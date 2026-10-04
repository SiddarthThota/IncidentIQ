# IncidentIQ — AGENTS.md

## Purpose
Permanent rules for all coding agents working in IncidentIQ.

## Instruction Priority
1. User's explicit current instruction
2. `AGENTS.md`
3. `ARCHITECTURE.md`
4. `IMPLEMENTATION.md`
5. `CURRENT_PHASE.md`
6. Existing source code, tests, and runtime evidence
7. Agent preference

## Product
IncidentIQ is an AI-powered Incident Investigation and Evidence Intelligence platform.

It must:
- accept natural-language incident questions
- retrieve evidence using semantic + metadata-aware search
- perform evidence-driven follow-up searches
- reason about dates and versions
- detect contradictory/outdated guidance
- distinguish similar from exact historical incidents
- provide document-backed conclusions
- explicitly state insufficient evidence when appropriate

## Approved Stack
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
- bounded investigation workflow

Data/Auth:
- Supabase
- PostgreSQL
- pgvector
- Supabase Auth
- Row Level Security

Deployment:
- Vercel frontend
- Railway or Render backend
- Supabase hosted services

Ollama is excluded from runtime architecture.

## Lead-First Integration
Siddarth is the primary integration owner.

Core implementation normally belongs to the lead:
- application frontend
- backend
- AI/agent
- retrieval
- database
- authentication
- deployment

QA/docs contributors should not independently rewrite core application modules.

## Evidence Rules
Never invent evidence.

Important conclusions must be traceable to actual evidence/document identifiers.

Temporal association is not causation.

Similar incident is not exact incident.

Insufficient evidence is a valid successful result.

Contradictions must be surfaced.

## Deterministic vs LLM
Prefer deterministic code for:
- IDs
- metadata filters
- date comparisons
- version metadata/comparison where practical
- event/state bookkeeping
- access control
- API validation
- evidence linkage

Use the LLM for:
- language understanding
- decomposition
- claim extraction
- semantic interpretation
- follow-up query generation
- explanation

## Retrieval
Use:
- semantic retrieval
- metadata filters
- lexical fallback where useful
- bounded top-k
- bounded iterations

## Investigation
Maintain explicit state including:
- question
- entities
- subquestions
- facts
- documents
- evidence claims
- relationships
- contradictions
- follow-up queries
- open questions
- status/events

Every follow-up query must be explainable by discovered evidence or an unresolved question.

## Frontend
The UI must be:
- professional
- modern
- responsive
- accessible
- evidence-centric

Useful visualizations:
- investigation timeline
- evidence relationship map
- contradiction comparison
- historical incident comparison
- progress/status

UI visuals may evolve without unnecessarily changing backend contracts.

## Security
Never:
- commit secrets
- expose privileged keys to the frontend
- log credentials
- hard-code API secrets
- bypass authentication/RLS

## Testing
After meaningful changes:
- run focused tests
- run relevant regression
- build affected packages
- exercise runtime behavior where relevant

A feature is not done because code was generated.

## Team
Lead: core implementation/integration.

QA: tests, fixtures, regression, A/B/C, release QA.

Docs: README, documentation, screenshots, architecture/demo assets.

Use branches and PRs. Do not create meaningless commits.

## Git
`main` is the stable integration branch.

Before work:
```bash
git fetch origin
git switch main
git pull origin main
```

Never auto-push/merge without the human operator's explicit approval.

## Agent Behavior
Agents must:
- inspect before editing
- preserve working behavior
- report blockers
- avoid unnecessary package churn
- adapt to the actual repository
- stay within assigned role

## Definition of Done
Implemented + integrated + tested + verified + documented where appropriate + no known regression.
