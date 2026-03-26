from pydantic import BaseModel
from typing import Optional


class LicensePurchaseRequest(BaseModel):
    face_id: str
    license_type: str  # standard | extended
    usage_purpose: str
    duration_months: int
    company_name: Optional[str] = ""


class LicenseResponse(BaseModel):
    id: str
    face_id: str
    buyer_id: str
    license_type: str
    usage_purpose: str
    duration_months: int
    price_paid: float
    status: str
    created_at: str
    expires_at: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str
