"""Proof Passport: builds the PUBLIC view from an allow-list of fields.
Anything not copied here (answers, summaries, notes, ids, email) can never appear on a public page."""
import secrets

from .evidence_graph import build_graph
from .growth import KIND, LEVELS

NOTES = ["This evidence was recorded by SkillSetra from the learner's own activity. It is not an external certification or accreditation.",
         "Self-reported skills are claims. SkillSetra has not verified them.",
         "A skill with little or no evidence here is not proof that the learner lacks it."]


def new_slug():
    """12 random URL-safe characters (72 bits). Impossible to guess or count through."""
    return secrets.token_urlsafe(9)


def _day(value):
    return str(value)[:10] if value else None


def build_public(row, role, evidence, now=None):
    chosen = set(row.get("skills") or [])
    skills = []
    for s in build_graph(evidence, now)["skills"]:
        if s["key"] not in chosen:
            continue
        real = [e for e in s["evidence"] if not e["claim"]]                 # newest first
        skills.append({
            "key": s["key"], "status": s["klass"],
            "state": s["state"] if real else None,
            "verified_results": s["verified_count"], "self_reported": s["claim_count"] > 0,
            "first_result": _day(s["first_real_at"]), "last_result": _day(s["last_real_at"]),
            "results": [{"date": _day(e["when"]), "source": e["source_label"],
                         "judged_by": KIND.get(e["source"], "evaluated"), "level": LEVELS[e["level"]]} for e in real[:6]],
        })
    repos = []
    if row.get("show_repos"):
        repos = sorted({e["source_ref"] for e in evidence if e.get("source_type") == "github" and e.get("source_ref")})[:12]
    return {"name": row.get("display_name") or "Learner", "headline": row.get("headline") or "",
            "role": role if row.get("show_role") else None, "published_on": _day(row.get("published_at")),
            "skills": skills, "repos": repos, "notes": NOTES}