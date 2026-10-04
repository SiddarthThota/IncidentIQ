# IncidentIQ — QA Teammate Guide

## Role
You are the QA/testing contributor.

Use the QA agent to implement tests and execute validation. Do not manually build the core application.

## Primary Ownership
- tests
- test-fixtures
- qa reports
- regression
- A/B/C acceptance
- API/browser testing
- bug reproduction
- release validation

## When to Work
Prepare test plans ahead of a checkpoint.

Start executing tests once the lead marks the phase READY FOR QA.

Work throughout the sprint; do not wait for the entire product.

## Startup
Clone once:

```bash
git clone <REPOSITORY_URL>
cd incidentiq
```

Read:
- `AGENTS.md`
- `ARCHITECTURE.md`
- `IMPLEMENTATION.md`
- `CURRENT_PHASE.md`
- `TEAMMATE_QA_GUIDE.md`

Create a focused branch:

```bash
git fetch origin
git switch main
git pull origin main
git switch -c qa/<phase>
```

## Agent Prompt
Give the QA agent the prompt stored in `QA_AGENT_PROMPT.md` and tell it to work on the current phase only.

## Testing Priorities
A:
- incident/version/deployment/history linkage
- temporal vs causal distinction

B:
- conflict detection
- condition/context
- date/version

C:
- exact vs similar
- insufficient evidence

## Bug Reporting
Include:
- title
- environment/commit
- reproduction steps
- expected
- actual
- evidence
- severity

## Commit
After reviewing the agent's work:

```bash
git status
git diff
git add tests/ test-fixtures/ qa/
git commit -m "Add <phase> QA coverage"
git push -u origin qa/<phase>
```

Create a PR to `main`.

Do not create fake/empty commits.

## Success
The QA contribution is successful when it provides reproducible tests, catches real defects, and verifies the final deployed application.
