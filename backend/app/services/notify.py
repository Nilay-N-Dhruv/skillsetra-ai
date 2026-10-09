"""Create notifications, respecting the user's preferences. A failure here must never break the main action."""
import logging

log = logging.getLogger("skillsetra.notify")
DEFAULT_PREFS = {"email": False, "assessment": True, "interview": True, "learning": True, "job": True}


async def get_prefs(db, uid) -> dict:
    rows = await db.select("user_settings", uid)
    return {**DEFAULT_PREFS, **(rows[0].get("prefs") or {})} if rows else dict(DEFAULT_PREFS)


async def notify(db, uid, kind, title, body="", link=""):
    try:
        if kind != "system" and not (await get_prefs(db, uid)).get(kind, True):
            return
        await db.insert("notifications", {"user_id": uid, "kind": kind, "title": title[:120],
                                          "body": body[:300], "link": link[:200], "read": False})
    except Exception:                      # noqa: BLE001
        log.exception("notification failed")