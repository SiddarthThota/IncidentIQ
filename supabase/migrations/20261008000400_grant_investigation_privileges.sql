-- Phase 4 Grant Privileges to service_role

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_subquestions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_evidence TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_claims TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_relationships TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_contradictions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_open_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_events TO service_role;
