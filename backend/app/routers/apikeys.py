import secrets
import hashlib
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


class _CreateKey(BaseModel):
    name: str = "Default"
    permissions: str = "read"


@router.post("")
async def create_api_key(body: _CreateKey, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        # Generate key
        raw_key = f"fp_{''.join(secrets.token_hex(20))}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

        kid = new_id()
        db.execute(
            "INSERT INTO api_keys (id, user_id, key_hash, name, permissions) VALUES (?, ?, ?, ?, ?)",
            (kid, current_user["id"], key_hash, body.name, body.permissions),
        )
        db.commit()

        return {
            "id": kid,
            "api_key": raw_key,  # Only shown once!
            "name": body.name,
            "permissions": body.permissions,
            "message": "Save this key — it won't be shown again.",
        }
    finally:
        db.close()


@router.get("")
async def list_api_keys(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            "SELECT id, name, permissions, calls_today, calls_total, rate_limit, active, created_at, last_used_at FROM api_keys WHERE user_id = ?",
            (current_user["id"],),
        ).fetchall()
        return {"keys": dict_rows(rows)}
    finally:
        db.close()


@router.delete("/{key_id}")
async def delete_api_key(key_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        key = db.execute("SELECT user_id FROM api_keys WHERE id = ?", (key_id,)).fetchone()
        if not key or key["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        db.execute("DELETE FROM api_keys WHERE id = ?", (key_id,))
        db.commit()
        return {"message": "API key deleted"}
    finally:
        db.close()


@router.patch("/{key_id}/toggle")
async def toggle_api_key(key_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        key = db.execute("SELECT user_id, active FROM api_keys WHERE id = ?", (key_id,)).fetchone()
        if not key or key["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        new_state = 0 if key["active"] else 1
        db.execute("UPDATE api_keys SET active = ? WHERE id = ?", (new_state, key_id))
        db.commit()
        return {"active": bool(new_state)}
    finally:
        db.close()
