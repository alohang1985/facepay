from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id

router = APIRouter(prefix="/reviews", tags=["reviews"])


class _ReviewCreate(BaseModel):
    face_id: str
    rating: int
    comment: str = ""


@router.post("")
async def create_review(body: _ReviewCreate, current_user: dict = Depends(get_current_user)):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    db = get_db()
    try:
        existing = db.execute("SELECT id FROM reviews WHERE face_id = ? AND user_id = ?", (body.face_id, current_user["id"])).fetchone()
        if existing:
            # Update existing review
            db.execute("UPDATE reviews SET rating = ?, comment = ? WHERE face_id = ? AND user_id = ?",
                       (body.rating, body.comment, body.face_id, current_user["id"]))
            db.commit()
            return {"message": "Review updated"}

        rid = new_id()
        db.execute("INSERT INTO reviews (id, face_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
                   (rid, body.face_id, current_user["id"], body.rating, body.comment))
        db.commit()
        return {"message": "Review created", "id": rid}
    finally:
        db.close()


@router.get("/face/{face_id}")
async def get_face_reviews(face_id: str):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT r.*, u.name as user_name FROM reviews r
               LEFT JOIN users u ON r.user_id = u.id
               WHERE r.face_id = ? ORDER BY r.created_at DESC""",
            (face_id,)
        ).fetchall()

        avg = db.execute("SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE face_id = ?", (face_id,)).fetchone()

        return {
            "reviews": dict_rows(rows),
            "average_rating": round(avg["avg"] or 0, 1),
            "total_reviews": avg["count"] or 0,
        }
    finally:
        db.close()


@router.delete("/{review_id}")
async def delete_review(review_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        review = db.execute("SELECT user_id FROM reviews WHERE id = ?", (review_id,)).fetchone()
        if not review or review["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        db.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
        db.commit()
        return {"message": "Review deleted"}
    finally:
        db.close()
