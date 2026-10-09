import pytest

from app.core.config import settings
from app.core.security import ai_limiter, ip_limiter


@pytest.fixture(autouse=True)
def clean(monkeypatch):
    monkeypatch.setattr(
        settings,
        "ai_provider",
        "ollama"
    )  # old tests expect the offline/fallback path

    ai_limiter.hits.clear()
    ip_limiter.hits.clear()

    yield