"""Skill Evidence Graph: groups saved evidence by skill and says how solid each skill's evidence is.
It reads existing evidence rows and creates nothing new."""
from datetime import datetime, timezone

from ..core.catalog import DIMENSIONS
from .competency import state_from_levels
from .timeutil import parse_ts

STALE_DAYS = 90
SOURCE_LABELS = {"exam": "Assessment", "challenge": "Challenge", "github": "GitHub analysis", "interview": "AI interview",
                 "defense": "Project defense", "project": "Project", "whatif": "What-If", "disagreement": "AI Disagreement",
                 "claim": "Self-reported", "seed": "Demo data"}


def classify(rows, now):
    """self-reported / insufficient / outdated / demonstrated. 'Insufficient' means the evidence is thin, not that the skill is missing."""
    real = [r for r in rows if r.get("source_type") != "claim"]
    if not real:
        return "self-reported"
    if len(real) < 2:
        return "insufficient"
    newest = max(parse_ts(r["created_at"]) for r in real)
    if (now - newest).days > STALE_DAYS:
        return "outdated"
    ordered = sorted(real, key=lambda r: parse_ts(r["created_at"]))
    if state_from_levels([r["level"] for r in ordered]) == "Limited":
        return "insufficient"
    return "demonstrated"


def build_graph(evidence, now=None):
    now = now or datetime.now(timezone.utc)
    by = {}
    for e in evidence:
        by.setdefault(e["competency"], []).append(e)
    skills = []
    for key, rows in by.items():
        rows = sorted(rows, key=lambda r: parse_ts(r["created_at"]))
        real = [r for r in rows if r.get("source_type") != "claim"]
        skills.append({
            "key": key, "kind": "dimension" if key in DIMENSIONS else "skill",
            "klass": classify(rows, now),
            "state": state_from_levels([r["level"] for r in real]) if real else "Self-reported only",
            "count": len(rows), "verified_count": len(real), "claim_count": len(rows) - len(real),
            "first_real_at": real[0]["created_at"] if real else None,
            "last_real_at": real[-1]["created_at"] if real else None,
            "last_at": rows[-1]["created_at"],
            "evidence": [{"id": r.get("id"), "when": r["created_at"], "source": r.get("source_type"),
                          "source_label": SOURCE_LABELS.get(r.get("source_type"), "Other"), "level": r["level"],
                          "confidence": r.get("confidence"), "summary": r["summary"],
                          "claim": r.get("source_type") == "claim"} for r in reversed(rows)][:50],
        })
    skills.sort(key=lambda s: (-s["verified_count"], s["key"]))
    counts = {}
    for e in evidence:
        counts[e.get("source_type")] = counts.get(e.get("source_type"), 0) + 1
    sources = [{"key": k, "label": SOURCE_LABELS.get(k, "Other"), "count": n} for k, n in sorted(counts.items(), key=lambda x: -x[1])]
    return {"skills": skills, "sources": sources, "stale_days": STALE_DAYS, "generated_at": now.isoformat()}