from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..core.db import db_for
from ..core.security import CurrentUser, get_current_user
from ..services.notify import get_prefs

router = APIRouter(prefix="/api/notifications")
UUID = r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"


class PrefsIn(BaseModel):
    email: bool = False
    assessment: bool = True
    interview: bool = True
    learning: bool = True
    job: bool = True


class ReadIn(BaseModel):
    id: str | None = Field(default=None, pattern=UUID)      # none = mark everything read


@router.get("")
async def list_notifications(user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    items = await db.select("notifications", user.id, order="created_at", desc=True, limit=30)
    return {"items": items, "unread": sum(not i["read"] for i in items), "prefs": await get_prefs(db, user.id)}


@router.post("/read")
async def mark_read(body: ReadIn, user: CurrentUser = Depends(get_current_user)):
    db = db_for(user)
    if body.id:
        await db.update("notifications", user.id, {"read": True}, id=body.id)
    else:
        await db.update("notifications", user.id, {"read": True}, read=False)
    return {"ok": True}


@router.put("/prefs")
async def save_prefs(body: PrefsIn, user: CurrentUser = Depends(get_current_user)):
    await db_for(user).upsert("user_settings", {"user_id": user.id, "prefs": body.model_dump()})
    return {"ok": True}