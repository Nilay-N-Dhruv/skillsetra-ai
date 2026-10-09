"""Run: cd backend && pytest -q"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)
H = {"Authorization": "Bearer demo-pytestuser1"}
ROLE = {"target_role": "Python Developer"}


@pytest.fixture(autouse=True)
def fresh_demo():                           # every test starts with an empty demo learner
    c.post("/api/demo/reset", headers=H)


def start_and_submit(answer=0, skill=None):
    body = {"role": "Python Developer", **({"skill": skill} if skill else {})}
    ex = c.post("/api/exam/start", headers=H, json=body).json()
    sub = c.post("/api/exam/submit", headers=H,
                 json={"session_id": ex["session_id"], "answers": {q["id"]: answer for q in ex["questions"]}})
    return ex, sub


def test_health_and_roles_are_public():
    assert c.get("/api/health").status_code == 200
    assert len(c.get("/api/roles").json()["roles"]) == 10


def test_private_routes_require_auth():
    for path in ("/api/dashboard", "/api/evidence", "/api/roadmap", "/api/profile", "/api/competencies"):
        assert c.get(path).status_code == 401
    assert c.get("/api/dashboard", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_exam_never_leaks_answers():
    c.put("/api/profile/role", headers=H, json=ROLE)
    ex = c.post("/api/exam/start", headers=H, json={"role": "Python Developer"}).json()
    assert ex["total"] == 10
    for q in ex["questions"]:
        assert "answer" not in q and "why" not in q


def test_full_flow_and_dashboard():
    assert c.get("/api/dashboard", headers=H).json()["stage"] == "choose_role"
    c.put("/api/profile/role", headers=H, json=ROLE)
    assert c.get("/api/dashboard", headers=H).json()["stage"] == "take_exam"
    ex, sub = start_and_submit()
    assert sub.status_code == 200 and sub.json()["total"] == 10
    d = c.get("/api/dashboard", headers=H).json()
    assert d["stage"] == "ready" and d["baseline"]["total"] == 10 and len(d["radar"]) == 11


def test_double_submit_and_fake_questions_rejected():
    ex, _ = start_and_submit()
    again = c.post("/api/exam/submit", headers=H, json={"session_id": ex["session_id"], "answers": {}})
    assert again.status_code == 409
    ex2 = c.post("/api/exam/start", headers=H, json={"role": "Python Developer"}).json()
    bad = c.post("/api/exam/submit", headers=H, json={"session_id": ex2["session_id"], "answers": {"not-a-question": 1}})
    assert bad.status_code == 422


def test_skill_claim_is_only_limited_evidence():
    r = c.post("/api/skills/claim", headers=H, json={"skill": "Docker", "kind": "course", "note": "Finished a Docker course"})
    assert r.status_code == 200
    items = {i["key"]: i for i in c.get("/api/competencies", headers=H).json()["items"]}
    assert items["Docker"]["state"] == "Limited" and items["Docker"]["claimed"] is True


def test_skill_retest_runs():
    c.put("/api/profile/role", headers=H, json=ROLE)
    start_and_submit()
    ex, sub = start_and_submit(skill="SQL")
    assert sub.status_code == 200 and ex["total"] <= 6


def test_validation_and_safe_errors():
    p = {"name": "A", "target_role": "Python Developer", "dob": "2000-01-01", "experience": "Student", "consent": True}
    assert c.put("/api/profile", headers=H, json={**p, "consent": False}).status_code == 422
    assert c.put("/api/profile", headers=H, json={**p, "dob": "2020-01-01"}).status_code == 422
    assert c.put("/api/profile", headers=H, json={**p, "target_role": "Wizard"}).status_code == 422
    assert c.put("/api/profile", headers=H, json=p).status_code == 200
    r = c.post("/api/exam/submit", headers=H, json={"session_id": "zzzz-zzzz", "answers": {}})
    assert r.status_code == 422 and "Traceback" not in r.text


def test_testing_skill_retest_and_claim():
    c.put("/api/profile/role", headers=H, json=ROLE)
    ex, sub = start_and_submit(skill="Testing")
    assert sub.status_code == 200
    r = c.post("/api/skills/claim", headers=H, json={"skill": "Testing", "kind": "practice", "note": "Wrote pytest tests"})
    assert r.status_code == 200


def test_skill_retest_does_not_replace_baseline():
    c.put("/api/profile/role", headers=H, json=ROLE)
    start_and_submit()
    start_and_submit(skill="SQL")
    d = c.get("/api/dashboard", headers=H).json()
    assert d["baseline"]["total"] == 10 and d["baseline"]["attempts"] == 1