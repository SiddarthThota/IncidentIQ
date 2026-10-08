-- Phase 5 Iterative Investigation Schema

create table if not exists investigation_followup_queries (
    id uuid default gen_random_uuid() primary key,
    investigation_id uuid references investigations(id) on delete cascade not null,
    question_id uuid references investigation_open_questions(id) on delete cascade,
    query_text text not null,
    reason text,
    supporting_evidence_ids uuid[] default '{}'::uuid[],
    priority text,
    status text not null, -- PENDING, EXECUTED, SKIPPED, FAILED, NO_RESULTS
    iteration integer not null,
    retrieved_result_ids uuid[] default '{}'::uuid[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table investigations
add column if not exists iteration_count integer default 1 not null;

alter table investigation_open_questions
add column if not exists why_it_matters text,
add column if not exists supporting_evidence_ids uuid[] default '{}'::uuid[],
add column if not exists status text default 'OPEN' not null,
add column if not exists resolved_by_evidence_ids uuid[] default '{}'::uuid[],
add column if not exists resolution_reason text,
add column if not exists generated_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- RLS
alter table investigation_followup_queries enable row level security;

-- Policies for Authenticated & Service Role Bypass
create policy "Auth users can manage investigation_followup_queries" on investigation_followup_queries for all to authenticated using (true);

-- Grant Privileges to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_followup_queries TO service_role;
