"""SQLite database module for FacePay."""
import sqlite3
import uuid
import os
from app.core.config import get_settings

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "facepay.db"))


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def dict_row(row):
    """Convert sqlite3.Row to dict."""
    if row is None:
        return None
    return dict(row)


def dict_rows(rows):
    """Convert list of sqlite3.Row to list of dict."""
    return [dict(r) for r in rows]


def new_id():
    return str(uuid.uuid4())


def init_db():
    """Create tables and seed data on startup."""
    conn = get_db()
    cur = conn.cursor()

    # Create tables
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'provider' CHECK (role IN ('provider', 'buyer', 'admin')),
            avatar_url TEXT DEFAULT '',
            balance REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS faces (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            photo_url TEXT DEFAULT '',
            price REAL NOT NULL,
            tags TEXT DEFAULT '',
            ethnicity TEXT DEFAULT '',
            age INTEGER,
            gender TEXT DEFAULT '',
            style TEXT DEFAULT '',
            location TEXT DEFAULT '',
            face_id_hash TEXT DEFAULT '',
            verified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS licenses (
            id TEXT PRIMARY KEY,
            face_id TEXT REFERENCES faces(id) ON DELETE SET NULL,
            buyer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            provider_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            license_type TEXT NOT NULL CHECK (license_type IN ('standard', 'extended')),
            usage_purpose TEXT NOT NULL,
            duration_months INTEGER NOT NULL,
            price_paid REAL NOT NULL,
            company_name TEXT DEFAULT '',
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'pending')),
            created_at TEXT DEFAULT (datetime('now')),
            expires_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_faces_verified ON faces(verified);
        CREATE INDEX IF NOT EXISTS idx_faces_user ON faces(user_id);
        CREATE INDEX IF NOT EXISTS idx_licenses_buyer ON licenses(buyer_id);
        CREATE INDEX IF NOT EXISTS idx_licenses_provider ON licenses(provider_id);
    """)

    # Seed data if empty
    count = cur.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count == 0:
        _seed_data(cur)

    conn.commit()
    conn.close()
    print(f"[DB] SQLite initialized at {DB_PATH}")


def _seed_data(cur):
    from app.core.security import hash_password

    # Admin account
    admin_id = new_id()
    cur.execute(
        "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        (admin_id, "Admin", "admin@facepay.com", hash_password("admin123"), "admin"),
    )

    # Test buyer
    buyer_id = new_id()
    cur.execute(
        "INSERT INTO users (id, name, email, password_hash, role, balance) VALUES (?, ?, ?, ?, ?, ?)",
        (buyer_id, "Sarah Kim", "sarah@example.com", hash_password("test123"), "buyer", 120.00),
    )

    # Test provider
    provider_id = new_id()
    cur.execute(
        "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        (provider_id, "Provider User", "provider@example.com", hash_password("test123"), "provider"),
    )

    # 12 face entries
    faces_data = [
        ("Soojin Park", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop&crop=face", 25, "Korean · 20s · Casual", "Korean", 24, "Female", "Casual", "Seoul, South Korea"),
        ("David Kim", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop&crop=face", 40, "Korean · 30s · Business", "Korean", 33, "Male", "Business", "Seoul, South Korea"),
        ("Ella Roberts", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop&crop=face", 30, "Caucasian · 20s · Lifestyle", "Caucasian", 26, "Female", "Lifestyle", "London, UK"),
        ("Maya Chen", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=600&fit=crop&crop=face", 35, "Asian · 30s · Fitness", "Asian", 31, "Female", "Fitness", "Los Angeles, USA"),
        ("Jake Lee", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&crop=face", 20, "Korean · 20s · Trendy", "Korean", 23, "Male", "Trendy", "Seoul, South Korea"),
        ("Anna Smith", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop&crop=face", 50, "Caucasian · 30s · Professional", "Caucasian", 34, "Female", "Professional", "New York, USA"),
        ("Lucas Mendes", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop&crop=face", 28, "Latino · 40s · Outdoor", "Latino", 42, "Male", "Outdoor", "Sao Paulo, Brazil"),
        ("Yumi Tanaka", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop&crop=face", 32, "Japanese · 20s · Studio", "Asian", 27, "Female", "Studio", "Tokyo, Japan"),
        ("Emily Johnson", "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=600&fit=crop&crop=face", 45, "Blonde · 30s · Elegant", "Caucasian", 35, "Female", "Elegant", "Paris, France"),
        ("Jimin Choi", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=600&fit=crop&crop=face", 22, "Korean · 20s · Street", "Korean", 22, "Male", "Street", "Seoul, South Korea"),
        ("Jessica Lee", "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=600&fit=crop&crop=face", 38, "Asian · 30s · Glamour", "Asian", 30, "Female", "Glamour", "Hong Kong"),
        ("Mark Taylor", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=600&fit=crop&crop=face", 35, "Caucasian · 50s · Mature", "Caucasian", 54, "Male", "Mature", "Chicago, USA"),
    ]

    face_ids = []
    for f in faces_data:
        fid = new_id()
        face_ids.append(fid)
        cur.execute(
            "INSERT INTO faces (id, user_id, name, photo_url, price, tags, ethnicity, age, gender, style, location, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
            (fid, provider_id, f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8]),
        )

    # Sample licenses for Sarah
    from datetime import datetime, timedelta
    now = datetime.utcnow().isoformat()
    exp1 = (datetime.utcnow() + timedelta(days=5)).isoformat()
    exp2 = (datetime.utcnow() + timedelta(days=365)).isoformat()
    exp3 = (datetime.utcnow() - timedelta(days=10)).isoformat()

    licenses_data = [
        (new_id(), face_ids[0], buyer_id, provider_id, "standard", "YouTube Ad Campaign", 3, 25.0, "active", exp1),
        (new_id(), face_ids[2], buyer_id, provider_id, "extended", "E-Commerce Promo", 12, 75.0, "active", exp2),
        (new_id(), face_ids[4], buyer_id, provider_id, "standard", "Instagram Content", 6, 30.0, "expired", exp3),
    ]
    for lic in licenses_data:
        cur.execute(
            "INSERT INTO licenses (id, face_id, buyer_id, provider_id, license_type, usage_purpose, duration_months, price_paid, status, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            lic,
        )

    print("[DB] Seeded: admin@facepay.com/admin123, sarah@example.com/test123, 12 faces, 3 licenses")
