"""Ask the AI for structured JSON and validate it before anything uses it."""
from fastapi import HTTPException
from pydantic import ValidationError

from ..ai.provider import UNAVAILABLE, run_json
from ..core.config import settings


def clip(items, n: int = 300, k: int = 8) -> list[str]:
    return [str(x)[:n] for x in (items or [])][:k]


def clean(text: str, tag: str) -> str:
    """Stop a learner from closing our data tag to smuggle in instructions."""
    return text.replace(f"<{tag}>", "").replace(f"</{tag}>", "")


async def judge(model, system: str, prompt: str):
    """A validated model, or None when a labelled fallback should be used."""
    for _ in range(2):                              # one retry if the AI returns bad JSON
        data = await run_json(system, prompt)
        if data is None:
            return None
        try:
            return model(**data)
        except (ValidationError, TypeError):
            continue
    if settings.ai_fallback:
        return None
    raise HTTPException(503, UNAVAILABLE)