from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.core.database import get_db, dict_rows

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            (current_user["id"],),
        ).fetchall()
        unread = sum(1 for r in rows if not r["read"])
        return {"notifications": dict_rows(rows), "unread": unread}
    finally:
        db.close()


@router.patch("/read-all")
async def read_all(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        db.execute("UPDATE notifications SET read = 1 WHERE user_id = ?", (current_user["id"],))
        db.commit()
        return {"message": "All marked as read"}
    finally:
        db.close()


@router.patch("/{nid}/read")
async def read_one(nid: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        db.execute("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?", (nid, current_user["id"]))
        db.commit()
        return {"message": "Marked as read"}
    finally:
        db.close()
