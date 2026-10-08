import asyncio
import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas.document import DocumentCreate
from app.services.ingestion_service import IngestionService
from app.repositories.document_repo import get_document_repo
from app.services.embedding_service import get_embedding_service

DOCUMENTS = [
    {
        "source": "INC-1042",
        "title": "Incident Report: orders-api latency",
        "document_type": "incident_report",
        "service": "orders-api",
        "document_date": "2026-09-16",
        "software_version": "v2.8.1",
        "content": "P95 latency increased significantly on orders-api. The incident began shortly after the latest deployment of v2.8.1."
    },
    {
        "source": "DEP-882",
        "title": "Deployment Note: orders-api",
        "document_type": "deployment_note",
        "service": "orders-api",
        "document_date": "2026-09-15",
        "software_version": "v2.8.1",
        "content": "orders-api v2.8.1 deployed successfully at 18:10 UTC."
    },
    {
        "source": "PM-211",
        "title": "Postmortem: orders-api db saturation",
        "document_type": "postmortem",
        "service": "orders-api",
        "document_date": "2026-05-03",
        "software_version": "v2.6.0",
        "content": "Previous latency incident involving DB connection saturation during schema migration on orders-api v2.6.0."
    },
    {
        "source": "GUIDE-12",
        "title": "Troubleshooting: Service A Latency",
        "document_type": "troubleshooting",
        "service": "Service A",
        "document_date": "2024-02-01",
        "software_version": "v1",
        "content": "If latency remains high, restart Service A to clear saturated connections."
    },
    {
        "source": "GUIDE-41",
        "title": "Troubleshooting: Service A Dependencies",
        "document_type": "troubleshooting",
        "service": "Service A",
        "document_date": "2026-08-10",
        "software_version": "v3",
        "content": "Do NOT restart Service A during dependency failures. Check dependency health first, as restarting will only cause thundering herd."
    },
    {
        "source": "INC-300",
        "title": "Incident Report: catalog-api db",
        "document_type": "incident_report",
        "service": "catalog-api",
        "document_date": "2026-07-11",
        "software_version": "v5",
        "content": "catalog-api experienced severe latency due to database saturation."
    },
    {
        "source": "INC-301",
        "title": "Incident Report: orders-api cert",
        "document_type": "incident_report",
        "service": "orders-api",
        "document_date": "2026-07-12",
        "software_version": "v4",
        "content": "order errors caused by an expired TLS certificate connecting to the payment gateway."
    }
]

def seed_corpus():
    repo = get_document_repo()
    embedding_service = get_embedding_service()
    ingestion_service = IngestionService(repo, embedding_service)
    
    print("Starting controlled corpus seeding...")
    for doc_data in DOCUMENTS:
        doc = DocumentCreate(**doc_data)
        try:
            result = ingestion_service.ingest_document(doc)
            print(f"[{doc.source}] Status: {result.status} | Chunks: {result.chunks_created}")
        except Exception as e:
            print(f"[{doc.source}] Error: {e}")

if __name__ == "__main__":
    seed_corpus()
