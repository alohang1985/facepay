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

        CREATE TABLE IF NOT EXISTS wishlist (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            face_id TEXT REFERENCES faces(id) ON DELETE CASCADE,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(user_id, face_id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            face_id TEXT REFERENCES faces(id) ON DELETE CASCADE,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(face_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            key_hash TEXT NOT NULL,
            name TEXT DEFAULT 'Default',
            permissions TEXT DEFAULT 'read',
            calls_today INTEGER DEFAULT 0,
            calls_total INTEGER DEFAULT 0,
            rate_limit INTEGER DEFAULT 100,
            active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            last_used_at TEXT
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            from_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            to_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            face_id TEXT REFERENCES faces(id) ON DELETE SET NULL,
            subject TEXT DEFAULT '',
            body TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS usage_reports (
            id TEXT PRIMARY KEY,
            license_id TEXT REFERENCES licenses(id) ON DELETE CASCADE,
            reported_url TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            type TEXT DEFAULT 'info',
            title TEXT NOT NULL,
            body TEXT DEFAULT '',
            link TEXT DEFAULT '',
            read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
            price REAL DEFAULT 0,
            status TEXT DEFAULT 'active',
            started_at TEXT DEFAULT (datetime('now')),
            expires_at TEXT
        );

        CREATE TABLE IF NOT EXISTS promo_codes (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            discount_percent INTEGER DEFAULT 0,
            discount_flat REAL DEFAULT 0,
            max_uses INTEGER DEFAULT 100,
            used_count INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1,
            expires_at TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS face_views (
            id TEXT PRIMARY KEY,
            face_id TEXT REFERENCES faces(id) ON DELETE CASCADE,
            viewer_id TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS usage_urls (
            id TEXT PRIMARY KEY,
            license_id TEXT REFERENCES licenses(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            description TEXT DEFAULT '',
            verified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS disputes (
            id TEXT PRIMARY KEY,
            license_id TEXT REFERENCES licenses(id),
            reporter_id TEXT REFERENCES users(id),
            against_id TEXT REFERENCES users(id),
            reason TEXT NOT NULL,
            evidence TEXT DEFAULT '',
            status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved_buyer', 'resolved_provider', 'dismissed')),
            admin_notes TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            resolved_at TEXT
        );

        CREATE TABLE IF NOT EXISTS misuse_scans (
            id TEXT PRIMARY KEY,
            face_id TEXT REFERENCES faces(id) ON DELETE CASCADE,
            provider_id TEXT REFERENCES users(id),
            stage INTEGER DEFAULT 1,
            match_score REAL DEFAULT 0,
            source_url TEXT DEFAULT '',
            provider_confirmed INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'dismissed', 'dmca_sent')),
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS auctions (
            id TEXT PRIMARY KEY,
            face_id TEXT REFERENCES faces(id) ON DELETE CASCADE,
            provider_id TEXT REFERENCES users(id),
            industry TEXT NOT NULL,
            starting_price REAL NOT NULL,
            current_price REAL NOT NULL,
            current_bidder_id TEXT,
            bid_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
            scheduled_at TEXT NOT NULL,
            starts_at TEXT,
            ends_at TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS auction_bids (
            id TEXT PRIMARY KEY,
            auction_id TEXT REFERENCES auctions(id) ON DELETE CASCADE,
            bidder_id TEXT REFERENCES users(id),
            amount REAL NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS license_tiers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            description TEXT DEFAULT '',
            base_multiplier REAL DEFAULT 1.0,
            allows_commercial INTEGER DEFAULT 1,
            allows_ai_synthesis INTEGER DEFAULT 0,
            allows_adult INTEGER DEFAULT 0,
            allows_print INTEGER DEFAULT 0,
            allows_broadcast INTEGER DEFAULT 0,
            max_impressions INTEGER DEFAULT 0,
            category TEXT DEFAULT 'standard',
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS impressions (
            id TEXT PRIMARY KEY,
            license_id TEXT REFERENCES licenses(id),
            face_id TEXT REFERENCES faces(id),
            url TEXT DEFAULT '',
            count INTEGER DEFAULT 0,
            date TEXT DEFAULT (date('now'))
        );

        CREATE TABLE IF NOT EXISTS referrals (
            id TEXT PRIMARY KEY,
            referrer_id TEXT REFERENCES users(id),
            referred_id TEXT REFERENCES users(id),
            code TEXT NOT NULL,
            reward_amount REAL DEFAULT 10,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired')),
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS moodboards (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            is_public INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS moodboard_items (
            id TEXT PRIMARY KEY,
            moodboard_id TEXT REFERENCES moodboards(id) ON DELETE CASCADE,
            face_id TEXT REFERENCES faces(id) ON DELETE CASCADE,
            note TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(moodboard_id, face_id)
        );

        CREATE TABLE IF NOT EXISTS price_history (
            id TEXT PRIMARY KEY,
            face_id TEXT REFERENCES faces(id) ON DELETE CASCADE,
            price REAL NOT NULL,
            demand_score REAL DEFAULT 0,
            recorded_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS insurance (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            face_id TEXT REFERENCES faces(id),
            plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'premium')),
            monthly_cost REAL DEFAULT 2,
            coverage_amount REAL DEFAULT 5000,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_impressions_license ON impressions(license_id);
        CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
        CREATE INDEX IF NOT EXISTS idx_moodboards_user ON moodboards(user_id);
        CREATE INDEX IF NOT EXISTS idx_price_history_face ON price_history(face_id);
        CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
        CREATE INDEX IF NOT EXISTS idx_auction_bids ON auction_bids(auction_id);
        CREATE INDEX IF NOT EXISTS idx_face_views ON face_views(face_id);
        CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_face ON reviews(face_id);
        CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_user_id);
        CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys(user_id);
        CREATE INDEX IF NOT EXISTS idx_faces_verified ON faces(verified);
        CREATE INDEX IF NOT EXISTS idx_faces_user ON faces(user_id);
        CREATE INDEX IF NOT EXISTS idx_licenses_buyer ON licenses(buyer_id);
        CREATE INDEX IF NOT EXISTS idx_licenses_provider ON licenses(provider_id);
        CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
    """)

    # Add columns if missing (safe migration)
    try:
        cur.execute("ALTER TABLE licenses ADD COLUMN exclusive INTEGER DEFAULT 0")
    except:
        pass
    try:
        cur.execute("ALTER TABLE licenses ADD COLUMN exclusive_industry TEXT DEFAULT ''")
    except:
        pass
    try:
        cur.execute("ALTER TABLE faces ADD COLUMN view_count INTEGER DEFAULT 0")
    except:
        pass

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

    # Referral codes for existing users
    cur.execute("INSERT INTO referrals (id, referrer_id, code, status) VALUES (?, ?, 'SARAH10', 'pending')", (new_id(), buyer_id))

    # License tiers
    tiers = [
        (new_id(), "Personal SNS", "personal_sns", "Personal social media use only", 1.0, 0, 0, 0, 0, 0, 10000, "personal", 1),
        (new_id(), "Personal Blog", "personal_blog", "Personal blog and website", 1.5, 0, 0, 0, 0, 0, 50000, "personal", 2),
        (new_id(), "Commercial Web", "commercial_web", "Business website and online ads", 3.0, 1, 0, 0, 0, 0, 500000, "business", 3),
        (new_id(), "Commercial Print", "commercial_print", "Print advertising and packaging", 4.0, 1, 0, 0, 1, 0, 1000000, "business", 4),
        (new_id(), "Broadcast/TV", "broadcast", "TV, streaming, video production", 6.0, 1, 0, 0, 1, 1, 0, "business", 5),
        (new_id(), "AI Synthesis", "ai_synthesis", "Use face for AI-generated content", 8.0, 1, 1, 0, 1, 1, 0, "ai", 6),
        (new_id(), "Adult Content", "adult", "Adult-oriented content (18+)", 10.0, 1, 0, 1, 1, 0, 0, "restricted", 7),
        (new_id(), "Exclusive Industry", "exclusive", "Exclusive rights within an industry", 15.0, 1, 1, 0, 1, 1, 0, "exclusive", 8),
        (new_id(), "Full Buyout", "buyout", "Complete exclusive rights, all uses", 25.0, 1, 1, 1, 1, 1, 0, "exclusive", 9),
    ]
    for t in tiers:
        cur.execute("""INSERT INTO license_tiers (id, name, code, description, base_multiplier,
                       allows_commercial, allows_ai_synthesis, allows_adult, allows_print, allows_broadcast,
                       max_impressions, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", t)

    # Promo codes
    cur.execute("INSERT INTO promo_codes (id, code, discount_percent, max_uses) VALUES (?, ?, ?, ?)",
                (new_id(), "WELCOME20", 20, 999))
    cur.execute("INSERT INTO promo_codes (id, code, discount_percent, max_uses) VALUES (?, ?, ?, ?)",
                (new_id(), "FIRST50", 50, 100))
    cur.execute("INSERT INTO promo_codes (id, code, discount_flat, max_uses) VALUES (?, ?, ?, ?)",
                (new_id(), "SAVE10", 10, 500))

    # Sample notifications for Sarah
    for title, body_text in [
        ("Welcome to FacePay!", "Start exploring faces and licensing."),
        ("License Expiring Soon", "Your license for Soojin Park expires in 5 days."),
    ]:
        cur.execute("INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, 'info', ?, ?)",
                    (new_id(), buyer_id, title, body_text))

    print("[DB] Seeded: admin@facepay.com/admin123, sarah@example.com/test123, 12 faces, 3 licenses, promo codes")
