# IncidentIQ — ANTIGRAVITY SETUP

## Repository

GitHub:

`https://github.com/SiddarthThota/IncidentIQ`

Local repository:

`C:\Users\sidar\OneDrive\Desktop\IncidentIQ`

Open the **IncidentIQ repository root** in Antigravity.

Do NOT open:
- `C:\Users\sidar`
- `Desktop`
- `IncidentIQ-Planning`

as the implementation workspace.

## Before the Hackathon

Prepare:
- GitHub access for all three teammates
- Antigravity login
- Supabase account
- OpenAI account/access
- deployment accounts as needed
- planning documents

Do NOT pre-build the actual application if that conflicts with the event's implementation-window rules.

## Repository Planning Files

At the appropriate time, the repository should contain:

```text
AGENTS.md
ARCHITECTURE.md
IMPLEMENTATION.md
CURRENT_PHASE.md
TEAM_WORKFLOW.md
TEAMMATE_QA_GUIDE.md
QA_AGENT_PROMPT.md
TEAMMATE_DOCS_GUIDE.md
DOCS_AGENT_PROMPT.md
MASTER_ANTIGRAVITY_PROMPT.md
ANTIGRAVITY_SETUP.md
```

Custom agent definitions:

```text
.agents/
└── agents/
    ├── incidentiq-qa-engineer.md
    └── incidentiq-product-docs.md
```

## Antigravity Commands

### `/plan`
Use at the start of the actual implementation.

Purpose:
- inspect workspace
- discover requirements
- produce implementation plan
- allow human review before execution

### `/agents`
Open Agent Manager for custom agents/subagents.

### `/goal`
Use only for a narrow repair/verification objective. Do not use it to blindly build the entire application.

## Start Sequence

When the permitted implementation window starts:

1. Open the IncidentIQ repository root.
2. Confirm Git status.
3. Ensure the planning files are available.
4. Configure Supabase.
5. Configure the cloud AI provider.
6. Configure environment variables.
7. Read `AGENTS.md`.
8. Read `ARCHITECTURE.md`.
9. Read `IMPLEMENTATION.md`.
10. Read `CURRENT_PHASE.md`.
11. Run `/plan`.
12. Review the generated plan.
13. Correct deviations from the approved architecture.
14. Start Phase 0.
15. Use checkpoint-based implementation.

## Git Safety

Stable branch:

`main`

Lead controls integration.

Teammate branches:
- `qa/*`
- `docs/*`

Use PRs for teammate contributions.

Do not allow the coding agent to auto-push/merge without explicit human approval.

## Current Phase

The lead updates `CURRENT_PHASE.md` after stable checkpoints so role agents know what is ready.

## Important Architecture Constraint

Ollama is excluded from the runtime architecture.

Archify is optional documentation/demo tooling after the real codebase is stable; it is never a runtime dependency.
