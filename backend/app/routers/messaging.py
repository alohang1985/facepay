from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id

router = APIRouter(prefix="/messages", tags=["messages"])


class _SendMessage(BaseModel):
    to_user_id: str
    face_id: Optional[str] = None
    subject: str = ""
    body: str


@router.post("")
async def send_message(msg: _SendMessage, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        mid = new_id()
        db.execute(
            "INSERT INTO messages (id, from_user_id, to_user_id, face_id, subject, body) VALUES (?, ?, ?, ?, ?, ?)",
            (mid, current_user["id"], msg.to_user_id, msg.face_id, msg.subject, msg.body),
        )
        db.commit()
        return {"id": mid, "message": "Message sent"}
    finally:
        db.close()


@router.get("/inbox")
async def inbox(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT m.*, u.name as from_name, u.email as from_email, f.name as face_name
               FROM messages m
               LEFT JOIN users u ON m.from_user_id = u.id
               LEFT JOIN faces f ON m.face_id = f.id
               WHERE m.to_user_id = ? ORDER BY m.created_at DESC""",
            (current_user["id"],),
        ).fetchall()
        unread = sum(1 for r in rows if not r["read"])
        return {"messages": dict_rows(rows), "unread": unread}
    finally:
        db.close()


@router.get("/sent")
async def sent(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT m.*, u.name as to_name, f.name as face_name
               FROM messages m
               LEFT JOIN users u ON m.to_user_id = u.id
               LEFT JOIN faces f ON m.face_id = f.id
               WHERE m.from_user_id = ? ORDER BY m.created_at DESC""",
            (current_user["id"],),
        ).fetchall()
        return {"messages": dict_rows(rows)}
    finally:
        db.close()


@router.patch("/{msg_id}/read")
async def mark_read(msg_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        db.execute("UPDATE messages SET read = 1 WHERE id = ? AND to_user_id = ?", (msg_id, current_user["id"]))
        db.commit()
        return {"message": "Marked as read"}
    finally:
        db.close()


@router.delete("/{msg_id}")
async def delete_message(msg_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        db.execute("DELETE FROM messages WHERE id = ? AND (from_user_id = ? OR to_user_id = ?)",
                   (msg_id, current_user["id"], current_user["id"]))
        db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()


# === Usage Reports (Misuse Detection) ===
class _ReportMisuse(BaseModel):
    license_id: str
    reported_url: str
    notes: str = ""


@router.post("/report-misuse")
async def report_misuse(body: _ReportMisuse, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rid = new_id()
        db.execute(
            "INSERT INTO usage_reports (id, license_id, reported_url, notes) VALUES (?, ?, ?, ?)",
            (rid, body.license_id, body.reported_url, body.notes),
        )
        db.commit()
        return {"id": rid, "message": "Misuse report submitted"}
    finally:
        db.close()


@router.get("/reports")
async def my_reports(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT r.*, l.face_id, f.name as face_name
               FROM usage_reports r
               LEFT JOIN licenses l ON r.license_id = l.id
               LEFT JOIN faces f ON l.face_id = f.id
               WHERE l.buyer_id = ? OR l.provider_id = ?
               ORDER BY r.created_at DESC""",
            (current_user["id"], current_user["id"]),
        ).fetchall()
        return {"reports": dict_rows(rows)}
    finally:
        db.close()
