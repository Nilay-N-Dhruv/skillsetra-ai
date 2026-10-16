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
DifficultyLevel = Literal["Beginner", "Intermediate", "Advanced", "Senior"]

QMAP = {q["id"]: q for q in QUESTIONS}

class StartIn(BaseModel):
    role: RoleName
    level: DifficultyLevel = "Beginner"
    skill: SkillName | None = None


class SubmitIn(BaseModel):
    session_id: str = Field(
        pattern=(
            r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-"
            r"[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
            r"[0-9a-fA-F]{12}$"
        )
    )
    answers: dict[str, int] = Field(max_length=40)


def public(q, order=None):
    """Never send the answer or explanation before submission."""
    result = {
        key: q[key]
        for key in ("id", "prompt", "dimension", "level")
    }
    order = order or list(range(len(q["options"])))
    result["options"] = [q["options"][i] for i in order]
    return result


def level_from(correct: int, total: int) -> int:
    if total <= 0:
        return 0

    pct = correct / total
    return 3 if pct >= 0.85 else 2 if pct >= 0.6 else 1 if pct > 0 else 0


def pick_questions(role, level, skill, seen, target):
    """Pick up to `target` questions for a role at EXACTLY the requested level (Beginner never gets Intermediate).

    Questions the learner has not seen before come first, then random order.
    A skill-focused test only uses that skill.
    """
    want = str(level).strip().casefold()
    pool = [
        q for q in QUESTIONS
        if q.get("role") == role
        and str(q.get("level", "")).strip().casefold() == want
        and (skill is None or q.get("skill") == skill)
    ]
    pool.sort(key=lambda q: (q["id"] in seen, random.random()))
    return pool[:target]


@router.post("/start")
async def start(
    body: StartIn,
    user: CurrentUser = Depends(get_current_user),
):
    db = db_for(user)

    target = 6 if body.skill else 10

    # Prefer questions this learner has not seen in earlier attempts for this role.
    previous_results = await db.select("exam_results", user.id, role=body.role)
    seen = {
        qid
        for result in previous_results
        for qid in (result.get("answers") or {})
    }

    picked = pick_questions(body.role, body.level, body.skill, seen, target)

    if not picked:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No {body.level} questions are available for '{body.role}'"
                + (f" with skill '{body.skill}'." if body.skill else ".")
            ),
        )

    # Be honest when the bank is smaller than a full test at this level.
    mix = {body.level: len(picked)}
    notice = None
    if len(picked) < target:
        notice = (f"Only {len(picked)} {body.level} question{'s' if len(picked) != 1 else ''} are available for "
                  f"{body.role}{' (' + body.skill + ')' if body.skill else ''} right now.")

    # Shuffle options independently and persist their order for grading.
    option_orders = {}

    for q in picked:
        order = list(range(len(q["options"])))
        random.shuffle(order)
        option_orders[q["id"]] = order

    sess = await db.insert(
        "exam_sessions",
        {
            "user_id": user.id,
            "role": body.role,
            "skill": body.skill,
            "question_ids": [q["id"] for q in picked],
            "option_orders": option_orders,
        },
    )

    return {
        "session_id": sess["id"],
        "role": body.role,
        "level": body.level,
        "total": len(picked),
        "target": target,
        "level_mix": mix,
        "notice": notice,
        "questions": [
            public(q, option_orders[q["id"]])
            for q in picked
        ],
    }


@router.post("/submit")
async def submit(
    body: SubmitIn,
    user: CurrentUser = Depends(get_current_user),
):
    db = db_for(user)

    sessions = await db.select(
        "exam_sessions",
        user.id,
        id=body.session_id,
    )

    if not sessions:
        raise HTTPException(
            status_code=404,
            detail="Exam session not found.",
        )

    sess = sessions[0]

    existing_results = await db.select(
        "exam_results",
        user.id,
        session_id=body.session_id,
    )

    if existing_results:
        raise HTTPException(
            status_code=409,
            detail="This exam was already submitted.",
        )

    ids = sess["question_ids"]

    if set(body.answers) != set(ids):
        raise HTTPException(
            status_code=422,
            detail="Please answer every question before submitting.",
        )

    if any(
        not isinstance(value, int)
        or isinstance(value, bool)
        or not 0 <= value <= 3
        for value in body.answers.values()
    ):
        raise HTTPException(
            status_code=422,
            detail="Some of the answers sent are invalid.",
        )

    review = []
    per_dim = {}
    per_skill = {}
    per_key = {}
    option_orders = sess.get("option_orders") or {}

    for qid in ids:
        q = QMAP.get(qid)

        if q is None:
            raise HTTPException(
                status_code=500,
                detail=f"Question '{qid}' is missing from the question bank.",
            )

        chosen = body.answers[qid]
        order = option_orders.get(
            qid,
            list(range(len(q["options"]))),
        )

        if sorted(order) != list(range(len(q["options"]))):
            raise HTTPException(
                status_code=500,
                detail=f"Invalid option mapping for question '{qid}'.",
            )

        original_chosen = order[chosen]
        correct_index = order.index(q["answer"])
        is_correct = original_chosen == q["answer"]

        for bucket, key in (
            (per_dim, q["dimension"]),
            (per_skill, q["skill"]),
        ):
            stats = bucket.setdefault(
                key,
                {"correct": 0, "total": 0},
            )
            stats["total"] += 1
            stats["correct"] += int(is_correct)

        for key in {q["dimension"], q["skill"]}:
            per_key.setdefault(key, []).append(is_correct)

        review.append({
            "id": qid,
            "prompt": q["prompt"],
            "options": [q["options"][i] for i in order],
            "chosen": chosen,
            "correct_index": correct_index,
            "correct": is_correct,
            "why": q["why"],
            "dimension": q["dimension"],
            "skill": q["skill"],
            "level": q["level"],
        })

    correct = sum(item["correct"] for item in review)
    total = len(ids)

    await db.insert(
        "exam_results",
        {
            "user_id": user.id,
            "session_id": body.session_id,
            "role": sess["role"],
            "correct": correct,
            "total": total,
            "per_dimension": per_dim,
            "per_skill": per_skill,
            "answers": body.answers,
        },
    )

    for key, outcomes in per_key.items():
        correct_count = sum(outcomes)
        count = len(outcomes)

        await db.insert(
            "evidence",
            {
                "user_id": user.id,
                "competency": key,
                "level": level_from(correct_count, count),
                "confidence": 0.5,
                "source_type": "exam",
                "source_ref": body.session_id,
                "summary": (
                    f"Assessment: {correct_count} of {count} correct"
                ),
                "details": {
                    "correct": correct_count,
                    "total": count,
                },
            },
        )

    await notify(
        db,
        user.id,
        "assessment",
        "Assessment completed",
        f"{correct} of {total} answered correctly for {sess['role']}.",
        "/dashboard",
    )

    return {
        "correct": correct,
        "total": total,
        "pct": round(100 * correct / total) if total else 0,
        "review": review,
        "per_dimension": per_dim,
        "per_skill": per_skill,
    }