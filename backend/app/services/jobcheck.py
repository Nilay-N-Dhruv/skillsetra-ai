"""Job Reality Check: compares what a job asks for with the evidence you have. Deterministic and explainable.
It never treats missing evidence as proof that you lack a skill."""
import re
from collections import Counter

from .evidence_graph import build_graph
from .role_fit import HOURS_MISSING, HOURS_PARTIAL

SKILL_PATTERNS = {k: re.compile(v, re.I) for k, v in {
    "Python": r"\bpython\b",
    "Pandas": r"\bpandas\b",
    "Machine Learning": r"machine learning|\bml\b|scikit|sklearn|tensorflow|pytorch|deep learning|\bnlp\b",
    "SQL": r"\bsql\b|postgres|mysql|sqlite|relational database",
    "FastAPI": r"fastapi",
    "Docker": r"docker|container",
    "APIs": r"\bapis?\b|\brest(?:ful)?\b|graphql|openapi",
    "Authentication": r"authenticat|\boauth\b|\bjwt\b|authoriz|\bsso\b",
    "Testing": r"unit test|integration test|\btesting\b|\bpytest\b|\bjest\b|test-driven|\btdd\b|\bqa\b",
    "Debugging": r"\bdebug|troubleshoot",
    "JavaScript": r"javascript|\bjs\b|typescript|node\.?js",
    "React": r"\breact\b|next\.?js",
    "CSS": r"\bcss\b|tailwind|\bsass\b",
    "Accessibility": r"accessib|\bwcag\b|\ba11y\b",
    "Performance": r"web performance|performance optimi[sz]|\blatency\b",
    "Packaging": r"packaging|\bpypi\b|pyproject",
    "Linux": r"\blinux\b|\bbash\b|\bunix\b",
    "CI/CD": r"ci/cd|\bcicd\b|continuous integration|github actions|jenkins|gitlab ci",
    "Cloud": r"\baws\b|\bazure\b|\bgcp\b|google cloud|cloud (?:platform|services|infrastructure)",
    "Deployment": r"\bdeploy",
    "Monitoring": r"monitoring|observability|prometheus|grafana",
    "Scripting": r"scripting|shell script",
    "Networking": r"networking|\btcp\b|\bdns\b",
    "Web Security": r"web security|\bowasp\b|\bxss\b|sql injection|penetration test|pentest",
    "Security": r"\bsecurity\b",
    "Cryptography": r"cryptograph|encryption|\btls\b",
    "Incident Response": r"incident response|\bsiem\b|threat detection",
    "Statistics": r"statistic|hypothesis test|a/b test",
    "Visualization": r"visuali[sz]ation|tableau|power bi|matplotlib",
    "Excel": r"\bexcel\b|spreadsheet",
    "LLM Apps": r"\bllms?\b|large language model|\brag\b|langchain",
    "Prompting": r"prompt engineering|prompting",
    "Evaluation": r"model evaluation|evaluation metrics|\bevals?\b",
    "Problem Solving": r"problem[- ]solving",
}.items()}
OTHER_TECH = {k: re.compile(v, re.I) for k, v in {
    "Kubernetes": r"kubernetes|\bk8s\b", "Terraform": r"terraform", "Java": r"\bjava\b", "Go": r"\bgolang\b",
    "Rust": r"\brust\b", "C++": r"c\+\+", "C#/.NET": r"c#|\.net\b", "PHP": r"\bphp\b", "Ruby": r"\bruby\b",
    "Kafka": r"\bkafka\b", "Redis": r"\bredis\b", "MongoDB": r"\bmongo(?:db)?\b", "Spark": r"\bspark\b",
    "Airflow": r"\bairflow\b", "Kotlin/Swift": r"\bkotlin\b|\bswift\b", "Flutter": r"\bflutter\b",
    "Microservices": r"microservice", "Agile/Scrum": r"\bagile\b|\bscrum\b"}.items()}
PREFERRED = re.compile(r"nice to have|preferred|bonus|good to have|a plus|desirable", re.I)
RESPONSIBILITY = re.compile(r"responsibilit|what you.?ll do|day[- ]to[- ]day", re.I)
REQUIRED = re.compile(r"requirements?|required|must have|qualifications|what you.?ll need|essential", re.I)
BULLET = re.compile(r"^\s*(?:[-*\u2022\u00b7]|\d+[.)])\s+")
QUAL = re.compile(r"bachelor|master'?s|degree|certification|b\.?tech|\bphd\b", re.I)
YEARS = re.compile(r"(\d{1,2})\s*(?:\+|-\s*\d{1,2}|to\s*\d{1,2})?\s*(?:years?|yrs?)\b")
WHY = {"demonstrated": "Two or more recent recorded results support this.",
       "partial": "Some evidence exists, but it is thin or older than 90 days.",
       "missing": "No recorded results yet. This is missing evidence, not proof that you lack the skill."}


def extract(text):
    mode = "required"
    counts, required, resp, quals = Counter(), set(), [], []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        low = line.lower()
        if line.endswith(":") or (len(line) <= 30 and line.isupper()):          # a section header
            if PREFERRED.search(low):
                mode = "preferred"
            elif RESPONSIBILITY.search(low):
                mode = "responsibilities"
            elif REQUIRED.search(low):
                mode = "required"
            continue
        preferred_line = mode == "preferred" or bool(PREFERRED.search(low))
        if mode == "responsibilities" and BULLET.match(line) and len(resp) < 8:
            resp.append(BULLET.sub("", line)[:160])
        if QUAL.search(low) and len(quals) < 5:
            quals.append(line[:160])
        for key, pat in SKILL_PATTERNS.items():
            n = len(pat.findall(line))
            if n:
                counts[key] += n
                if not preferred_line:
                    required.add(key)
    skills = [{"key": k, "mentions": n, "level": "required" if k in required else "preferred"} for k, n in counts.items()]
    years = sorted({int(m) for m in YEARS.findall(text.lower()) if 0 < int(m) <= 30})
    return {"skills": skills, "other": [k for k, p in OTHER_TECH.items() if p.search(text)],
            "years": years, "responsibilities": resp, "qualifications": quals}


def analyze(text, evidence, resources_for, now=None):
    ex = extract(text)
    graph = {s["key"]: s for s in build_graph(evidence, now)["skills"]}
    reqs = []
    for r in sorted(ex["skills"], key=lambda r: (r["level"] != "required", -r["mentions"], r["key"])):
        g = graph.get(r["key"])
        status = ("demonstrated" if g and g["klass"] == "demonstrated"
                  else "partial" if g and g["klass"] in ("insufficient", "outdated") else "missing")
        claimed = bool(g and g["claim_count"]) and status == "missing"
        reqs.append({**r, "status": status, "claimed": claimed,
                     "state": g["state"] if g and g["verified_count"] else None,
                     "why": WHY[status] + (" You marked it as learned, but a claim is not a demonstrated skill." if claimed else ""),
                     "evidence": [{"date": str(e["when"])[:10], "source": e["source_label"], "level": e["level"]}
                                  for e in (g["evidence"] if g else []) if not e["claim"]][:3]})
    counts = Counter(r["status"] for r in reqs)
    n = len(reqs)
    score = round(100 * (counts["demonstrated"] + 0.5 * counts["partial"]) / n) if n else None
    todo = sorted((r for r in reqs if r["status"] != "demonstrated"),
                  key=lambda r: (r["level"] != "required", -r["mentions"], r["status"] != "missing"))[:6]
    plan = []
    for r in todo:
        links = resources_for(r["key"])
        plan.append({"skill": r["key"], "status": r["status"], "level": r["level"],
                     "hours": HOURS_MISSING if r["status"] == "missing" else HOURS_PARTIAL,
                     "action": "Build your first evidence" if r["status"] == "missing" else "Strengthen and refresh your evidence",
                     "resource": links[0] if links else None})
    notes = ["Requirements are found by matching known skill names in the text. Unusual wording can be missed.",
             "Not-assessed items are technologies SkillSetra cannot test yet. They are not counted in the score.",
             "Missing evidence is not proof that you lack a skill."]
    if ex["years"]:
        notes.append(f'The posting mentions up to {max(ex["years"])} years of experience. SkillSetra cannot verify years of experience.')
    return {"requirements": reqs, "not_assessed": ex["other"], "experience_years": ex["years"],
            "responsibilities": ex["responsibilities"], "qualifications": ex["qualifications"],
            "counts": {"demonstrated": counts["demonstrated"], "partial": counts["partial"], "missing": counts["missing"], "total": n},
            "score": score, "score_confidence": "reasonable" if n >= 5 else "limited" if n >= 3 else "very limited",
            "formula": "Score = (demonstrated + 0.5 x partially supported) / assessable requirements",
            "plan": plan, "total_hours": sum(p["hours"] for p in plan), "notes": notes}