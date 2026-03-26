"""Face protection: watermarks, misuse detection, disputes, usage tracking, exclusive licenses."""
import io
import math
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from PIL import Image, ImageDraw, ImageFont
from app.core.security import get_current_user, get_admin_user
from app.core.database import get_db, dict_row, dict_rows, new_id

router = APIRouter(prefix="/protection", tags=["protection"])


# === WATERMARK ===

@router.get("/watermarked/{face_id}")
async def get_watermarked_image(face_id: str):
    """Return face image with FacePay watermark for non-purchasers."""
    db = get_db()
    try:
        face = db.execute("SELECT photo_url FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not face or not face["photo_url"]:
            raise HTTPException(status_code=404, detail="Face not found")

        # For URL-based images, we generate a watermark overlay instruction
        # In production, this would fetch the image and apply watermark server-side
        return {
            "original_url": face["photo_url"],
            "watermark": True,
            "watermark_text": "FACEPAY PREVIEW",
            "message": "Purchase a license to download without watermark",
        }
    finally:
        db.close()


# === 3-STAGE MISUSE DETECTION ===

class _ScanRequest(BaseModel):
    face_id: str
    source_url: str = ""

@router.post("/scan")
async def initiate_scan(body: _ScanRequest, current_user: dict = Depends(get_current_user)):
    """Stage 1: Lightweight pattern match. Compare facial geometry ratios."""
    db = get_db()
    try:
        # Verify ownership
        face = db.execute("SELECT * FROM faces WHERE id = ? AND user_id = ?", (body.face_id, current_user["id"])).fetchone()
        if not face:
            raise HTTPException(status_code=403, detail="Not your face or face not found")

        face = dict_row(face)

        # Stage 1: Compare with all other verified faces (lightweight)
        all_faces = db.execute("SELECT id, name, photo_url, face_id_hash FROM faces WHERE id != ? AND verified = 1", (body.face_id,)).fetchall()

        # Since we don't have real web crawling, simulate detection
        # In production: crawl source_url, extract faces, compare geometry
        scan_id = new_id()
        match_score = 0.0

        # If source URL provided, create a scan record
        db.execute(
            "INSERT INTO misuse_scans (id, face_id, provider_id, stage, match_score, source_url, status) VALUES (?, ?, ?, 1, ?, ?, 'pending')",
            (scan_id, body.face_id, current_user["id"], match_score, body.source_url),
        )
        db.commit()

        return {
            "scan_id": scan_id,
            "stage": 1,
            "match_score": match_score,
            "status": "pending",
            "message": "Scan initiated. We'll notify you if potential misuse is detected.",
        }
    finally:
        db.close()


class _ConfirmMisuse(BaseModel):
    confirmed: bool

@router.patch("/scan/{scan_id}/confirm")
async def confirm_misuse(scan_id: str, body: _ConfirmMisuse, current_user: dict = Depends(get_current_user)):
    """Stage 2: Provider confirms 'Is this you?'"""
    db = get_db()
    try:
        scan = db.execute("SELECT * FROM misuse_scans WHERE id = ? AND provider_id = ?", (scan_id, current_user["id"])).fetchone()
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")

        if body.confirmed:
            # Provider says YES, this is misuse → Stage 3
            db.execute("UPDATE misuse_scans SET stage = 3, provider_confirmed = 1, status = 'confirmed' WHERE id = ?", (scan_id,))
            db.commit()
            return {"stage": 3, "status": "confirmed", "message": "Misuse confirmed. DMCA takedown request will be generated."}
        else:
            db.execute("UPDATE misuse_scans SET status = 'dismissed' WHERE id = ?", (scan_id,))
            db.commit()
            return {"stage": 2, "status": "dismissed", "message": "Scan dismissed. No further action needed."}
    finally:
        db.close()


@router.get("/scan/{scan_id}/dmca")
async def generate_dmca(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Stage 3: Generate DMCA takedown notice."""
    db = get_db()
    try:
        scan = db.execute("SELECT * FROM misuse_scans WHERE id = ? AND provider_id = ? AND status = 'confirmed'",
                          (scan_id, current_user["id"])).fetchone()
        if not scan:
            raise HTTPException(status_code=404, detail="No confirmed scan found")

        scan = dict_row(scan)
        face = db.execute("SELECT name FROM faces WHERE id = ?", (scan["face_id"],)).fetchone()
        user = db.execute("SELECT name, email FROM users WHERE id = ?", (current_user["id"],)).fetchone()

        dmca_text = f"""DMCA TAKEDOWN NOTICE

Date: {scan['created_at'][:10]}
Reference: FacePay Scan #{scan_id[:8]}

To Whom It May Concern,

I, {user['name']} ({user['email']}), am the rightful owner of the facial likeness
known as "{face['name']}" on FacePay (https://facepay-sigma.vercel.app).

The following URL contains unauthorized use of my licensed facial likeness:
{scan['source_url']}

This content was not licensed through FacePay and constitutes unauthorized use
of my intellectual property and likeness rights.

I request the immediate removal of this content.

This notice is submitted in good faith under the Digital Millennium Copyright Act.

Sincerely,
{user['name']}
via FacePay Automated Protection System
"""

        db.execute("UPDATE misuse_scans SET status = 'dmca_sent' WHERE id = ?", (scan_id,))
        db.commit()

        return {"dmca_text": dmca_text, "status": "dmca_sent"}
    finally:
        db.close()


@router.get("/my-scans")
async def my_scans(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT ms.*, f.name as face_name FROM misuse_scans ms
               LEFT JOIN faces f ON ms.face_id = f.id
               WHERE ms.provider_id = ? ORDER BY ms.created_at DESC""",
            (current_user["id"],),
        ).fetchall()
        return {"scans": dict_rows(rows)}
    finally:
        db.close()


# === USAGE URL TRACKING ===

class _RegisterUsage(BaseModel):
    license_id: str
    url: str
    description: str = ""

@router.post("/usage-url")
async def register_usage_url(body: _RegisterUsage, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        lic = db.execute("SELECT buyer_id FROM licenses WHERE id = ?", (body.license_id,)).fetchone()
        if not lic or lic["buyer_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your license")

        uid = new_id()
        db.execute("INSERT INTO usage_urls (id, license_id, url, description) VALUES (?, ?, ?, ?)",
                   (uid, body.license_id, body.url, body.description))
        db.commit()
        return {"id": uid, "message": "Usage URL registered"}
    finally:
        db.close()


@router.get("/usage-urls/{license_id}")
async def get_usage_urls(license_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute("SELECT * FROM usage_urls WHERE license_id = ? ORDER BY created_at DESC", (license_id,)).fetchall()
        return {"urls": dict_rows(rows)}
    finally:
        db.close()


# === DISPUTES ===

class _CreateDispute(BaseModel):
    license_id: str
    against_id: str
    reason: str
    evidence: str = ""

@router.post("/disputes")
async def create_dispute(body: _CreateDispute, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        did = new_id()
        db.execute(
            "INSERT INTO disputes (id, license_id, reporter_id, against_id, reason, evidence) VALUES (?, ?, ?, ?, ?, ?)",
            (did, body.license_id, current_user["id"], body.against_id, body.reason, body.evidence),
        )
        db.commit()
        return {"id": did, "message": "Dispute filed"}
    finally:
        db.close()


@router.get("/disputes")
async def my_disputes(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            """SELECT d.*, reporter.name as reporter_name, against.name as against_name
               FROM disputes d
               LEFT JOIN users reporter ON d.reporter_id = reporter.id
               LEFT JOIN users against ON d.against_id = against.id
               WHERE d.reporter_id = ? OR d.against_id = ?
               ORDER BY d.created_at DESC""",
            (current_user["id"], current_user["id"]),
        ).fetchall()
        return {"disputes": dict_rows(rows)}
    finally:
        db.close()


@router.patch("/disputes/{dispute_id}/resolve")
async def resolve_dispute(dispute_id: str, status: str, notes: str = "", _: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        db.execute("UPDATE disputes SET status = ?, admin_notes = ?, resolved_at = datetime('now') WHERE id = ?",
                   (status, notes, dispute_id))
        db.commit()
        return {"message": "Dispute resolved"}
    finally:
        db.close()


# === FACE VIEW TRACKING ===

@router.post("/view/{face_id}")
async def track_view(face_id: str, viewer_id: Optional[str] = None):
    db = get_db()
    try:
        db.execute("INSERT INTO face_views (id, face_id, viewer_id) VALUES (?, ?, ?)",
                   (new_id(), face_id, viewer_id or "anonymous"))
        db.execute("UPDATE faces SET view_count = view_count + 1 WHERE id = ?", (face_id,))
        db.commit()
        return {"message": "View tracked"}
    finally:
        db.close()


@router.get("/analytics/{face_id}")
async def face_analytics(face_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        face = db.execute("SELECT user_id, view_count FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not face or face["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your face")

        total_views = face["view_count"] or 0
        total_licenses = db.execute("SELECT COUNT(*) FROM licenses WHERE face_id = ?", (face_id,)).fetchone()[0]
        total_revenue = db.execute("SELECT COALESCE(SUM(price_paid), 0) FROM licenses WHERE face_id = ?", (face_id,)).fetchone()[0]
        avg_rating_row = db.execute("SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE face_id = ?", (face_id,)).fetchone()
        wishlist_count = db.execute("SELECT COUNT(*) FROM wishlist WHERE face_id = ?", (face_id,)).fetchone()[0]

        conversion = round((total_licenses / total_views * 100), 2) if total_views > 0 else 0

        return {
            "total_views": total_views,
            "total_licenses": total_licenses,
            "total_revenue": round(total_revenue, 2),
            "avg_rating": round(avg_rating_row["avg"] or 0, 1),
            "total_reviews": avg_rating_row["cnt"],
            "wishlist_count": wishlist_count,
            "conversion_rate": conversion,
        }
    finally:
        db.close()


# === PRICE RECOMMENDATION ===

@router.get("/price-recommendation")
async def recommend_price(ethnicity: str = "", gender: str = "", style: str = "", age: int = 0):
    db = get_db()
    try:
        query = "SELECT price FROM faces WHERE verified = 1"
        params = []
        if ethnicity:
            query += " AND ethnicity = ?"; params.append(ethnicity)
        if gender:
            query += " AND gender = ?"; params.append(gender)
        if style:
            query += " AND style = ?"; params.append(style)

        rows = db.execute(query, params).fetchall()
        prices = [r["price"] for r in rows]

        if not prices:
            rows = db.execute("SELECT price FROM faces WHERE verified = 1").fetchall()
            prices = [r["price"] for r in rows]

        avg = sum(prices) / len(prices) if prices else 30
        low = min(prices) if prices else 15
        high = max(prices) if prices else 60

        return {
            "recommended": round(avg, 2),
            "range": {"low": round(low, 2), "high": round(high, 2)},
            "sample_size": len(prices),
            "tip": f"Similar faces are priced ${low:.0f}-${high:.0f}. We recommend ${avg:.0f}.",
        }
    finally:
        db.close()


# === ALSO VIEWED / RECOMMENDATIONS ===

@router.get("/also-viewed/{face_id}")
async def also_viewed(face_id: str, limit: int = 4):
    """Faces that viewers of this face also viewed."""
    db = get_db()
    try:
        # Get viewers of this face
        viewers = db.execute(
            "SELECT DISTINCT viewer_id FROM face_views WHERE face_id = ? AND viewer_id != 'anonymous' LIMIT 50",
            (face_id,),
        ).fetchall()
        viewer_ids = [v["viewer_id"] for v in viewers]

        if not viewer_ids:
            # Fallback: return similar faces by attributes
            face = db.execute("SELECT ethnicity, gender, style FROM faces WHERE id = ?", (face_id,)).fetchone()
            if face:
                rows = db.execute(
                    "SELECT * FROM faces WHERE verified = 1 AND id != ? AND (ethnicity = ? OR gender = ?) ORDER BY RANDOM() LIMIT ?",
                    (face_id, face["ethnicity"], face["gender"], limit),
                ).fetchall()
                return {"faces": dict_rows(rows)}
            return {"faces": []}

        placeholders = ",".join(["?"] * len(viewer_ids))
        rows = db.execute(
            f"""SELECT f.*, COUNT(*) as co_views FROM face_views fv
                JOIN faces f ON fv.face_id = f.id
                WHERE fv.viewer_id IN ({placeholders}) AND fv.face_id != ? AND f.verified = 1
                GROUP BY fv.face_id ORDER BY co_views DESC LIMIT ?""",
            (*viewer_ids, face_id, limit),
        ).fetchall()

        return {"faces": dict_rows(rows)}
    finally:
        db.close()
