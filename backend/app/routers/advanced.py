"""Advanced features: CPM tracking, face value estimator, referrals, price engine, moodboards, matching, insurance."""
import secrets
import math
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id

router = APIRouter(tags=["advanced"])


# ==================== CPM TRACKING ====================

@router.post("/tracking/impression")
async def record_impression(license_id: str, face_id: str, url: str = "", count: int = 1):
    """Called by JS tracking tag on buyer's site. Records face impressions."""
    db = get_db()
    try:
        today = __import__('datetime').date.today().isoformat()
        existing = db.execute("SELECT id, count FROM impressions WHERE license_id = ? AND date = ?", (license_id, today)).fetchone()
        if existing:
            db.execute("UPDATE impressions SET count = count + ? WHERE id = ?", (count, existing["id"]))
        else:
            db.execute("INSERT INTO impressions (id, license_id, face_id, url, count, date) VALUES (?, ?, ?, ?, ?, ?)",
                       (new_id(), license_id, face_id, url, count, today))
        db.commit()
        return {"recorded": count}
    finally:
        db.close()


@router.get("/tracking/stats/{license_id}")
async def tracking_stats(license_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute("SELECT date, SUM(count) as daily_count FROM impressions WHERE license_id = ? GROUP BY date ORDER BY date DESC LIMIT 30",
                          (license_id,)).fetchall()
        total = db.execute("SELECT SUM(count) FROM impressions WHERE license_id = ?", (license_id,)).fetchone()[0] or 0
        return {"daily": dict_rows(rows), "total_impressions": total}
    finally:
        db.close()


@router.get("/tracking/embed/{license_id}")
async def get_tracking_code(license_id: str):
    """Generate JS tracking snippet for buyers to embed."""
    code = f"""<!-- FacePay Impression Tracker -->
<script>
(function(){{
  var fp_lid='{license_id}';
  var fp_url=encodeURIComponent(window.location.href);
  fetch('https://facepay-production-85f0.up.railway.app/api/tracking/impression?license_id='+fp_lid+'&face_id=&url='+fp_url+'&count=1',
    {{method:'POST'}}).catch(function(){{}});
}})();
</script>"""
    return {"embed_code": code, "license_id": license_id}


# ==================== FACE VALUE ESTIMATOR ====================

@router.post("/estimate-value")
async def estimate_face_value(
    ethnicity: str = "", gender: str = "", age: int = 25, style: str = "",
):
    """Estimate market value of a face based on attributes. No auth needed (viral tool)."""
    db = get_db()
    try:
        # Get comparable faces
        query = "SELECT price, view_count FROM faces WHERE verified = 1"
        params = []
        if ethnicity:
            query += " AND ethnicity = ?"; params.append(ethnicity)
        if gender:
            query += " AND gender = ?"; params.append(gender)

        rows = db.execute(query, params).fetchall()
        if not rows:
            rows = db.execute("SELECT price, view_count FROM faces WHERE verified = 1").fetchall()

        prices = [r["price"] for r in rows]
        avg_price = sum(prices) / len(prices) if prices else 30

        # Modifiers
        score = avg_price
        factors = []

        # Age bonus
        if 20 <= age <= 30:
            score *= 1.3; factors.append({"factor": "Age 20-30 (high demand)", "modifier": "+30%"})
        elif 30 <= age <= 40:
            score *= 1.1; factors.append({"factor": "Age 30-40 (steady demand)", "modifier": "+10%"})

        # Style bonus
        if style.lower() in ['business', 'professional', 'elegant']:
            score *= 1.25; factors.append({"factor": f"'{style}' style premium", "modifier": "+25%"})

        # Ethnicity demand
        demand_map = {"Korean": 1.4, "Japanese": 1.3, "Asian": 1.2, "Caucasian": 1.0, "Latino": 1.1}
        if ethnicity in demand_map:
            mult = demand_map[ethnicity]
            if mult > 1:
                score *= mult; factors.append({"factor": f"{ethnicity} (high demand region)", "modifier": f"+{int((mult-1)*100)}%"})

        estimated = round(score, 2)
        monthly_potential = round(estimated * 8, 2)  # Average 8 licenses/month for popular faces
        yearly_potential = round(monthly_potential * 12, 2)

        return {
            "estimated_price": estimated,
            "price_range": {"low": round(estimated * 0.7, 2), "high": round(estimated * 1.5, 2)},
            "monthly_potential": monthly_potential,
            "yearly_potential": yearly_potential,
            "factors": factors,
            "comparable_faces": len(prices),
            "market_average": round(avg_price, 2),
        }
    finally:
        db.close()


# ==================== REFERRAL PROGRAM ====================

@router.get("/referral/my-code")
async def get_referral_code(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        code = f"REF{current_user['id'][:6].upper()}"
        existing = db.execute("SELECT code FROM referrals WHERE referrer_id = ? LIMIT 1", (current_user["id"],)).fetchone()
        if existing:
            code = existing["code"]

        total_referred = db.execute("SELECT COUNT(*) FROM referrals WHERE referrer_id = ? AND status = 'credited'", (current_user["id"],)).fetchone()[0]
        total_earned = total_referred * 10

        return {
            "code": code,
            "share_link": f"https://facepay-sigma.vercel.app/login?ref={code}",
            "total_referred": total_referred,
            "total_earned": total_earned,
            "reward_per_referral": 10,
        }
    finally:
        db.close()


class _ApplyReferral(BaseModel):
    code: str

@router.post("/referral/apply")
async def apply_referral(body: _ApplyReferral, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        ref = db.execute("SELECT * FROM referrals WHERE code = ? AND status = 'pending'", (body.code,)).fetchone()
        if not ref:
            raise HTTPException(status_code=400, detail="Invalid or already used referral code")

        if ref["referrer_id"] == current_user["id"]:
            raise HTTPException(status_code=400, detail="Cannot use your own referral code")

        # Credit both users
        db.execute("UPDATE users SET balance = balance + 10 WHERE id = ?", (ref["referrer_id"],))
        db.execute("UPDATE users SET balance = balance + 10 WHERE id = ?", (current_user["id"],))
        db.execute("INSERT INTO referrals (id, referrer_id, referred_id, code, status) VALUES (?, ?, ?, ?, 'credited')",
                   (new_id(), ref["referrer_id"], current_user["id"], body.code))
        db.commit()

        return {"message": "Referral applied! Both you and the referrer received $10.", "credited": 10}
    finally:
        db.close()


# ==================== REAL-TIME PRICE FLUCTUATION ====================

@router.get("/price-engine/{face_id}")
async def get_price_history(face_id: str):
    db = get_db()
    try:
        face = db.execute("SELECT price, view_count FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not face:
            raise HTTPException(status_code=404)

        # Calculate demand score
        views = face["view_count"] or 0
        licenses_count = db.execute("SELECT COUNT(*) FROM licenses WHERE face_id = ?", (face_id,)).fetchone()[0]
        wishlist_count = db.execute("SELECT COUNT(*) FROM wishlist WHERE face_id = ?", (face_id,)).fetchone()[0]

        demand_score = (views * 0.1) + (licenses_count * 5) + (wishlist_count * 2)
        demand_score = min(100, demand_score)

        # Suggested dynamic price
        base = face["price"]
        dynamic = base * (1 + demand_score / 200)  # Max 50% increase

        # Get history
        history = db.execute("SELECT price, demand_score, recorded_at FROM price_history WHERE face_id = ? ORDER BY recorded_at DESC LIMIT 30",
                             (face_id,)).fetchall()

        # Record current
        db.execute("INSERT INTO price_history (id, face_id, price, demand_score) VALUES (?, ?, ?, ?)",
                   (new_id(), face_id, round(dynamic, 2), demand_score))
        db.commit()

        trend = "stable"
        if len(history) >= 2:
            if history[0]["price"] > history[1]["price"]:
                trend = "up"
            elif history[0]["price"] < history[1]["price"]:
                trend = "down"

        return {
            "base_price": base,
            "dynamic_price": round(dynamic, 2),
            "demand_score": round(demand_score, 1),
            "trend": trend,
            "history": dict_rows(history),
            "factors": {
                "views": views,
                "licenses": licenses_count,
                "wishlists": wishlist_count,
            },
        }
    finally:
        db.close()


# ==================== MOODBOARDS ====================

class _CreateMoodboard(BaseModel):
    name: str
    description: str = ""
    is_public: bool = False

@router.post("/moodboards")
async def create_moodboard(body: _CreateMoodboard, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        mid = new_id()
        db.execute("INSERT INTO moodboards (id, user_id, name, description, is_public) VALUES (?, ?, ?, ?, ?)",
                   (mid, current_user["id"], body.name, body.description, int(body.is_public)))
        db.commit()
        return {"id": mid, "message": "Moodboard created"}
    finally:
        db.close()


@router.get("/moodboards")
async def my_moodboards(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT m.*, COUNT(mi.id) as item_count FROM moodboards m
               LEFT JOIN moodboard_items mi ON m.id = mi.moodboard_id
               WHERE m.user_id = ? GROUP BY m.id ORDER BY m.created_at DESC""",
            (current_user["id"],),
        ).fetchall()
        return {"moodboards": dict_rows(rows)}
    finally:
        db.close()


@router.get("/moodboards/{board_id}")
async def get_moodboard(board_id: str):
    db = get_db()
    try:
        board = db.execute("SELECT * FROM moodboards WHERE id = ?", (board_id,)).fetchone()
        if not board:
            raise HTTPException(status_code=404)

        items = db.execute(
            """SELECT mi.*, f.name, f.photo_url, f.price, f.tags, f.ethnicity, f.gender
               FROM moodboard_items mi JOIN faces f ON mi.face_id = f.id
               WHERE mi.moodboard_id = ? ORDER BY mi.created_at DESC""",
            (board_id,),
        ).fetchall()

        return {"moodboard": dict_row(board), "items": dict_rows(items)}
    finally:
        db.close()


@router.post("/moodboards/{board_id}/add/{face_id}")
async def add_to_moodboard(board_id: str, face_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        board = db.execute("SELECT user_id FROM moodboards WHERE id = ?", (board_id,)).fetchone()
        if not board or board["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403)

        db.execute("INSERT OR IGNORE INTO moodboard_items (id, moodboard_id, face_id) VALUES (?, ?, ?)",
                   (new_id(), board_id, face_id))
        db.commit()
        return {"message": "Added to moodboard"}
    finally:
        db.close()


@router.delete("/moodboards/{board_id}/remove/{face_id}")
async def remove_from_moodboard(board_id: str, face_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        db.execute("DELETE FROM moodboard_items WHERE moodboard_id = ? AND face_id = ?", (board_id, face_id))
        db.commit()
        return {"message": "Removed"}
    finally:
        db.close()


@router.delete("/moodboards/{board_id}")
async def delete_moodboard(board_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        db.execute("DELETE FROM moodboards WHERE id = ? AND user_id = ?", (board_id, current_user["id"]))
        db.commit()
        return {"message": "Moodboard deleted"}
    finally:
        db.close()


# ==================== REAL-TIME MATCHING API ====================

@router.get("/match")
async def match_faces(
    gender: str = "", ethnicity: str = "", age_min: int = 0, age_max: int = 99,
    style: str = "", max_price: float = 9999, limit: int = 3,
):
    """B2B matching API. Input criteria → get best matching faces."""
    db = get_db()
    try:
        query = "SELECT * FROM faces WHERE verified = 1"
        params = []

        if gender:
            query += " AND gender = ?"; params.append(gender)
        if ethnicity:
            query += " AND ethnicity = ?"; params.append(ethnicity)
        if style:
            query += " AND style = ?"; params.append(style)
        if age_min:
            query += " AND age >= ?"; params.append(age_min)
        if age_max < 99:
            query += " AND age <= ?"; params.append(age_max)
        if max_price < 9999:
            query += " AND price <= ?"; params.append(max_price)

        query += " ORDER BY view_count DESC LIMIT ?"
        params.append(limit)

        rows = db.execute(query, params).fetchall()
        return {"matches": dict_rows(rows), "count": len(rows), "criteria": {"gender": gender, "ethnicity": ethnicity, "age_range": f"{age_min}-{age_max}", "style": style}}
    finally:
        db.close()


# ==================== INSURANCE ====================

class _InsuranceEnroll(BaseModel):
    face_id: str
    plan: str = "basic"

@router.post("/insurance/enroll")
async def enroll_insurance(body: _InsuranceEnroll, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        plans = {"basic": {"cost": 2, "coverage": 5000}, "premium": {"cost": 8, "coverage": 25000}}
        p = plans.get(body.plan)
        if not p:
            raise HTTPException(status_code=400, detail="Invalid plan")

        iid = new_id()
        db.execute("INSERT INTO insurance (id, user_id, face_id, plan, monthly_cost, coverage_amount) VALUES (?, ?, ?, ?, ?, ?)",
                   (iid, current_user["id"], body.face_id, body.plan, p["cost"], p["coverage"]))
        db.commit()
        return {"id": iid, "plan": body.plan, "monthly_cost": p["cost"], "coverage": p["coverage"]}
    finally:
        db.close()


@router.get("/insurance/my")
async def my_insurance(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT i.*, f.name as face_name FROM insurance i
               LEFT JOIN faces f ON i.face_id = f.id
               WHERE i.user_id = ? AND i.status = 'active'""",
            (current_user["id"],),
        ).fetchall()
        return {"policies": dict_rows(rows)}
    finally:
        db.close()


# ==================== LEGAL REFERRAL ====================

@router.post("/legal/request")
async def request_legal(face_id: str, issue: str = "", current_user: dict = Depends(get_current_user)):
    """Request legal consultation for face misuse."""
    db = get_db()
    try:
        face = db.execute("SELECT name FROM faces WHERE id = ?", (face_id,)).fetchone()
        # In production: send to legal partner via API
        return {
            "message": "Legal consultation request submitted",
            "reference": f"LEGAL-{new_id()[:8].upper()}",
            "face": face["name"] if face else "Unknown",
            "next_steps": [
                "A legal advisor will contact you within 24 hours",
                "Prepare evidence of misuse (screenshots, URLs)",
                "Your FacePay protection scan results will be shared with the advisor",
            ],
        }
    finally:
        db.close()


# ==================== BUYER PORTFOLIO ====================

@router.get("/buyer-portfolio/{user_id}")
async def buyer_portfolio(user_id: str):
    db = get_db()
    try:
        user = db.execute("SELECT id, name, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404)

        licenses_data = db.execute(
            """SELECT l.*, f.name as face_name, f.photo_url FROM licenses l
               LEFT JOIN faces f ON l.face_id = f.id
               WHERE l.buyer_id = ? AND l.status = 'active' ORDER BY l.created_at DESC""",
            (user_id,),
        ).fetchall()

        total_spent = db.execute("SELECT COALESCE(SUM(price_paid), 0) FROM licenses WHERE buyer_id = ?", (user_id,)).fetchone()[0]

        return {
            "buyer": dict_row(user),
            "active_licenses": dict_rows(licenses_data),
            "total_licenses": len(licenses_data),
            "total_spent": round(total_spent, 2),
        }
    finally:
        db.close()
