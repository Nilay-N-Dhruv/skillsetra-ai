"""Skill Evidence Graph endpoint. Reads existing evidence; creates nothing."""
from fastapi import APIRouter, Depends

from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services.evidence_graph import build_graph

router = APIRouter(prefix="/api")


@router.get("/evidence-graph")
async def evidence_graph(user: CurrentUser = Depends(get_current_user)):
    return build_graph(await db_for(user).select("evidence", user.id))