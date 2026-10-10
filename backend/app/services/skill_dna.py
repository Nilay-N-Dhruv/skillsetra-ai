"""Skill DNA: a fingerprint of HOW a learner works, built only from saved evidence.
No AI is used here. Every number can be traced to the rows listed under it."""
from .competency import state_from_levels
from .timeutil import parse_ts

SPEC = [
    ("accuracy", "Accuracy", "Assessment questions answered correctly"),
    ("debugging", "Debugging", "Finding and fixing faults"),
    ("reasoning", "Reasoning", "Explaining causes and trade-offs"),
    ("testing", "Testing habits", "Checking work with tests and edge cases"),
    ("problem_solving", "Problem solving", "Breaking an unfamiliar problem down"),
    ("adaptation", "Adaptation", "Changing a solution when conditions change"),
    ("explanation", "Explanation", "Defending decisions in words"),
]
DISCLAIMER = ("Skill DNA describes patterns in the work you completed in this app. It is not a validated "
              "psychological assessment and says nothing about intelligence or personality.")
MIN_EVIDENCE = 2


def _rows(key, evidence, exams):
    if key == "accuracy":
        return [{"when": e["created_at"], "source": "exam", "level": round(3 * e["correct"] / e["total"], 2),
                 "summary": f'{e["correct"]} of {e["total"]} correct ({e["role"]})'} for e in exams if e.get("total")]
    rows = []
    for e in evidence:
        if e.get("source_type") == "claim":          # self-reported claims never shape the fingerprint
            continue
        c, s = e["competency"], e.get("source_type")
        match = {"debugging": c == "Debugging", "reasoning": c == "Reasoning", "testing": c == "Testing",
                 "problem_solving": c == "Problem Solving", "adaptation": c in ("Adaptation", "Transfer"),
                 "explanation": s in ("defense", "interview")}[key]
        if match:
            rows.append({"when": e["created_at"], "source": s, "level": e["level"], "summary": e["summary"]})
    return rows


def _indicator(key, label, blurb, rows):
    rows = sorted(rows, key=lambda r: parse_ts(r["when"]))
    levels = [r["level"] for r in rows]
    n = len(rows)
    avg = state = trend = steady = None
    if n < MIN_EVIDENCE:
        state = "No evidence" if n == 0 else "Insufficient evidence"
    else:
        state = state_from_levels(levels)
        recent = levels[-4:]
        avg = round(sum(recent) / len(recent), 1)
    if n >= 3:
        diff = levels[-1] - levels[0]
        trend = "improving" if diff >= 1 else "declining" if diff <= -1 else "flat"
        mean = sum(levels) / n
        sd = (sum((x - mean) ** 2 for x in levels) / n) ** 0.5
        steady = "steady" if sd <= 0.6 else "varied"
    return {"key": key, "label": label, "blurb": blurb, "state": state, "avg_level": avg, "count": n,
            "trend": trend, "consistency": steady, "last_at": rows[-1]["when"] if rows else None,
            "evidence": list(reversed(rows))[:8]}


def _observations(items):
    by = {i["key"]: i for i in items}
    has = lambda k: by[k]["avg_level"] is not None
    high = lambda k: has(k) and by[k]["avg_level"] >= 2.5
    low = lambda k: has(k) and by[k]["avg_level"] < 1.5
    out = []
    if high("accuracy") and (low("testing") or low("debugging")):
        out.append("Your assessment answers are strong, but your testing or debugging evidence is lower. Hands-on practice is your next step.")
    if low("accuracy") and (high("debugging") or high("testing")):
        out.append("Your hands-on evidence is strong even though assessment accuracy is lower. Review the concepts behind the questions you missed.")
    others = any(has(k) for k in by if k != "adaptation")
    if others and not has("adaptation"):
        out.append("There is not enough evidence about how you adapt when conditions change. Try the What-If Machine.")
    if others and not has("explanation"):
        out.append("There is no evidence yet of you defending decisions in words. Try Project Defense or the AI Interviewer.")
    for i in items:
        if i["trend"] == "improving":
            out.append(f'{i["label"]} is improving across your attempts.')
    return out or ["Add more evidence from assessments, challenges and labs to reveal your patterns."]


def compute_dna(evidence, exams):
    items = [_indicator(k, label, blurb, _rows(k, evidence, exams)) for k, label, blurb in SPEC]
    return {"indicators": items, "observations": _observations(items), "disclaimer": DISCLAIMER,
            "total_evidence": sum(i["count"] for i in items)}