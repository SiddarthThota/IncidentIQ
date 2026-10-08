import pytest
from fastapi.testclient import TestClient
import os

# Set dummy environment variables so pydantic-settings doesn't fail on import during tests
os.environ["SUPABASE_URL"] = "https://dummy.supabase.co"
os.environ["SUPABASE_SECRET_KEY"] = "dummy_secret"
os.environ["OPENAI_API_KEY"] = "dummy_openai"
os.environ["GEMINI_API_KEY"] = "dummy_gemini"

from main import app
from app.core.config import Settings
from app.services.supabase_client import get_supabase_client

client = TestClient(app, raise_server_exceptions=False)

def test_app_imports_cleanly():
    """Verify the application imports and starts without errors."""
    assert app.title == "IncidentIQ API"

def test_health_endpoint():
    """Verify the /health endpoint returns structured status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "application" in data["services"]
    assert "supabase" in data["services"]

def test_configuration_validation():
    """Verify configuration loads with environment variables."""
    settings = Settings(_env_file=None)
    assert settings.supabase_url == "https://dummy.supabase.co"
    assert settings.frontend_url == "http://localhost:5173"

def test_missing_configuration_behavior(monkeypatch):
    """Verify missing required config raises an error."""
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    with pytest.raises(Exception):
        Settings(_env_file=None)

def test_cors_behavior():
    """Verify CORS headers are returned for the frontend origin."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_safe_error_handling():
    """Verify that unhandled exceptions do not leak stack traces."""
    # We create a dummy route that raises an exception to test the handler
    @app.get("/trigger-error")
    def trigger_error():
        raise ValueError("Secret Stack Trace")
        
    response = client.get("/trigger-error")
    assert response.status_code == 500
    data = response.json()
    assert data["detail"] == "Internal Server Error"
    assert "Secret Stack Trace" not in response.text
