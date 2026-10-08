-- Grant minimum privileges required by the backend repository
-- The backend uses the service_role key, so we grant it full CRUD access.
-- We intentionally do not grant access to authenticated or anon roles,
-- as all table interactions occur server-side through the FastAPI backend.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_chunks TO service_role;
