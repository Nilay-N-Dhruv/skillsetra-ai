"""Proof Passport: a public, unlisted page that shows ONLY what the learner chose to show."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Path, Request
from pydantic import BaseModel, Field

from ..core import catalog
from ..core.db import db_for, db_public, now_iso
from ..core.security import CurrentUser, get_current_user, public_limiter
from ..services.evidence_graph import build_graph
from ..services.passport import build_public, new_slug

router = APIRouter(prefix="/api")
SLUG = r"^[A-Za-z0-9_-]{8,40}$"
SkillKey = Literal[tuple(catalog.ALL_KEYS)]


class SettingsIn(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)
    headline: str = Field(default="", max_length=120)
    show_role: bool = True
    show_repos: bool = False
    skills: list[SkillKey] = Field(max_length=20)


async def _mine(db, uid):
    rows = await db.select("passports", uid)
    return rows[0] if rows else None


def _no_demo(user):
    if user.demo:
        raise HTTPException(403, "Passports need a real account. Demo data cannot be published.")


@router.get("/passport")
async def get_passport(user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    row = await _mine(db, user.id) or {}
    prof = (await db.select("profiles", user.id) or [{}])[0]
    graph = build_graph(await db.select("evidence", user.id))
    return {
        "demo": user.demo,
        "settings": {"display_name": row.get("display_name") or prof.get("name") or "", "headline": row.get("headline") or "",
                     "show_role": row.get("show_role", True), "show_repos": row.get("show_repos", False),
                     "skills": row.get("skills") or []},
        "published": bool(row.get("published")), "slug": row.get("slug"), "published_at": row.get("published_at"),
        "available": [{"key": s["key"], "klass": s["klass"], "state": s["state"], "verified_count": s["verified_count"]}
                      for s in graph["skills"]],
    }


@router.put("/passport")
async def save_passport(body: SettingsIn, user: CurrentUser = Depends(get_current_user)):
    _no_demo(user)
    name = body.display_name.strip()
    if not name:
        raise HTTPException(422, "Enter the name to show on your passport.")
    db = db_for(user)
    row = await _mine(db, user.id) or {}
    await db.upsert("passports", {
        "user_id": user.id, "slug": row.get("slug"), "published": bool(row.get("published")),
        "published_at": row.get("published_at"), "display_name": name, "headline": body.headline.strip(),
        "show_role": body.show_role, "show_repos": body.show_repos,
        "skills": list(dict.fromkeys(body.skills)), "updated_at": now_iso()})
    return {"ok": True}


@router.post("/passport/publish")
async def publish(user: CurrentUser = Depends(get_current_user)):
    _no_demo(user)
    db = db_for(user)
    row = await _mine(db, user.id)
    if not row or not row.get("skills"):
        raise HTTPException(422, "Save your passport with at least one skill before publishing.")
    slug = row.get("slug") or new_slug()
    await db.update("passports", user.id, {"slug": slug, "published": True,
                                           "published_at": row.get("published_at") or now_iso()})
    return {"ok": True, "slug": slug}


@router.post("/passport/unpublish")
async def unpublish(user: CurrentUser = Depends(get_current_user)):
    _no_demo(user)
    await db_for(user).update("passports", user.id, {"published": False})
    return {"ok": True}


@router.post("/passport/revoke")
async def revoke(user: CurrentUser = Depends(get_current_user)):
    """Hide the page AND destroy the link. A later publish creates a brand-new link."""
    _no_demo(user)
    await db_for(user).update("passports", user.id, {"published": False, "slug": None})
    return {"ok": True}


@router.get("/public/passport/{slug}")
async def public_passport(request: Request, slug: str = Path(pattern=SLUG)):
    public_limiter.check(request.client.host if request.client else "unknown")
    db = db_public()
    row = await db.find("passports", slug=slug)
    if not row or not row.get("published"):
        raise HTTPException(404, "This passport is not available.")      # same answer for "never existed" and "hidden"
    uid = row["user_id"]
    prof = (await db.select("profiles", uid) or [{}])[0]
    return build_public(row, prof.get("target_role"), await db.select("evidence", uid))