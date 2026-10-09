"""Opportunities from the public Remotive API. Keyword matching, no AI. No jobs are ever invented."""
import re
import time
from datetime import date

import httpx
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel, Field

from ..core import catalog
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services import competency as comp
from ..services.notify import notify

router = APIRouter(prefix="/api/jobs")
SOURCE = "https://remotive.com/api/remote-jobs"
OK_URL = r"^https://remotive\.com/.{0,400}$"
_cache: dict[str, tuple[float, list]] = {}
ROLE_QUERY = {"ML Engineer": "machine learning", "AI Engineer": "ai", "Data Scientist": "data scientist", "Data Analyst": "data analyst",
              "Backend Developer": "backend", "Full-Stack Developer": "full stack", "Frontend Developer": "frontend",
              "Python Developer": "python", "DevOps Engineer": "devops", "Cybersecurity": "security"}


class SaveIn(BaseModel):
    id: str = Field(pattern=r"^[A-Za-z0-9_-]{1,40}$")
    title: str = Field(min_length=1, max_length=200)
    company: str = Field(default="", max_length=120)
    url: str = Field(pattern=OK_URL)


async def fetch_jobs(search: str) -> list[dict]:
    hit = _cache.get(search)
    if hit and hit[0] > time.time():
        return hit[1]
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(SOURCE, params={"search": search, "limit": 40})
        r.raise_for_status()
        raw = r.json().get("jobs", [])
    except (httpx.HTTPError, ValueError, AttributeError):
        raise HTTPException(502, "We couldn't load opportunities right now. Please try again later.")
    jobs = []
    for j in raw:
        url = str(j.get("url", ""))
        if not re.match(OK_URL, url):
            continue                                            # only show links to the source site
        text = " ".join([str(j.get("title", "")), " ".join(map(str, j.get("tags", []))), re.sub(r"<[^>]+>", " ", str(j.get("description", ""))[:6000])])
        jobs.append({"id": str(j.get("id")), "title": str(j.get("title", ""))[:200], "company": str(j.get("company_name", ""))[:120],
                     "url": url, "location": str(j.get("candidate_required_location", ""))[:100], "type": str(j.get("job_type", "")),
                     "posted": str(j.get("publication_date", ""))[:10], "tags": [str(t)[:30] for t in j.get("tags", [])][:6],
                     "salary": str(j.get("salary", ""))[:80], "text": text.lower()})
    _cache[search] = (time.time() + 6 * 3600, jobs)
    return jobs


def match(job: dict, skills: list[str]) -> tuple[list[str], list[str]]:
    found = [s for s in skills if re.search(r"(?<![a-z0-9])" + re.escape(s.lower()) + r"(?![a-z0-9])", job["text"])]
    return found, [s for s in skills if s not in found]


@router.get("")
async def opportunities(q: str | None = Query(None, max_length=40, pattern=r"^[A-Za-z0-9 +#./-]*$"),
                        user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    prof = (await db.select("profiles", user.id) or [{}])[0]
    role = prof.get("target_role") or "ML Engineer"
    skills = catalog.ROLES[role]
    states = await comp.competency_states(db, user.id)
    saved = {s["job_id"] for s in await db.select("saved_jobs", user.id)}
    items = []
    for j in await fetch_jobs((q or "").strip() or ROLE_QUERY[role]):
        found, missing = match(j, skills)
        items.append({**{k: v for k, v in j.items() if k != "text"}, "matched": found, "missing": missing,
                      "have": [s for s in found if states[s]["state"] in ("Demonstrated", "Developing")],
                      "pct": round(100 * len(found) / len(skills)), "saved": j["id"] in saved})
    items.sort(key=lambda x: (-x["pct"], x["posted"]), reverse=False)
    items = items[:30]
    if items and items[0]["pct"] >= 50:                          # at most one job notification per day
        last = await db.select("notifications", user.id, kind="job", order="created_at", desc=True, limit=1)
        if not last or str(last[0]["created_at"])[:10] != date.today().isoformat():
            await notify(db, user.id, "job", "Opportunities match your skills", f"{items[0]['title']} at {items[0]['company']} matches {items[0]['pct']}% of {role} skills.", "/jobs")
    return {"role": role, "query": q or ROLE_QUERY[role], "items": items,
            "note": "Match is a keyword comparison between this role's skills and the listing text. It is not a hiring prediction.",
            "attribution": "Job listings via Remotive (remotive.com)"}


@router.get("/saved")
async def saved(user: CurrentUser = Depends(get_current_user)):
    rows = await db_for(user).select("saved_jobs", user.id, order="created_at", desc=True)
    return {"items": [{"id": r["job_id"], "title": r["title"], "company": r["company"], "url": r["url"]} for r in rows]}


@router.post("/save")
async def save(body: SaveIn, user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    await db.delete("saved_jobs", user.id, job_id=body.id)
    await db.insert("saved_jobs", {"user_id": user.id, "job_id": body.id, "title": body.title, "company": body.company, "url": body.url})
    return {"ok": True}


@router.delete("/save/{job_id}")
async def unsave(job_id: str = Path(pattern=r"^[A-Za-z0-9_-]{1,40}$"), user: CurrentUser = Depends(get_current_user)):
    await db_for(user).delete("saved_jobs", user.id, job_id=job_id)
    return {"ok": True}