# IncidentIQ — Product / Documentation Teammate Guide

## Role
You are the Product/Documentation contributor.

Use the documentation agent to create and maintain documentation and demo assets. Do not manually build the core application.

## Primary Ownership
- README
- product documentation
- architecture documentation
- user guide
- API documentation
- A/B/C explanation
- screenshots
- demo script/checklist
- architecture visuals
- presentation support

## When to Work
Prepare document structure while the lead builds.

After each usable checkpoint:
- pull latest main
- inspect actual implementation
- update documentation for that checkpoint
- prepare or update demo material

Do not document features that do not exist.

## Startup

```bash
git clone <REPOSITORY_URL>
cd incidentiq
```

Read:
- `AGENTS.md`
- `ARCHITECTURE.md`
- `IMPLEMENTATION.md`
- `CURRENT_PHASE.md`
- `TEAMMATE_DOCS_GUIDE.md`

Create a branch:

```bash
git fetch origin
git switch main
git pull origin main
git switch -c docs/<phase>
```

## Agent Prompt
Use `DOCS_AGENT_PROMPT.md` with the current phase.

## Documentation Priorities
- product problem/solution
- actual architecture
- agent workflow
- evidence model
- A/B/C behavior
- setup/deployment
- demo steps
- screenshots

## Commit

After reviewing the agent's changes:

```bash
git status
git diff
git add docs/ demo/ README.md
git commit -m "Document <phase> and update demo assets"
git push -u origin docs/<phase>
```

Create a PR to `main`.

Do not create fake/empty commits.

## Success
A reviewer should understand what IncidentIQ does, how it works, how evidence is handled, and how to demo it without needing the lead developer to explain every file.
