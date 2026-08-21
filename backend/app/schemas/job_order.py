from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Import Enums from model
from backend.app.models.job_order import JobOrderStatus, InspectionStatus

class ChecklistDetailBase(BaseModel):
    labor_id: str
    status: InspectionStatus = InspectionStatus.PENDING
    diagnostic_notes: Optional[str] = None
    visual_proof: Optional[str] = None

class ChecklistDetailResponse(ChecklistDetailBase):
    cd_id: str
    jo_id: str
    labor_name: str

    class Config:
        from_attributes = True

# Front-end helper schemas
class DetailItem(BaseModel):
    status: str
    note: Optional[str] = None
    photo_urls: str = "[]"

class InspectionItemResponse(BaseModel):
    id: str
    name: str
    status: str
    details: List[DetailItem] = []

class MechanicResponse(BaseModel):
    user_id: str
    name: str

    class Config:
        from_attributes = True

class OwnerResponseSimple(BaseModel):
    owner_id: str
    name: str
    phone: str
    fb_handle: Optional[str] = None

class VehicleResponseSimple(BaseModel):
    vehicle_id: str
    model: str
    plate_number: str
    engine_type: str
    photo_url: Optional[str] = None

class JobOrderCreate(BaseModel):
    owner_id: str
    vehicle_id: str
    bundle_id: str
    odometer: int
    mechanic_names: List[str] = []

class JobOrderResponse(BaseModel):
    id: str
    owner: OwnerResponseSimple
    vehicle: VehicleResponseSimple
    service_type: str
    odometer: str
    status: str
    created_at: str
    vehicle_photo_url: Optional[str] = None
    mechanics: List[MechanicResponse] = []
    inspection_items: List[InspectionItemResponse] = []
    # placeholders for billing/estimates
    estimate_items: List[dict] = []
    discount: float = 0.0
    estimate_comment: Optional[str] = None
    inspection_started: bool = False
    mechanic_findings: Optional[str] = None
    mechanic_marked_ready: bool = False

    class Config:
        from_attributes = True

class JobOrderUpdate(BaseModel):
    odometer: Optional[int] = None
    bundle_id: Optional[str] = None
    mechanic_names: Optional[List[str]] = None
