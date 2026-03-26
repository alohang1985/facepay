import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import get_settings
from app.core.database import init_db
from app.routers import auth, faces, licenses, dashboard, admin, wishlist, reviews, apikeys, messaging, notifications, subscriptions, protection

settings = get_settings()

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="FacePay API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api")
app.include_router(faces.router, prefix="/api")
app.include_router(licenses.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(apikeys.router, prefix="/api")
app.include_router(messaging.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(protection.router, prefix="/api")


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/")
async def root():
    return {"message": "FacePay API", "version": "0.1.0"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
