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

def get_search_repo() -> SearchRepository:
    return SearchRepository()
