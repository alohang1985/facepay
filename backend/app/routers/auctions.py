"""Auction system for exclusive face licenses."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id

router = APIRouter(prefix="/auctions", tags=["auctions"])


class _CreateAuction(BaseModel):
    face_id: str
    industry: str
    starting_price: float
    scheduled_date: str  # ISO date, auction goes live this day
    scheduled_time: str  # HH:MM


@router.post("")
async def create_auction(body: _CreateAuction, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        face = db.execute("SELECT user_id FROM faces WHERE id = ? AND verified = 1", (body.face_id,)).fetchone()
        if not face or face["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your face or not verified")

        aid = new_id()
        scheduled = f"{body.scheduled_date}T{body.scheduled_time}:00"
        starts = scheduled
        ends_dt = datetime.fromisoformat(scheduled) + timedelta(minutes=10)
        ends = ends_dt.isoformat()

        db.execute(
            """INSERT INTO auctions (id, face_id, provider_id, industry, starting_price, current_price, status, scheduled_at, starts_at, ends_at)
               VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)""",
            (aid, body.face_id, current_user["id"], body.industry, body.starting_price, body.starting_price, scheduled, starts, ends),
        )
        db.commit()
        return {"auction_id": aid, "starts_at": starts, "ends_at": ends, "message": "Auction scheduled! It will run for 10 minutes."}
    finally:
        db.close()


@router.get("")
async def list_auctions(status: str = ""):
    db = get_db()
    try:
        query = """SELECT a.*, f.name as face_name, f.photo_url as face_photo, f.price as face_base_price,
                          u.name as provider_name
                   FROM auctions a
                   LEFT JOIN faces f ON a.face_id = f.id
                   LEFT JOIN users u ON a.provider_id = u.id"""
        params = []
        if status:
            query += " WHERE a.status = ?"
            params.append(status)
        query += " ORDER BY a.scheduled_at DESC"

        # Auto-update statuses
        now = datetime.utcnow().isoformat()
        db.execute("UPDATE auctions SET status = 'live' WHERE status = 'scheduled' AND starts_at <= ? AND ends_at > ?", (now, now))
        db.execute("UPDATE auctions SET status = 'ended' WHERE status = 'live' AND ends_at <= ?", (now,))
        db.commit()

        rows = db.execute(query, params).fetchall()
        return {"auctions": dict_rows(rows)}
    finally:
        db.close()


@router.get("/{auction_id}")
async def get_auction(auction_id: str):
    db = get_db()
    try:
        row = db.execute(
            """SELECT a.*, f.name as face_name, f.photo_url as face_photo, f.tags as face_tags,
                      u.name as provider_name, bidder.name as current_bidder_name
               FROM auctions a
               LEFT JOIN faces f ON a.face_id = f.id
               LEFT JOIN users u ON a.provider_id = u.id
               LEFT JOIN users bidder ON a.current_bidder_id = bidder.id
               WHERE a.id = ?""",
            (auction_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Auction not found")

        # Get bid history
        bids = db.execute(
            """SELECT ab.*, u.name as bidder_name FROM auction_bids ab
               LEFT JOIN users u ON ab.bidder_id = u.id
               WHERE ab.auction_id = ? ORDER BY ab.amount DESC""",
            (auction_id,),
        ).fetchall()

        result = dict_row(row)
        result["bids"] = dict_rows(bids)

        # Check time remaining
        now = datetime.utcnow()
        if result["ends_at"]:
            try:
                ends = datetime.fromisoformat(result["ends_at"])
                remaining = max(0, (ends - now).total_seconds())
                result["seconds_remaining"] = int(remaining)
            except:
                result["seconds_remaining"] = 0

        return result
    finally:
        db.close()


class _PlaceBid(BaseModel):
    amount: float

@router.post("/{auction_id}/bid")
async def place_bid(auction_id: str, body: _PlaceBid, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        auction = db.execute("SELECT * FROM auctions WHERE id = ?", (auction_id,)).fetchone()
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")

        a = dict_row(auction)

        if a["status"] != "live" and a["status"] != "scheduled":
            # Auto-check if it should be live
            now = datetime.utcnow().isoformat()
            if a["starts_at"] <= now and (not a["ends_at"] or a["ends_at"] > now):
                db.execute("UPDATE auctions SET status = 'live' WHERE id = ?", (auction_id,))
                db.commit()
            else:
                raise HTTPException(status_code=400, detail=f"Auction is {a['status']}, not accepting bids")

        if a["provider_id"] == current_user["id"]:
            raise HTTPException(status_code=400, detail="Cannot bid on your own auction")

        if body.amount <= a["current_price"]:
            raise HTTPException(status_code=400, detail=f"Bid must be higher than ${a['current_price']:.2f}")

        bid_id = new_id()
        db.execute("INSERT INTO auction_bids (id, auction_id, bidder_id, amount) VALUES (?, ?, ?, ?)",
                   (bid_id, auction_id, current_user["id"], body.amount))
        db.execute("UPDATE auctions SET current_price = ?, current_bidder_id = ?, bid_count = bid_count + 1 WHERE id = ?",
                   (body.amount, current_user["id"], auction_id))
        db.commit()

        return {"bid_id": bid_id, "amount": body.amount, "message": f"Bid placed: ${body.amount:.2f}"}
    finally:
        db.close()


# === LICENSE TIERS ===

@router.get("/tiers/all")
async def get_license_tiers():
    db = get_db()
    try:
        rows = db.execute("SELECT * FROM license_tiers ORDER BY sort_order").fetchall()
        return {"tiers": dict_rows(rows)}
    finally:
        db.close()
