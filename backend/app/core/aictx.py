"""Per-request AI context and one-time tickets for browser-side AI (Puter)."""
import contextvars
import secrets
import time

ctx = contextvars.ContextVar("ai_ctx", default=None)      # {"user": id, "ticket": header value}
source = contextvars.ContextVar("ai_source", default="ai")  # becomes "puter" when browser output is used
_tickets: dict[str, dict] = {}
TTL = 120


def _prune():
    now = time.time()
    for k in [k for k, v in _tickets.items() if v["exp"] < now]:
        del _tickets[k]
    if len(_tickets) > 2000:
        _tickets.clear()


def new_ticket(uid: str) -> str:
    _prune()
    t = secrets.token_urlsafe(24)
    _tickets[t] = {"user": uid, "exp": time.time() + TTL, "output": None, "failed": False, "ready": False}
    return t


def store(ticket: str, uid: str, output: str | None, failed: bool) -> bool:
    v = _tickets.get(ticket)
    if not v or v["user"] != uid or v["exp"] < time.time():
        return False
    v.update(output=output, failed=failed, ready=True)
    return True


def take(ticket: str, uid: str):
    """Single use, and only for the user who created the ticket."""
    v = _tickets.get(ticket)
    if not v or v["user"] != uid or not v["ready"] or v["exp"] < time.time():
        return None
    del _tickets[ticket]
    return v