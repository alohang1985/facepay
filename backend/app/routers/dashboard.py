from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.core.database import get_db, dict_rows

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        uid = current_user["id"]

        total_bought = db.execute("SELECT COUNT(*) FROM licenses WHERE buyer_id = ?", (uid,)).fetchone()[0]
        active = db.execute("SELECT COUNT(*) FROM licenses WHERE buyer_id = ? AND status = 'active'", (uid,)).fetchone()[0]
        total_spent = db.execute("SELECT COALESCE(SUM(price_paid), 0) FROM licenses WHERE buyer_id = ?", (uid,)).fetchone()[0]
        total_earned = db.execute("SELECT COALESCE(SUM(price_paid), 0) FROM licenses WHERE provider_id = ?", (uid,)).fetchone()[0]
        total_faces = db.execute("SELECT COUNT(*) FROM faces WHERE user_id = ?", (uid,)).fetchone()[0]
        balance = db.execute("SELECT balance FROM users WHERE id = ?", (uid,)).fetchone()[0]

        return {
            "total_licenses_bought": total_bought,
            "active_licenses": active,
            "total_spent": round(total_spent, 2),
            "total_earned": round(total_earned, 2),
            "total_faces": total_faces,
            "balance": round(balance or 0, 2),
        }
    finally:
        db.close()


@router.get("/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user), limit: int = 10):
    db = get_db()
    try:
        uid = current_user["id"]

        purchases = db.execute(
            """SELECT l.*, f.name as face_name, f.photo_url as face_photo
               FROM licenses l LEFT JOIN faces f ON l.face_id = f.id
               WHERE l.buyer_id = ? ORDER BY l.created_at DESC LIMIT ?""",
            (uid, limit),
        ).fetchall()

        sales = db.execute(
            """SELECT l.*, f.name as face_name, f.photo_url as face_photo
               FROM licenses l LEFT JOIN faces f ON l.face_id = f.id
               WHERE l.provider_id = ? ORDER BY l.created_at DESC LIMIT ?""",
            (uid, limit),
        ).fetchall()

        return {"purchases": dict_rows(purchases), "sales": dict_rows(sales)}
    finally:
        db.close()


@router.get("/earnings")
async def get_earnings(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            "SELECT price_paid, usage_purpose, created_at FROM licenses WHERE provider_id = ? ORDER BY created_at DESC",
            (current_user["id"],),
        ).fetchall()

        licenses = dict_rows(rows)
        by_purpose = {}
        for lic in licenses:
            p = lic["usage_purpose"]
            by_purpose[p] = by_purpose.get(p, 0) + lic["price_paid"]

        return {
            "total": sum(l["price_paid"] for l in licenses),
            "by_purpose": by_purpose,
            "recent": licenses[:10],
        }
    finally:
        db.close()
