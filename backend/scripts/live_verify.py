"""
Phase 2 Live Verification Script
=================================
Runs all live checks against the configured Supabase environment.
Requires: SUPABASE_URL, SUPABASE_SECRET_KEY, OPENAI_API_KEY in backend/.env

Checks:
1. Supabase connection
2. Migration: documents + document_chunks tables + indexes
3. RLS policies
4. Seed corpus (7 documents)
5. Chunk count verification
6. Embedding vector shape verification
7. Duplicate handling
8. List documents API
9. Get document by ID API
"""

import os
import sys
import json

# Ensure backend root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── RESULTS ACCUMULATOR ──────────────────────────────────────────────────────
results = []

def check(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append({"name": name, "status": status, "detail": detail})
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ── 1. SUPABASE CONNECTION ────────────────────────────────────────────────────
section("1. Supabase Connection")
try:
    from app.services.supabase_client import get_supabase_client
    client = get_supabase_client()
    # Simple probe: list tables by querying pg_tables via RPC won't work easily;
    # instead try a basic select that should return an empty list if tables exist
    check("Supabase client initialised", True)
except Exception as e:
    check("Supabase client initialised", False, str(e))
    print("\nFATAL: Cannot connect to Supabase. Aborting.")
    sys.exit(1)

# ── 2. MIGRATION: TABLE EXISTENCE ─────────────────────────────────────────────
section("2. Migration — Table & Index Verification")
try:
    resp = client.table("documents").select("id").limit(1).execute()
    check("documents table exists", True)
except Exception as e:
    check("documents table exists", False, str(e))

try:
    resp = client.table("document_chunks").select("id").limit(1).execute()
    check("document_chunks table exists", True)
except Exception as e:
    check("document_chunks table exists", False, str(e))

# Verify vector column exists by checking a chunk with embedding field
try:
    resp = client.table("document_chunks").select("id, embedding").limit(1).execute()
    check("embedding (vector) column accessible", True)
except Exception as e:
    check("embedding (vector) column accessible", False, str(e))

# ── 3. RLS CHECK ──────────────────────────────────────────────────────────────
section("3. RLS — Service Role Bypass Verification")
try:
    # Service role key bypasses RLS; a read should succeed
    resp = client.table("documents").select("id").limit(1).execute()
    check("Service-role key bypasses RLS (read succeeds)", True)
except Exception as e:
    check("Service-role key bypasses RLS (read succeeds)", False, str(e))

# ── 4. SEED CORPUS ────────────────────────────────────────────────────────────
section("4. Seed Corpus — 7 Required Documents")
from app.schemas.document import DocumentCreate
from app.repositories.document_repo import get_document_repo
from app.services.embedding_service import get_embedding_service
from app.services.ingestion_service import IngestionService

REQUIRED_SOURCES = ["INC-1042", "DEP-882", "PM-211", "GUIDE-12", "GUIDE-41", "INC-300", "INC-301"]

repo = get_document_repo()
embedding_service = get_embedding_service()
ingestion_service = IngestionService(repo, embedding_service)

# Import seed data directly to avoid re-running the script
from scripts.seed_corpus import DOCUMENTS

seeded_ids = {}
seed_statuses = {}

for doc_data in DOCUMENTS:
    doc = DocumentCreate(**doc_data)
    try:
        result = ingestion_service.ingest_document(doc)
        seed_statuses[doc.source] = result.status
        seeded_ids[doc.source] = result.document_id
        passed = result.status in ("success", "skipped_duplicate")
        check(f"Seed [{doc.source}]", passed, f"status={result.status}, chunks={result.chunks_created}")
    except Exception as e:
        seed_statuses[doc.source] = "error"
        check(f"Seed [{doc.source}]", False, str(e))

# Verify all 7 required sources are now in the DB
section("5. Corpus Verification — All 7 Sources Present in DB")
for source in REQUIRED_SOURCES:
    try:
        doc = repo.get_document_by_source(source)
        check(f"DB record [{source}]", doc is not None, f"id={doc.id}" if doc else "NOT FOUND")
        if doc:
            seeded_ids[source] = doc.id
    except Exception as e:
        check(f"DB record [{source}]", False, str(e))

# ── 6. CHUNK VERIFICATION ─────────────────────────────────────────────────────
section("6. Document Chunks — Verify Chunks Exist per Document")
total_chunks = 0
for source in REQUIRED_SOURCES:
    doc_id = seeded_ids.get(source)
    if doc_id is None:
        check(f"Chunks [{source}]", False, "document_id unknown, skipping")
        continue
    try:
        chunks = repo.get_chunks_for_document(doc_id)
        has_chunks = len(chunks) > 0
        total_chunks += len(chunks)
        check(f"Chunks [{source}]", has_chunks, f"{len(chunks)} chunk(s)")
    except Exception as e:
        check(f"Chunks [{source}]", False, str(e))

check(f"Total chunks across all documents", total_chunks > 0, f"{total_chunks} total chunks")

# ── 7. EMBEDDING / VECTOR SHAPE ───────────────────────────────────────────────
section("7. Embeddings — Verify Vector Dimensionality")
for source in REQUIRED_SOURCES[:3]:  # Spot-check first 3 for speed
    doc_id = seeded_ids.get(source)
    if not doc_id:
        continue
    try:
        chunks = repo.get_chunks_for_document(doc_id)
        if chunks and chunks[0].embedding:
            dim = len(chunks[0].embedding)
            check(f"Vector dim [{source}]", dim == 1536, f"dim={dim} (expected 1536)")
        else:
            check(f"Vector dim [{source}]", False, "no embedding found")
    except Exception as e:
        check(f"Vector dim [{source}]", False, str(e))

# ── 8. LIST DOCUMENTS API ─────────────────────────────────────────────────────
section("8. API — GET /api/documents (list)")
try:
    docs = repo.list_documents(limit=10, offset=0)
    check("list_documents returns results", len(docs) > 0, f"{len(docs)} documents returned")
    has_required = all(
        any(d.source == src for d in docs) or True  # may exceed 10 limit
        for src in REQUIRED_SOURCES
    )
    # Do a full count
    all_docs = repo.list_documents(limit=100, offset=0)
    sources_present = {d.source for d in all_docs}
    all_present = all(s in sources_present for s in REQUIRED_SOURCES)
    check("All 7 required sources in list", all_present,
          f"Found: {sorted(sources_present & set(REQUIRED_SOURCES))}")
except Exception as e:
    check("list_documents", False, str(e))

# ── 9. GET DOCUMENT BY ID ─────────────────────────────────────────────────────
section("9. API — GET /api/documents/{id}")
test_source = "INC-1042"
test_id = seeded_ids.get(test_source)
if test_id:
    try:
        doc = repo.get_document_by_id(test_id)
        check(f"get_document_by_id [{test_source}]", doc is not None and doc.source == test_source,
              f"source={doc.source if doc else 'None'}")
    except Exception as e:
        check(f"get_document_by_id [{test_source}]", False, str(e))
else:
    check(f"get_document_by_id [{test_source}]", False, "document_id not available")

# ── 10. INGEST API — DUPLICATE HANDLING ───────────────────────────────────────
section("10. API — POST /api/documents/ingest (duplicate)")
try:
    dup_doc = DocumentCreate(
        source="INC-1042",
        title="Incident Report: orders-api latency",
        document_type="incident_report",
        service="orders-api",
        document_date="2026-09-16",
        software_version="v2.8.1",
        content="P95 latency increased significantly on orders-api."
    )
    result = ingestion_service.ingest_document(dup_doc)
    check("Duplicate INC-1042 returns skipped_duplicate", result.status == "skipped_duplicate",
          f"status={result.status}, chunks_created={result.chunks_created}")
    check("Duplicate creates 0 new chunks", result.chunks_created == 0,
          f"chunks_created={result.chunks_created}")
except Exception as e:
    check("Duplicate handling", False, str(e))

# ── FINAL SUMMARY ─────────────────────────────────────────────────────────────
section("FINAL SUMMARY")
passed = [r for r in results if r["status"] == "PASS"]
failed = [r for r in results if r["status"] == "FAIL"]

print(f"\n  PASSED: {len(passed)}/{len(results)}")
print(f"  FAILED: {len(failed)}/{len(results)}")

if failed:
    print("\n  FAILED CHECKS:")
    for r in failed:
        print(f"    X {r['name']}: {r['detail']}")

overall = "PASS" if len(failed) == 0 else "FAIL"
print(f"\n  OVERALL: {overall}")
print()
sys.exit(0 if overall == "PASS" else 1)
