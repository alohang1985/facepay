from fastapi import APIRouter, HTTPException, Depends
from app.core.security import get_current_user
from app.core.database import get_db, dict_rows, new_id

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT w.id as wishlist_id, w.created_at as added_at, f.*
               FROM wishlist w JOIN faces f ON w.face_id = f.id
               WHERE w.user_id = ? ORDER BY w.created_at DESC""",
            (current_user["id"],),
        ).fetchall()
        return {"items": dict_rows(rows)}
    finally:
        db.close()


@router.post("/{face_id}")
async def add_to_wishlist(face_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        existing = db.execute(
            "SELECT id FROM wishlist WHERE user_id = ? AND face_id = ?",
            (current_user["id"], face_id),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Already in wishlist")

        wid = new_id()
        db.execute("INSERT INTO wishlist (id, user_id, face_id) VALUES (?, ?, ?)", (wid, current_user["id"], face_id))
        db.commit()
        return {"message": "Added to wishlist", "id": wid}
    finally:
        db.close()


@router.delete("/{face_id}")
async def remove_from_wishlist(face_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        db.execute("DELETE FROM wishlist WHERE user_id = ? AND face_id = ?", (current_user["id"], face_id))
        db.commit()
        return {"message": "Removed from wishlist"}
    finally:
        db.close()


@router.get("/check/{face_id}")
async def check_wishlist(face_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        row = db.execute("SELECT id FROM wishlist WHERE user_id = ? AND face_id = ?", (current_user["id"], face_id)).fetchone()
        return {"in_wishlist": row is not None}
    finally:
        db.close()
