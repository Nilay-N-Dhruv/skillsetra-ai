"""Skill DNA, Proof of Growth and Career Time Machine. All three read saved evidence and use no AI."""
from typing import Literal

from fastapi import APIRouter, Depends, Query

from ..core import catalog
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services import competency as comp
from ..services.growth import build_report, overview, usable
from ..services.skill_dna import compute_dna
from ..services.timemachine import compare_roles

router = APIRouter(prefix="/api")
RoleName = Literal[tuple(catalog.ROLES)]
CompName = Literal[tuple(catalog.ALL_KEYS)]


@router.get("/skill-dna")
async def skill_dna(user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    return compute_dna(await db.select("evidence", user.id), await db.select("exam_results", user.id))


@router.get("/growth")
async def growth_list(user: CurrentUser = Depends(get_current_user)):
    evidence = await db_for(user).select("evidence", user.id)
    return {"items": overview(evidence, catalog.ALL_KEYS)}


@router.get("/growth/report")
async def growth_report(competency: CompName = Query(...), user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    prof = (await db.select("profiles", user.id) or [{}])[0]
    evidence = await db.select("evidence", user.id)
    progress = await db.select("learning_progress", user.id)
    report = build_report(competency, prof.get("target_role"), usable(evidence, competency),
                          progress, catalog.modules_for(competency))
    return {**report, "competency": competency, "learner": prof.get("name") or "Learner"}


@router.get("/career/compare")
async def career_compare(target: RoleName = Query(...), origin: RoleName | None = Query(None),
                         user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    prof = (await db.select("profiles", user.id) or [{}])[0]
    start = origin or prof.get("target_role") or "ML Engineer"
    states = await comp.competency_states(db, user.id)
    return compare_roles(start, target, states, catalog.ROLES, catalog.resources_for)