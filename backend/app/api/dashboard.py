"""Everything the dashboard needs, in one request."""
from fastapi import APIRouter, Depends

from ..core import catalog
from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services import competency as comp

router = APIRouter(prefix="/api")
GAP_STATES = ("Limited", "Needs Evidence", "Transfer Gap")
LEVEL = ["No evidence", "Limited", "Developing", "Demonstrated"]


@router.get("/dashboard")
async def dashboard(user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    prof = (await db.select("profiles", user.id) or [{}])[0]
    role = prof.get("target_role")
    if not role:
        return {"stage": "choose_role"}
    sessions = {s["id"]: s for s in await db.select("exam_sessions", user.id)}
    results = [r for r in await db.select("exam_results", user.id, order="created_at", role=role)
               if not sessions.get(r["session_id"], {}).get("skill")]          # full exams only
    if not results:
        return {"stage": "take_exam", "role": role}

    latest, first = results[-1], results[0]
    pct = lambda r: round(100 * r["correct"] / r["total"])
    states = await comp.competency_states(db, user.id)                          # live: updates with any new evidence

    gaps = [{"key": d, "state": states[d]["state"], **v,
             "action": "Build a concrete artifact, practice in a changed context, then re-test."}
            for d, v in latest["per_dimension"].items() if d in states and states[d]["state"] in GAP_STATES]
    gaps.sort(key=lambda g: comp.PRIORITY[g["state"]])
    skills = [{"key": s, "state": states[s]["state"], "claimed": states[s]["claimed"],
               **latest["per_skill"].get(s, {"correct": 0, "total": 0})} for s in catalog.ROLES[role]]

    materials, seen = [], set()
    for g in gaps[:3]:
        for r in catalog.resources_for(g["key"])[:2]:
            if r["url"] not in seen:
                seen.add(r["url"])
                materials.append({**r, "for": g["key"]})

    # ---- master overview (all real data) ----
    done_iv = [i for i in await db.select("interview_sessions", user.id, order="created_at") if i["status"] == "done"]
    attempts = await db.select("challenge_attempts", user.id, order="created_at")
    prog = {r["step_key"] for r in await db.select("learning_progress", user.id)}
    saved = await db.select("saved_jobs", user.id)
    total = done = 0
    for k in catalog.ROLES[role]:
        if states[k]["state"] != "Demonstrated":
            mods = catalog.modules_for(k)
            total += len(mods)
            done += sum(f"{k}:{m['key']}" in prog for m in mods)
    ev = await db.select("evidence", user.id, order="created_at", desc=True, limit=8)
    recs = []
    if gaps:
        recs.append(f"Strengthen {gaps[0]['key']}: open the roadmap, finish a learning item, then re-test.")
    if not attempts:
        recs.append("Try an unknown-problem challenge to test how you handle a new situation.")
    if not done_iv:
        recs.append(f"Practice an AI interview for {role}.")
    if not saved:
        recs.append("Browse opportunities that match your skills.")
    overview = {
        "practice": {"attempts": len(attempts), "last": LEVEL[(attempts[-1].get("evaluation") or {}).get("level", 0)] if attempts else None},
        "interviews": {"count": len(done_iv), "last": (done_iv[-1].get("report") or {}).get("level_label") if done_iv else None},
        "learning": {"done": done, "total": total, "pct": round(100 * done / total) if total else 0},
        "jobs": {"saved": len(saved)},
        "activity": [{"when": e["created_at"], "text": f"{e['competency']}: {e['summary']}"} for e in ev],
        "recommendations": recs[:3]}

    return {"stage": "ready", "role": role, "name": prof.get("name", ""),
            "baseline": {"pct": pct(latest), "correct": latest["correct"], "total": latest["total"],
                         "delta": pct(latest) - pct(first), "attempts": len(results)},
            "gaps": gaps, "skills": skills, "materials": materials, "overview": overview,
            "radar": [v for v in states.values() if v["kind"] == "dimension"],
            "trend": [{"date": r["created_at"][:10], "pct": pct(r)} for r in results]}