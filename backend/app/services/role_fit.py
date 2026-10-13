"""Role fit, strongest evidence areas and role history. Pure functions over saved competency states."""
import math

from .timeutil import parse_ts

AREAS = {
    "Backend": ["Python", "APIs", "SQL", "Authentication", "FastAPI", "Testing", "Packaging"],
    "Frontend": ["JavaScript", "React", "CSS", "Accessibility", "Performance"],
    "Data": ["Pandas", "SQL", "Statistics", "Visualization", "Excel"],
    "AI and ML": ["Machine Learning", "LLM Apps", "Prompting", "Evaluation"],
    "DevOps and Cloud": ["Docker", "Linux", "CI/CD", "Cloud", "Monitoring", "Scripting"],
    "Security": ["Web Security", "Cryptography", "Incident Response", "Networking", "Security"],
}
HOURS_PARTIAL = 10      # planning assumption: hours to turn thin evidence into solid evidence
HOURS_MISSING = 25      # planning assumption: hours to produce first credible evidence
BACKED = ("Demonstrated", "Developing")


def _group(skills, states):
    backed, partial, missing = [], [], []
    for s in skills:
        st = states.get(s, {}).get("state", "Needs Evidence")
        (backed if st in BACKED else partial if st == "Limited" else missing).append({"skill": s, "state": st})
    return backed, partial, missing


def effort_hours(partial, missing):
    return len(partial) * HOURS_PARTIAL + len(missing) * HOURS_MISSING


def weeks_for(hours, weekly):
    return math.ceil(hours / weekly) if hours else 0


def area_strength(states):
    out = []
    for area, skills in AREAS.items():
        b, p, m = _group(skills, states)
        out.append({"area": area, "backed": len(b), "total": len(skills), "pct": round(100 * len(b) / len(skills)),
                    "skills": b + p + m})
    out.sort(key=lambda a: (-a["pct"], -a["backed"], a["area"]))
    top = out[0] if out and out[0]["backed"] >= 2 else None
    return out, top


def role_fit(roles, states, current, weekly):
    rows = []
    for name, skills in roles.items():
        b, p, m = _group(skills, states)
        hours = effort_hours(p, m)
        rows.append({"role": name, "total": len(skills), "backed": [x["skill"] for x in b],
                     "partial": [x["skill"] for x in p], "missing": [x["skill"] for x in m],
                     "coverage_pct": round(100 * len(b) / len(skills)), "effort_hours": hours,
                     "effort_weeks": weeks_for(hours, weekly), "is_target": name == current})
    rows.sort(key=lambda r: (-r["coverage_pct"], r["effort_hours"], r["role"]))
    return rows


def radar(states, roles, current, weekly=6):
    areas, top = area_strength(states)
    rows = role_fit(roles, states, current, weekly)
    eligible = [r for r in rows if len(r["backed"]) >= 2]          # a role needs at least 2 evidenced skills to be suggested
    for r in rows:
        r["recommended"] = r in eligible[:3]
    suggestion = None
    if top and eligible:
        best = eligible[0]
        cur = next((r for r in rows if r["is_target"]), None)
        if cur is None or (best["role"] != cur["role"] and best["coverage_pct"] > cur["coverage_pct"]):
            suggestion = (f'Your strongest evidence is in {top["area"]}. {best["role"]} matches {best["coverage_pct"]}% of its skills'
                          + (f', compared with {cur["coverage_pct"]}% for your current target ({cur["role"]}).' if cur else "."))
    shortest = min(eligible, key=lambda r: (r["effort_hours"], -r["coverage_pct"]), default=None)
    return {"areas": areas, "strongest": top, "roles": rows, "suggestion": suggestion,
            "shortest_path": shortest["role"] if shortest else None,
            "assumptions": {"hours_partial": HOURS_PARTIAL, "hours_missing": HOURS_MISSING, "weekly_hours": weekly},
            "note": ("A strongest area needs at least two skills with Developing or Demonstrated evidence. "
                     if not top else "") + "Coverage counts only skills with recorded evidence. Missing evidence is not proof you lack a skill."}


def role_history(roles, results, sessions, states, current):
    full, retests = {}, {}
    for r in sorted(results, key=lambda r: parse_ts(r["created_at"])):
        if sessions.get(r["session_id"], {}).get("skill"):
            retests[r["role"]] = retests.get(r["role"], 0) + 1
            continue
        full.setdefault(r["role"], []).append(r)
    names = list(dict.fromkeys(list(full) + list(retests) + ([current] if current else [])))
    out = []
    for name in names:
        if name not in roles:
            continue
        rows = full.get(name, [])
        hist = [{"date": str(x["created_at"])[:10], "pct": round(100 * x["correct"] / x["total"])} for x in rows if x["total"]]
        pcts = [h["pct"] for h in hist]
        b, p, m = _group(roles[name], states)
        out.append({"role": name, "current": name == current, "attempts": len(rows), "skill_retests": retests.get(name, 0),
                    "latest_pct": pcts[-1] if pcts else None, "best_pct": max(pcts) if pcts else None,
                    "first_pct": pcts[0] if pcts else None, "last_at": rows[-1]["created_at"] if rows else None,
                    "history": hist, "coverage": {"backed": len(b), "partial": len(p), "missing": len(m), "total": len(roles[name])},
                    "coverage_pct": round(100 * len(b) / len(roles[name]))})
    out.sort(key=lambda r: (not r["current"], -(parse_ts(r["last_at"]).timestamp() if r["last_at"] else 0)))
    return out