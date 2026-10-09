"""Unknown-problem challenges. Each skill has TWO variants so a re-test is a different problem."""
GROUPS = ["Debugging", "Testing", "Transfer"]

CHALLENGES = {
 "debug-1": {"competency": "Debugging", "variant": 1, "kind": "fix", "required_fn": "order_total",
   "title": "Checkout totals are wrong",
   "scenario": "A shop's checkout reports wrong totals for some customers and crashes for others. Find every root cause, fix the function and explain how you found them.",
   "requirements": ["Totals must include every item", "A discount is a fraction, for example 0.1 means 10% off", "An empty cart must return 0"],
   "constraints": ["Keep the function name and signature", "Python 3 standard library only"],
   "starter_code": "def order_total(items, discount=0):\n    total = 0\n    for i in range(1, len(items)):\n        total += items[i][\"price\"] * items[i][\"qty\"]\n    return total - total * discount / len(items)\n"},
 "debug-2": {"competency": "Debugging", "variant": 2, "kind": "fix", "required_fn": "paginate",
   "title": "The feed repeats posts",
   "scenario": "Users see the same posts on different pages of a feed. Find every root cause, fix it and explain your debugging process.",
   "requirements": ["Pages are 0-indexed", "Each page has exactly `size` posts (fewer on the last page)", "Separate calls must not share hidden state"],
   "constraints": ["Keep the function name", "Python 3 standard library only"],
   "starter_code": "def paginate(posts, page, size=10, seen=[]):\n    start = page * size\n    chunk = posts[start:start + size + 1]\n    seen.extend(chunk)\n    return chunk\n"},
 "test-1": {"competency": "Testing", "variant": 1, "kind": "tests", "required_fn": "normalize_email",
   "title": "Can you trust this email cleaner?",
   "scenario": "A teammate wrote normalize_email and says it is done. Write pytest tests that would catch real problems, including edge cases.",
   "requirements": ["At least 4 test functions starting with test_", "Cover normal, empty, whitespace and invalid input"],
   "constraints": ["Do not change the function", "Use plain assert statements"],
   "starter_code": "def normalize_email(s):\n    s = s.strip().lower()\n    if \"@\" not in s:\n        raise ValueError(\"invalid email\")\n    return s\n\n# write your tests below\n"},
 "test-2": {"competency": "Testing", "variant": 2, "kind": "tests", "required_fn": "parse_duration",
   "title": "Is this duration parser safe?",
   "scenario": "parse_duration turns text like '1h30m' into seconds. Write pytest tests that expose weaknesses, including edge cases.",
   "requirements": ["At least 4 test functions starting with test_", "Cover valid, empty, missing-unit and unexpected input"],
   "constraints": ["Do not change the function", "Use plain assert statements"],
   "starter_code": "import re\n\ndef parse_duration(text):\n    total = 0\n    for n, unit in re.findall(r\"(\\d+)([hms])\", text):\n        total += int(n) * {\"h\": 3600, \"m\": 60, \"s\": 1}[unit]\n    return total\n\n# write your tests below\n"},
 "transfer-1": {"competency": "Transfer", "variant": 1, "kind": "write", "required_fn": "dedupe_events",
   "title": "Noisy sensor events",
   "scenario": "IoT devices send duplicate alerts. Write dedupe_events(events, window_seconds) that drops an event if the same (device, type) pair was already kept within the window. Events are dicts {device, type, ts}, sorted by ts.",
   "requirements": ["The first event of each (device, type) is kept", "The same pair inside the window is dropped", "Return events in their original order"],
   "constraints": ["Python 3 standard library only", "Single pass over the data"],
   "starter_code": "def dedupe_events(events, window_seconds):\n    # your solution\n    pass\n"},
 "transfer-2": {"competency": "Transfer", "variant": 2, "kind": "write", "required_fn": "allow_request",
   "title": "Protect an API from bursts",
   "scenario": "Write allow_request(timestamps, now, limit, window) that returns True if a client with the given past request timestamps may make another request at time `now` without exceeding `limit` requests in the last `window` seconds.",
   "requirements": ["Ignore timestamps older than the window", "Return False when the limit is already reached", "Do not modify the input list"],
   "constraints": ["Python 3 standard library only", "Explain why your approach scales"],
   "starter_code": "def allow_request(timestamps, now, limit, window):\n    # your solution\n    pass\n"},
}


def public(cid: str) -> dict:
    """What the browser may see. The tested competency is hidden so it cannot bias the learner."""
    ch = CHALLENGES[cid]
    return {"id": cid, **{k: ch[k] for k in ("title", "scenario", "requirements", "constraints", "starter_code", "variant")}}

HINTS = {
    "debug-1": "Run the function in your head on an empty cart and on a cart with one item. Which line skips an item or fails?",
    "debug-2": "Call paginate twice in a row. What state survives between the two calls, and where does it live?",
    "test-1": "List what a real user might type: spaces, capital letters, empty text, text with no @. What should each do?",
    "test-2": "Try '1h30m', '', '90', '5x' and '1h1h'. Which should be errors, and does the code agree?",
    "transfer-1": "What must you remember for each (device, type) pair so you can compare the next event's time?",
    "transfer-2": "Once the window moves forward, which timestamps still matter? Count only those.",
}