-- Function to perform vector similarity search with metadata filtering
create or replace function match_document_chunks(
    query_embedding extensions.vector(1536),
    match_count int default 10,
    filter_service text default null,
    filter_document_type text default null,
    filter_date_from date default null,
    filter_date_to date default null,
    filter_software_version text default null,
    filter_document_id uuid default null
)
returns table (
    chunk_id uuid,
    document_id uuid,
    chunk_index integer,
    content text,
    similarity float,
    document_type text,
    service text,
    document_date date,
    software_version text,
    title text,
    source text
)
language plpgsql
as $$
begin
    return query
    select
        c.id as chunk_id,
        c.document_id,
        c.chunk_index,
        c.content,
        1 - (c.embedding <=> query_embedding) as similarity,
        d.document_type,
        d.service,
        d.document_date,
        d.software_version,
        d.title,
        d.source
    from document_chunks c
    join documents d on c.document_id = d.id
    where
        (filter_service is null or d.service = filter_service)
        and (filter_document_type is null or d.document_type = filter_document_type)
        and (filter_date_from is null or d.document_date >= filter_date_from)
        and (filter_date_to is null or d.document_date <= filter_date_to)
        and (filter_software_version is null or d.software_version = filter_software_version)
        and (filter_document_id is null or d.id = filter_document_id)
    order by c.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Grant execute to service_role and authenticated roles
grant execute on function match_document_chunks to service_role;
grant execute on function match_document_chunks to authenticated;
