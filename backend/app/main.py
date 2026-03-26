from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import init_db
from app.routers import auth, faces, licenses, dashboard, admin

settings = get_settings()

app = FastAPI(title="FacePay API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(faces.router, prefix="/api")
app.include_router(licenses.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/")
async def root():
    return {"message": "FacePay API", "version": "0.1.0"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
