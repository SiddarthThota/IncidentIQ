from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logger import logger, log_safe
from app.services.supabase_client import get_supabase_client

app = FastAPI(title="IncidentIQ API")

# Configure CORS for local development and future production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Prevents stack traces from leaking to the client while logging safely on the server.
    """
    # Safe server-side logging
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

@app.get("/health")
def health_check():
    """
    Lightweight health endpoint verifying application and basic config status.
    """
    # Check that Supabase client initialization succeeds without making expensive network calls
    try:
        get_supabase_client()
        supabase_status = "configured"
    except Exception:
        supabase_status = "error"

    return {
        "status": "ok",
        "services": {
            "application": "ok",
            "supabase": supabase_status,
            "ai_provider": "configured" if settings.openai_api_key else "missing"
        }
    }
