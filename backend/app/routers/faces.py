import base64
import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from typing import Optional
from pydantic import BaseModel as _BaseModel
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"))

router = APIRouter(prefix="/faces", tags=["faces"])


@router.post("/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Upload a face image and return its URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max 10MB")

    ext = file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Build full URL
    base_url = str(request.base_url).rstrip("/")
    photo_url = f"{base_url}/uploads/{filename}"

    return {"photo_url": photo_url, "filename": filename}


@router.post("/analyze")
async def analyze_face_photo(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Max 10MB.")

    try:
        from app.services.face_analyzer import analyze_face
        result = analyze_face(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face analysis failed: {str(e)}")

    if not result.get("success"):
        raise HTTPException(status_code=422, detail=result.get("error", "Face analysis failed"))

    preview_b64 = base64.b64encode(contents).decode("utf-8")
    content_type = file.content_type or "image/jpeg"

    return {
        **result,
        "preview_url": f"data:{content_type};base64,{preview_b64}",
        "filename": file.filename,
    }


@router.get("/similar/{face_id}")
async def find_similar(face_id: str, limit: int = 6):
    """Find faces similar to the given face using geometric ratio comparison."""
    import json, math
    db = get_db()
    try:
        target = db.execute("SELECT * FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not target:
            # Try numeric fallback
            try:
                idx = int(face_id) - 1
                rows = db.execute("SELECT * FROM faces WHERE verified = 1 ORDER BY created_at ASC").fetchall()
                if 0 <= idx < len(rows):
                    target = rows[idx]
            except (ValueError, IndexError):
                pass
        if not target:
            raise HTTPException(status_code=404, detail="Face not found")

        target = dict_row(target)
        all_faces = db.execute("SELECT * FROM faces WHERE verified = 1 AND id != ?", (target["id"],)).fetchall()
        all_faces = dict_rows(all_faces)

        # Compare by attributes (ethnicity, gender, style, age range)
        scored = []
        for f in all_faces:
            score = 0
            if f.get("ethnicity") == target.get("ethnicity"):
                score += 3
            if f.get("gender") == target.get("gender"):
                score += 2
            if f.get("style") == target.get("style"):
                score += 2
            # Age proximity (within 5 years = bonus)
            if f.get("age") and target.get("age"):
                diff = abs(f["age"] - target["age"])
                if diff <= 5:
                    score += 2
                elif diff <= 10:
                    score += 1
            # Price similarity
            if f.get("price") and target.get("price"):
                pdiff = abs(f["price"] - target["price"])
                if pdiff <= 5:
                    score += 1

            scored.append((score, f))

        scored.sort(key=lambda x: -x[0])
        similar = [f for _, f in scored[:limit]]

        return {"similar": similar, "count": len(similar)}
    finally:
        db.close()


@router.get("")
async def list_faces(
    gender: Optional[str] = None,
    ethnicity: Optional[str] = None,
    style: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    db = get_db()
    try:
        query = "SELECT * FROM faces WHERE verified = 1"
        params = []

        if gender and gender != "All":
            query += " AND gender = ?"
            params.append(gender)
        if ethnicity and ethnicity != "All":
            query += " AND ethnicity = ?"
            params.append(ethnicity)
        if style and style != "All":
            query += " AND style = ?"
            params.append(style)
        if min_price:
            query += " AND price >= ?"
            params.append(min_price)
        if max_price:
            query += " AND price <= ?"
            params.append(max_price)
        if search:
            query += " AND name LIKE ?"
            params.append(f"%{search}%")

        count_q = query.replace("SELECT *", "SELECT COUNT(*)")
        total = db.execute(count_q, params).fetchone()[0]

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = db.execute(query, params).fetchall()

        return {"faces": dict_rows(rows), "total": total}
    finally:
        db.close()


@router.get("/{face_id}")
async def get_face(face_id: str):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not row:
            try:
                idx = int(face_id) - 1
                rows = db.execute("SELECT * FROM faces WHERE verified = 1 ORDER BY created_at ASC").fetchall()
                if 0 <= idx < len(rows):
                    row = rows[idx]
            except (ValueError, IndexError):
                pass
        if not row:
            raise HTTPException(status_code=404, detail="Face not found")
        return dict_row(row)
    finally:
        db.close()


class _FaceRegisterBody(_BaseModel):
    name: str
    price: float
    photo_url: str = ""
    tags: str = ""
    ethnicity: str = ""
    age: Optional[int] = None
    gender: str = ""
    style: str = ""
    location: str = ""
    face_id_hash: str = ""

@router.post("")
async def register_face(
    body: _FaceRegisterBody,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    try:
        fid = new_id()
        db.execute(
            """INSERT INTO faces (id, user_id, name, photo_url, price, tags, ethnicity, age, gender, style, location, face_id_hash, verified)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)""",
            (fid, current_user["id"], body.name, body.photo_url, body.price, body.tags, body.ethnicity, body.age, body.gender, body.style, body.location, body.face_id_hash),
        )
        db.commit()

        row = db.execute("SELECT * FROM faces WHERE id = ?", (fid,)).fetchone()
        return dict_row(row)
    finally:
        db.close()


@router.get("/my/list")
async def my_faces(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute("SELECT * FROM faces WHERE user_id = ? ORDER BY created_at DESC", (current_user["id"],)).fetchall()
        return {"faces": dict_rows(rows)}
    finally:
        db.close()


class _FaceUpdateBody(_BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    tags: Optional[str] = None
    ethnicity: Optional[str] = None
    style: Optional[str] = None
    location: Optional[str] = None
    photo_url: Optional[str] = None

@router.patch("/{face_id}")
async def update_face(face_id: str, body: _FaceUpdateBody, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        face = db.execute("SELECT user_id FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not face:
            raise HTTPException(status_code=404, detail="Face not found")
        if face["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        updates, params = [], []
        for field in ["name", "price", "tags", "ethnicity", "style", "location", "photo_url"]:
            val = getattr(body, field, None)
            if val is not None:
                updates.append(f"{field} = ?"); params.append(val)
        if not updates:
            raise HTTPException(status_code=400, detail="Nothing to update")

        params.append(face_id)
        db.execute(f"UPDATE faces SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()
        row = db.execute("SELECT * FROM faces WHERE id = ?", (face_id,)).fetchone()
        return dict_row(row)
    finally:
        db.close()


@router.delete("/{face_id}")
async def delete_face(face_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        face = db.execute("SELECT user_id FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not face:
            raise HTTPException(status_code=404, detail="Face not found")
        if face["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        db.execute("DELETE FROM faces WHERE id = ?", (face_id,))
        db.commit()
        return {"message": "Face deleted"}
    finally:
        db.close()
