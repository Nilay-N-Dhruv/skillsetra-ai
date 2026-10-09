"""Turns raw evidence into an honest, explainable competency state.
Levels: 0 none, 1 limited, 2 developing, 3 demonstrated. No fake percentages."""
from ..core.catalog import ALL_KEYS, DIMENSIONS

EXPLAIN = {
    "Demonstrated": "Repeated evidence supports this in the contexts tested.",
    "Developing": "Some evidence exists, but depth or consistency is still emerging.",
    "Limited": "Only weak or single evidence so far. One more targeted observation is needed.",
    "Needs Evidence": "No evidence yet. This is unknown, not a failure.",
    "Transfer Gap": "Knowledge looks strong, but independent use in a new context is not yet shown.",
}
PRIORITY = {"Needs Evidence": 0, "Transfer Gap": 0, "Limited": 1, "Developing": 2, "Demonstrated": 3}


def state_from_levels(levels: list[int]) -> str:
    if not levels:
        return "Needs Evidence"
    recent = levels[-4:]                      # the newest evidence matters most
    avg = sum(recent) / len(recent)
    if avg >= 2.5 and len(recent) >= 2:
        return "Demonstrated"
    if avg >= 1.5:
        return "Developing"
    return "Limited"


def build_states(evidence: list[dict]) -> dict[str, dict]:
    by_key: dict[str, list[dict]] = {k: [] for k in ALL_KEYS}
    for e in sorted(evidence, key=lambda e: e["created_at"]):
        if e["competency"] in by_key:
            by_key[e["competency"]].append(e)
    out = {}
    for k, rows in by_key.items():
        real = [r for r in rows if r.get("source_type") != "claim"]
        used = real or rows                   # claims count only when nothing verified exists
        levels = [r["level"] for r in used]
        out[k] = {"key": k, "kind": "dimension" if k in DIMENSIONS else "skill",
                  "state": state_from_levels(levels), "count": len(rows),
                  "claimed": any(r.get("source_type") == "claim" for r in rows),
                  "avg_level": round(sum(levels[-4:]) / len(levels[-4:]), 1) if levels else 0.0}
    if out["Knowledge"]["state"] == "Demonstrated" and out["Transfer"]["state"] in ("Needs Evidence", "Limited"):
        out["Transfer"]["state"] = "Transfer Gap"
    for v in out.values():
        v["explain"] = EXPLAIN[v["state"]]
    return out


async def competency_states(db, user_id: str) -> dict[str, dict]:
    return build_states(await db.select("evidence", user_id))