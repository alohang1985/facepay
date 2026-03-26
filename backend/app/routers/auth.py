from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.core.database import get_db, dict_row, new_id

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
            "SELECT id, name, email, role, balance, created_at FROM users WHERE id = ?",
            (current_user["id"],),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return dict_row(row)
    finally:
        db.close()
