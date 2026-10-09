from supabase import Client
from typing import List, Dict, Any, Optional
from datetime import date
from uuid import UUID

from app.services.supabase_client import get_supabase_client

class SearchRepository:
    def __init__(self, client: Client = None):
        self.client = client or get_supabase_client()

    def search_chunks(
        self,
        query_embedding: List[float],
        match_count: int = 10,
        filter_service: Optional[str] = None,
        filter_document_type: Optional[str] = None,
        filter_date_from: Optional[date] = None,
        filter_date_to: Optional[date] = None,
        filter_software_version: Optional[str] = None,
        filter_document_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute the match_document_chunks RPC with the given embedding and filters.
        """
        # Prepare params, excluding None values or converting types if necessary
        params = {
            "query_embedding": query_embedding,
            "match_count": match_count
        }

        if filter_service is not None:
            params["filter_service"] = filter_service
        if filter_document_type is not None:
            params["filter_document_type"] = filter_document_type
        if filter_date_from is not None:
            params["filter_date_from"] = filter_date_from.isoformat()
        if filter_date_to is not None:
            params["filter_date_to"] = filter_date_to.isoformat()
        if filter_software_version is not None:
            params["filter_software_version"] = filter_software_version
        if filter_document_id is not None:
            params["filter_document_id"] = str(filter_document_id)

        response = self.client.rpc("match_document_chunks", params).execute()
        return response.data if response.data else []

    def fallback_search_chunks(
        self,
        query_text: str,
        match_count: int = 10,
        filter_service: Optional[str] = None,
        filter_document_type: Optional[str] = None,
        filter_date_from: Optional[date] = None,
        filter_date_to: Optional[date] = None,
        filter_software_version: Optional[str] = None,
        filter_document_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        # Fallback to a simple text match without vector search
        q = self.client.table("document_chunks").select(
            "id:chunk_id, chunk_index, content, document_id, documents!inner(document_type, service, document_date, software_version, title, source)"
        )

        # very basic keyword filter for the first significant word > 4 chars, else just the first word
        words = [w for w in query_text.split() if len(w) > 4]
        keyword = words[0] if words else (query_text.split()[0] if query_text.split() else query_text)
        if keyword:
            q = q.ilike("content", f"%{keyword}%")

        if filter_service:
            q = q.eq("documents.service", filter_service)
        if filter_document_type:
            q = q.eq("documents.document_type", filter_document_type)
        if filter_date_from:
            q = q.gte("documents.document_date", filter_date_from.isoformat())
        if filter_date_to:
            q = q.lte("documents.document_date", filter_date_to.isoformat())
        if filter_software_version:
            q = q.eq("documents.software_version", filter_software_version)
        if filter_document_id:
            q = q.eq("document_id", str(filter_document_id))

        res = q.limit(match_count).execute()
        results = []
        for r in (res.data or []):
            doc = r.get("documents", {})
            results.append({
                "chunk_id": r.get("id") or r.get("chunk_id") or "fallback-chunk",
                "document_id": r.get("document_id"),
                "chunk_index": r.get("chunk_index", 0),
                "content": r.get("content", ""),
                "similarity": 0.5, # Dummy similarity for fallback
                "document_type": doc.get("document_type"),
                "service": doc.get("service"),
                "document_date": doc.get("document_date"),
                "software_version": doc.get("software_version"),
                "title": doc.get("title"),
                "source": doc.get("source")
            })
        return results

def get_search_repo() -> SearchRepository:
    return SearchRepository()
