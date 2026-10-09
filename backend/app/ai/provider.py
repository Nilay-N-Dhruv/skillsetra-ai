"""AI layer. The rest of the app talks to this file, never to a vendor directly."""
import json
import logging
from abc import ABC, abstractmethod

import httpx
from fastapi import HTTPException

from ..core import aictx
from ..core.config import settings

log = logging.getLogger("skillsetra.ai")
UNAVAILABLE = "The AI service is unavailable right now. Please try again shortly."


class AIUnavailable(Exception):
    pass


class NeedsBrowserAI(Exception):
    """Raised by the Puter provider: the browser must run the prompt and send the answer back."""

    def __init__(self, ticket: str, system: str, prompt: str):
        self.ticket = ticket
        self.system = system
        self.prompt = prompt


def extract_json(text: str) -> dict:
    """Puter has no JSON mode, so find the {...} in the reply."""
    start, end = text.find("{"), text.rfind("}")

    if start == -1 or end <= start:
        raise AIUnavailable()

    try:
        data = json.loads(text[start:end + 1])
    except ValueError as e:
        raise AIUnavailable() from e

    if not isinstance(data, dict):
        raise AIUnavailable()

    return data


class AIProvider(ABC):
    name = "base"

    @abstractmethod
    async def ask_json(self, system: str, prompt: str) -> dict:
        ...

    @abstractmethod
    async def ask_text(self, system: str, prompt: str) -> str:
        ...

    async def healthy(self) -> bool | None:
        return True


class OllamaProvider(AIProvider):
    name = "ollama"

    async def _chat(self, system, prompt, as_json):
        body = {
            "model": settings.ollama_model,
            "stream": False,
            "options": {
                "temperature": 0.2
            },
            "messages": [
                {
                    "role": "system",
                    "content": system
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        if as_json:
            body["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=90) as c:
                r = await c.post(
                    f"{settings.ollama_base_url}/api/chat",
                    json=body
                )

            r.raise_for_status()

            return r.json()["message"]["content"]

        except (httpx.HTTPError, KeyError, ValueError) as e:
            log.warning("Ollama call failed: %s", e)
            raise AIUnavailable() from e

    async def ask_json(self, system, prompt):
        return extract_json(
            await self._chat(system, prompt, True)
        )

    async def ask_text(self, system, prompt):
        return (
            await self._chat(system, prompt, False)
        ).strip()

    async def healthy(self):
        try:
            async with httpx.AsyncClient(timeout=3) as c:
                return (
                    await c.get(
                        f"{settings.ollama_base_url}/api/tags"
                    )
                ).status_code == 200

        except httpx.HTTPError:
            return False


class PuterProvider(AIProvider):
    """Runs in the BROWSER. The server hands the prompt out, then validates what comes back."""

    name = "puter"

    async def _ask(self, system: str, prompt: str) -> str:
        c = aictx.ctx.get() or {}

        uid = c.get("user")
        ticket = c.get("ticket")

        if not uid:
            raise AIUnavailable()

        if ticket:
            res = aictx.take(ticket, uid)

            if res is not None:
                if res["failed"] or not res["output"]:
                    raise AIUnavailable()

                aictx.source.set("puter")

                return res["output"]

        raise NeedsBrowserAI(
            aictx.new_ticket(uid),
            system,
            prompt
        )

    async def ask_json(self, system, prompt):
        return extract_json(
            await self._ask(system, prompt)
        )

    async def ask_text(self, system, prompt):
        return (
            await self._ask(system, prompt)
        ).strip()

    async def healthy(self):
        # Puter runs in the browser, so the server cannot determine
        # whether the browser-side SDK is reachable.
        return None


PROVIDERS = {
    "puter": PuterProvider,
    "ollama": OllamaProvider
}


def get_provider() -> AIProvider:
    return PROVIDERS.get(
        settings.ai_provider,
        PuterProvider
    )()


def ai_source() -> str:
    """'ai' (server model) or 'puter' (browser model) for the current request."""
    return aictx.source.get()


def trusted(level: int, confidence: float) -> tuple[int, float]:
    """Browser-produced results can be forged, so they can never prove mastery on their own."""
    return (
        min(level, 2),
        min(confidence, 0.5)
    ) if aictx.source.get() == "puter" else (
        level,
        confidence
    )


async def run_json(system: str, prompt: str) -> dict | None:
    """A dict from the AI, or None when the AI is down and a LABELLED fallback is allowed."""
    try:
        return await get_provider().ask_json(
            system,
            prompt
        )

    except AIUnavailable:
        if settings.ai_fallback:
            return None

        raise HTTPException(
            503,
            UNAVAILABLE
        )


async def run_text(system: str, prompt: str) -> str | None:
    try:
        return await get_provider().ask_text(
            system,
            prompt
        )

    except AIUnavailable:
        if settings.ai_fallback:
            return None

        raise HTTPException(
            503,
            UNAVAILABLE
        )