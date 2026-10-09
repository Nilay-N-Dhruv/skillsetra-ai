"""Authentication, authorization and rate limiting."""
import time
from collections import defaultdict, deque

import httpx
from fastapi import Depends, HTTPException, Request
from . import aictx
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from .config import settings
import re

DEMO_RE = re.compile(r"^demo-[a-z0-9]{8,32}$")
bearer = HTTPBearer(auto_error=False)
_cache: dict[str, tuple[float, "CurrentUser"]] = {}


class CurrentUser(BaseModel):
    id: str
    email: str | None = None
    demo: bool = False


async def _resolve_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> CurrentUser:
    if creds is None:
        raise HTTPException(401, "Please sign in to continue.")
    token = creds.credentials

    if DEMO_RE.match(token):               # one private sandbox per demo visitor
        if not settings.demo_mode:
            raise HTTPException(401, "Demo mode is disabled.")
        return CurrentUser(id=token, email="demo@skillsetra", demo=True)

    hit = _cache.get(token)
    if hit and hit[0] > time.time():
        return hit[1]
    if not settings.supabase_url:
        raise HTTPException(401, "Authentication is not configured.")
    try:                                   # ask Supabase Auth whether this token is valid
        async with httpx.AsyncClient(timeout=8) as c:
            r = await c.get(f"{settings.supabase_url.strip().rstrip('/')}/auth/v1/user",
                            headers={"apikey": settings.supabase_anon_key,
                                     "Authorization": f"Bearer {token}"})
    except httpx.HTTPError:
        raise HTTPException(503, "Sign-in service is unavailable. Try again shortly.")
    if r.status_code != 200:
        raise HTTPException(401, "Your session has expired. Please sign in again.")
    data = r.json()
    user = CurrentUser(id=data["id"], email=data.get("email"))
    if len(_cache) > 1000:
        _cache.clear()
    _cache[token] = (time.time() + 60, user)
    return user


async def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer)
) -> CurrentUser:
    user = await _resolve_user(creds)
    aictx.ctx.set({
        "user": user.id,
        "ticket": request.headers.get("x-ai-ticket")
    })
    aictx.source.set("ai")
    return user


class RateLimiter:
    """Sliding window: allow `limit` requests per `window` seconds per key."""

    def __init__(self, limit: int, window: int = 60):
        self.limit, self.window = limit, window
        self.hits: dict[str, deque] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.time()
        q = self.hits[key]
        while q and q[0] <= now - self.window:
            q.popleft()
        if len(q) >= self.limit:
            raise HTTPException(429, "Too many requests. Please wait a moment and try again.",
                                headers={"Retry-After": str(self.window)})
        q.append(now)


ip_limiter = RateLimiter(settings.rate_limit_per_minute)
ai_limiter = RateLimiter(settings.ai_rate_limit_per_minute)


async def limit_ai(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    ai_limiter.check(user.id)
    return user