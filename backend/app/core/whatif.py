"""What-If scenarios. Each one changes the conditions of a familiar situation.
The rubric is checked on the SERVER and is never sent to the browser before you submit."""

SCENARIOS = {
 "wi-scale": {"title": "Ten thousand users",
   "base": "You built a small API with one server and one database. It serves about 50 people a day and feels fast.",
   "change": "A news site links to your app. Next week 10,000 people may use it at the same time.",
   "question": "What would you change, in what order, and how would you know it worked?",
   "rubric": [
     {"label": "Measure before changing", "words": ["load test", "benchmark", "measure", "profil", "bottleneck", "monitor"]},
     {"label": "Caching", "words": ["cache", "caching", "redis", "cdn"]},
     {"label": "Database scaling", "words": ["index", "pool", "replica", "shard", "partition"]},
     {"label": "Horizontal scaling", "words": ["load balanc", "horizontal", "more instances", "autoscal", "scale out", "stateless"]},
     {"label": "Slow work in the background", "words": ["queue", "background", "async", "worker"]}]},
 "wi-dbdown": {"title": "The database goes down",
   "base": "Your app reads and writes everything in one database. Users sign in, browse and save data.",
   "change": "The database becomes unreachable for ten minutes during peak hours.",
   "question": "What should the app do during the outage, and what would you put in place so it hurts less next time?",
   "rubric": [
     {"label": "Timeouts and retries", "words": ["timeout", "retry", "retries", "backoff"]},
     {"label": "Graceful degradation", "words": ["degrad", "read-only", "cached", "fallback", "maintenance"]},
     {"label": "Monitoring and alerts", "words": ["alert", "monitor", "health check", "log"]},
     {"label": "Clear messages to users", "words": ["error message", "friendly", "message to", "status page", "inform"]},
     {"label": "Backup and recovery", "words": ["backup", "restore", "failover", "replica", "recover"]}]},
 "wi-security": {"title": "A new security requirement",
   "base": "Your app stores names, emails and learning records for several hundred users.",
   "change": "An auditor says you must now prove that personal data is protected.",
   "question": "Which changes would you make first, and how would you show the auditor they work?",
   "rubric": [
     {"label": "Encryption", "words": ["encrypt", "tls", "https", "hash"]},
     {"label": "Access control", "words": ["access control", "least privilege", "permission", "authoriz", "authenticat", "role"]},
     {"label": "Audit logging", "words": ["audit", "log"]},
     {"label": "Data minimisation", "words": ["minimi", "retention", "delete", "anonymi", "only collect"]},
     {"label": "Secret handling", "words": ["secret", "key rotation", "vault", "environment variable", "rotate"]}]},
 "wi-apichange": {"title": "A partner API changes",
   "base": "Your app calls a partner's API and shows the result directly to users.",
   "change": "The partner renames fields and changes the response format without warning.",
   "question": "How would you make your app survive changes like this?",
   "rubric": [
     {"label": "Validate responses", "words": ["validat", "schema", "parse"]},
     {"label": "Adapter layer", "words": ["adapter", "wrapper", "abstraction", "isolate"]},
     {"label": "Contract or integration tests", "words": ["contract test", "integration test", "test"]},
     {"label": "Versioning", "words": ["version", "pin"]},
     {"label": "Fallback and alerts", "words": ["fallback", "alert", "monitor", "graceful", "error handling"]}]},
 "wi-budget": {"title": "The budget is cut in half",
   "base": "Your product runs on paid servers, a managed database and several paid tools.",
   "change": "Next quarter your hosting and tools budget is cut by half.",
   "question": "How would you decide what to cut or change, and what would you tell your team?",
   "rubric": [
     {"label": "Measure costs first", "words": ["measure", "cost report", "billing", "usage", "track"]},
     {"label": "Prioritise", "words": ["priorit", "mvp", "must-have", "drop", "cut"]},
     {"label": "Right-size resources", "words": ["right-size", "rightsiz", "smaller", "autoscal", "scale down", "reserved"]},
     {"label": "Cheaper alternatives", "words": ["managed", "free tier", "open source", "cheaper", "serverless", "alternative"]},
     {"label": "Explain the trade-offs", "words": ["trade-off", "tradeoff", "stakeholder", "explain", "impact"]}]},
 "wi-flaky": {"title": "A service fails now and then",
   "base": "Your checkout calls a payment service on every order.",
   "change": "The payment service now fails about 5% of the time, at random.",
   "question": "How should checkout behave, and what must you be careful about?",
   "rubric": [
     {"label": "Retries with backoff", "words": ["retry", "retries", "backoff"]},
     {"label": "Avoid duplicate charges", "words": ["idempoten", "duplicate", "deduplic"]},
     {"label": "Timeouts and circuit breaker", "words": ["timeout", "circuit breaker", "circuit-breaker"]},
     {"label": "Queue or async handling", "words": ["queue", "async", "background", "buffer"]},
     {"label": "Observability", "words": ["monitor", "alert", "metric", "log", "trace"]}]},
}


def public(sid):
    s = SCENARIOS[sid]
    return {"id": sid, "title": s["title"], "base": s["base"], "change": s["change"], "question": s["question"]}


def coverage(text, rubric):
    low = text.lower()
    return [{"label": r["label"], "covered": any(w in low for w in r["words"])} for r in rubric]


def cap_from(covered):
    """More expected ideas covered = a higher maximum level. The AI can never go above this."""
    return 0 if covered == 0 else 1 if covered == 1 else 2 if covered <= 3 else 3