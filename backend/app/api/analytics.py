"""User-scoped analytics and activity timeline."""
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from ..core.db import db_for, now_iso
from ..core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
SOURCES = {
    "assessments": ("exam_results", "Assessment"),
    "practice": ("challenge_attempts", "Practice"),
    "learning": ("learning_progress", "Learning"),
    "interviews": ("interview_sessions", "Interview"),
    "jobs": ("saved_jobs", "Saved job"),
    "job_analyses": ("job_analyses", "Job analysis"),
    "resume": ("resume_analyses", "Resume analysis"),
}
def _dt(value):
    if not value: return None
    try: return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (ValueError, TypeError): return None
def _first(row, *keys):
    for key in keys:
        if row.get(key) not in (None, ""): return row[key]
    return None
def _event(row, category, title=None):
    created = _first(row, "created_at", "updated_at", "completed_at", "started_at", "date")
    return {"id": str(row.get("id") or f"{category}-{created or 'unknown'}"),
            "category": category, "title": title or _first(row, "title", "name", "skill", "role", "kind", "event_type") or category,
            "description": _first(row, "description", "summary", "status", "level_label"),
            "created_at": created, "status": _first(row, "status", "state"),
            "score": _first(row, "score", "percentage", "pct", "accuracy")}
async def _safe_select(db, table, user_id, limit=1000):
    try: return await db.select(table, user_id, order="created_at", desc=True, limit=limit)
    except Exception: return []

@router.post("/events")
async def track_event(body: dict, user: CurrentUser = Depends(get_current_user)):
    allowed = {"assessment","practice","learning","interview","job","job_analysis","resume","navigation","other"}
    category = str(body.get("category") or "other").strip().lower()
    if category not in allowed: category = "other"
    title = str(body.get("title") or "Activity").strip()[:120]
    description = str(body.get("description") or "").strip()[:240]
    row = {"user_id": user.id, "category": category, "title": title,
           "description": description, "created_at": now_iso()}
    saved = await db_for(user).insert("activity_events", row)
    return {"ok": True, "event": _event(saved, category, title)}

@router.get("")
async def analytics(days: int = Query(default=30, ge=7, le=365),
                    category: Optional[str] = Query(default=None, max_length=32),
                    user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    tables = {}
    for key, (table, _) in SOURCES.items():
        tables[key] = await _safe_select(db, table, user.id)
    explicit = await _safe_select(db, "activity_events", user.id)
    events = []
    for key, rows in tables.items():
        for row in rows:
            if _first(row, "created_at", "updated_at", "completed_at", "started_at", "date"):
                events.append(_event(row, key))
    events.extend(_event(row, str(row.get("category") or "other"), row.get("title")) for row in explicit)
    unique, seen = [], set()
    for event in events:
        key = (event["category"], event["id"])
        if key not in seen: seen.add(key); unique.append(event)
    events = [e for e in unique if _dt(e.get("created_at"))]
    events.sort(key=lambda e: _dt(e["created_at"]), reverse=True)
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days-1)
    selected = []
    daily = {(start + timedelta(days=i)).isoformat(): 0 for i in range(days)}
    for e in events:
        stamp = _dt(e["created_at"])
        if stamp.tzinfo is None: stamp = stamp.replace(tzinfo=timezone.utc)
        day = stamp.astimezone(timezone.utc).date().isoformat()
        if start.isoformat() <= day <= today.isoformat() and (not category or category == "all" or e["category"] == category):
            selected.append(e)
            daily[day] = daily.get(day, 0) + 1
    counts = Counter(e["category"] for e in selected)
    assessment_rows = tables["assessments"]
    scores = []
    for row in assessment_rows:
        try:
            n = float(_first(row, "score", "percentage", "pct", "accuracy"))
            if 0 <= n <= 1: n *= 100
            if 0 <= n <= 100: scores.append(n)
        except (TypeError, ValueError): pass
    learning = tables["learning"]
    def completed(row):
        status = str(_first(row, "status", "state", "progress") or "").lower()
        return status in {"done","completed","complete","demonstrated","passed"} or bool(row.get("completed_at"))
    done = sum(completed(row) for row in learning)
    return {
        "generated_at": now_iso(), "range_days": days, "range_start": start.isoformat(), "range_end": today.isoformat(),
        "summary": {
            "activities_in_range": len(selected), "all_recorded_events": len(events),
            "assessment_records": len(assessment_rows), "practice_attempts": len(tables["practice"]),
            "interview_sessions": len(tables["interviews"]), "learning_items": len(learning),
            "learning_completed": done, "learning_completion_pct": round(done/len(learning)*100) if learning else 0,
            "saved_jobs": len(tables["jobs"]), "job_analyses": len(tables["job_analyses"]),
            "resume_analyses": len(tables["resume"]),
            "average_assessment_score": round(sum(scores)/len(scores), 1) if scores else None},
        "daily": [{"date": day, "count": count} for day, count in daily.items()],
        "categories": [{"category": key, "count": value} for key, value in sorted(counts.items())],
        "events": selected[:200],
        "source_counts": {key: len(rows) for key, rows in tables.items()},
        "note": "Existing timestamped records provide best-effort history. Explicit activity tracking starts when the activity table and frontend tracking calls are installed."
    }
