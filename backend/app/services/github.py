"""GitHub Intelligence: reads PUBLIC repository metadata with the official REST API."""
import re
import time

import httpx
from fastapi import HTTPException

from ..core.config import settings

GH = "https://api.github.com"
REPO_RE = re.compile(r"^(?:https?://github\.com/)?([A-Za-z0-9_.-]{1,100})/([A-Za-z0-9_.-]{1,100})/?$")
_cache: dict[str, tuple[float, dict]] = {}


def normalize(raw: str) -> str:
    """'https://github.com/psf/requests.git' or 'psf/requests' -> 'psf/requests'. Anything else is rejected."""
    m = REPO_RE.match(raw.strip())
    if not m:
        raise ValueError("repo")
    owner, name = m.group(1), m.group(2).removesuffix(".git")
    if not name or owner.startswith(".") or name.startswith("."):    # blocks '..' path tricks
        raise ValueError("repo")
    return f"{owner}/{name}"


def signals_from_paths(paths: list[str]) -> dict:
    low = [p.lower() for p in paths]
    has = lambda pred: any(pred(p) for p in low)
    return {
        "tests": has(lambda p: "test" in p.split("/")[-1] or p.startswith(("tests/", "test/"))),
        "dockerfile": has(lambda p: p.split("/")[-1] == "dockerfile"),
        "compose": has(lambda p: "docker-compose" in p or p.endswith("compose.yml")),
        "ci": has(lambda p: p.startswith(".github/workflows/")),
        "license": has(lambda p: p.split("/")[-1].startswith("license")),
        "env_example": has(lambda p: p.endswith(".env.example")),
        "deps": has(lambda p: p.split("/")[-1] in ("requirements.txt", "package.json", "pyproject.toml")),
        "readme": has(lambda p: p.split("/")[-1].startswith("readme")),
    }


def evidence_from_signals(s: dict) -> list[tuple[str, int, str]]:
    out = []
    if s["tests"]:
        out.append(("Testing", 2 if s["ci"] else 1, "Test files found" + (" with a CI workflow" if s["ci"] else "")))
    if s["dockerfile"]:
        out.append(("Docker", 2 if s["compose"] else 1, "Dockerfile found" + (" with a compose file" if s["compose"] else "")))
    if s["ci"] or s["dockerfile"]:
        out.append(("Deployment", 2 if (s["ci"] and s["dockerfile"]) else 1, "CI and/or container configuration present"))
    score = sum(bool(s[k]) for k in ("readme", "license", "ci", "env_example", "tests", "deps"))
    if score >= 3:
        out.append(("Engineering", 2 if score >= 5 else 1, f"{score} of 6 engineering-hygiene signals present"))
    return out


async def analyze_repo(full_name: str) -> dict:
    hit = _cache.get(full_name.lower())
    if hit and hit[0] > time.time():
        return hit[1]
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "skillsetra"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    try:
        async with httpx.AsyncClient(timeout=10, headers=headers) as c:
            r = await c.get(f"{GH}/repos/{full_name}")
            if r.status_code == 404:
                raise HTTPException(404, "Repository not found or not public.")
            if r.status_code in (403, 429):
                raise HTTPException(429, "GitHub rate limit reached. Try again later or add a GitHub token on the server.")
            r.raise_for_status()
            meta = r.json()
            langs = (await c.get(f"{GH}/repos/{full_name}/languages")).json()
            tree = (await c.get(f"{GH}/repos/{full_name}/git/trees/{meta['default_branch']}?recursive=1")).json()
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, ValueError):
        raise HTTPException(502, "We couldn't connect to GitHub. Check your connection or try again.")
    paths = [t["path"] for t in tree.get("tree", [])][:5000] if isinstance(tree, dict) else []
    sig = signals_from_paths(paths)
    result = {"repo": full_name, "description": meta.get("description"), "stars": meta.get("stargazers_count", 0),
              "languages": list(langs)[:6] if isinstance(langs, dict) else [], "file_count": len(paths), "signals": sig,
              "evidence": [{"competency": c, "level": l, "summary": s} for c, l, s in evidence_from_signals(sig)],
              "note": "GitHub signals are evidence, not proof of skill or authorship."}
    _cache[full_name.lower()] = (time.time() + 600, result)
    return result