# IncidentIQ — Hackathon Day Runbook

## Purpose

Exact operating sequence for the 24-hour implementation.

## Before the Clock Starts

Have ready:
- GitHub repository and team access
- Antigravity
- Supabase account
- cloud LLM/embedding provider access
- deployment accounts
- planning documents

Do not perform the actual application implementation before the permitted implementation window.

---

# Hour 0 — Start

Open:

```text
C:\Users\sidar\OneDrive\Desktop\IncidentIQ
```

Verify:

```bash
git status
git remote -v
```

If necessary:

```bash
git rev-parse --show-toplevel
```

It must point to the IncidentIQ repository root.

---

# 1. Configure External Services

Create/configure the actual project resources:
- Supabase project
- Supabase Auth
- PostgreSQL
- pgvector
- cloud LLM
- embedding provider

Create local environment variables from `.env.example`.

Never commit `.env`.

---

# 2. Read the Control Files

Before implementation, inspect:

```text
AGENTS.md
ARCHITECTURE.md
IMPLEMENTATION.md
CURRENT_PHASE.md
TEAM_WORKFLOW.md
MASTER_ANTIGRAVITY_PROMPT.md
```

---

# 3. Start with `/plan`

Antigravity's current `/plan` command is designed to inspect the repository, analyze requirements, and create a structured implementation plan for review before execution.

Use:

```text
/plan
```

Then instruct:

> Read AGENTS.md, ARCHITECTURE.md, IMPLEMENTATION.md, CURRENT_PHASE.md, TEAM_WORKFLOW.md, and MASTER_ANTIGRAVITY_PROMPT.md. Create a complete implementation plan for IncidentIQ without changing the approved architecture. Include frontend, backend, Supabase/Auth/PostgreSQL/pgvector, cloud LLM + embeddings, ingestion, hybrid retrieval, iterative investigation, evidence, date/version reasoning, contradiction handling, historical comparison, A/B/C, professional UI/visualization, security, deployment, testing, and acceptance gates. Do not modify application files during planning.

Review the resulting plan before proceeding.

---

# 4. Phase 0 — Prompt to Your Main Agent

Use this exact prompt after the plan is approved:

> Read AGENTS.md, ARCHITECTURE.md, IMPLEMENTATION.md, CURRENT_PHASE.md, and MASTER_ANTIGRAVITY_PROMPT.md. Implement ONLY Phase 0 — Foundation. Build the React/Vite frontend shell, FastAPI backend, environment configuration, Supabase connection, cloud AI connection, GET /health, and basic frontend-to-backend communication. Do not implement later phases yet. Use the approved architecture exactly. After implementation, install only required dependencies, run frontend checks/build, run backend checks, run the health endpoint, verify frontend/backend communication, fix failures, inspect changed files, update CURRENT_PHASE.md to the correct checkpoint state, and report actual verification evidence. Do not commit/push until I review the changes.

---

# 5. Phase Cycle

For every phase:

```text
Implement
  ↓
Focused test
  ↓
Regression test
  ↓
Runtime check
  ↓
Inspect diff
  ↓
Commit
  ↓
Push
  ↓
Notify teammates
```

---

# 6. Lead Git Pattern

Always run Git commands from:

```text
C:\Users\sidar\OneDrive\Desktop\IncidentIQ
```

Before a stable checkpoint:

```bash
git status
git diff
```

Then:

```bash
git add .
git commit -m "Implement <phase name>"
git push origin main
```

---

# 7. Teammate Activation

After you push a stable checkpoint, tell both teammates:

> Phase <N> is ready. Pull the latest main. Read AGENTS.md, ARCHITECTURE.md, IMPLEMENTATION.md, CURRENT_PHASE.md, and your role guide. Use your role agent to perform only the work assigned to your role for this checkpoint. Do not modify unrelated core application logic. Review the agent diff before committing.

### QA teammate

```bash
git fetch origin
git switch main
git pull origin main
git switch -c qa/<phase>
```

Then use the QA agent.

### Documentation teammate

```bash
git fetch origin
git switch main
git pull origin main
git switch -c docs/<phase>
```

Then use the Docs agent.

---

# 8. Lead While Teammates Work

Do not automatically wait.

Continue the next core phase if QA/Docs are not reporting a blocker.

Stop for:
- broken data integrity
- authentication failure
- unusable investigation flow
- incorrect A/B/C behavior
- deployment blocker

Do not stop core development for minor cosmetic issues.

---

# 9. Critical Milestone

Before optional polish:

```text
A PASS
B PASS
C PASS
```

Once A/B/C pass, continue with:
- UI polish
- explainability
- security hardening
- deployment
- final E2E

---

# 10. Final E2E

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

Then test A/B/C against the deployed application.

---

# 11. Final Freeze

Before final submission:

```bash
git status
git diff
git log --oneline -n 10
```

Make only intended final changes.

Stop:
- major refactors
- framework changes
- provider changes
- unnecessary features

Only fix release-blocking bugs.

---

# 12. Final Judge Preparation

Have ready:
- deployed application
- demo dataset
- A/B/C test guide
- GitHub repo
- README
- architecture diagram
- demo recording
- screenshots

Use `EVALUATOR_TEST_GUIDE.md` as the judge-facing guide.
