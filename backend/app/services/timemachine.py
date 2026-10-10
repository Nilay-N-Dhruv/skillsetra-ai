"""Career Time Machine: reuses the evidence you already have when you change role."""


def compare_roles(origin, target, states, roles, resources_for):
    origin_skills = set(roles[origin])
    groups = {"backed": [], "partial": [], "missing": []}
    for s in roles[target]:
        st = states[s]["state"]
        g = "backed" if st in ("Demonstrated", "Developing") else "partial" if st == "Limited" else "missing"
        groups[g].append({"skill": s, "state": st, "in_origin": s in origin_skills})
    gaps = groups["missing"] + groups["partial"]
    return {"origin": origin, "target": target, "same_role": origin == target, **groups,
            "new_for_you": [r["skill"] for r in groups["missing"] if not r["in_origin"]],
            "resources": [{"skill": r["skill"], "links": resources_for(r["skill"])[:2]} for r in gaps[:3]],
            "note": "This compares your saved evidence with the skills listed for each role. It is a guide, not a prediction of hiring outcomes."}