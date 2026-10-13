"""Header search over the signed-in user's own data."""
from fastapi import APIRouter, Depends, Query

from ..core import catalog
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services.search import search_all

router = APIRouter(prefix="/api")


@router.get("/search")
async def search(q: str = Query(..., min_length=2, max_length=40, pattern=r"^[\w .+#/-]+$"),
                 user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    return search_all(q, await db.select("evidence", user.id), await db.select("interview_sessions", user.id),
                      await db.select("exam_results", user.id), await db.select("job_analyses", user.id), catalog.ROLES)