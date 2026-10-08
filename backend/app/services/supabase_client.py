from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """
    Initializes and returns the Supabase client using the backend service role key.
    Fails clearly if configuration is missing.
    """
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise RuntimeError("Supabase configuration is missing.")
    
    return create_client(settings.supabase_url, settings.supabase_secret_key)


