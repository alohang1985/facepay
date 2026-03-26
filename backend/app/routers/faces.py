import base64
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional
from app.core.security import get_current_user
from app.core.database import get_db, dict_row, dict_rows, new_id

router = APIRouter(prefix="/faces", tags=["faces"])


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
        # Try by UUID first, then by integer ID for mock data compatibility
        row = db.execute("SELECT * FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not row:
            # Fallback: get by row number for legacy /face/1 etc
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


from pydantic import BaseModel as _BaseModel

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
