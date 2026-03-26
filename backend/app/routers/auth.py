import secrets
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.core.database import get_db, dict_row, new_id

# In-memory reset tokens (production would use Redis/DB)
_reset_tokens = {}

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    db = get_db()
    try:
        existing = db.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_id = new_id()
        hashed = hash_password(req.password)
        db.execute(
            "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            (user_id, req.name, req.email, hashed, "provider"),
        )
        db.commit()

        token = create_access_token({"sub": user_id, "email": req.email, "role": "provider"})
        return AuthResponse(
            access_token=token,
            user={"id": user_id, "name": req.name, "email": req.email, "role": "provider"},
        )
    finally:
        db.close()


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = dict_row(row)
        if not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
        return AuthResponse(
            access_token=token,
            user={"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
        )
    finally:
        db.close()


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        row = db.execute(
            "SELECT id, name, email, role, balance, avatar_url, created_at FROM users WHERE id = ?",
            (current_user["id"],),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return dict_row(row)
    finally:
        db.close()


class _ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

@router.patch("/profile")
async def update_profile(body: _ProfileUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        updates, params = [], []
        if body.name is not None:
            updates.append("name = ?"); params.append(body.name)
        if body.avatar_url is not None:
            updates.append("avatar_url = ?"); params.append(body.avatar_url)
        if not updates:
            raise HTTPException(status_code=400, detail="Nothing to update")

        params.append(current_user["id"])
        db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()

        row = db.execute("SELECT id, name, email, role, balance, avatar_url, created_at FROM users WHERE id = ?", (current_user["id"],)).fetchone()
        return dict_row(row)
    finally:
        db.close()


class _PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(body: _PasswordChange, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        row = db.execute("SELECT password_hash FROM users WHERE id = ?", (current_user["id"],)).fetchone()
        if not row or not verify_password(body.current_password, row["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        new_hash = hash_password(body.new_password)
        db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, current_user["id"]))
        db.commit()
        return {"message": "Password changed successfully"}
    finally:
        db.close()


class _ForgotPassword(BaseModel):
    email: str

@router.post("/forgot-password")
async def forgot_password(body: _ForgotPassword):
    db = get_db()
    try:
        user = db.execute("SELECT id, email FROM users WHERE email = ?", (body.email,)).fetchone()
        if not user:
            return {"message": "If the email exists, a reset link has been sent."}
        token = secrets.token_urlsafe(32)
        _reset_tokens[token] = user["id"]
        # In production: send email with reset link
        return {"message": "If the email exists, a reset link has been sent.", "reset_token": token}
    finally:
        db.close()


class _ResetPassword(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password")
async def reset_password(body: _ResetPassword):
    user_id = _reset_tokens.pop(body.token, None)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    db = get_db()
    try:
        new_hash = hash_password(body.new_password)
        db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
        db.commit()
        return {"message": "Password reset successfully"}
    finally:
        db.close()
