"""General endpoints. The exam and the dashboard live in their own files."""
from datetime import date, datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, HttpUrl, field_validator
from ..core.config import settings
from ..core import catalog
from ..core.db import db_for, forget_demo
from ..core.roles import ROLE_PROFILES
from ..core.security import CurrentUser, get_current_user
from ..services import competency as comp
from ..services.notify import notify
import httpx

router = APIRouter(prefix="/api")

RoleName = Literal[tuple(catalog.ROLES)]
SkillName = Literal[tuple(catalog.ROLE_SKILLS)]
Experience = Literal[
    "Student",
    "Early career",
    "Mid-level",
    "Senior"
]


class ProfileIn(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=80
    )
    target_role: RoleName
    dob: date
    experience: Experience
    goal: str = Field(
        default="",
        max_length=160
    )
    status: Literal[
        "Student",
        "Working",
        "Between jobs",
        "Other"
    ] = "Student"
    country: str = Field(
        default="",
        max_length=60
    )
    consent: Literal[True]                          # the privacy box must be ticked

    @field_validator("dob")
    @classmethod
    def sane_age(cls, v):
        if not 13 <= (date.today() - v).days // 365 <= 100:
            raise ValueError("age")
        return v


class RoleIn(BaseModel):
    target_role: RoleName
    experience: Experience = "Early career"
    goal: str = Field(
        default="",
        max_length=160
    )


class ClaimIn(BaseModel):
    skill: SkillName
    kind: Literal[
        "course",
        "project",
        "practice"
    ]
    note: str = Field(
        min_length=10,
        max_length=400
    )
    link: HttpUrl | None = None


async def _role(db, uid) -> str:
    rows = await db.select(
        "profiles",
        uid
    )

    return (
        rows[0].get("target_role")
        if rows
        else None
    ) or "ML Engineer"


@router.get("/health")
async def health():
    return {"status": "ok",
            "auth_configured": bool(settings.supabase_url and settings.supabase_anon_key),
            "database": "supabase" if (settings.supabase_url and settings.supabase_service_role_key) else "memory"}


@router.get("/roles")                               # public: sign-up needs it before login
async def roles():
    return {
        "roles": [
            {
                "name": n,
                **p
            }
            for n, p in ROLE_PROFILES.items()
        ]
    }


@router.get("/profile")
async def get_profile(
    user: CurrentUser = Depends(get_current_user)
):
    rows = await db_for(user).select(
        "profiles",
        user.id
    )

    p = rows[0] if rows else {}

    minor = (
        bool(p.get("dob"))
        and (
            date.today()
            - date.fromisoformat(
                str(p["dob"])[:10]
            )
        ).days // 365 < 18
    )

    return {
        "name": p.get("name", ""),
        "target_role": p.get("target_role"),
        "experience": p.get("experience"),
        "goal": p.get("goal"),
        "email": user.email,
        "demo": user.demo,
        "complete": bool(p.get("target_role")),
        "minor": minor,
    }


@router.get("/profile")
async def get_profile(user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    rows = await db.select("profiles", user.id)
    if not rows and not user.demo:
        try:
            await db.insert("profiles", {"user_id": user.id, "name": "", "email": user.email})
        except Exception:                      # noqa: BLE001  (the sign-up trigger may have just created it)
            pass
        rows = await db.select("profiles", user.id)
    p = rows[0] if rows else {}
    minor = bool(p.get("dob")) and (date.today() - date.fromisoformat(str(p["dob"])[:10])).days // 365 < 18
    return {"name": p.get("name", ""), "target_role": p.get("target_role"), "experience": p.get("experience"),
            "goal": p.get("goal"), "email": user.email, "demo": user.demo,
            "complete": bool(p.get("target_role")), "minor": minor}


@router.put("/profile/role")                        # change role later, or set it in demo mode
async def put_role(
    body: RoleIn,
    user: CurrentUser = Depends(get_current_user)
):
    db = db_for(user)

    rows = await db.select(
        "profiles",
        user.id
    )

    base = {
        k: v
        for k, v in (rows[0] if rows else {}).items()
        if k != "created_at"
    }

    await db.upsert("profiles", {**base, "user_id": user.id, **body.model_dump(exclude_unset=True)})

    return {"ok": True}


@router.get("/competencies")
async def competencies(
    user: CurrentUser = Depends(get_current_user)
):
    items = list(
        (
            await comp.competency_states(
                db_for(user),
                user.id
            )
        ).values()
    )

    counts = {}

    for i in items:
        counts[i["state"]] = (
            counts.get(i["state"], 0) + 1
        )

    return {
        "items": items,
        "counts": counts
    }


@router.get("/evidence")
async def evidence(
    user: CurrentUser = Depends(get_current_user)
):
    rows = await db_for(user).select(
        "evidence",
        user.id,
        order="created_at",
        desc=True,
        limit=100
    )

    return {
        "items": rows
    }


@router.post("/skills/claim")                       # "I learned something new"
async def claim_skill(
    body: ClaimIn,
    user: CurrentUser = Depends(get_current_user)
):
    await db_for(user).insert(
        "evidence",
        {
            "user_id": user.id,
            "competency": body.skill,
            "level": 1,
            "confidence": 0.3,
            "source_type": "claim",
            "source_ref": (
                str(body.link)
                if body.link
                else body.kind
            ),
            "summary": (
                f"Self-reported {body.kind}: "
                f"{body.note}"
            ),
            "details": {},
        }
    )

    return {
        "ok": True,
        "skill": body.skill,
        "next": (
            "Take a short re-test on this skill "
            "to turn the claim into stronger evidence."
        ),
    }


@router.get("/career")
async def career(
    role: RoleName | None = None,
    user: CurrentUser = Depends(get_current_user)
):
    db = db_for(user)

    role = role or await _role(
        db,
        user.id
    )

    states = await comp.competency_states(
        db,
        user.id
    )

    groups = {
        "Strong Evidence": [],
        "Developing Evidence": [],
        "Limited Evidence": [],
        "Not Yet Demonstrated": [],
    }

    label = {
        "Demonstrated": "Strong Evidence",
        "Developing": "Developing Evidence",
        "Limited": "Limited Evidence",
    }

    for k in catalog.ROLES[role]:
        groups[
            label.get(
                states[k]["state"],
                "Not Yet Demonstrated"
            )
        ].append(k)

    return {
        "role": role,
        "roles": list(catalog.ROLES),
        "groups": groups
    }


@router.get("/roadmap")
async def roadmap(user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    role = await _role(db, user.id)
    states = await comp.competency_states(db, user.id)
    done_keys = {r["step_key"] for r in await db.select("learning_progress", user.id)}
    steps, done = [], 0
    for k in catalog.ROLES[role]:
        s = states[k]
        if s["state"] == "Demonstrated":
            done += 1
            continue
        mods = [{**m, "done": f"{k}:{m['key']}" in done_keys} for m in catalog.modules_for(k)]
        n = sum(m["done"] for m in mods)
        status = "Ready to re-test" if n == len(mods) else "In Progress" if (n or s["state"] == "Developing") else "Not Started"
        steps.append({"competency": k, "state": s["state"], "objective": f"Move {k} from {s['state']} to Demonstrated",
                      "why": f"{role} work needs {k}. {s['explain']}", "modules": mods,
                      "progress": {"done": n, "total": len(mods)}, "status": status,
                      "evidence_required": f"Two verified pieces of evidence for {k}."})
    return {"role": role, "completed": done, "steps": steps[:8]}

@router.delete("/me/data")
async def delete_my_data(
    user: CurrentUser = Depends(get_current_user)
):
    db = db_for(user)

    for t in (
        "evidence",
        "exam_results",
        "exam_sessions",
        "challenge_attempts",
        "github_repositories",
        "notifications",
        "interview_sessions",
        "learning_progress",
        "saved_jobs",
    ):
        await db.delete(
            t,
            user.id
        )

    return {"ok": True}


@router.post("/demo/reset")
async def demo_reset(
    user: CurrentUser = Depends(get_current_user)
):
    if not user.demo:
        raise HTTPException(
            403,
            "Only the demo account can be reset."
        )

    forget_demo(user.id)

    return {"ok": True}

DB_TABLES = ["profiles", "evidence", "exam_sessions", "exam_results", "challenge_attempts", "github_repositories",
             "notifications", "user_settings", "interview_sessions", "learning_progress", "saved_jobs"]


@router.get("/health/db")
async def health_db():
    """Development-only self-test. It never shows a key, only what KIND of key it is."""
    if settings.app_env == "production":
        raise HTTPException(404, "Not found.")
    key = settings.supabase_service_role_key.strip()
    kind = ("missing" if not key else "secret" if key.startswith("sb_secret_")
            else "PUBLISHABLE - wrong key for the backend" if key.startswith("sb_publishable_")
            else "legacy-jwt" if key.startswith("eyJ") else "unknown format")
    out = {"url_set": bool(settings.supabase_url), "key_kind": kind,
           "same_as_publishable_key": bool(key) and key == settings.supabase_anon_key.strip(), "tables": {}}
    if not (settings.supabase_url and key):
        out["verdict"] = "The backend is using MEMORY, not Supabase. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env, then restart."
        return out
    headers = {"apikey": key}
    if not key.startswith("sb_"):
        headers["Authorization"] = f"Bearer {key}"
    base = settings.supabase_url.strip().rstrip("/")
    async with httpx.AsyncClient(timeout=10) as c:
        for t in DB_TABLES:
            try:
                r = await c.get(f"{base}/rest/v1/{t}", params={"select": "*", "limit": "1"}, headers=headers)
                out["tables"][t] = "ok" if r.status_code == 200 else f"HTTP {r.status_code}: {r.text[:200]}"
            except httpx.HTTPError as e:
                out["tables"][t] = f"network error: {type(e).__name__}"
    out["verdict"] = "All tables reachable." if all(v == "ok" for v in out["tables"].values()) else "See the tables that are not ok."
    return out