import logging
from typing import List, Dict, Any, Optional

from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.repositories.search_repo import SearchRepository
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger("incidentiq")

class RetrievalService:
    def __init__(self, repo: SearchRepository, embedding_service: EmbeddingService):
        self.repo = repo
        self.embedding_service = embedding_service
        self.similarity_threshold = 0.5  # Adjust this depending on empirical data

    def search(self, request: SearchRequest) -> SearchResponse:
        logger.info(f"Retrieval Request: query='{request.query}', top_k={request.top_k}, filters={request.filters}")
        
        # 1. Embed query
        embeddings = self.embedding_service.generate_embeddings([request.query])
        if not embeddings or not embeddings[0]:
            logger.warning("Failed to generate query embedding.")
            return SearchResponse(
                query=request.query,
                results=[],
                applied_filters=request.filters,
                insufficient_evidence=True
            )
        query_embedding = embeddings[0]
            
        # 2. Extract filters
        kwargs = {}
        if request.filters:
            if request.filters.service: kwargs["filter_service"] = request.filters.service
            if request.filters.document_type: kwargs["filter_document_type"] = request.filters.document_type
            if request.filters.date_from: kwargs["filter_date_from"] = request.filters.date_from
            if request.filters.date_to: kwargs["filter_date_to"] = request.filters.date_to
            if request.filters.software_version: kwargs["filter_software_version"] = request.filters.software_version
            if request.filters.document_id: kwargs["filter_document_id"] = request.filters.document_id
            
        # 3. Retrieve candidates (fetch slightly more to allow dedup)
        fetch_count = max(request.top_k * 3, 20)
        
        raw_results = self.repo.search_chunks(
            query_embedding=query_embedding,
            match_count=fetch_count,
            **kwargs
        )
        
        # 4. Deduplicate and rank
        # Strategy: allow at most N chunks from the same document to prevent flooding
        # Keep them sorted by similarity (the RPC already sorted them descending by similarity, meaning highest similarity first)
        MAX_CHUNKS_PER_DOC = 2
        doc_counts = {}
        final_results = []
        
        for r in raw_results:
            doc_id = r["document_id"]
            sim = r["similarity"]
            
            if sim < self.similarity_threshold:
                continue
                
            doc_counts[doc_id] = doc_counts.get(doc_id, 0) + 1
            if doc_counts[doc_id] <= MAX_CHUNKS_PER_DOC:
                final_results.append(
                    SearchResult(
                        chunk_id=r["chunk_id"],
                        document_id=doc_id,
                        chunk_index=r["chunk_index"],
                        content=r["content"],
                        similarity=sim,
                        document_type=r["document_type"],
                        service=r["service"],
                        document_date=r.get("document_date"),
                        software_version=r.get("software_version"),
                        title=r["title"],
                        source=r["source"]
                    )
                )
                
            if len(final_results) >= request.top_k:
                break
                
        insufficient = len(final_results) == 0
        
        logger.info(f"Retrieval complete. Found {len(final_results)} results. Insufficient? {insufficient}")
        
        return SearchResponse(
            query=request.query,
            results=final_results,
            applied_filters=request.filters,
            insufficient_evidence=insufficient
        )
