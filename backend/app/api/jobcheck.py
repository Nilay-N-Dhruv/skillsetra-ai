"""Job Reality Check endpoints. The pasted text is analysed and never stored; only the result is saved, on request."""
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field

from ..core import catalog
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services.jobcheck import analyze

router = APIRouter(prefix="/api/job-check")
UUID = r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
MAX_SAVED = 30


class AnalyzeIn(BaseModel):
    title: str = Field(default="Job posting", max_length=120)
    company: str = Field(default="", max_length=120)
    text: str = Field(min_length=50, max_length=8000)
    save: bool = False


@router.post("/analyze")
async def run(body: AnalyzeIn, user: CurrentUser = Depends(get_current_user)):
    if len(body.text.strip()) < 50:
        raise HTTPException(422, "Paste at least a few sentences of the job description.")
    db = db_for(user)
    title = body.title.strip() or "Job posting"
    company = body.company.strip()
    result = analyze(body.text, await db.select("evidence", user.id), catalog.resources_for)   # the text is only read as data
    saved_id = None
    if body.save:
        if len(await db.select("job_analyses", user.id)) >= MAX_SAVED:
            raise HTTPException(409, "You have 30 saved analyses. Delete one before saving another.")
        row = await db.insert("job_analyses", {"user_id": user.id, "title": title, "company": company,
                                               "score": result["score"], "result": result})
        saved_id = row["id"]
    return {**result, "title": title, "company": company, "saved_id": saved_id}


@router.get("/saved")
async def saved(user: CurrentUser = Depends(get_current_user)):
    rows = await db_for(user).select("job_analyses", user.id, order="created_at", desc=True, limit=MAX_SAVED)
    return {"items": [{"id": r["id"], "title": r["title"], "company": r["company"], "score": r["score"],
                       "created_at": r["created_at"], "result": r["result"]} for r in rows]}


@router.delete("/saved/{jid}")
async def delete_saved(jid: str = Path(pattern=UUID), user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    if not await db.select("job_analyses", user.id, id=jid):          # also hides other users' ids: they simply "don't exist"
        raise HTTPException(404, "Analysis not found.")
    await db.delete("job_analyses", user.id, id=jid)
    return {"ok": True}