-- Phase 6: Final Reasoning / Conclusion Schema

create table if not exists investigation_conclusions (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null unique,
    summary text not null,
    conclusion_status text not null, -- SUPPORTED, PARTIALLY_SUPPORTED, INSUFFICIENT, CONTRADICTED, PROVIDER_LIMITED
    confidence text not null,        -- HIGH, MEDIUM, LOW
    uncertainty_notes text,
    unresolved_questions text[],
    generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_findings (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    conclusion_id uuid references investigation_conclusions(id) on delete cascade not null,
    statement text not null,
    classification text not null,   -- DIRECT, CORROBORATED, TEMPORAL, INFERRED, CONTRADICTED, INSUFFICIENT
    confidence text not null,       -- HIGH, MEDIUM, LOW
    reasoning_basis text,
    evidence_ids uuid[] default '{}'::uuid[],
    document_ids uuid[] default '{}'::uuid[],
    chunk_ids uuid[] default '{}'::uuid[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_source_references (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    conclusion_id uuid references investigation_conclusions(id) on delete cascade not null,
    source_label text not null,
    document_id uuid references documents(id) on delete set null,
    evidence_id uuid references investigation_evidence(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_timeline_events (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    conclusion_id uuid references investigation_conclusions(id) on delete cascade not null,
    event_label text not null,
    event_date date,
    event_timestamp timestamp with time zone,
    document_date date,
    source_label text,
    software_version text,
    service text,
    evidence_id uuid references investigation_evidence(id) on delete set null,
    ordering integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table investigation_conclusions enable row level security;
alter table investigation_findings enable row level security;
alter table investigation_source_references enable row level security;
alter table investigation_timeline_events enable row level security;

create policy "Auth users can manage investigation_conclusions" on investigation_conclusions for all to authenticated using (true);
create policy "Auth users can manage investigation_findings" on investigation_findings for all to authenticated using (true);
create policy "Auth users can manage investigation_source_references" on investigation_source_references for all to authenticated using (true);
create policy "Auth users can manage investigation_timeline_events" on investigation_timeline_events for all to authenticated using (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_conclusions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_findings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_source_references TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_timeline_events TO service_role;
