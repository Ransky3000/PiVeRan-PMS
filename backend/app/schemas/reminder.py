from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.app.models.reminder import ReminderStatus
from backend.app.schemas.master import VehicleResponse, OwnerResponse

class ReminderCreate(BaseModel):
    jo_id: Optional[str] = None
    vehicle_id: str
    owner_id: str
    start_date: Optional[datetime] = None
    target_date: datetime
    start_odometer: Optional[int] = 0
    target_odometer: int
    status: Optional[ReminderStatus] = ReminderStatus.PENDING
    notes: Optional[str] = None

class ReminderUpdate(BaseModel):
    target_date: Optional[datetime] = None
    target_odometer: Optional[int] = None
    status: Optional[ReminderStatus] = None
    notes: Optional[str] = None

class ReminderResponse(BaseModel):
    reminder_id: str
    jo_id: Optional[str] = None
    vehicle_id: str
    owner_id: str
    start_date: datetime
    target_date: datetime
    start_odometer: int
    target_odometer: int
    status: ReminderStatus
    notes: Optional[str] = None
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None
    owner: Optional[OwnerResponse] = None

    class Config:
        from_attributes = True
