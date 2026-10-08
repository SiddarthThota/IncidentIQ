from typing import List, Optional
from uuid import UUID
from app.services.supabase_client import get_supabase_client
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentChunkCreate, DocumentChunkResponse
from app.core.logger import logger

class DocumentRepository:
    def __init__(self):
        # We fetch the client lazily per request/instantiation to avoid import-time network I/O
        self.client = get_supabase_client()

    def get_document_by_source(self, source: str) -> Optional[DocumentResponse]:
        """Check if a document exists by its source identifier."""
        try:
            response = self.client.table("documents").select("*").eq("source", source).limit(1).execute()
            if response.data and len(response.data) > 0:
                return DocumentResponse(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Error checking document by source {source}: {e}")
            raise

    def get_document_by_id(self, document_id: UUID) -> Optional[DocumentResponse]:
        """Retrieve a single document by its UUID."""
        try:
            response = self.client.table("documents").select("*").eq("id", str(document_id)).limit(1).execute()
            if response.data and len(response.data) > 0:
                return DocumentResponse(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching document by id {document_id}: {e}")
            raise

    def list_documents(self, limit: int = 50, offset: int = 0) -> List[DocumentResponse]:
        """List documents ordered by creation date."""
        try:
            response = self.client.table("documents").select("*").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            return [DocumentResponse(**doc) for doc in response.data] if response.data else []
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            raise

    def create_document(self, document_in: DocumentCreate) -> DocumentResponse:
        """Create a new document."""
        try:
            # We convert dates to isoformat strings for supabase insertion
            data = document_in.model_dump()
            if data.get('document_date'):
                data['document_date'] = data['document_date'].isoformat()

            response = self.client.table("documents").insert(data).execute()
            if response.data:
                return DocumentResponse(**response.data[0])
            raise RuntimeError("Failed to insert document: no data returned")
        except Exception as e:
            logger.error(f"Error creating document {document_in.source}: {e}")
            raise

    def create_chunks(self, chunks_in: List[DocumentChunkCreate]) -> List[DocumentChunkResponse]:
        """Bulk insert document chunks with embeddings."""
        if not chunks_in:
            return []
            
        try:
            data = [
                {
                    "document_id": str(chunk.document_id),
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "embedding": chunk.embedding,
                    "metadata": chunk.metadata
                }
                for chunk in chunks_in
            ]
            response = self.client.table("document_chunks").insert(data).execute()
            if response.data:
                return [DocumentChunkResponse(**chunk) for chunk in response.data]
            return []
        except Exception as e:
            logger.error(f"Error bulk inserting chunks: {e}")
            raise

    def get_chunks_for_document(self, document_id: UUID) -> List[DocumentChunkResponse]:
        """Retrieve chunks associated with a specific document, ordered by index."""
        try:
            response = self.client.table("document_chunks").select("*").eq("document_id", str(document_id)).order("chunk_index").execute()
            return [DocumentChunkResponse(**chunk) for chunk in response.data] if response.data else []
        except Exception as e:
            logger.error(f"Error getting chunks for document {document_id}: {e}")
            raise

def get_document_repo() -> DocumentRepository:
    return DocumentRepository()
