import pytest
from unittest.mock import Mock, patch
from pydantic import BaseModel
from app.services.llm_service import LLMService
from app.core.config import settings

class SampleSchema(BaseModel):
    message: str
    code: int

def test_llm_service_configured_model_respected():
    service = LLMService(model="custom-gemini-test-model")
    assert service.model == "custom-gemini-test-model"

def test_llm_service_default_model_from_settings():
    service = LLMService()
    expected = settings.llm_model or "gemini-3.5-flash"
    assert service.model == expected

def test_llm_service_empty_model_fallback():
    with patch("app.services.llm_service.settings.llm_model", None):
        service = LLMService(model=None)
        assert service.model == "gemini-3.5-flash"

def test_llm_service_structured_generation_success():
    service = LLMService()
    mock_response = Mock()
    mock_response.text = '{"message": "success", "code": 200}'
    service.client.models.generate_content = Mock(return_value=mock_response)

    res = service.generate_structured("test prompt", SampleSchema)
    assert isinstance(res, SampleSchema)
    assert res.message == "success"
    assert res.code == 200

def test_llm_service_exception_propagation():
    service = LLMService()
    service.client.models.generate_content = Mock(side_effect=RuntimeError("Provider 503 Service Unavailable"))

    with pytest.raises(RuntimeError) as exc_info:
        service.generate_structured("test prompt", SampleSchema)
    assert "Provider 503" in str(exc_info.value)
