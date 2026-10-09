"""Profile details. Files go straight from the browser to Supabase Storage (private buckets with size/type limits);
the server only records a path that IT computes, so a client can never point at someone else's file."""
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, StringConstraints

from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/profile")
Skill = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]


class CareerPrefs(BaseModel):
    open_to_work: bool = False
    work_type: Literal["Any", "Remote", "Hybrid", "On-site"] = "Any"
    location: str = Field(default="", max_length=80)


class DetailsIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    headline: str = Field(default="", max_length=120)
    bio: str = Field(default="", max_length=600)
    education: str = Field(default="", max_length=300)
    experience_summary: str = Field(default="", max_length=600)
    skills: list[Skill] = Field(default_factory=list, max_length=20)
    career_prefs: CareerPrefs = CareerPrefs()


class FilesIn(BaseModel):
    avatar: bool | None = None          # True = uploaded, False = removed
    resume: bool | None = None


async def _merge(db, uid, values):
    rows = await db.select("profiles", uid)
    base = {k: v for k, v in (rows[0] if rows else {}).items() if k not in ("created_at", "id")}
    await db.upsert("profiles", {**base, "user_id": uid, **values})


@router.get("/details")
async def details(user: CurrentUser = Depends(get_current_user)):
    p = ((await db_for(user).select("profiles", user.id)) or [{}])[0]
    return {"uid": user.id, "demo": user.demo, "email": user.email, "name": p.get("name", ""),
            "headline": p.get("headline") or "", "bio": p.get("bio") or "", "education": p.get("education") or "",
            "experience_summary": p.get("experience_summary") or "", "skills": p.get("skills") or [],
            "career_prefs": p.get("career_prefs") or {}, "target_role": p.get("target_role"),
            "avatar_path": p.get("avatar_path"), "resume_path": p.get("resume_path")}


@router.put("/details")
async def save_details(body: DetailsIn, user: CurrentUser = Depends(get_current_user)):
    await _merge(db_for(user), user.id, {**body.model_dump(exclude={"career_prefs"}),
                                         "career_prefs": body.career_prefs.model_dump()})
    return {"ok": True}


@router.put("/files")
async def files(body: FilesIn, user: CurrentUser = Depends(get_current_user)):
    if user.demo:
        raise HTTPException(403, "File uploads need a real account. Sign up to use them.")
    vals = {}
    if body.avatar is not None:
        vals["avatar_path"] = f"{user.id}/avatar" if body.avatar else None
    if body.resume is not None:
        vals["resume_path"] = f"{user.id}/resume.pdf" if body.resume else None
    if vals:
        await _merge(db_for(user), user.id, vals)
    return {"ok": True}