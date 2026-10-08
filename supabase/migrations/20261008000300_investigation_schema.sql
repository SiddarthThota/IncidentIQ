-- Phase 4 Investigation Schema

create table if not exists investigations (
    id uuid default gen_random_uuid() primary key,
    original_question text not null,
    normalized_question text,
    investigation_intent text,
    status text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_subquestions (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    question text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_evidence (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    document_id uuid references documents(id) on delete cascade not null,
    chunk_id uuid references document_chunks(id) on delete cascade not null,
    retrieved_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (investigation_id, chunk_id)
);

create table if not exists investigation_claims (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    evidence_id uuid references investigation_evidence(id) on delete cascade not null,
    claim_text text not null,
    classification text not null, -- DIRECT, CORROBORATED, TEMPORAL, INFERRED, CONTRADICTED, INSUFFICIENT
    confidence float,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_relationships (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    source_evidence_id uuid references investigation_evidence(id) on delete cascade not null,
    target_evidence_id uuid references investigation_evidence(id) on delete cascade not null,
    relationship_type text not null,
    explanation text,
    confidence float,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_contradictions (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    evidence_1_id uuid references investigation_evidence(id) on delete cascade not null,
    evidence_2_id uuid references investigation_evidence(id) on delete cascade not null,
    conflicting_claims text not null,
    context_info text,
    status text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_open_questions (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    question text not null,
    reason text,
    related_evidence_id uuid references investigation_evidence(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists investigation_events (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    event_type text not null,
    details text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table investigations enable row level security;
alter table investigation_subquestions enable row level security;
alter table investigation_evidence enable row level security;
alter table investigation_claims enable row level security;
alter table investigation_relationships enable row level security;
alter table investigation_contradictions enable row level security;
alter table investigation_open_questions enable row level security;
alter table investigation_events enable row level security;

-- Policies for Authenticated & Service Role Bypass
create policy "Auth users can manage investigations" on investigations for all to authenticated using (true);
create policy "Auth users can manage investigation_subquestions" on investigation_subquestions for all to authenticated using (true);
create policy "Auth users can manage investigation_evidence" on investigation_evidence for all to authenticated using (true);
create policy "Auth users can manage investigation_claims" on investigation_claims for all to authenticated using (true);
create policy "Auth users can manage investigation_relationships" on investigation_relationships for all to authenticated using (true);
create policy "Auth users can manage investigation_contradictions" on investigation_contradictions for all to authenticated using (true);
create policy "Auth users can manage investigation_open_questions" on investigation_open_questions for all to authenticated using (true);
create policy "Auth users can manage investigation_events" on investigation_events for all to authenticated using (true);
