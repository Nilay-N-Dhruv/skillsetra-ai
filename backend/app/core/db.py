"""Data access with two backends sharing one interface."""
import logging
from collections import defaultdict
from datetime import datetime, timezone
from uuid import uuid4

import httpx

from .config import settings

log = logging.getLogger("skillsetra.db")


class DatabaseError(Exception):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _match(r, user_id, eq):
    return r.get("user_id") == user_id and all(r.get(k) == v for k, v in eq.items())


class MemoryDB:
    def __init__(self):
        self.t: dict[str, list[dict]] = defaultdict(list)
        self.users: set[str] = set()

    def ensure_user(self, uid):
        if uid in self.users:
            return
        if len(self.users) >= 300:                 # keep memory bounded
            self.t.clear()
            self.users.clear()
        self.users.add(uid)
        self.t["profiles"].append({"id": uid, "user_id": uid, "name": "Demo Learner", "created_at": now_iso()})

    def forget(self, uid):
        for k in list(self.t):
            self.t[k] = [r for r in self.t[k] if r.get("user_id") != uid]
        self.users.discard(uid)

    async def select(self, table, user_id, order=None, desc=False, limit=None, **eq):
        rows = [r for r in self.t[table] if _match(r, user_id, eq)]
        if order:
            rows.sort(key=lambda r: r[order], reverse=desc)
        return [dict(r) for r in (rows[:limit] if limit else rows)]

    async def insert(self, table, row):
        row = {"id": str(uuid4()), "created_at": now_iso(), **row}
        self.t[table].append(row)
        return dict(row)

    async def upsert(self, table, row):               # one row per user (profiles, user_settings)
        self.t[table] = [r for r in self.t[table] if r.get("user_id") != row["user_id"]]
        return await self.insert(table, row)

    async def update(self, table, user_id, values, **eq):
        for r in self.t[table]:
            if _match(r, user_id, eq):
                r.update(values)

    async def delete(self, table, user_id, **eq):
        self.t[table] = [r for r in self.t[table] if not _match(r, user_id, eq)]


class SupabaseDB:
    def __init__(self):
        key = settings.supabase_service_role_key.strip()
        self.base = f"{settings.supabase_url.strip().rstrip('/')}/rest/v1"
        self.h = {"apikey": key, "Content-Type": "application/json"}
        if not key.startswith("sb_"):                 # old-style JWT keys are also sent as Bearer
            self.h["Authorization"] = f"Bearer {key}"

    @staticmethod
    def _filters(user_id, eq):                        # every query is pinned to ONE user
        val = lambda v: str(v).lower() if isinstance(v, bool) else v
        return {"user_id": f"eq.{user_id}", **{k: f"eq.{val(v)}" for k, v in eq.items()}}

    async def _req(self, method, table, params=None, json=None, prefer=None):
        headers = {**self.h, **({"Prefer": prefer} if prefer else {})}
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.request(method, f"{self.base}/{table}", params=params, json=json, headers=headers)
            r.raise_for_status()
            return r.json() if r.content else []
        except httpx.HTTPStatusError as e:             # must come before HTTPError
            log.error("Supabase %s %s failed: HTTP %s %s", method, table, e.response.status_code, e.response.text[:300])
            raise DatabaseError() from e
        except httpx.HTTPError as e:
            log.error("Supabase %s %s network error: %s", method, table, type(e).__name__)
            raise DatabaseError() from e

    async def select(self, table, user_id, order=None, desc=False, limit=None, **eq):
        p = self._filters(user_id, eq)
        if order:
            p["order"] = f"{order}.{'desc' if desc else 'asc'}"
        if limit:
            p["limit"] = str(limit)
        return await self._req("GET", table, params=p)

    async def insert(self, table, row):
        return (await self._req("POST", table, json=row, prefer="return=representation"))[0]

    async def upsert(self, table, row):
        return (await self._req("POST", table, params={"on_conflict": "user_id"}, json=row,
                                prefer="resolution=merge-duplicates,return=representation"))[0]

    async def update(self, table, user_id, values, **eq):
        await self._req("PATCH", table, params=self._filters(user_id, eq), json=values)

    async def delete(self, table, user_id, **eq):
        await self._req("DELETE", table, params=self._filters(user_id, eq))


_demo_db: MemoryDB | None = None
_real_db = None


def db_for(user):
    """Demo visitors get a private slot in memory. Real users get Supabase when configured."""
    global _demo_db, _real_db
    if user.demo or not (settings.supabase_url and settings.supabase_service_role_key):
        if _demo_db is None:
            _demo_db = MemoryDB()
        _demo_db.ensure_user(user.id)
        return _demo_db
    if _real_db is None:
        _real_db = SupabaseDB()
    return _real_db


def forget_demo(user_id):
    if _demo_db:
        _demo_db.forget(user_id)