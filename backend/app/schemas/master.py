from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Owner Schemas ---
class OwnerCreate(BaseModel):
    name: str
    facebook: Optional[str] = None
    contact_number: str

class OwnerResponse(OwnerCreate):
    owner_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Vehicle Schemas ---
class VehicleCreate(BaseModel):
    owner_id: str
    make: str
    model: str
    year: int
    color: str
    plate_number: str
    photo_url: Optional[str] = None

class VehicleResponse(VehicleCreate):
    vehicle_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Material Schemas ---
class MaterialCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class MaterialResponse(MaterialCreate):
    materials_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Labor Schemas ---
class LaborCreate(BaseModel):
    labor_name: str
    price: float
    category: str
    description: Optional[str] = None

class LaborResponse(LaborCreate):
    labor_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Bundle Schemas ---
class BundleCreate(BaseModel):
    bundle_name: str
    interval: str
    description: Optional[str] = None
    original_price: float
    discounted_price: float
    labor_ids: List[str]

class BundleResponse(BaseModel):
    bundle_id: str
    bundle_name: str
    interval: str
    description: Optional[str] = None
    original_price: float
    discounted_price: float
    services: List[LaborResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
