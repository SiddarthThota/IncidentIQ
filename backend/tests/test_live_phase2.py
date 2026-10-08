"""
Phase 2 Live Verification — pytest test suite
===============================================
Runs against the REAL Supabase environment configured in backend/.env

IMPORTANT: Run this file IN ISOLATION from the unit tests to avoid
env-var contamination from test_foundation.py which sets dummy values.

Run with:
  $env:PYTHONPATH="."; .\\venv\\Scripts\\python.exe -m pytest tests/test_live_phase2.py -v -s --tb=short

This test WILL:
- Make real calls to Supabase (uses SUPABASE_SECRET_KEY)
- Make real Gemini embedding API calls (uses GEMINI_API_KEY)
- Seed the 7 required corpus documents (idempotent — duplicates are skipped)
- Verify chunks and vector dimensionality
- Test duplicate handling
"""

import os
import re
import json
import urllib.request
import urllib.error
import pytest
from uuid import UUID

# ── ENSURE REAL CREDENTIALS ARE LOADED ───────────────────────────────────────
@pytest.fixture(scope="module", autouse=True)
def setup_real_credentials():
    _DUMMY_URL = "dummy.supabase.co"
    if os.environ.get("SUPABASE_URL", "").endswith(_DUMMY_URL):
        del os.environ["SUPABASE_URL"]
    if os.environ.get("SUPABASE_SECRET_KEY", "") in ("dummy_secret", "dummy"):
        del os.environ["SUPABASE_SECRET_KEY"]
    if os.environ.get("OPENAI_API_KEY", "") in ("dummy_openai", "dummy"):
        del os.environ["OPENAI_API_KEY"]
    if os.environ.get("GEMINI_API_KEY", "") in ("dummy_gemini", "dummy"):
        del os.environ["GEMINI_API_KEY"]
    
    # Reload real credentials into environment and update global settings
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=True)
    
    import app.core.config
    try:
        new_settings = app.core.config.Settings()
        app.core.config.settings = new_settings
        
        # Patch modules that already imported 'settings'
        import app.services.supabase_client
        app.services.supabase_client.settings = new_settings
        
        import app.services.embedding_service
        app.services.embedding_service.settings = new_settings
    except Exception as e:
        print("Warning: could not reload settings", e)


# ── SEED CORPUS DATA ──────────────────────────────────────────────────────────

SEED_DOCUMENTS = [
    {
        "source": "INC-1042",
        "title": "Incident Report: orders-api latency",
        "document_type": "incident_report",
        "service": "orders-api",
        "document_date": "2026-09-16",
        "software_version": "v2.8.1",
        "content": "P95 latency increased significantly on orders-api. The incident began shortly after the latest deployment of v2.8.1.",
    },
    {
        "source": "DEP-882",
        "title": "Deployment Note: orders-api",
        "document_type": "deployment_note",
        "service": "orders-api",
        "document_date": "2026-09-15",
        "software_version": "v2.8.1",
        "content": "orders-api v2.8.1 deployed successfully at 18:10 UTC.",
    },
    {
        "source": "PM-211",
        "title": "Postmortem: orders-api db saturation",
        "document_type": "postmortem",
        "service": "orders-api",
        "document_date": "2026-05-03",
        "software_version": "v2.6.0",
        "content": "Previous latency incident involving DB connection saturation during schema migration on orders-api v2.6.0.",
    },
    {
        "source": "GUIDE-12",
        "title": "Troubleshooting: Service A Latency",
        "document_type": "troubleshooting",
        "service": "Service A",
        "document_date": "2024-02-01",
        "software_version": "v1",
        "content": "If latency remains high, restart Service A to clear saturated connections.",
    },
    {
        "source": "GUIDE-41",
        "title": "Troubleshooting: Service A Dependencies",
        "document_type": "troubleshooting",
        "service": "Service A",
        "document_date": "2026-08-10",
        "software_version": "v3",
        "content": "Do NOT restart Service A during dependency failures. Check dependency health first, as restarting will only cause thundering herd.",
    },
    {
        "source": "INC-300",
        "title": "Incident Report: catalog-api db",
        "document_type": "incident_report",
        "service": "catalog-api",
        "document_date": "2026-07-11",
        "software_version": "v5",
        "content": "catalog-api experienced severe latency due to database saturation.",
    },
    {
        "source": "INC-301",
        "title": "Incident Report: orders-api cert",
        "document_type": "incident_report",
        "service": "orders-api",
        "document_date": "2026-07-12",
        "software_version": "v4",
        "content": "order errors caused by an expired TLS certificate connecting to the payment gateway.",
    },
]

REQUIRED_SOURCES = [d["source"] for d in SEED_DOCUMENTS]

# Module-level cache for document IDs populated during seed tests
_seeded_ids: dict = {}


# ── FIXTURES ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def supabase_client():
    """Real Supabase client using service-role key from .env"""
    from app.services.supabase_client import get_supabase_client
    return get_supabase_client()


@pytest.fixture(scope="module")
def document_repo():
    from app.repositories.document_repo import get_document_repo
    return get_document_repo()


@pytest.fixture(scope="module")
def ingestion_service():
    from app.repositories.document_repo import get_document_repo
    from app.services.embedding_service import get_embedding_service
    from app.services.ingestion_service import IngestionService
    repo = get_document_repo()
    embeddings = get_embedding_service()
    return IngestionService(repo, embeddings)


# ── 1. SUPABASE CONNECTION ────────────────────────────────────────────────────

class TestSupabaseConnection:
    def test_client_initialises(self, supabase_client):
        """Supabase client must initialise without error using real credentials"""
        assert supabase_client is not None

    def test_can_query_documents_table(self, supabase_client):
        """documents table must exist and be queryable"""
        resp = supabase_client.table("documents").select("id").limit(1).execute()
        assert isinstance(resp.data, list)

    def test_can_query_document_chunks_table(self, supabase_client):
        """document_chunks table must exist and be queryable"""
        resp = supabase_client.table("document_chunks").select("id").limit(1).execute()
        assert isinstance(resp.data, list)


# ── 2. SCHEMA / MIGRATION VERIFICATION ───────────────────────────────────────

class TestSchemaVerification:
    def test_embedding_column_accessible(self, supabase_client):
        """document_chunks must have embedding (vector) column"""
        resp = supabase_client.table("document_chunks").select("id, embedding").limit(1).execute()
        assert isinstance(resp.data, list)

    def test_chunks_metadata_column_accessible(self, supabase_client):
        """document_chunks must have metadata (jsonb) column"""
        resp = supabase_client.table("document_chunks").select("id, metadata").limit(1).execute()
        assert isinstance(resp.data, list)

    def test_documents_source_unique_constraint(self, document_repo):
        """get_document_by_source must return None for non-existent source"""
        result = document_repo.get_document_by_source("__nonexistent_xyz_99999__")
        assert result is None


# ── 3. RLS VERIFICATION ───────────────────────────────────────────────────────

class TestRLSVerification:
    def test_service_role_bypasses_rls_documents(self, supabase_client):
        """Service-role key bypasses RLS — reads must succeed"""
        resp = supabase_client.table("documents").select("id").limit(5).execute()
        assert isinstance(resp.data, list)

    def test_service_role_bypasses_rls_chunks(self, supabase_client):
        """Service-role key bypasses RLS on chunks"""
        resp = supabase_client.table("document_chunks").select("id").limit(5).execute()
        assert isinstance(resp.data, list)


# ── 4. SEED CORPUS ────────────────────────────────────────────────────────────

class TestSeedCorpus:
    """Seeds all 7 required documents. Idempotent — duplicates return skipped_duplicate."""

    def _seed(self, ingestion_service, doc_data: dict):
        from app.schemas.document import DocumentCreate
        doc = DocumentCreate(**doc_data)
        result = ingestion_service.ingest_document(doc)
        assert result.status in ("success", "skipped_duplicate"), \
            f"Unexpected status for {doc.source}: {result.status}"
        _seeded_ids[doc_data["source"]] = result.document_id
        print(f"  [{doc_data['source']}] status={result.status}, chunks={result.chunks_created}")
        return result

    def test_seed_INC_1042(self, ingestion_service):
        r = self._seed(ingestion_service, SEED_DOCUMENTS[0])
        assert r.document_id is not None

    def test_seed_DEP_882(self, ingestion_service):
        r = self._seed(ingestion_service, SEED_DOCUMENTS[1])
        assert r.document_id is not None

    def test_seed_PM_211(self, ingestion_service):
        r = self._seed(ingestion_service, SEED_DOCUMENTS[2])
        assert r.document_id is not None

    def test_seed_GUIDE_12(self, ingestion_service):
        r = self._seed(ingestion_service, SEED_DOCUMENTS[3])
        assert r.document_id is not None

    def test_seed_GUIDE_41(self, ingestion_service):
        r = self._seed(ingestion_service, SEED_DOCUMENTS[4])
        assert r.document_id is not None

    def test_seed_INC_300(self, ingestion_service):
        r = self._seed(ingestion_service, SEED_DOCUMENTS[5])
        assert r.document_id is not None

    def test_seed_INC_301(self, ingestion_service):
        r = self._seed(ingestion_service, SEED_DOCUMENTS[6])
        assert r.document_id is not None


# ── 5. DB RECORD VERIFICATION ─────────────────────────────────────────────────

class TestDocumentDBRecords:
    def test_all_7_sources_present_in_db(self, document_repo):
        """All 7 required source identifiers must be in the DB"""
        all_docs = document_repo.list_documents(limit=100, offset=0)
        found_sources = {d.source for d in all_docs}
        missing = set(REQUIRED_SOURCES) - found_sources
        assert not missing, f"Missing sources in DB: {missing}"

    @pytest.mark.parametrize("source", REQUIRED_SOURCES)
    def test_source_retrievable_by_source(self, document_repo, source):
        doc = document_repo.get_document_by_source(source)
        assert doc is not None, f"Document {source} not found"
        assert doc.source == source
        _seeded_ids[source] = doc.id  # refresh ID cache


# ── 6. CHUNK VERIFICATION ─────────────────────────────────────────────────────

class TestChunkVerification:
    @pytest.mark.parametrize("source", REQUIRED_SOURCES)
    def test_document_has_at_least_one_chunk(self, document_repo, source):
        doc = document_repo.get_document_by_source(source)
        assert doc is not None
        chunks = document_repo.get_chunks_for_document(doc.id)
        assert len(chunks) > 0, f"No chunks found for {source}"
        print(f"  [{source}] {len(chunks)} chunk(s)")

    def test_total_chunks_across_all_documents(self, document_repo):
        total = 0
        for source in REQUIRED_SOURCES:
            doc = document_repo.get_document_by_source(source)
            if doc:
                total += len(document_repo.get_chunks_for_document(doc.id))
        assert total > 0, f"Expected >0 total chunks, got {total}"
        print(f"\n  Total chunks across all 7 docs: {total}")


# ── 7. EMBEDDING / VECTOR DIMENSIONALITY ──────────────────────────────────────

class TestEmbeddingVerification:
    @pytest.mark.parametrize("source", ["INC-1042", "GUIDE-12", "INC-300"])
    def test_vector_dimensionality_1536(self, document_repo, supabase_client, source):
        """Embeddings must be 1536-dimensional (text-embedding-3-small output)"""
        doc = document_repo.get_document_by_source(source)
        assert doc is not None
        
        # Query db directly since DocumentChunkResponse deliberately excludes embedding payload
        resp = supabase_client.table("document_chunks").select("embedding").eq("document_id", str(doc.id)).limit(1).execute()
        assert resp.data and len(resp.data) > 0, "No chunks found in DB"
        
        embedding_str = resp.data[0].get("embedding")
        assert embedding_str is not None, f"No embedding on first chunk of {source}"
        
        # pgvector returns embedding as a string representation of array e.g., "[0.1, 0.2, ...]"
        import ast
        embedding = ast.literal_eval(embedding_str) if isinstance(embedding_str, str) else embedding_str
        
        assert len(embedding) == 1536, \
            f"Expected 1536-dim vector for {source}, got dim={len(embedding)}"


# ── 8. LIST DOCUMENTS API ─────────────────────────────────────────────────────

class TestListDocumentsAPI:
    def test_list_returns_results(self, document_repo):
        docs = document_repo.list_documents(limit=50, offset=0)
        assert len(docs) > 0

    def test_list_contains_all_required_sources(self, document_repo):
        all_docs = document_repo.list_documents(limit=100, offset=0)
        sources = {d.source for d in all_docs}
        for required in REQUIRED_SOURCES:
            assert required in sources, f"{required} not in listed documents"

    def test_list_respects_limit_param(self, document_repo):
        docs = document_repo.list_documents(limit=3, offset=0)
        assert len(docs) <= 3

    def test_list_respects_offset_param(self, document_repo):
        all_docs = document_repo.list_documents(limit=100, offset=0)
        if len(all_docs) >= 2:
            offset_docs = document_repo.list_documents(limit=100, offset=1)
            assert len(offset_docs) == len(all_docs) - 1


# ── 9. GET DOCUMENT BY ID ─────────────────────────────────────────────────────

class TestGetDocumentByID:
    def test_get_document_by_valid_id(self, document_repo):
        doc = document_repo.get_document_by_source("INC-1042")
        assert doc is not None
        fetched = document_repo.get_document_by_id(doc.id)
        assert fetched is not None
        assert fetched.source == "INC-1042"
        assert fetched.id == doc.id

    def test_get_nonexistent_id_returns_none(self, document_repo):
        from uuid import uuid4
        result = document_repo.get_document_by_id(uuid4())
        assert result is None


# ── 10. DUPLICATE HANDLING ────────────────────────────────────────────────────

class TestDuplicateHandling:
    def test_duplicate_ingest_returns_skipped_duplicate(self, ingestion_service):
        """Re-ingesting INC-1042 must return status=skipped_duplicate, chunks_created=0"""
        from app.schemas.document import DocumentCreate
        dup = DocumentCreate(
            source="INC-1042",
            title="Incident Report: orders-api latency",
            document_type="incident_report",
            service="orders-api",
            document_date="2026-09-16",
            software_version="v2.8.1",
            content="P95 latency increased significantly on orders-api.",
        )
        result = ingestion_service.ingest_document(dup)
        assert result.status == "skipped_duplicate", \
            f"Expected skipped_duplicate, got {result.status}"
        assert result.chunks_created == 0, \
            f"Expected 0 chunks for duplicate, got {result.chunks_created}"

    def test_duplicate_does_not_increase_document_count(self, document_repo, ingestion_service):
        """Total document count must not change after a duplicate ingest"""
        from app.schemas.document import DocumentCreate
        before = len(document_repo.list_documents(limit=200, offset=0))
        dup = DocumentCreate(
            source="DEP-882",
            title="Deployment Note: orders-api",
            document_type="deployment_note",
            service="orders-api",
            document_date="2026-09-15",
            software_version="v2.8.1",
            content="orders-api v2.8.1 deployed successfully at 18:10 UTC.",
        )
        ingestion_service.ingest_document(dup)
        after = len(document_repo.list_documents(limit=200, offset=0))
        assert after == before, \
            f"Document count changed after duplicate ingest: {before} -> {after}"
