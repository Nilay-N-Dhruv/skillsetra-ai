import pytest
from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)
H = {"Authorization": "Bearer demo-part4user01"}
ROLE = {"target_role": "Python Developer"}
LONG = "Because the API retries, I would measure the load, test one change at a time, and weigh the trade-off against cost. For example, I would log queue depth."


@pytest.fixture(autouse=True)
def fresh():
    c.post("/api/demo/reset", headers=H)


def take_exam():
    ex = c.post("/api/exam/start", headers=H, json={"role": "Python Developer"}).json()
    return c.post("/api/exam/submit", headers=H, json={"session_id": ex["session_id"], "answers": {q["id"]: 0 for q in ex["questions"]}})


def test_notifications_and_preferences():
    c.put("/api/profile/role", headers=H, json=ROLE)
    assert take_exam().status_code == 200
    d = c.get("/api/notifications", headers=H).json()
    assert d["unread"] >= 1 and d["items"][0]["kind"] == "assessment"
    c.post("/api/notifications/read", headers=H, json={})
    assert c.get("/api/notifications", headers=H).json()["unread"] == 0
    c.put("/api/notifications/prefs", headers=H, json={"assessment": False})
    before = len(c.get("/api/notifications", headers=H).json()["items"])
    take_exam()
    assert len(c.get("/api/notifications", headers=H).json()["items"]) == before
    assert c.post("/api/notifications/read", headers=H, json={"id": "not-a-uuid"}).status_code == 422


def test_profile_details_validation_and_files():
    ok = {"name": "Asha", "headline": "Dev", "bio": "Hi", "skills": ["Python", "SQL"], "career_prefs": {"open_to_work": True, "work_type": "Remote", "location": "India"}}
    assert c.put("/api/profile/details", headers=H, json=ok).status_code == 200
    got = c.get("/api/profile/details", headers=H).json()
    assert got["skills"] == ["Python", "SQL"] and got["career_prefs"]["work_type"] == "Remote"
    assert c.put("/api/profile/details", headers=H, json={**ok, "bio": "x" * 601}).status_code == 422
    assert c.put("/api/profile/details", headers=H, json={**ok, "skills": ["a"] * 21}).status_code == 422
    assert c.put("/api/profile/details", headers=H, json={**ok, "career_prefs": {"work_type": "Moon"}}).status_code == 422
    assert c.put("/api/profile/files", headers=H, json={"avatar": True}).status_code == 403     # demo cannot upload


def test_interview_full_flow_with_labelled_fallback():
    s = c.post("/api/interviews/start", headers=H, json={"role": "Python Developer", "kind": "Mixed", "difficulty": "Adaptive"}).json()
    assert s["total"] == 5 and s["source"] == "demo-template" and s["question"]
    assert c.post(f"/api/interviews/{s['id']}/answer", headers=H, json={"answer": "short"}).status_code == 422
    for n in range(5):
        r = c.post(f"/api/interviews/{s['id']}/answer", headers=H, json={"answer": LONG}).json()
        assert r["source"] == "demo-template" and r["level"] <= 2
        assert r["done"] is (n == 4)
    assert r["report"]["level_label"]
    assert c.post(f"/api/interviews/{s['id']}/answer", headers=H, json={"answer": LONG}).status_code == 409
    assert any(e["source_type"] == "interview" for e in c.get("/api/evidence", headers=H).json()["items"])
    assert c.get("/api/interviews", headers=H).json()["items"][0]["status"] == "done"
    assert c.post("/api/interviews/start", headers=H, json={"role": "Wizard", "kind": "Mixed", "difficulty": "Adaptive"}).status_code == 422


def test_learning_progress_and_roadmap():
    c.put("/api/profile/role", headers=H, json=ROLE)
    step = c.get("/api/roadmap", headers=H).json()["steps"][0]
    skill = step["competency"]
    for m in step["modules"]:
        assert c.post("/api/learning/progress", headers=H, json={"skill": skill, "key": m["key"], "done": True}).status_code == 200
    again = next(s for s in c.get("/api/roadmap", headers=H).json()["steps"] if s["competency"] == skill)
    assert again["status"] == "Ready to re-test" and again["progress"]["done"] == again["progress"]["total"]
    assert any(n["kind"] == "learning" for n in c.get("/api/notifications", headers=H).json()["items"])
    assert c.post("/api/learning/progress", headers=H, json={"skill": skill, "key": "resource-99", "done": True}).status_code == 404
    assert c.post("/api/learning/progress", headers=H, json={"skill": skill, "key": "../x", "done": True}).status_code == 422
    assert c.post("/api/learning/progress", headers=H, json={"skill": "Cooking", "key": "project", "done": True}).status_code == 422


def test_practice_extras():
    assert c.get("/api/challenges/debug-1/hint", headers=H).json()["hint"]
    assert c.get("/api/challenges/zzz-9/hint", headers=H).status_code == 404
    assert c.get("/api/challenges/next?id=debug-2", headers=H).json()["id"] == "debug-2"
    assert c.get("/api/challenges/next?id=../x", headers=H).status_code == 422
    c.post("/api/challenges/debug-1/submit", headers=H, json={"code": "def x():\n    return 1\n", "explanation": "tried"})
    assert len(c.get("/api/challenges/history", headers=H).json()["items"]) == 1


def test_jobs_matching_saving_and_validation(monkeypatch):
    from app.api import jobs

    async def fake(search):
        return [{"id": "1", "title": "Python Backend Engineer", "company": "Acme", "url": "https://remotive.com/remote-jobs/x",
                 "location": "Worldwide", "type": "full_time", "posted": "2026-10-01", "tags": ["python"], "salary": "",
                 "text": "python sql testing apis packaging"}]
    monkeypatch.setattr(jobs, "fetch_jobs", fake)
    c.put("/api/profile/role", headers=H, json=ROLE)
    d = c.get("/api/jobs", headers=H).json()
    assert d["items"][0]["pct"] == 100 and "text" not in d["items"][0] and d["attribution"]
    ok = {"id": "1", "title": "Python Backend Engineer", "company": "Acme", "url": "https://remotive.com/remote-jobs/x"}
    assert c.post("/api/jobs/save", headers=H, json=ok).status_code == 200
    c.post("/api/jobs/save", headers=H, json=ok)                                                  # no duplicates
    assert len(c.get("/api/jobs/saved", headers=H).json()["items"]) == 1
    assert c.post("/api/jobs/save", headers=H, json={**ok, "url": "https://evil.example/x"}).status_code == 422
    assert c.post("/api/jobs/save", headers=H, json={**ok, "url": "javascript:alert(1)"}).status_code == 422
    assert c.get("/api/jobs?q=<script>", headers=H).status_code == 422
    c.delete("/api/jobs/save/1", headers=H)
    assert c.get("/api/jobs/saved", headers=H).json()["items"] == []


def test_dashboard_overview_after_activity():
    c.put("/api/profile/role", headers=H, json=ROLE)
    take_exam()
    o = c.get("/api/dashboard", headers=H).json()["overview"]
    assert {"practice", "interviews", "learning", "jobs", "activity", "recommendations"} <= set(o)
    assert o["activity"] and o["recommendations"]