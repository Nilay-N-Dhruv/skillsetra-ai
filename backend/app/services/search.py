"""Global search over the signed-in user's OWN data. Every result carries a fixed link chosen here,
never a value taken from stored text, so a search result can never point somewhere unexpected."""
from .evidence_graph import SOURCE_LABELS
from .timeutil import parse_ts


def _has(term, *values):
    return any(term in str(v or "").lower() for v in values)


def search_all(term, evidence, interviews, exams, jobs, roles, limit=4):
    t = term.strip().lower()
    out = {"skills": [], "interviews": [], "assessments": [], "jobs": [], "careers": []}
    if not t:
        return out
    seen = set()
    for e in sorted(evidence, key=lambda e: parse_ts(e["created_at"]), reverse=True):
        if len(out["skills"]) >= limit:
            break
        if e["competency"] not in seen and _has(t, e["competency"], e["summary"]):
            seen.add(e["competency"])
            out["skills"].append({"label": e["competency"], "href": "/evidence-graph",
                                  "hint": f'{SOURCE_LABELS.get(e.get("source_type"), "Other")} - {str(e["summary"])[:80]}'})
    for s in sorted(interviews, key=lambda s: parse_ts(s["created_at"]), reverse=True):
        if len(out["interviews"]) >= limit:
            break
        if _has(t, s["role"], s["kind"], s["difficulty"], "interview"):
            out["interviews"].append({"label": f'{s["kind"]} interview - {s["role"]}', "href": "/interviewer",
                                      "hint": f'{s["difficulty"]} - {s["status"]} - {str(s["created_at"])[:10]}'})
    for r in sorted(exams, key=lambda r: parse_ts(r["created_at"]), reverse=True):
        if len(out["assessments"]) >= limit:
            break
        if _has(t, r["role"], "assessment exam test"):
            out["assessments"].append({"label": f'{r["role"]} assessment', "href": "/dashboard",
                                       "hint": f'{r["correct"]} of {r["total"]} correct - {str(r["created_at"])[:10]}'})
    for j in sorted(jobs, key=lambda j: parse_ts(j["created_at"]), reverse=True):
        if len(out["jobs"]) >= limit:
            break
        if _has(t, j["title"], j.get("company"), "job"):
            match = f'match {j["score"]}%' if j.get("score") is not None else "no score"
            out["jobs"].append({"label": j["title"], "href": "/job-check",
                                "hint": f'{j.get("company") or "Saved analysis"} - {match}'})
    for name, skills in roles.items():
        if len(out["careers"]) >= limit:
            break
        if _has(t, name) or any(t in s.lower() for s in skills):
            out["careers"].append({"label": name, "href": "/opportunity-radar", "hint": "Career path"})
    return out