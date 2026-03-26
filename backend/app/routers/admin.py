from fastapi import APIRouter, HTTPException, Depends
from app.core.security import get_admin_user
from app.core.database import get_db, dict_row, dict_rows

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def admin_stats(_: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        total_users = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        total_faces = db.execute("SELECT COUNT(*) FROM faces").fetchone()[0]
        pending_faces = db.execute("SELECT COUNT(*) FROM faces WHERE verified = 0").fetchone()[0]
        verified_faces = db.execute("SELECT COUNT(*) FROM faces WHERE verified = 1").fetchone()[0]
        total_licenses = db.execute("SELECT COUNT(*) FROM licenses").fetchone()[0]
        active_licenses = db.execute("SELECT COUNT(*) FROM licenses WHERE status = 'active'").fetchone()[0]
        total_revenue = db.execute("SELECT COALESCE(SUM(price_paid), 0) FROM licenses").fetchone()[0]

        return {
            "total_users": total_users,
            "total_faces": total_faces,
            "pending_faces": pending_faces,
            "verified_faces": verified_faces,
            "total_licenses": total_licenses,
            "active_licenses": active_licenses,
            "total_revenue": round(total_revenue, 2),
        }
    finally:
        db.close()


@router.get("/users")
async def list_users(limit: int = 50, offset: int = 0, _: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        total = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        rows = db.execute(
            "SELECT id, name, email, role, balance, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return {"users": dict_rows(rows), "total": total}
    finally:
        db.close()


@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, _: dict = Depends(get_admin_user)):
    if role not in ("provider", "buyer", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    db = get_db()
    try:
        db.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
        db.commit()
        row = db.execute("SELECT id, name, email, role FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return dict_row(row)
    finally:
        db.close()


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, _: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        db.commit()
        return {"message": "User deleted"}
    finally:
        db.close()


@router.get("/faces")
async def list_all_faces(verified: int = -1, limit: int = 50, offset: int = 0, _: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        query = "SELECT f.*, u.name as owner_name, u.email as owner_email FROM faces f LEFT JOIN users u ON f.user_id = u.id"
        params = []

        if verified >= 0:
            query += " WHERE f.verified = ?"
            params.append(verified)

        count_q = query.replace("SELECT f.*, u.name as owner_name, u.email as owner_email", "SELECT COUNT(*)")
        total = db.execute(count_q, params).fetchone()[0]

        query += " ORDER BY f.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = db.execute(query, params).fetchall()

        return {"faces": dict_rows(rows), "total": total}
    finally:
        db.close()


@router.patch("/faces/{face_id}/verify")
async def verify_face(face_id: str, _: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        db.execute("UPDATE faces SET verified = 1 WHERE id = ?", (face_id,))
        db.commit()
        row = db.execute("SELECT * FROM faces WHERE id = ?", (face_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Face not found")
        return dict_row(row)
    finally:
        db.close()


@router.patch("/faces/{face_id}/reject")
async def reject_face(face_id: str, _: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        db.execute("DELETE FROM faces WHERE id = ?", (face_id,))
        db.commit()
        return {"message": "Face rejected and removed"}
    finally:
        db.close()


@router.get("/licenses")
async def list_all_licenses(status: str = "", limit: int = 50, offset: int = 0, _: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        query = """SELECT l.*, f.name as face_name, f.photo_url as face_photo,
                          buyer.name as buyer_name, provider.name as provider_name
                   FROM licenses l
                   LEFT JOIN faces f ON l.face_id = f.id
                   LEFT JOIN users buyer ON l.buyer_id = buyer.id
                   LEFT JOIN users provider ON l.provider_id = provider.id"""
        params = []

        if status:
            query += " WHERE l.status = ?"
            params.append(status)

        count_q = "SELECT COUNT(*) FROM licenses" + (" WHERE status = ?" if status else "")
        total = db.execute(count_q, params[:1] if status else []).fetchone()[0]

        query += " ORDER BY l.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = db.execute(query, params).fetchall()

        return {"licenses": dict_rows(rows), "total": total}
    finally:
        db.close()


@router.patch("/licenses/{lic_id}/revoke")
async def revoke_license(lic_id: str, _: dict = Depends(get_admin_user)):
    db = get_db()
    try:
        db.execute("UPDATE licenses SET status = 'revoked' WHERE id = ?", (lic_id,))
        db.commit()
        return {"message": "License revoked"}
    finally:
        db.close()
