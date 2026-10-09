from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..ai.provider import ai_source, run_text
from ..core import catalog
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user, limit_ai
from ..services import competency as comp
from ..services.notify import notify

router = APIRouter(prefix="/api/learning")

SkillName = Literal[tuple(catalog.ALL_KEYS)]


class ProgressIn(BaseModel):
    skill: SkillName
    key: str = Field(pattern=r"^(resource-[0-9]{1,2}|project)$")
    done: bool


class AdviceIn(BaseModel):
    skill: SkillName


@router.get("/resources")
async def resources(
    skill: str | None = Query(default=None),
    user: CurrentUser = Depends(get_current_user),
):
    """
    Return the complete user-provided resource library.

    Resources are maintained by the existing catalog module.
    No resource records are stored in the database.
    """

    db = db_for(user)

    prof = (await db.select("profiles", user.id) or [{}])[0]
    role = prof.get("target_role")

    if not role:
        return {
            "role": None,
            "skills": [],
            "items": [],
        }

    role_skills = list(catalog.ROLES.get(role, []))

    if skill and skill not in role_skills and skill not in catalog.ALL_KEYS:
        raise HTTPException(
            404,
            "That skill or topic is not available."
        )

    selected = skill or None

    items = []

    if selected:
        resources_for_skill = catalog.resources_for(selected)
        for i, resource in enumerate(resources_for_skill):
            items.append(
                {
                    **resource,
                    "key": f"resource-{i}",
                    "for": selected,
                }
            )
    else:
        seen = set()

        for topic in role_skills:
            for i, resource in enumerate(catalog.resources_for(topic)):
                url = resource.get("url")

                if not url or url in seen:
                    continue

                seen.add(url)

                items.append(
                    {
                        **resource,
                        "key": f"resource-{len(items)}",
                        "for": topic,
                    }
                )

    return {
        "role": role,
        "skills": role_skills,
        "items": items,
    }


@router.post("/progress")
async def progress(
    body: ProgressIn,
    user: CurrentUser = Depends(get_current_user),
):
    keys = [
        m["key"]
        for m in catalog.modules_for(body.skill)
    ]

    if body.key not in keys:
        raise HTTPException(
            404,
            "That learning item does not exist."
        )

    db = db_for(user)
    step = f"{body.skill}:{body.key}"

    await db.delete(
        "learning_progress",
        user.id,
        step_key=step,
    )

    if body.done:
        await db.insert(
            "learning_progress",
            {
                "user_id": user.id,
                "step_key": step,
            },
        )

        have = {
            r["step_key"]
            for r in await db.select(
                "learning_progress",
                user.id,
            )
        }

        if all(
            f"{body.skill}:{k}" in have
            for k in keys
        ):
            await notify(
                db,
                user.id,
                "learning",
                f"Ready to re-test {body.skill}",
                "You finished every learning item. "
                "A re-test turns the learning into evidence.",
                "/roadmap",
            )

    return {"ok": True}


@router.post("/advice")
async def advice(
    body: AdviceIn,
    user: CurrentUser = Depends(limit_ai),
):
    s = (
        await comp.competency_states(
            db_for(user),
            user.id,
        )
    )[body.skill]

    system = (
        "You write 2-3 sentences of encouraging, "
        "concrete study advice. No links. Plain text. "
        "Never claim the learner has skills they have "
        "not shown."
    )

    text = await run_text(
        system,
        (
            f"Skill: {body.skill}. "
            f"Current evidence state: {s['state']} "
            f"({s['count']} evidence items)."
        ),
    )

    if text:
        return {
            "text": text[:800],
            "source": ai_source(),
        }

    return {
        "source": "demo-template",
        "text": (
            f"Your evidence for {body.skill} is "
            f"'{s['state']}'. Work through the learning "
            "items below, build the small project task, "
            "then re-test."
        ),
    }