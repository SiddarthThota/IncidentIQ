# IncidentIQ — Evaluator Demo & Test Guide

## Purpose

This is the judge-facing guide for demonstrating the IncidentIQ prototype.

## What IncidentIQ Investigates

IncidentIQ investigates **operational/software incidents** inside a distributed engineering environment. It is not a crime-investigation system.

It connects evidence across internal operational documents such as:
- incident reports
- deployment notes
- architecture documents
- troubleshooting guides
- customer complaints
- engineering discussions
- post-incident reviews / postmortems

The challenge requires natural-language investigation, semantic + metadata-aware retrieval, evidence-driven follow-up searches, date/version awareness, contradiction handling, similar-vs-identical distinction, and evidence-backed answers with explicit insufficient-evidence handling.

## Recommended Judge Flow

1. Open the deployed application.
2. Sign in.
3. Open **New Investigation**.
4. Enter one of the challenge questions below.
5. Start the investigation.
6. Observe progress/timeline.
7. Inspect evidence sources.
8. Inspect the reasoning and conclusion.
9. Open evidence/document details.
10. Repeat for A, B, and C.

---

# Test A — Deployment-Related Incident

### User question

> Why did the Order API become slow on September 16? Check whether the deployment was related and whether we have seen this before.

### Documents

#### INC-1042

```json
{
  "document_id": "INC-1042",
  "type": "incident_report",
  "service": "orders-api",
  "date": "2026-09-16",
  "version": "v2.8.1",
  "title": "Order API latency spike",
  "content": "P95 latency increased significantly. The incident began shortly after the latest deployment."
}
```

#### DEP-882

```json
{
  "document_id": "DEP-882",
  "type": "deployment_note",
  "service": "orders-api",
  "date": "2026-09-15",
  "version": "v2.8.1",
  "title": "Orders deployment",
  "content": "Version v2.8.1 was deployed to production at 18:10 UTC."
}
```

#### PM-211

```json
{
  "document_id": "PM-211",
  "type": "postmortem",
  "service": "orders-api",
  "date": "2026-05-03",
  "version": "v2.6.0",
  "title": "Previous latency incident",
  "content": "A previous latency incident was caused by database connection saturation during a schema migration."
}
```

### Expected behavior

Connect:

```text
INC-1042
  ↓
orders-api / v2.8.1
  ↓
DEP-882
  ↓
PM-211
```

The system may establish that the deployment temporally preceded the incident, but it must not claim that the deployment caused the incident unless supporting evidence establishes causation.

It should also explain that PM-211 was a previous latency incident with a different documented cause.

---

# Test B — Contradictory Guidance

### User question

> The service is failing after a deployment. What should the on-call engineer do first?

### Documents

#### GUIDE-12

```json
{
  "document_id": "GUIDE-12",
  "type": "troubleshooting",
  "date": "2024-02-01",
  "version": "v1",
  "title": "Service restart procedure",
  "content": "Restart Service A when latency remains high."
}
```

#### GUIDE-41

```json
{
  "document_id": "GUIDE-41",
  "type": "troubleshooting",
  "date": "2026-08-10",
  "version": "v3",
  "title": "Service A incident procedure",
  "content": "Do not restart Service A during dependency failures. Check dependency health first."
}
```

### Expected behavior

The system should:
1. retrieve both documents
2. detect conflicting recommendations
3. compare conditions/context
4. compare dates/versions
5. avoid silently merging the recommendations
6. explain the newer/applicable guidance when supported

---

# Test C — Insufficient Evidence

### User question

> Did this exact failure happen before?

### Documents

#### INC-300

```json
{
  "document_id": "INC-300",
  "type": "incident_report",
  "service": "catalog-api",
  "date": "2026-07-11",
  "version": "v5",
  "title": "Catalog latency",
  "content": "Latency increased due to database saturation."
}
```

#### INC-301

```json
{
  "document_id": "INC-301",
  "type": "incident_report",
  "service": "orders-api",
  "date": "2026-07-12",
  "version": "v4",
  "title": "Order errors",
  "content": "Requests failed because of an expired certificate."
}
```

### Expected behavior

Do not claim an exact historical match.

Compare:
- service
- symptom/failure type
- cause
- version
- context

The expected behavior is an evidence-limited response such as:

```text
No exact historical match can be established from the available evidence.
The retrieved incidents are materially different.
```

---

# What the Judge Should See

```text
Investigation Question
        ↓
Investigation Progress
        ↓
Evidence Sources
        ↓
Follow-up Searches
        ↓
Reasoning
        ↓
Conclusion
        ↓
Uncertainty / Insufficient Evidence
```

Useful visible elements:
- evidence document IDs
- investigation timeline
- evidence cards
- contradiction comparison
- historical comparison
- confidence/uncertainty

---

# What to Say if Asked "What does this investigate?"

> IncidentIQ investigates operational software incidents inside a distributed engineering environment. It connects incident reports, deployments, troubleshooting procedures, and postmortems to answer multi-document investigation questions. It is not a crime-investigation system.

# What to Say if Asked "Why isn't this just RAG?"

> Traditional RAG retrieves relevant passages for a question. IncidentIQ performs an investigation: it retrieves evidence, tracks what it learned, uses discovered information to perform follow-up searches, connects evidence across document types, checks dates and versions, surfaces contradictions, and can explicitly conclude that the evidence is insufficient.

# What to Say if Asked "How do you reduce hallucination?"

> Important conclusions are tied to evidence/document identifiers. Dates, metadata, evidence links, access control, and investigation state are handled deterministically where practical. The cloud LLM handles language understanding, decomposition, interpretation, follow-up query generation, and explanation. When evidence is insufficient, the system is allowed to say so.

---

# Live Demo Backup

Keep:
- a short demo recording
- screenshots of A/B/C
- the deployed URL
- a local runnable copy when possible

Do not fabricate test results or screenshots.

---

# Submission Materials

Keep ready:
- deployed URL
- GitHub repository
- README
- architecture diagram
- demo script
- evaluator test guide
- screenshots
- required demo/video recording

The official HackVibe 2.O site states that the final submission includes the final GitHub commit, README, and video demonstration.
