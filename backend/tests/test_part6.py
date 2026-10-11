import json
import re
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.db import db_for
from app.core.security import CurrentUser, get_current_user
from app.main import app
from app.services.evidence_graph import STALE_DAYS, build_graph, classify
from app.services.passport import build_public, new_slug

c = TestClient(app)
NOW = datetime(2026, 10, 20, tzinfo=timezone.utc)
DEMO = {"Authorization": "Bearer demo-part6user01"}
OTHER = {"Authorization": "Bearer demo-part6user02"}
REAL = CurrentUser(id="user-real-001", email="real@example.com")


def ev(comp, level, src="exam", days_ago=1, **kw):
    return {"competency": comp, "level": level, "source_type": src, "summary": "s",
            "created_at": (NOW - timedelta(days=days_ago)).isoformat(), **kw}


@pytest.fixture
def real_user(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", "")                 # force the in-memory store, never a real database
    monkeypatch.setattr(settings, "supabase_service_role_key", "")
    app.dependency_overrides[get_current_user] = lambda: REAL
    yield
    app.dependency_overrides.pop(get_current_user, None)
    db_for(REAL).forget(REAL.id)


# ---- logic ----
def test_classify_rules():
    assert classify([ev("A", 3, "claim")], NOW) == "self-reported"
    assert classify([ev("A", 3)], NOW) == "insufficient"
    assert classify([ev("A", 3), ev("A", 3, days_ago=2)], NOW) == "demonstrated"
    assert classify([ev("A", 3, days_ago=200), ev("A", 3, days_ago=150)], NOW) == "outdated"
    assert classify([ev("A", 3, days_ago=STALE_DAYS - 1), ev("A", 3, days_ago=STALE_DAYS + 5)], NOW) == "demonstrated"
    assert classify([ev("A", 0), ev("A", 1, days_ago=2)], NOW) == "insufficient"
    assert classify([ev("A", 3), ev("A", 3, "claim", days_ago=2)], NOW) == "insufficient"


def test_graph_groups_and_orders():
    rows = [ev("Python", 3, id="e1"), ev("Python", 3, "challenge", 2, id="e2"), ev("Python", 2, "claim", 3, id="e3"),
            ev("SQL", 1, "claim", 1, id="e4"), ev("Testing", 2, "github", 5, id="e5")]
    by = {s["key"]: s for s in build_graph(rows, NOW)["skills"]}
    assert by["Python"]["klass"] == "demonstrated" and by["Python"]["verified_count"] == 2 and by["Python"]["claim_count"] == 1
    assert by["SQL"]["klass"] == "self-reported" and by["SQL"]["verified_count"] == 0
    assert by["Python"]["evidence"][0]["when"] > by["Python"]["evidence"][-1]["when"]
    assert build_graph([], NOW)["skills"] == []


def test_public_view_never_contains_private_data():
    rows = [{**ev("Python", 3, id="ev-SECRET-ID", summary="SECRET-NOTE answer text"), "user_id": "user-abc"},
            {**ev("Python", 2, "challenge", 2, id="ev-2", summary="Another SECRET-NOTE"), "user_id": "user-abc"},
            {**ev("Python", 3, "claim", 3, summary="Self-reported course: SECRET-CLAIM"), "user_id": "user-abc"},
            {**ev("SQL", 3), "user_id": "user-abc"},
            {**ev("Docker", 2, "github", 4, source_ref="octo/shown-repo"), "user_id": "user-abc"}]
    row = {"user_id": "user-abc", "display_name": "Asha", "headline": "Learner", "show_role": False, "show_repos": False,
           "skills": ["Python", "Docker"], "published_at": "2026-10-10T08:00:00+00:00", "slug": "SLUGSLUGSLUG"}
    dump = json.dumps(build_public(row, "ML Engineer", rows, NOW))
    for banned in ("SECRET", "user-abc", "ev-2", "SLUGSLUG", "ML Engineer", "shown-repo", "SQL"):
        assert banned not in dump, banned
    shown = build_public({**row, "show_role": True, "show_repos": True}, "ML Engineer", rows, NOW)
    assert shown["role"] == "ML Engineer" and shown["repos"] == ["octo/shown-repo"]
    py = next(s for s in shown["skills"] if s["key"] == "Python")
    assert set(py) == {"key", "status", "state", "verified_results", "self_reported", "first_result", "last_result", "results"}
    assert set(py["results"][0]) == {"date", "source", "judged_by", "level"}


def test_slugs_are_unique_and_safe():
    slugs = {new_slug() for _ in range(2000)}
    assert len(slugs) == 2000 and all(re.fullmatch(r"[A-Za-z0-9_-]{8,40}", s) for s in slugs)


# ---- endpoints ----
def test_routes_require_sign_in():
    for p in ("/api/evidence-graph", "/api/passport"):
        assert c.get(p).status_code == 401
    assert c.post("/api/passport/publish").status_code == 401


def test_graph_endpoint_is_private_to_the_owner():
    c.post("/api/demo/reset", headers=DEMO)
    ex = c.post("/api/exam/start", headers=DEMO, json={"role": "Python Developer"}).json()
    c.post("/api/exam/submit", headers=DEMO, json={"session_id": ex["session_id"], "answers": {q["id"]: 0 for q in ex["questions"]}})
    assert len(c.get("/api/evidence-graph", headers=DEMO).json()["skills"]) > 0
    assert c.get("/api/evidence-graph", headers=OTHER).json()["skills"] == []


def test_demo_cannot_publish():
    body = {"display_name": "A", "skills": ["Python"]}
    assert c.put("/api/passport", headers=DEMO, json=body).status_code == 403
    assert c.post("/api/passport/publish", headers=DEMO).status_code == 403


def test_passport_flow_and_privacy(real_user):
    for _ in range(2):
        ex = c.post("/api/exam/start", json={"role": "Python Developer"}).json()
        c.post("/api/exam/submit", json={"session_id": ex["session_id"], "answers": {q["id"]: 0 for q in ex["questions"]}})
    c.post("/api/skills/claim", json={"skill": "SQL", "kind": "course", "note": "SECRET-CLAIM note text here"})
    assert c.get("/api/passport").json()["published"] is False
    assert c.post("/api/passport/publish").status_code == 422                      # nothing saved yet
    save = {"display_name": "Asha", "headline": "Learner", "show_role": False, "show_repos": False, "skills": ["Python", "SQL", "Python"]}
    assert c.put("/api/passport", json={**save, "display_name": "   "}).status_code == 422
    assert c.put("/api/passport", json={**save, "skills": ["Cooking"]}).status_code == 422
    assert c.put("/api/passport", json=save).status_code == 200
    assert c.get("/api/passport").json()["settings"]["skills"] == ["Python", "SQL"]          # duplicates removed
    slug = c.post("/api/passport/publish").json()["slug"]

    pub = c.get(f"/api/public/passport/{slug}")
    assert pub.status_code == 200
    for banned in ("SECRET-CLAIM", "real@example.com", "user-real-001"):
        assert banned not in pub.text
    body = pub.json()
    assert body["name"] == "Asha" and body["role"] is None
    sql = next(s for s in body["skills"] if s["key"] == "SQL")
    assert sql["status"] == "self-reported" and sql["results"] == []
    assert next(s for s in body["skills"] if s["key"] == "Python")["verified_results"] >= 2

    assert c.post("/api/passport/unpublish").status_code == 200
    assert c.get(f"/api/public/passport/{slug}").status_code == 404
    c.post("/api/passport/publish")
    assert c.get(f"/api/public/passport/{slug}").status_code == 200                # same link comes back
    c.post("/api/passport/revoke")
    assert c.get(f"/api/public/passport/{slug}").status_code == 404
    assert c.post("/api/passport/publish").json()["slug"] != slug                  # a revoked link never returns


def test_public_route_validation_and_rate_limit():
    assert c.get("/api/public/passport/short").status_code == 422
    assert c.get("/api/public/passport/AAAAAAAAAAAA").status_code == 404
    codes = [c.get("/api/public/passport/AAAAAAAAAAAA").status_code for _ in range(35)]
    assert 429 in codes