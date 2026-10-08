-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector
with schema extensions;

-- Create documents table
create table if not exists documents (
    id uuid default gen_random_uuid() primary key,
    document_type text not null,
    service text,
    document_date date,
    software_version text,
    title text not null,
    source text not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Ensure we don't insert the exact same document source multiple times by accident
    unique (source)
);

-- Create document_chunks table
create table if not exists document_chunks (
    id uuid default gen_random_uuid() primary key,
    document_id uuid references documents(id) on delete cascade not null,
    chunk_index integer not null,
    content text not null,
    embedding extensions.vector(1536), -- Assuming OpenAI embeddings (text-embedding-3-small or text-embedding-ada-002)
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,

    unique (document_id, chunk_index)
);

-- Create HNSW index for vector similarity search
create index if not exists document_chunks_embedding_idx on document_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- Create indexes for metadata filtering
create index if not exists documents_type_idx on documents (document_type);
create index if not exists documents_service_idx on documents (service);
create index if not exists documents_date_idx on documents (document_date);

-- Enable Row Level Security (RLS)
alter table documents enable row level security;
alter table document_chunks enable row level security;

-- For Phase 2, we allow authenticated users to select/insert documents and chunks.
-- If an admin service role key is used, it bypasses RLS automatically.
create policy "Authenticated users can read documents" on documents
    for select to authenticated using (true);
    
create policy "Authenticated users can insert documents" on documents
    for insert to authenticated with check (true);

create policy "Authenticated users can read chunks" on document_chunks
    for select to authenticated using (true);
    
create policy "Authenticated users can insert chunks" on document_chunks
    for insert to authenticated with check (true);
