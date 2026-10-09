from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from ..core.challenges import CHALLENGES, GROUPS, HINTS, public
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user, limit_ai
from ..services import competency as comp
from ..services.evaluate import evaluate, static_checks
from ..services.notify import notify

router = APIRouter(prefix="/api/challenges")


class CodeIn(BaseModel):
    code: str = Field(max_length=6000)


class SubmitIn(CodeIn):
    explanation: str = Field(default="", max_length=2000)
    seconds: int = Field(default=0, ge=0, le=86400)


def _get(cid: str) -> dict:
    ch = CHALLENGES.get(cid)

    if not ch:
        raise HTTPException(
            404,
            "Challenge not found."
        )

    return ch


async def _attempts(db, uid, competency):
    rows = await db.select(
        "challenge_attempts",
        uid,
        order="created_at"
    )

    return [
        a
        for a in rows
        if CHALLENGES.get(
            a["challenge_key"],
            {}
        ).get("competency") == competency
    ]


@router.get("/next")
async def next_challenge(competency: Literal["Debugging", "Testing", "Transfer"] | None = Query(None),
                         id: str | None = Query(None, pattern=r"^[a-z]+-[0-9]$"),
                         user: CurrentUser = Depends(get_current_user)):
    if id:                                                    # retry a specific problem
        if id not in CHALLENGES:
            raise HTTPException(404, "Challenge not found.")
        return {**public(id), "is_retest": True}
    db = db_for(user)
    states = await comp.competency_states(db, user.id)
    target = competency or min(GROUPS, key=lambda k: comp.PRIORITY[states[k]["state"]])  # weakest first
    done = await _attempts(db, user.id, target)
    seen = {a["challenge_key"] for a in done}
    variants = sorted((i for i, c in CHALLENGES.items() if c["competency"] == target), key=lambda i: CHALLENGES[i]["variant"])
    pick = next((i for i in variants if i not in seen), variants[len(done) % len(variants)])
    return {**public(pick), "is_retest": bool(done)}

@router.get("/history")
async def history(user: CurrentUser = Depends(get_current_user)):
    rows = await db_for(user).select("challenge_attempts", user.id, order="created_at", desc=True, limit=20)
    return {"items": [{"id": a["id"], "title": CHALLENGES.get(a["challenge_key"], {}).get("title", "Challenge"),
                       "level": (a.get("evaluation") or {}).get("level"), "created_at": a["created_at"]} for a in rows]}


@router.get("/{cid}/hint")
async def hint(cid: str, user: CurrentUser = Depends(get_current_user)):
    _get(cid)
    return {"hint": HINTS.get(cid, "Break the problem into smaller steps and test each one.")}

@router.post("/{cid}/check")
async def check(
    cid: str,
    body: CodeIn,
    user: CurrentUser = Depends(get_current_user)
):
    """Static checks only. Code is never executed on the server."""
    return {
        "checks": static_checks(
            _get(cid),
            body.code
        ),
        "mode": "static-only"
    }


@router.post("/{cid}/submit")
async def submit(
    cid: str,
    body: SubmitIn,
    user: CurrentUser = Depends(limit_ai)
):
    ch, db = _get(cid), db_for(user)

    key = ch["competency"]

    before = (
        await comp.competency_states(
            db,
            user.id
        )
    )[key]["state"]

    prior = await _attempts(
        db,
        user.id,
        key
    )

    ev = await evaluate(
        ch,
        body.code,
        body.explanation
    )

    await db.insert(
        "challenge_attempts",
        {
            "user_id": user.id,
            "challenge_key": cid,
            "response": body.code,
            "evaluation": {
                **ev,
                "explanation": body.explanation,
                "seconds": body.seconds,
            },
        }
    )

    await db.insert(
        "evidence",
        {
            "user_id": user.id,
            "competency": key,
            "level": ev["level"],
            "confidence": ev["confidence"],
            "source_type": "challenge",
            "source_ref": cid,
            "summary": (
                f"{ch['title']}: {ev['level_label']}"
                + (
                    ""
                    if ev["source"] != "demo-heuristic"
                    else " (demo heuristic)"
                )
            ),
            "details": {
                "source": ev["source"]
            },
        }
    )

    after = (
        await comp.competency_states(
            db,
            user.id
        )
    )[key]["state"]

    comparison = (
        {
            "previous_level": prior[-1]["evaluation"]["level"],
            "new_level": ev["level"],
        }
        if prior
        else None
    )

    await notify(
        db,
        user.id,
        "assessment",
        "Challenge evaluated",
        f"{ch['title']}: {ev['level_label']}",
        "/challenges"
    )

    return {
        **ev,
        "state_before": before,
        "state_after": after,
        "comparison": comparison,
    }