import pytest
from fastapi.testclient import TestClient

from app.core.whatif import SCENARIOS, cap_from, coverage, public
from app.main import app
from app.services.growth import build_report, overview, usable
from app.services.skill_dna import compute_dna
from app.services.timemachine import compare_roles

c = TestClient(app)
H = {"Authorization": "Bearer demo-part5user01"}


def ev(comp, level, src="exam", day=1, **kw):
    return {"competency": comp, "level": level, "source_type": src, "summary": "s",
            "created_at": f"2026-10-{day:02d}T10:00:00+00:00", **kw}


@pytest.fixture(autouse=True)
def fresh():
    c.post("/api/demo/reset", headers=H)


def take_exam():
    ex = c.post("/api/exam/start", headers=H, json={"role": "Python Developer"}).json()
    return c.post("/api/exam/submit", headers=H, json={"session_id": ex["session_id"], "answers": {q["id"]: 0 for q in ex["questions"]}})


# ---- logic ----
def test_skill_dna_needs_two_results_and_ignores_claims():
    one = next(i for i in compute_dna([ev("Debugging", 3)], [])["indicators"] if i["key"] == "debugging")
    assert one["state"] == "Insufficient evidence" and one["avg_level"] is None
    rows = [ev("Testing", 1, day=1), ev("Testing", 2, day=2), ev("Testing", 3, day=3), ev("Testing", 3, src="claim", day=4)]
    t = next(i for i in compute_dna(rows, [])["indicators"] if i["key"] == "testing")
    assert t["count"] == 3 and t["trend"] == "improving" and t["state"] == "Developing"


def test_skill_dna_accuracy_and_observation():
    exams = [{"correct": 9, "total": 10, "role": "Python Developer", "created_at": "2026-10-01T10:00:00+00:00"},
             {"correct": 8, "total": 10, "role": "Python Developer", "created_at": "2026-10-02T10:00:00+00:00"}]
    d = compute_dna([ev("Testing", 1, day=1), ev("Testing", 1, day=2)], exams)
    assert next(i for i in d["indicators"] if i["key"] == "accuracy")["state"] == "Demonstrated"
    assert any("assessment answers are strong" in o for o in d["observations"])


def test_mixed_timestamp_formats_do_not_crash():
    rows = [ev("Reasoning", 2, day=1), {**ev("Reasoning", 3, day=2), "created_at": "2026-10-02T10:00:00.123456Z"},
            {**ev("Reasoning", 3, day=3), "created_at": "2026-10-03T10:00:00"}]
    assert next(i for i in compute_dna(rows, [])["indicators"] if i["key"] == "reasoning")["count"] == 3


def test_growth_report_rules():
    assert build_report("Docker", None, usable([ev("Docker", 1)], "Docker"), [], [])["ready"] is False
    rows = usable([ev("Docker", 1, day=1), ev("Docker", 2, src="challenge", day=5), ev("Docker", 3, src="claim", day=6)], "Docker")
    mods = [{"key": "resource-0", "title": "Docker docs"}, {"key": "project", "title": "Containerise an app"}]
    prog = [{"step_key": "Docker:resource-0", "created_at": "2026-10-03T10:00:00+00:00"},
            {"step_key": "Docker:project", "created_at": "2026-10-09T10:00:00+00:00"},
            {"step_key": "SQL:resource-0", "created_at": "2026-10-03T10:00:00+00:00"}]
    r = build_report("Docker", "ML Engineer", rows, prog, mods)
    assert r["movement"] == "up" and r["interventions"] == ["Docker docs"]
    assert "caused" in r["limitations"][0] and "Both results were graded" not in r["verification"]
    assert overview([ev("Docker", 1), ev("Docker", 2, day=2), ev("SQL", 3)], ["Docker", "SQL", "Pandas"])[0]["key"] == "Docker"


def test_role_comparison_groups():
    roles = {"A": ["Python", "SQL"], "B": ["Python", "Docker", "SQL"]}
    states = {"Python": {"state": "Demonstrated"}, "SQL": {"state": "Limited"}, "Docker": {"state": "Needs Evidence"}}
    d = compare_roles("A", "B", states, roles, lambda s: [{"title": s}, {"title": s + "2"}, {"title": s + "3"}])
    assert [x["skill"] for x in d["backed"]] == ["Python"] and d["new_for_you"] == ["Docker"] and len(d["resources"][0]["links"]) == 2


def test_whatif_rubric_and_cap():
    assert len(SCENARIOS) == 6 and all(len(s["rubric"]) == 5 for s in SCENARIOS.values())
    assert "rubric" not in public("wi-scale")
    text = "I would measure with a load test, add a cache, use a queue for slow work and add a load balancer."
    assert sum(x["covered"] for x in coverage(text, SCENARIOS["wi-scale"]["rubric"])) == 4
    assert [cap_from(n) for n in (0, 1, 2, 3, 4, 5)] == [0, 1, 2, 2, 3, 3]


# ---- endpoints ----
def test_new_routes_require_sign_in():
    for p in ("/api/skill-dna", "/api/growth", "/api/growth/report?competency=Python",
              "/api/career/compare?target=ML%20Engineer", "/api/whatif/next"):
        assert c.get(p).status_code == 401


def test_skill_dna_and_growth_after_two_exams():
    c.put("/api/profile/role", headers=H, json={"target_role": "Python Developer"})
    assert c.get("/api/growth/report?competency=Python", headers=H).json()["ready"] is False
    take_exam(); take_exam()
    dna = c.get("/api/skill-dna", headers=H).json()
    assert next(i for i in dna["indicators"] if i["key"] == "accuracy")["count"] == 2 and dna["disclaimer"]
    assert any(i["key"] == "Python" and i["ready"] for i in c.get("/api/growth", headers=H).json()["items"])
    r = c.get("/api/growth/report?competency=Python", headers=H).json()
    assert r["ready"] and r["limitations"] and r["learner"]
    assert c.get("/api/growth/report?competency=Cooking", headers=H).status_code == 422


def test_career_compare_reuses_evidence():
    c.put("/api/profile/role", headers=H, json={"target_role": "Python Developer"})
    take_exam()
    d = c.get("/api/career/compare?target=Backend%20Developer", headers=H).json()
    assert d["origin"] == "Python Developer" and any(x["skill"] == "Python" for x in d["backed"] + d["partial"])
    assert c.get("/api/career/compare?target=Wizard", headers=H).status_code == 422


def test_whatif_flow():
    s = c.get("/api/whatif/next", headers=H).json()
    assert s["id"] == "wi-scale" and "rubric" not in s
    url = "/api/whatif/wi-scale/submit"
    assert c.post(url, headers=H, json={"text": "too short"}).status_code == 422
    good = "I would measure first with a load test, add a cache, add indexes, use a queue for slow work and add a load balancer. " * 2
    r = c.post(url, headers=H, json={"text": good}).json()
    assert all(x["covered"] for x in r["covered"]) and r["level"] <= 3 and r["source"] in ("ai", "demo-heuristic")
    assert any(e["source_type"] == "whatif" and e["competency"] == "Adaptation" for e in c.get("/api/evidence", headers=H).json()["items"])
    assert c.get("/api/whatif/next", headers=H).json()["id"] != "wi-scale"
    off = c.post(url, headers=H, json={"text": "I like turtles and long walks on the beach, truly. " * 3}).json()
    assert off["level"] == 0
    assert c.post("/api/whatif/nope/submit", headers=H, json={"text": good}).status_code == 422
    assert c.post("/api/whatif/wi-zzzz/submit", headers=H, json={"text": good}).status_code == 404