from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..core.challenges import CHALLENGES, GROUPS, public
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user, limit_ai
from ..services import competency as comp
from ..services.evaluate import evaluate, static_checks

router = APIRouter(prefix="/api/challenges")


class CodeIn(BaseModel):
    code: str = Field(max_length=6000)


class SubmitIn(CodeIn):
    explanation: str = Field(default="", max_length=2000)
    seconds: int = Field(default=0, ge=0, le=86400)


def _get(cid: str) -> dict:
    ch = CHALLENGES.get(cid)
    if not ch:
        raise HTTPException(404, "Challenge not found.")
    return ch


async def _attempts(db, uid, competency):
    rows = await db.select("challenge_attempts", uid, order="created_at")
    return [a for a in rows if CHALLENGES.get(a["challenge_key"], {}).get("competency") == competency]


@router.get("/next")
async def next_challenge(competency: Literal["Debugging", "Testing", "Transfer"] | None = Query(None),
                         user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    states = await comp.competency_states(db, user.id)
    target = competency or min(GROUPS, key=lambda k: comp.PRIORITY[states[k]["state"]])  # weakest first
    done = await _attempts(db, user.id, target)
    seen = {a["challenge_key"] for a in done}
    variants = sorted((i for i, c in CHALLENGES.items() if c["competency"] == target), key=lambda i: CHALLENGES[i]["variant"])
    pick = next((i for i in variants if i not in seen), variants[len(done) % len(variants)])
    return {**public(pick), "is_retest": bool(done)}


@router.post("/{cid}/check")
async def check(cid: str, body: CodeIn, user: CurrentUser = Depends(get_current_user)):
    """Static checks only. Code is never executed on the server."""
    return {"checks": static_checks(_get(cid), body.code), "mode": "static-only"}


@router.post("/{cid}/submit")
async def submit(cid: str, body: SubmitIn, user: CurrentUser = Depends(limit_ai)):
    ch, db = _get(cid), db_for(user)
    key = ch["competency"]
    before = (await comp.competency_states(db, user.id))[key]["state"]
    prior = await _attempts(db, user.id, key)
    ev = await evaluate(ch, body.code, body.explanation)
    await db.insert("challenge_attempts", {"user_id": user.id, "challenge_key": cid, "response": body.code,
                                           "evaluation": {**ev, "explanation": body.explanation, "seconds": body.seconds}})
    await db.insert("evidence", {"user_id": user.id, "competency": key, "level": ev["level"],
                                 "confidence": ev["confidence"], "source_type": "challenge", "source_ref": cid,
                                 "summary": f"{ch['title']}: {ev['level_label']}" + ("" if ev["source"] == "ai" else " (demo heuristic)"),
                                 "details": {"source": ev["source"]}})
    after = (await comp.competency_states(db, user.id))[key]["state"]
    comparison = ({"previous_level": prior[-1]["evaluation"]["level"], "new_level": ev["level"]} if prior else None)
    return {**ev, "state_before": before, "state_after": after, "comparison": comparison}