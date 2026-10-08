from typing import List, Dict, Any, Optional
from uuid import UUID
import tiktoken
from fastapi import HTTPException

from app.schemas.document import DocumentCreate, DocumentResponse, DocumentChunkCreate, IngestionResponse
from app.repositories.document_repo import DocumentRepository
from app.services.embedding_service import EmbeddingService
from app.core.logger import logger

class IngestionService:
    def __init__(self, document_repo: DocumentRepository, embedding_service: EmbeddingService):
        self.repo = document_repo
        self.embedding_service = embedding_service
        # For simplicity, using a naive tiktoken chunker (cl100k_base is used by text-embedding-3-small)
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.chunk_size = 800
        self.chunk_overlap = 100

    def validate_document(self, doc_in: DocumentCreate):
        if not doc_in.content or not doc_in.content.strip():
            raise ValueError("Document content cannot be empty")
        if not doc_in.title or not doc_in.title.strip():
            raise ValueError("Document title cannot be empty")
        if not doc_in.source or not doc_in.source.strip():
            raise ValueError("Document source cannot be empty")

    def chunk_text(self, text: str) -> List[str]:
        """
        Token-based naive sliding window chunker.
        """
        tokens = self.tokenizer.encode(text)
        chunks = []
        i = 0
        while i < len(tokens):
            end = min(i + self.chunk_size, len(tokens))
            chunk_tokens = tokens[i:end]
            chunks.append(self.tokenizer.decode(chunk_tokens))
            if end == len(tokens):
                break
            # Advance by chunk_size - chunk_overlap
            i += (self.chunk_size - self.chunk_overlap)
        return chunks

    def ingest_document(self, doc_in: DocumentCreate) -> IngestionResponse:
        logger.info(f"Starting ingestion for document {doc_in.source}")
        
        # 1. Validate
        try:
            self.validate_document(doc_in)
        except ValueError as e:
            logger.warning(f"Validation failed for {doc_in.source}: {e}")
            raise HTTPException(status_code=400, detail=str(e))

        # 2. Duplicate Detection
        existing_doc = self.repo.get_document_by_source(doc_in.source)
        if existing_doc:
            logger.info(f"Document {doc_in.source} already exists, skipping ingestion.")
            return IngestionResponse(
                document_id=existing_doc.id,
                chunks_created=0,
                status="skipped_duplicate"
            )

        # 3. Persist Document
        try:
            document = self.repo.create_document(doc_in)
            logger.info(f"Persisted document {document.id}")
        except Exception as e:
            raise HTTPException(status_code=500, detail="Database error persisting document")

        # 4. Chunk
        try:
            text_chunks = self.chunk_text(document.content)
            logger.info(f"Generated {len(text_chunks)} chunks for document {document.id}")
        except Exception as e:
            logger.error(f"Error during chunking: {e}")
            raise HTTPException(status_code=500, detail="Error during document chunking")

        # 5. Generate Embeddings
        try:
            embeddings = self.embedding_service.generate_embeddings(text_chunks)
        except Exception as e:
            logger.error(f"Error generating embeddings for document {document.id}: {e}")
            raise HTTPException(status_code=500, detail="Error generating embeddings")

        # 6. Persist Chunks/Vectors
        chunks_to_create = []
        for i, (text, emb) in enumerate(zip(text_chunks, embeddings)):
            metadata = {
                "document_type": document.document_type,
                "service": document.service,
                "source": document.source,
                "title": document.title
            }
            if document.software_version:
                metadata["software_version"] = document.software_version
            if document.document_date:
                metadata["document_date"] = document.document_date.isoformat()

            chunks_to_create.append(
                DocumentChunkCreate(
                    document_id=document.id,
                    chunk_index=i,
                    content=text,
                    embedding=emb,
                    metadata=metadata
                )
            )

        try:
            created_chunks = self.repo.create_chunks(chunks_to_create)
            logger.info(f"Successfully ingested {len(created_chunks)} chunks for document {document.id}")
            return IngestionResponse(
                document_id=document.id,
                chunks_created=len(created_chunks),
                status="success"
            )
        except Exception as e:
            logger.error(f"Error persisting chunks for document {document.id}: {e}")
            raise HTTPException(status_code=500, detail="Database error persisting document chunks")

def get_ingestion_service(
    repo: DocumentRepository,
    embedding_service: EmbeddingService
) -> IngestionService:
    return IngestionService(repo, embedding_service)
