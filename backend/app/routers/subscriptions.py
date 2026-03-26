from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id
from datetime import datetime, timedelta

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

PLANS = {
    "free": {"price": 0, "licenses_per_month": 2, "label": "Free"},
    "starter": {"price": 29, "licenses_per_month": 10, "label": "Starter"},
    "pro": {"price": 79, "licenses_per_month": 50, "label": "Pro"},
    "enterprise": {"price": 199, "licenses_per_month": 999, "label": "Enterprise"},
}


@router.get("/plans")
async def get_plans():
    return {"plans": PLANS}


@router.get("/my")
async def my_subscription(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1",
                         (current_user["id"],)).fetchone()
        return {"subscription": dict_row(row) if row else None, "plans": PLANS}
    finally:
        db.close()


class _Subscribe(BaseModel):
    plan: str

@router.post("/subscribe")
async def subscribe(body: _Subscribe, current_user: dict = Depends(get_current_user)):
    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    db = get_db()
    try:
        # Cancel existing
        db.execute("UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'",
                   (current_user["id"],))

        sid = new_id()
        expires = (datetime.utcnow() + timedelta(days=30)).isoformat()
        db.execute(
            "INSERT INTO subscriptions (id, user_id, plan, price, status, expires_at) VALUES (?, ?, ?, ?, 'active', ?)",
            (sid, current_user["id"], body.plan, PLANS[body.plan]["price"], expires),
        )
        db.commit()

        return {"subscription_id": sid, "plan": body.plan, "price": PLANS[body.plan]["price"]}
    finally:
        db.close()


# === Promo Codes ===
class _ValidatePromo(BaseModel):
    code: str
    amount: float

@router.post("/validate-promo")
async def validate_promo(body: _ValidatePromo):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM promo_codes WHERE code = ? AND active = 1", (body.code.upper(),)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Invalid promo code")

        promo = dict_row(row)
        if promo["used_count"] >= promo["max_uses"]:
            raise HTTPException(status_code=400, detail="Promo code expired")

        if promo["discount_percent"]:
            discount = body.amount * promo["discount_percent"] / 100
        else:
            discount = min(promo["discount_flat"], body.amount)

        final = max(0, body.amount - discount)

        # Increment usage
        db.execute("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?", (promo["id"],))
        db.commit()

        return {"valid": True, "discount": round(discount, 2), "final_amount": round(final, 2), "code": body.code}
    finally:
        db.close()


# === Provider Rankings ===
@router.get("/rankings")
async def provider_rankings():
    db = get_db()
    try:
        rows = db.execute("""
            SELECT u.id, u.name, u.avatar_url,
                   COUNT(DISTINCT f.id) as total_faces,
                   COUNT(DISTINCT l.id) as total_sales,
                   COALESCE(SUM(l.price_paid), 0) as total_earned,
                   COALESCE(AVG(r.rating), 0) as avg_rating
            FROM users u
            LEFT JOIN faces f ON f.user_id = u.id AND f.verified = 1
            LEFT JOIN licenses l ON l.provider_id = u.id
            LEFT JOIN reviews r ON r.face_id = f.id
            WHERE u.role = 'provider' OR (SELECT COUNT(*) FROM faces WHERE user_id = u.id) > 0
            GROUP BY u.id
            HAVING total_faces > 0
            ORDER BY total_earned DESC
            LIMIT 20
        """).fetchall()
        return {"rankings": dict_rows(rows)}
    finally:
        db.close()
