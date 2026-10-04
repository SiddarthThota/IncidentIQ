# IncidentIQ — Revised Team Workflow

## Decision
IncidentIQ uses a **Lead-First Integrated Build** model.

The Team Leader owns the complete integrated application and performs the core implementation primarily through Antigravity.

The two co-hackers contribute in controlled, low-risk areas after meaningful checkpoints rather than independently building core application modules.

## Team Roles

### Lead — Siddarth
Owns:
- complete core implementation
- integration
- AI/agent
- retrieval
- backend
- frontend
- database
- authentication
- deployment
- final integration and release decisions

### Co-Hacker 1 — QA
Owns:
- test plan
- fixtures
- regression tests
- A/B/C acceptance tests
- API/browser QA
- bug reproduction
- final release validation

### Co-Hacker 2 — Product/Documentation
Owns:
- README
- product documentation
- architecture documentation
- demo script
- screenshots
- architecture visuals
- presentation/demo support
- final submission materials

## When Teammates Become Active
They do **not** wait until the entire project is complete.

They also do **not** modify core application code during the lead's initial build.

Use:

```text
Lead builds Phase N
        |
        v
Phase N reaches usable checkpoint
        |
        +--------------------+
        |                    |
        v                    v
QA agent works          Docs agent works
        |                    |
        +---------+----------+
                  |
                  v
            Findings/updates
                  |
                  v
        Lead fixes integration blockers
                  |
                  v
             Phase stable
```

The lead may prepare the next phase while QA/docs work on the released checkpoint.

## Timing Model

### 0–25% of sprint
Lead:
- foundation
- architecture implementation
- first product slice

QA:
- prepare test plan/fixtures

Docs:
- prepare README/docs skeleton

### 25–70%
Lead:
- core implementation
- retrieval
- investigation agent
- reasoning

QA:
- test stable checkpoints
- report bugs

Docs:
- document confirmed features
- prepare demo assets

### 70–90%
Lead:
- integration
- hardening
- UI polish
- deployment

QA:
- full A/B/C regression
- browser/E2E testing

Docs:
- screenshots
- architecture visualization
- README
- demo script

### 90–100%
All:
- release validation
- demo
- submission
- freeze

## Git Model
One repository:

```text
https://github.com/SiddarthThota/IncidentIQ
```

Stable branch:

```text
main
```

Lead:
```text
feature/*
fix/*
```

QA:
```text
qa/*
```

Docs:
```text
docs/*
```

All contributions must be genuine and useful. Do not create empty or fake commits.

## Pull Request Flow

```text
Teammate
  ↓
pull latest main
  ↓
focused role work
  ↓
agent implements/checks
  ↓
human reviews diff
  ↓
commit
  ↓
push branch
  ↓
PR
  ↓
Lead reviews
  ↓
targeted regression
  ↓
merge
```

## Key Principle
The objective is not equal source-code volume from every teammate. The objective is a strong product with genuine contributions from all three members.
