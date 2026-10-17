# # """Everything the dashboard needs, in one request."""
# # from fastapi import APIRouter, Depends

# # from ..core import catalog
# # from ..core.db import db_for
# # from ..core.security import CurrentUser, get_current_user
# # from ..services import competency as comp

# # router = APIRouter(prefix="/api")
# # GAP_STATES = ("Limited", "Needs Evidence", "Transfer Gap")
# # LEVEL = ["No evidence", "Limited", "Developing", "Demonstrated"]


# # @router.get("/dashboard")
# # async def dashboard(user: CurrentUser = Depends(get_current_user)):
# #     db = db_for(user)
# #     prof = (await db.select("profiles", user.id) or [{}])[0]
# #     role = prof.get("target_role")
# #     if not role:
# #         return {"stage": "choose_role"}
# #     sessions = {s["id"]: s for s in await db.select("exam_sessions", user.id)}
# #     results = [r for r in await db.select("exam_results", user.id, order="created_at", role=role)
# #                if not sessions.get(r["session_id"], {}).get("skill")]          # full exams only
# #     if not results:
# #         return {"stage": "take_exam", "role": role}

# #     latest, first = results[-1], results[0]
# #     pct = lambda r: round(100 * r["correct"] / r["total"])
# #     states = await comp.competency_states(db, user.id)                          # live: updates with any new evidence

# #     gaps = [{"key": d, "state": states[d]["state"], **v,
# #              "action": "Build a concrete artifact, practice in a changed context, then re-test."}
# #             for d, v in latest["per_dimension"].items() if d in states and states[d]["state"] in GAP_STATES]
# #     gaps.sort(key=lambda g: comp.PRIORITY[g["state"]])
# #     skills = [{"key": s, "state": states[s]["state"], "claimed": states[s]["claimed"],
# #                **latest["per_skill"].get(s, {"correct": 0, "total": 0})} for s in catalog.ROLES[role]]

# #     materials, seen = [], set()
# #     for g in gaps[:3]:
# #         for r in catalog.resources_for(g["key"])[:2]:
# #             if r["url"] not in seen:
# #                 seen.add(r["url"])
# #                 materials.append({**r, "for": g["key"]})

# #     # ---- master overview (all real data) ----
# #     done_iv = [i for i in await db.select("interview_sessions", user.id, order="created_at") if i["status"] == "done"]
# #     attempts = await db.select("challenge_attempts", user.id, order="created_at")
# #     prog = {r["step_key"] for r in await db.select("learning_progress", user.id)}
# #     saved = await db.select("saved_jobs", user.id)
# #     total = done = 0
# #     for k in catalog.ROLES[role]:
# #         if states[k]["state"] != "Demonstrated":
# #             mods = catalog.modules_for(k)
# #             total += len(mods)
# #             done += sum(f"{k}:{m['key']}" in prog for m in mods)
# #     ev = await db.select("evidence", user.id, order="created_at", desc=True, limit=8)
# #     recs = []
# #     if gaps:
# #         recs.append(f"Strengthen {gaps[0]['key']}: open the roadmap, finish a learning item, then re-test.")
# #     if not attempts:
# #         recs.append("Try an unknown-problem challenge to test how you handle a new situation.")
# #     if not done_iv:
# #         recs.append(f"Practice an AI interview for {role}.")
# #     if not saved:
# #         recs.append("Browse opportunities that match your skills.")
# #     overview = {
# #         "practice": {"attempts": len(attempts), "last": LEVEL[(attempts[-1].get("evaluation") or {}).get("level", 0)] if attempts else None},
# #         "interviews": {"count": len(done_iv), "last": (done_iv[-1].get("report") or {}).get("level_label") if done_iv else None},
# #         "learning": {"done": done, "total": total, "pct": round(100 * done / total) if total else 0},
# #         "jobs": {"saved": len(saved)},
# #         "activity": [{"when": e["created_at"], "text": f"{e['competency']}: {e['summary']}"} for e in ev],
# #         "recommendations": recs[:3]}

# #     return {"stage": "ready", "role": role, "name": prof.get("name", ""),
# #             "baseline": {"pct": pct(latest), "correct": latest["correct"], "total": latest["total"],
# #                          "delta": pct(latest) - pct(first), "attempts": len(results)},
# #             "gaps": gaps, "skills": skills, "materials": materials, "overview": overview,
# #             "radar": [v for v in states.values() if v["kind"] == "dimension"],
# #             "trend": [{"date": r["created_at"][:10], "pct": pct(r)} for r in results]}


# """Everything the dashboard needs, in one request."""

# from fastapi import APIRouter, Depends

# from ..core import catalog
# from ..core.db import db_for
# from ..core.security import CurrentUser, get_current_user
# from ..services import competency as comp

# router = APIRouter(prefix="/api")

# GAP_STATES = ("Limited", "Needs Evidence", "Transfer Gap")
# LEVEL = ["No evidence", "Limited", "Developing", "Demonstrated"]


# def score_pct(result):
#     total = int(result.get("total") or 0)
#     correct = int(result.get("correct") or 0)
#     return round(100 * correct / total) if total else 0


# def belongs_to_role(row, role):
#     """Only include explicitly role-associated records for role-specific stats."""
#     return row.get("role") == role


# @router.get("/dashboard")
# async def dashboard(user: CurrentUser = Depends(get_current_user)):
#     db = db_for(user)

#     profiles = await db.select("profiles", user.id)
#     profile = (profiles or [{}])[0]
#     role = profile.get("target_role")

#     if not role:
#         return {"stage": "choose_role"}

#     if role not in catalog.ROLES:
#         return {"stage": "choose_role"}

#     # Results are already filtered by authenticated user and active role.
#     sessions_list = await db.select("exam_sessions", user.id)
#     sessions = {row["id"]: row for row in sessions_list if row.get("id")}

#     role_results = await db.select(
#         "exam_results",
#         user.id,
#         order="created_at",
#         role=role,
#     )

#     # Exclude skill-focused tests from the overall baseline.
#     results = [
#         row
#         for row in role_results
#         if not sessions.get(row.get("session_id"), {}).get("skill")
#     ]

#     if not results:
#         return {
#             "stage": "take_exam",
#             "role": role,
#         }

#     # DB order is ascending because desc=False is the default.
#     first = results[0]
#     latest = results[-1]

#     # The competency service currently computes states from the user's
#     # evidence overall. Keep its established interface unchanged.
#     states = await comp.competency_states(db, user.id)

#     gaps = [
#         {
#             "key": dimension,
#             "state": states[dimension]["state"],
#             **details,
#             "action": (
#                 "Build a concrete artifact, practice in a changed context, "
#                 "then re-test."
#             ),
#         }
#         for dimension, details in (latest.get("per_dimension") or {}).items()
#         if dimension in states
#         and states[dimension]["state"] in GAP_STATES
#     ]

#     gaps.sort(key=lambda item: comp.PRIORITY[item["state"]])

#     # Restrict skills to the active role's catalog.
#     skills = [
#         {
#             "key": skill,
#             "state": states.get(skill, {}).get("state", "Needs Evidence"),
#             "claimed": states.get(skill, {}).get("claimed", False),
#             **(latest.get("per_skill") or {}).get(
#                 skill,
#                 {"correct": 0, "total": 0},
#             ),
#         }
#         for skill in catalog.ROLES[role]
#     ]

#     # Build learning recommendations from this role's latest assessment.
#     materials = []
#     seen_urls = set()

#     for gap in gaps[:3]:
#         for resource in catalog.resources_for(gap["key"])[:2]:
#             if resource["url"] not in seen_urls:
#                 seen_urls.add(resource["url"])
#                 materials.append(
#                     {
#                         **resource,
#                         "for": gap["key"],
#                     }
#                 )

#     # Load activity collections. Records with an explicit role are filtered
#     # to the active role; records without a role are not treated as role-specific.
#     all_interviews = await db.select(
#         "interview_sessions",
#         user.id,
#         order="created_at",
#     )
#     role_interviews = [
#         item
#         for item in all_interviews
#         if belongs_to_role(item, role) and item.get("status") == "done"
#     ]

#     all_attempts = await db.select(
#         "challenge_attempts",
#         user.id,
#         order="created_at",
#     )
#     role_attempts = [
#         item for item in all_attempts
#         if belongs_to_role(item, role)
#     ]

#     # Learning progress uses step keys such as "skill:module".
#     progress_rows = await db.select("learning_progress", user.id)
#     completed_steps = {
#         row.get("step_key")
#         for row in progress_rows
#         if row.get("step_key")
#     }

#     total_modules = 0
#     completed_modules = 0

#     for skill in catalog.ROLES[role]:
#         if states.get(skill, {}).get("state") == "Demonstrated":
#             continue

#         modules = catalog.modules_for(skill)
#         total_modules += len(modules)

#         completed_modules += sum(
#             f"{skill}:{module['key']}" in completed_steps
#             for module in modules
#         )

#     saved_jobs = await db.select("saved_jobs", user.id)

#     # Restrict recent evidence activity to competencies used by this role.
#     role_competencies = set(catalog.ROLES[role])
#     role_dimensions = set(latest.get("per_dimension") or {})
#     allowed_competencies = role_competencies | role_dimensions

#     evidence_rows = await db.select(
#         "evidence",
#         user.id,
#         order="created_at",
#         desc=True,
#         limit=100,
#     )

#     role_evidence = [
#         item
#         for item in evidence_rows
#         if item.get("competency") in allowed_competencies
#     ][:8]

#     recommendations = []

#     if gaps:
#         recommendations.append(
#             f"Strengthen {gaps[0]['key']}: open the roadmap, "
#             "finish a learning item, then re-test."
#         )

#     if not role_attempts:
#         recommendations.append(
#             "Try an unknown-problem challenge to test how you handle "
#             "a new situation in this role."
#         )

#     if not role_interviews:
#         recommendations.append(f"Practice an AI interview for {role}.")

#     if not saved_jobs:
#         recommendations.append(
#             "Browse opportunities that match your skills."
#         )

#     last_practice_level = None

#     if role_attempts:
#         evaluation = role_attempts[-1].get("evaluation") or {}
#         level = evaluation.get("level", 0)

#         if isinstance(level, int) and 0 <= level < len(LEVEL):
#             last_practice_level = LEVEL[level]

#     last_interview_level = None

#     if role_interviews:
#         last_interview_level = (
#             role_interviews[-1].get("report") or {}
#         ).get("level_label")

#     overview = {
#         "practice": {
#             "attempts": len(role_attempts),
#             "last": last_practice_level,
#         },
#         "interviews": {
#             "count": len(role_interviews),
#             "last": last_interview_level,
#         },
#         "learning": {
#             "done": completed_modules,
#             "total": total_modules,
#             "pct": (
#                 round(100 * completed_modules / total_modules)
#                 if total_modules
#                 else 0
#             ),
#         },
#         "jobs": {
#             "saved": len(saved_jobs),
#         },
#         "activity": [
#             {
#                 "when": item.get("created_at"),
#                 "text": (
#                     f"{item.get('competency', 'Competency')}: "
#                     f"{item.get('summary', 'Evidence updated')}"
#                 ),
#             }
#             for item in role_evidence
#             if item.get("created_at")
#         ],
#         "recommendations": recommendations[:3],
#     }

#     return {
#         "stage": "ready",
#         "role": role,
#         "name": profile.get("name", ""),
#         "baseline": {
#             "pct": score_pct(latest),
#             "correct": latest.get("correct", 0),
#             "total": latest.get("total", 0),
#             "delta": score_pct(latest) - score_pct(first),
#             "attempts": len(results),
#         },
#         "gaps": gaps,
#         "skills": skills,
#         "materials": materials,
#         "overview": overview,
#         "radar": [
#             value
#             for value in states.values()
#             if value.get("kind") == "dimension"
#         ],
#         "trend": [
#             {
#                 "date": str(result.get("created_at", ""))[:10],
#                 "pct": score_pct(result),
#             }
#             for result in results
#         ],
#     }


"""Everything the dashboard needs, in one request."""

from collections import defaultdict

from fastapi import APIRouter, Depends

from ..core import catalog
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services import competency as comp

router = APIRouter(prefix="/api")

GAP_STATES = ("Limited", "Needs Evidence", "Transfer Gap")
LEVEL = ["No evidence", "Limited", "Developing", "Demonstrated"]


def percentage(correct, total):
    """Calculate a rounded assessment percentage safely."""
    if not total:
        return 0
    return round(100 * correct / total)


def result_date(result):
    """Return a sortable timestamp string for a result."""
    return str(result.get("created_at") or "")


def result_role(result, sessions):
    """Resolve the role from the saved result or its session."""
    session = sessions.get(result.get("session_id"), {})
    return result.get("role") or session.get("role")


def is_full_exam(result, sessions):
    """Exclude skill-specific assessments from role history."""
    session = sessions.get(result.get("session_id"), {})
    return not session.get("skill")


def serialize_history_result(result, sessions):
    """Expose only the fields required by the dashboard history UI."""
    session = sessions.get(result.get("session_id"), {})

    correct = int(result.get("correct") or 0)
    total = int(result.get("total") or 0)

    return {
        "id": result.get("id"),
        "session_id": result.get("session_id"),
        "role": result.get("role") or session.get("role"),
        "correct": correct,
        "total": total,
        "pct": percentage(correct, total),
        "created_at": result.get("created_at"),
    }


@router.get("/dashboard")
async def dashboard(user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)

    # -------------------------------------------------------
    # Profile and current role
    # -------------------------------------------------------

    profiles = await db.select("profiles", user.id)
    prof = profiles[0] if profiles else {}
    role = prof.get("target_role")

    if not role:
        return {
            "stage": "choose_role",
            "role_history": [],
        }

    # -------------------------------------------------------
    # Assessment sessions and results across ALL roles
    # -------------------------------------------------------

    all_sessions = await db.select("exam_sessions", user.id)
    sessions = {
        session["id"]: session
        for session in all_sessions
        if session.get("id")
    }

    all_results = await db.select(
        "exam_results",
        user.id,
        order="created_at",
    )

    # Include full assessments only; skill-focused tests are excluded.
    full_results = [
        result
        for result in all_results
        if is_full_exam(result, sessions)
    ]

    # Group previous assessments by role.
    # The frontend filters out the current role and displays the rest.
    grouped_history = defaultdict(list)

    for result in full_results:
        result_role_name = result_role(result, sessions)

        if not result_role_name:
            continue

        grouped_history[result_role_name].append(
            serialize_history_result(result, sessions)
        )

    # Most recently assessed roles first.
    role_history = []

    for history_role, attempts in grouped_history.items():
        attempts.sort(key=result_date, reverse=True)

        role_history.extend(attempts)

    role_history.sort(key=result_date, reverse=True)

    # -------------------------------------------------------
    # Current-role full assessment results
    # -------------------------------------------------------

    results = [
        result
        for result in full_results
        if result_role(result, sessions) == role
    ]

    results.sort(key=result_date)

    if not results:
        return {
            "stage": "take_exam",
            "role": role,
            "name": prof.get("name", ""),
            "role_history": role_history,
        }

    latest = results[-1]
    first = results[0]

    latest_correct = int(latest.get("correct") or 0)
    latest_total = int(latest.get("total") or 0)

    latest_pct = percentage(latest_correct, latest_total)
    first_pct = percentage(
        int(first.get("correct") or 0),
        int(first.get("total") or 0),
    )

    # -------------------------------------------------------
    # Current competency states
    # -------------------------------------------------------

    states = await comp.competency_states(db, user.id)

    latest_dimensions = latest.get("per_dimension") or {}
    latest_skills = latest.get("per_skill") or {}

    gaps = []

    for dimension, values in latest_dimensions.items():
        if dimension not in states:
            continue

        state = states[dimension]["state"]

        if state not in GAP_STATES:
            continue

        gaps.append({
            "key": dimension,
            "state": state,
            **values,
            "action": (
                "Build a concrete artifact, practice in a changed "
                "context, then re-test."
            ),
        })

    gaps.sort(
        key=lambda item: comp.PRIORITY.get(item["state"], 999)
    )

    skills = []

    for skill_name in catalog.ROLES[role]:
        state_info = states.get(skill_name, {})

        skills.append({
            "key": skill_name,
            "state": state_info.get("state", "Needs Evidence"),
            "claimed": state_info.get("claimed", False),
            **latest_skills.get(
                skill_name,
                {"correct": 0, "total": 0},
            ),
        })

    # -------------------------------------------------------
    # Learning materials for current-role gaps
    # -------------------------------------------------------

    materials = []
    seen_urls = set()

    for gap in gaps[:3]:
        for resource in catalog.resources_for(gap["key"])[:2]:
            url = resource.get("url")

            if not url or url in seen_urls:
                continue

            seen_urls.add(url)

            materials.append({
                **resource,
                "for": gap["key"],
            })

    # -------------------------------------------------------
    # Activity and progress summaries
    # -------------------------------------------------------

    interview_sessions = await db.select(
        "interview_sessions",
        user.id,
        order="created_at",
    )

    done_interviews = [
        item
        for item in interview_sessions
        if item.get("status") == "done"
    ]

    challenge_attempts = await db.select(
        "challenge_attempts",
        user.id,
        order="created_at",
    )

    learning_progress = await db.select(
        "learning_progress",
        user.id,
    )

    completed_steps = {
        item["step_key"]
        for item in learning_progress
        if item.get("step_key")
    }

    saved_jobs = await db.select("saved_jobs", user.id)

    learning_total = 0
    learning_done = 0

    for skill_name in catalog.ROLES[role]:
        skill_state = states.get(skill_name, {}).get("state")

        if skill_state == "Demonstrated":
            continue

        modules = catalog.modules_for(skill_name)
        learning_total += len(modules)

        learning_done += sum(
            f"{skill_name}:{module['key']}" in completed_steps
            for module in modules
        )

    evidence = await db.select(
        "evidence",
        user.id,
        order="created_at",
        desc=True,
        limit=8,
    )

    recommendations = []

    if gaps:
        recommendations.append(
            f"Strengthen {gaps[0]['key']}: open the roadmap, "
            "finish a learning item, then re-test."
        )

    if not challenge_attempts:
        recommendations.append(
            "Try an unknown-problem challenge to test how you "
            "handle a new situation."
        )

    if not done_interviews:
        recommendations.append(
            f"Practice an AI interview for {role}."
        )

    if not saved_jobs:
        recommendations.append(
            "Browse opportunities that match your skills."
        )

    last_challenge = (
        challenge_attempts[-1]
        if challenge_attempts
        else None
    )

    last_evaluation = (
        (last_challenge.get("evaluation") or {})
        if last_challenge
        else {}
    )

    last_level = last_evaluation.get("level", 0)

    try:
        last_level_label = LEVEL[int(last_level)]
    except (ValueError, TypeError, IndexError):
        last_level_label = LEVEL[0]

    overview = {
        "practice": {
            "attempts": len(challenge_attempts),
            "last": last_level_label if last_challenge else None,
        },
        "interviews": {
            "count": len(done_interviews),
            "last": (
                (done_interviews[-1].get("report") or {}).get(
                    "level_label"
                )
                if done_interviews
                else None
            ),
        },
        "learning": {
            "done": learning_done,
            "total": learning_total,
            "pct": percentage(learning_done, learning_total),
        },
        "jobs": {
            "saved": len(saved_jobs),
        },
        "activity": [
            {
                "when": item.get("created_at"),
                "text": (
                    f"{item.get('competency', 'Competency')}: "
                    f"{item.get('summary', '')}"
                ),
            }
            for item in evidence
        ],
        "recommendations": recommendations[:3],
    }

    # -------------------------------------------------------
    # Current-role dashboard response
    # -------------------------------------------------------

    return {
        "stage": "ready",
        "role": role,
        "name": prof.get("name", ""),

        "baseline": {
            "pct": latest_pct,
            "correct": latest_correct,
            "total": latest_total,
            "delta": latest_pct - first_pct,
            "attempts": len(results),
        },

        "gaps": gaps,
        "skills": skills,
        "materials": materials,

        "overview": overview,

        "radar": [
            value
            for value in states.values()
            if value.get("kind") == "dimension"
        ],

        "trend": [
            {
                "date": result_date(result)[:10],
                "pct": percentage(
                    int(result.get("correct") or 0),
                    int(result.get("total") or 0),
                ),
            }
            for result in results
        ],

        # All full assessment attempts across roles.
        # The frontend excludes the active role.
        "role_history": role_history,
    }
