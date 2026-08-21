from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class LaborCategory(str, Enum):
    PMS = "PMS"
    AIRCON_SERVICES = "AIRCON SERVICES"
    MAJOR_WORK = "MAJOR WORK"
    UNDER_CHASSIS = "UNDER CHASSIS"
    COOLING_SYSTEM_RESTORATION = "COOLING SYSTEM RESTORATION"
    EXISTING_PMS_PACKAGES = "📦 EXISTING PMS PACKAGES"

# --- Owner Schemas ---
class OwnerCreate(BaseModel):
    name: str
    facebook: Optional[str] = None
    contact_number: str
    vehicle_ids: List[str] = []

class OwnerResponse(OwnerCreate):
    owner_id: str
    created_at: datetime
    vehicles: List['VehicleResponse'] = []

    class Config:
        from_attributes = True

class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    facebook: Optional[str] = None
    contact_number: Optional[str] = None
    vehicle_ids: Optional[List[str]] = None

class OwnerSimpleResponse(BaseModel):
    owner_id: str
    name: str
    facebook: Optional[str] = None
    contact_number: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Vehicle Schemas ---
class VehicleCreate(BaseModel):
    make: str
    model: str
    year: int
    color: str
    plate_number: str
    photo_url: Optional[str] = None
    owner_id: Optional[str] = None
    owner_ids: List[str] = []

class VehicleResponse(VehicleCreate):
    vehicle_id: str
    created_at: datetime
    owners: List[OwnerSimpleResponse] = []

    class Config:
        from_attributes = True

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    plate_number: Optional[str] = None
    photo_url: Optional[str] = None

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

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None

# --- Labor Schemas ---
class LaborCreate(BaseModel):
    labor_name: str
    price: float
    category: LaborCategory
    description: Optional[str] = None

class LaborResponse(LaborCreate):
    labor_id: str
    materials: List[MaterialResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class LaborUpdate(BaseModel):
    labor_name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[LaborCategory] = None
    description: Optional[str] = None

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

class BundleUpdate(BaseModel):
    bundle_name: Optional[str] = None
    interval: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    labor_ids: Optional[List[str]] = None
