from pydantic import BaseModel
from typing import Optional


class FaceCreate(BaseModel):
    name: str
    price: float
    tags: Optional[str] = ""
    ethnicity: Optional[str] = ""
    age: Optional[int] = None
    gender: Optional[str] = ""
    style: Optional[str] = ""
    location: Optional[str] = ""
    allowed_for: Optional[list[str]] = []
    not_allowed_for: Optional[list[str]] = []


class FaceResponse(BaseModel):
    id: str
    user_id: str
    name: str
    photo_url: str
    price: float
    tags: Optional[str] = ""
    ethnicity: Optional[str] = ""
    age: Optional[int] = None
    gender: Optional[str] = ""
    style: Optional[str] = ""
    location: Optional[str] = ""
    allowed_for: list[str] = []
    not_allowed_for: list[str] = []
    verified: bool = False
    created_at: str


class FaceListResponse(BaseModel):
    faces: list[FaceResponse]
    total: int
