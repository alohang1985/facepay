from fastapi import APIRouter, HTTPException, Depends
from app.schemas.license import LicensePurchaseRequest, LicenseResponse
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id
from datetime import datetime, timedelta

router = APIRouter(prefix="/licenses", tags=["licenses"])


@router.post("/purchase")
async def purchase_license(req: LicensePurchaseRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        # Get face info - support both UUID and numeric ID
        face = db.execute("SELECT * FROM faces WHERE id = ?", (req.face_id,)).fetchone()
        if not face:
            try:
                idx = int(req.face_id) - 1
                rows = db.execute("SELECT * FROM faces WHERE verified = 1 ORDER BY created_at ASC").fetchall()
                if 0 <= idx < len(rows):
                    face = rows[idx]
            except (ValueError, IndexError):
                pass
        if not face:
            raise HTTPException(status_code=404, detail="Face not found")

        face = dict_row(face)

        # Calculate price
        multiplier = 2.5 if req.license_type == "extended" else 1.0
        duration_mult = {3: 1, 6: 1.5, 12: 2.0}.get(req.duration_months, 1)
        price = face["price"] * multiplier * duration_mult

        now = datetime.utcnow()
        expires = now + timedelta(days=req.duration_months * 30)
        lic_id = new_id()

        db.execute(
            """INSERT INTO licenses (id, face_id, buyer_id, provider_id, license_type, usage_purpose, duration_months, price_paid, company_name, status, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)""",
            (lic_id, face["id"], current_user["id"], face["user_id"], req.license_type, req.usage_purpose, req.duration_months, price, req.company_name or "", expires.isoformat()),
        )
        db.commit()

        row = db.execute("SELECT * FROM licenses WHERE id = ?", (lic_id,)).fetchone()
        return dict_row(row)
    finally:
        db.close()


@router.post("/{lic_id}/renew")
async def renew_license(lic_id: str, months: int = 3, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM licenses WHERE id = ? AND buyer_id = ?", (lic_id, current_user["id"])).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="License not found")

        lic = dict_row(row)
        # Calculate new expiry from now
        from datetime import datetime, timedelta
        new_expires = (datetime.utcnow() + timedelta(days=months * 30)).isoformat()
        duration_mult = {3: 1, 6: 1.5, 12: 2.0}.get(months, 1)

        # Get face price
        face = db.execute("SELECT price FROM faces WHERE id = ?", (lic["face_id"],)).fetchone()
        base_price = face["price"] if face else lic["price_paid"]
        multiplier = 2.5 if lic["license_type"] == "extended" else 1.0
        renewal_price = base_price * multiplier * duration_mult

        db.execute(
            "UPDATE licenses SET status = 'active', expires_at = ?, duration_months = ?, price_paid = price_paid + ? WHERE id = ?",
            (new_expires, months, renewal_price, lic_id),
        )
        db.commit()

        updated = db.execute("SELECT * FROM licenses WHERE id = ?", (lic_id,)).fetchone()
        return {"license": dict_row(updated), "renewal_price": renewal_price}
    finally:
        db.close()


@router.get("/my")
async def my_licenses(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT l.*, f.name as face_name, f.photo_url as face_photo
               FROM licenses l LEFT JOIN faces f ON l.face_id = f.id
               WHERE l.buyer_id = ? ORDER BY l.created_at DESC""",
            (current_user["id"],),
        ).fetchall()
        return dict_rows(rows)
    finally:
        db.close()


@router.get("/provided")
async def provided_licenses(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT l.*, f.name as face_name, f.photo_url as face_photo
               FROM licenses l LEFT JOIN faces f ON l.face_id = f.id
               WHERE l.provider_id = ? ORDER BY l.created_at DESC""",
            (current_user["id"],),
        ).fetchall()
        return dict_rows(rows)
    finally:
        db.close()
