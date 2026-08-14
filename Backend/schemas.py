from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class VehicleBase(BaseModel):
    id: str
    plate_number: str
    model: str
    year: Optional[str] = None
    engine_type: Optional[str] = None

class Vehicle(VehicleBase):
    owner_id: str
    model_config = ConfigDict(from_attributes=True)

class OwnerBase(BaseModel):
    id: str
    name: str
    phone: str
    fb_handle: Optional[str] = None

class Owner(OwnerBase):
    vehicles: List[Vehicle] = []
    model_config = ConfigDict(from_attributes=True)

class MechanicBase(BaseModel):
    name: str
    bay: Optional[str] = None

class Mechanic(MechanicBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class InspectionItemDetailBase(BaseModel):
    status: str
    note: Optional[str] = None
    photo_urls: Optional[str] = None  # JSON string

class InspectionItemDetail(InspectionItemDetailBase):
    id: int
    inspection_item_id: int
    model_config = ConfigDict(from_attributes=True)

class InspectionItemBase(BaseModel):
    category: Optional[str] = None
    name: str
    status: str = 'PENDING'

class InspectionItem(InspectionItemBase):
    id: int
    job_order_id: str
    details: List[InspectionItemDetail] = []
    model_config = ConfigDict(from_attributes=True)

class EstimateItemBase(BaseModel):
    id: str
    description: str
    qty: int = 1
    unit_price: float
    customer_approved: Optional[bool] = None
    provisioning: str = 'BUY'

class EstimateItem(EstimateItemBase):
    job_order_id: str
    linked_inspection_item_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class JobOrderBase(BaseModel):
    id: str
    odometer: Optional[str] = None
    fuel_level: Optional[str] = None
    service_type: str
    status: str
    created_at: str
    vehicle_photo_url: Optional[str] = None
    inspection_started: bool = False
    mechanic_findings: Optional[str] = None
    discount: float = 0.0
    estimate_comment: Optional[str] = None
    mechanic_marked_ready: bool = False

class JobOrder(JobOrderBase):
    owner_id: str
    vehicle_id: str
    owner: Owner
    vehicle: VehicleBase
    mechanics: List[Mechanic] = []
    inspection_items: List[InspectionItem] = []
    estimate_items: List[EstimateItem] = []
    model_config = ConfigDict(from_attributes=True)

class ServiceCatalogBase(BaseModel):
    id: str
    name: str
    price: float
    category: str
    description: Optional[str] = None
    status: str = 'Active'

class ServiceCatalog(ServiceCatalogBase):
    model_config = ConfigDict(from_attributes=True)

class PackageBundleBase(BaseModel):
    id: str
    package_name: str
    target_interval: str
    description: Optional[str] = None
    package_price: float
    standalone_sum: Optional[float] = None
    popular_badge: bool = False

class PackageBundle(PackageBundleBase):
    services: List[ServiceCatalog] = []
    model_config = ConfigDict(from_attributes=True)
