import pytest
from fastapi.testclient import TestClient

from app.core import catalog
from app.core.questions import QUESTIONS
from app.main import app
from app.services.github import normalize

c = TestClient(app)
H = {"Authorization": "Bearer demo-pytestuser1"}


@pytest.fixture(autouse=True)
def fresh():
    c.post("/api/demo/reset", headers=H)


def test_question_bank_is_valid():
    ids = set()
    for q in QUESTIONS:
        assert q["id"] not in ids, q["id"]
        ids.add(q["id"])
        assert q["role"] in catalog.ROLES, q["id"]
        assert q["skill"] in catalog.ROLES[q["role"]], f"{q['id']}: skill not in role"
        assert q["dimension"] in catalog.DIMENSIONS, q["id"]
        assert len(q["options"]) == 4 and len(set(q["options"])) == 4, q["id"]
        assert q["answer"] in (0, 1, 2, 3) and q["why"], q["id"]


def test_github_repo_parsing():
    assert normalize("https://github.com/psf/requests.git") == "psf/requests"
    assert normalize("psf/requests") == "psf/requests"
    for bad in ("../..", "a/../b", "https://evil.com/a/b", "just-a-name", ".git/.git"):
        with pytest.raises(ValueError):
            normalize(bad)


def test_demo_visitors_are_isolated_and_old_token_is_rejected():
    A = {"Authorization": "Bearer demo-visitoraaaa1"}
    B = {"Authorization": "Bearer demo-visitorbbbb2"}
    c.put("/api/profile/role", headers=A, json={"target_role": "Python Developer"})
    assert c.get("/api/profile", headers=B).json()["target_role"] is None
    assert c.get("/api/profile", headers={"Authorization": "Bearer demo-token"}).status_code == 401


def test_challenge_hides_competency_and_blocks_empty_work():
    ch = c.get("/api/challenges/next", headers=H).json()
    assert "competency" not in ch
    r = c.post(f"/api/challenges/{ch['id']}/submit", headers=H, json={"code": ch["starter_code"], "explanation": "I did nothing"})
    assert r.status_code == 200 and r.json()["level"] == 0


def test_broken_code_cannot_score():
    ch = c.get("/api/challenges/next", headers=H).json()
    r = c.post(f"/api/challenges/{ch['id']}/submit", headers=H, json={"code": "def (:", "explanation": "x" * 300})
    assert r.json()["level"] == 0


def test_retest_returns_a_comparison_and_a_different_problem():
    first = c.get("/api/challenges/next?competency=Debugging", headers=H).json()
    c.post(f"/api/challenges/{first['id']}/submit", headers=H, json={"code": "def x():\n    return 1\n", "explanation": "tried"})
    second = c.get("/api/challenges/next?competency=Debugging", headers=H).json()
    assert second["id"] != first["id"] and second["is_retest"] is True
    r = c.post(f"/api/challenges/{second['id']}/submit", headers=H, json={"code": "def y():\n    return 2\n", "explanation": "again"})
    assert r.json()["comparison"] is not None and r.json()["source"] in ("ai", "demo-heuristic")


def test_github_validation():
    assert c.post("/api/github/analyze", headers=H, json={"repo": "../../etc"}).status_code == 422
    assert c.post("/api/github/analyze", headers=H, json={"repo": "a"}).status_code == 422


def test_labs():
    p = c.get("/api/lab/reasoning/prompt", headers=H).json()
    assert p["id"] == "r1" and c.get("/api/lab/reasoning/prompt?after=r1", headers=H).json()["id"] == "r2"
    assert c.post("/api/lab/reasoning/submit", headers=H, json={"prompt_id": "r1", "text": "too short"}).status_code == 422
    text = "I assume the database is the bottleneck because connections are near the limit, so retries make it worse. " * 2
    r = c.post("/api/lab/reasoning/submit", headers=H, json={"prompt_id": "r1", "text": text})
    assert r.status_code == 200 and r.json()["evidence_saved"] is True
    assert any(e["competency"] == "Reasoning" for e in c.get("/api/evidence", headers=H).json()["items"])
    i = c.post("/api/lab/interpretation/submit", headers=H, json={"prompt_id": "free", "text": "x" * 50})
    assert i.status_code in (200, 503)                  # 503 means AI is off: honest, no fake analysis


def test_coach_resources_and_rate_limit():
    assert c.post("/api/coach", json={"message": "hello"}).status_code == 401
    assert c.post("/api/coach", headers=H, json={"message": "What should I learn next?"}).json()["text"]
    codes = [c.post("/api/coach", headers=H, json={"message": "What next?"}).status_code for _ in range(12)]
    assert 429 in codes
    c.put("/api/profile/role", headers=H, json={"target_role": "Python Developer"})
    items = c.get("/api/resources", headers=H).json()["items"]
    assert items and all(i["url"].startswith("https://") for i in items)