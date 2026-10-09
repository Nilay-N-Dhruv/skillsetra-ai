"""Role assessment. Questions are chosen and graded on the SERVER."""
import random
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core import catalog
from ..core.db import db_for
from ..core.questions import QUESTIONS
from ..core.security import CurrentUser, get_current_user
from ..services.notify import notify

router = APIRouter(prefix="/api/exam")
RoleName = Literal[tuple(catalog.ROLES)]
SkillName = Literal[tuple(catalog.ROLE_SKILLS)]
QMAP = {q["id"]: q for q in QUESTIONS}


class StartIn(BaseModel):
    role: RoleName
    skill: SkillName | None = None          # set for a focused re-test of one skill


class SubmitIn(BaseModel):
    session_id: str = Field(
        pattern=r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    )
    answers: dict[str, int] = Field(max_length=40)


def public(q):                              # NEVER send "answer" or "why" before submit
    return {k: q[k] for k in ("id", "prompt", "options", "dimension", "level")}


def level_from(correct: int, total: int) -> int:
    pct = correct / total
    return 3 if pct >= 0.85 else 2 if pct >= 0.6 else 1 if pct > 0 else 0


@router.post("/start")
async def start(body: StartIn, user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)

    pool = [
        q for q in QUESTIONS
        if q["role"] == body.role
        and (not body.skill or q["skill"] == body.skill)
    ]

    if not pool:
        raise HTTPException(
            404,
            "No questions are available for this selection yet."
        )

    seen = {
        qid
        for r in await db.select("exam_results", user.id, role=body.role)
        for qid in r["answers"]
    }

    new = [q for q in pool if q["id"] not in seen]
    old = [q for q in pool if q["id"] in seen]

    random.shuffle(new)
    random.shuffle(old)

    size = 6 if body.skill else 10
    picked = (new + old)[:size]             # unseen questions first, then repeats if needed

    sess = await db.insert(
        "exam_sessions",
        {
            "user_id": user.id,
            "role": body.role,
            "skill": body.skill,
            "question_ids": [q["id"] for q in picked],
        }
    )

    return {
        "session_id": sess["id"],
        "role": body.role,
        "total": len(picked),
        "questions": [public(q) for q in picked],
    }


@router.post("/submit")
async def submit(
    body: SubmitIn,
    user: CurrentUser = Depends(get_current_user)
):
    db = db_for(user)

    sess = await db.select(
        "exam_sessions",
        user.id,
        id=body.session_id
    )

    if not sess:
        raise HTTPException(
            404,
            "Exam session not found."
        )

    if await db.select(
        "exam_results",
        user.id,
        session_id=body.session_id
    ):
        raise HTTPException(
            409,
            "This exam was already submitted."
        )

    ids = sess[0]["question_ids"]

    if (
        set(body.answers) - set(ids)
        or any(not 0 <= v <= 3 for v in body.answers.values())
    ):
        raise HTTPException(
            422,
            "Some of the answers sent are invalid."
        )

    review, per_dim, per_skill, per_key = [], {}, {}, {}

    for qid in ids:
        q, chosen = QMAP[qid], body.answers.get(qid)
        ok = chosen == q["answer"]

        for bucket, key in (
            (per_dim, q["dimension"]),
            (per_skill, q["skill"])
        ):
            b = bucket.setdefault(
                key,
                {"correct": 0, "total": 0}
            )
            b["total"] += 1
            b["correct"] += ok

        for key in {
            q["dimension"],
            q["skill"]
        }:          # a set: one question counts once per key
            per_key.setdefault(key, []).append(ok)

        review.append({
            "id": qid,
            "prompt": q["prompt"],
            "options": q["options"],
            "chosen": chosen,
            "correct_index": q["answer"],
            "correct": ok,
            "why": q["why"],
            "dimension": q["dimension"],
            "skill": q["skill"],
        })

    correct = sum(r["correct"] for r in review)

    await db.insert(
        "exam_results",
        {
            "user_id": user.id,
            "session_id": body.session_id,
            "role": sess[0]["role"],
            "correct": correct,
            "total": len(ids),
            "per_dimension": per_dim,
            "per_skill": per_skill,
            "answers": body.answers,
        }
    )

    for key, oks in per_key.items():                      # exam results become evidence
        c, t = sum(oks), len(oks)

        await db.insert(
            "evidence",
            {
                "user_id": user.id,
                "competency": key,
                "level": level_from(c, t),
                "confidence": 0.5,
                "source_type": "exam",
                "source_ref": body.session_id,
                "summary": f"Assessment: {c} of {t} correct",
                "details": {
                    "correct": c,
                    "total": t,
                },
            }
        )

    await notify(
        db,
        user.id,
        "assessment",
        "Assessment completed",
        f"{correct} of {len(ids)} answered correctly for {sess[0]['role']}.",
        "/dashboard"
    )

    return {
        "correct": correct,
        "total": len(ids),
        "pct": round(100 * correct / len(ids)),
        "review": review,
        "per_dimension": per_dim,
        "per_skill": per_skill,
    }