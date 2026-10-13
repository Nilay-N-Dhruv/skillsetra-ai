"""Role history and Opportunity Radar. Everything is derived from saved evidence and assessments."""
from fastapi import APIRouter, Depends, Query

from ..core import catalog
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services import competency as comp
from ..services.role_fit import radar, role_history

router = APIRouter(prefix="/api")


@router.get("/roles/history")
async def roles_history(user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    prof = (await db.select("profiles", user.id) or [{}])[0]
    sessions = {s["id"]: s for s in await db.select("exam_sessions", user.id)}
    results = await db.select("exam_results", user.id)
    states = await comp.competency_states(db, user.id)
    switches = await db.select("role_switches", user.id, order="created_at", desc=True, limit=20)
    return {"items": role_history(catalog.ROLES, results, sessions, states, prof.get("target_role")),
            "switches": [{"from": s["from_role"], "to": s["to_role"], "at": s["created_at"]} for s in switches],
            "note": ("Assessment % is the share of questions you answered correctly in a full assessment for that role. "
                     "Evidence coverage is the share of that role's skills your evidence currently supports, counting all your activity.")}


@router.get("/radar")
async def opportunity_radar(weekly_hours: int = Query(6, ge=1, le=40), user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    prof = (await db.select("profiles", user.id) or [{}])[0]
    states = await comp.competency_states(db, user.id)
    return radar(states, catalog.ROLES, prof.get("target_role"), weekly_hours)