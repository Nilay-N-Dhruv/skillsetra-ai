"""Proof of Growth: compares the first and the latest evidence for one competency.
It reports what the saved evidence shows and never claims that learning CAUSED a change."""
from .timeutil import parse_ts

LEVELS = ["No evidence", "Limited", "Developing", "Demonstrated"]
KIND = {"exam": "graded by the server", "challenge": "automatic checks plus AI", "github": "repository signals",
        "interview": "AI-evaluated", "defense": "AI-evaluated", "project": "AI-evaluated",
        "whatif": "rubric checks plus AI", "disagreement": "rubric checks plus AI", "seed": "demo data"}


def usable(evidence, competency):
    rows = [e for e in evidence if e["competency"] == competency and e.get("source_type") != "claim"]
    return sorted(rows, key=lambda e: parse_ts(e["created_at"]))


def overview(evidence, keys):
    out = []
    for k in keys:
        rows = usable(evidence, k)
        if rows:
            out.append({"key": k, "count": len(rows), "first_level": rows[0]["level"],
                        "latest_level": rows[-1]["level"], "ready": len(rows) >= 2})
    return sorted(out, key=lambda x: (not x["ready"], -x["count"]))


def _entry(e):
    return {"when": e["created_at"], "level": e["level"], "level_label": LEVELS[e["level"]],
            "source": e.get("source_type"), "kind": KIND.get(e.get("source_type"), "evaluated"), "summary": e["summary"]}


def build_report(competency, role, rows, progress, modules):
    if len(rows) < 2:
        return {"ready": False, "reason": f"Proof of Growth needs at least two separate pieces of evidence for {competency}. "
                                          f"You have {len(rows)}. Take a re-test or a challenge, then come back."}
    first, last = rows[0], rows[-1]
    t0, t1 = parse_ts(first["created_at"]), parse_ts(last["created_at"])
    titles = {m["key"]: m["title"] for m in modules}
    done = []
    for p in progress:
        skill, _, key = str(p["step_key"]).partition(":")
        if skill == competency and key in titles and t0 <= parse_ts(p["created_at"]) <= t1:
            done.append(titles[key])
    change = last["level"] - first["level"]
    movement = "up" if change > 0 else "down" if change < 0 else "same"
    limits = ["Finishing learning items between two results does not prove they caused any change.",
              "The two tasks can differ in difficulty, so read levels as signals, not exact measurements.",
              "Self-reported claims are not counted."]
    if first.get("source_type") != last.get("source_type"):
        limits.append("The two results come from different kinds of activity.")
    if any((r.get("details") or {}).get("source") in ("puter", "demo-heuristic") for r in (first, last)):
        limits.append("At least one result used browser AI or a demo fallback, which carries lower trust.")
    both_graded = first.get("source_type") == "exam" and last.get("source_type") == "exam"
    remaining = (f"{competency} is still below Demonstrated ({LEVELS[last['level']]}). Keep practising in new situations."
                 if last["level"] < 3 else f"No remaining gap in {competency} based on the evidence saved so far.")
    return {"ready": True, "role": role, "movement": movement, "change": change,
            "before": _entry(first), "after": _entry(last), "interventions": done, "remaining": remaining,
            "comparison": [_entry(r) for r in rows][-12:], "limitations": limits,
            "verification": ("Both results were graded by the server." if both_graded else
                             "At least one result was judged with AI or repository signals, so treat it as guidance.")}