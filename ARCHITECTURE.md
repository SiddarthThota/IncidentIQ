# IncidentIQ — ARCHITECTURE.md

## Product
IncidentIQ is an AI-powered incident investigation platform that connects operational evidence across internal documents.

## High-Level Runtime

```text
                         USER
                           |
                           v
                 +-------------------+
                 | React Frontend    |
                 | TS + Vite         |
                 +---------+---------+
                           |
                       HTTPS / REST
                           |
                           v
                 +-------------------+
                 | FastAPI Backend   |
                 +---------+---------+
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   Investigation      Retrieval        Persistence/Auth
      Engine            Engine              |
          |                |                v
          |        +-------+-------+      Supabase
          |        |               |      Auth/Postgres
          |        v               v          |
          |    Semantic         Metadata      |
          |     Search           Filters      |
          |        |               |          |
          |        +-------+-------+          |
          |                |                  |
          |                v                  |
          |             pgvector <------------+
          |
          +----------------------+
          |
          v
       Cloud LLM
       + Embeddings
```

## Frontend
Stack:
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide
- React Router
- TanStack Query

Screens:
1. Login
2. Dashboard
3. New Investigation
4. Investigation Detail
5. Documents
6. Investigation History
7. Settings/Profile

## Backend
Stack:
- Python
- FastAPI
- Pydantic
- Uvicorn

Responsibilities:
- API
- investigation orchestration
- retrieval
- evidence state
- reasoning
- persistence
- AI integration
- authorization checks

## Investigation Flow

```text
Question
  ↓
Analyze
  ↓
Entities + Subquestions
  ↓
Initial retrieval
  ↓
Evidence extraction
  ↓
State update
  ↓
Follow-up search if needed
  ↓
Reasoning
  ├─ dates/versions
  ├─ contradictions
  ├─ historical similarity
  └─ evidence sufficiency
  ↓
Structured conclusion
  ↓
Frontend presentation
```

## Retrieval
Hybrid:
- semantic
- metadata
- optional lexical fallback
- bounded ranking/top-k

Metadata:
- document_id
- type
- service
- date
- version
- title

## Document Pipeline

```text
Raw document
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

## Database
Supabase:
- Auth
- PostgreSQL
- pgvector
- RLS

Core tables:
- profiles
- documents
- document_chunks
- investigations
- investigation_documents
- investigation_events
- evidence_claims

## Evidence
Possible classifications:
- DIRECT
- CORROBORATED
- TEMPORAL
- INFERRED
- CONTRADICTED
- INSUFFICIENT

Important claims must preserve document IDs.

## Test A
Connect incident + version + deployment + historical evidence. Distinguish temporal association from proven causation.

## Test B
Detect conflicting guidance and compare subject, action, condition/context, date, version, and applicability.

## Test C
Compare historical incidents across service, symptom, failure type, cause, version, and context. Do not force exactness.

## Frontend Visualization
Use:
- investigation timeline
- evidence relationship map
- contradiction comparison
- historical comparison
- evidence/source cards

## Deployment

```text
Browser
  ↓
Vercel / React
  ↓
Railway/Render / FastAPI
  ├── Supabase Auth/Postgres/pgvector
  └── Cloud LLM + Embeddings
```

Archify is optional post-stabilization documentation/demo tooling, not a runtime dependency.
