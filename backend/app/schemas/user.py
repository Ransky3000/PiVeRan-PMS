from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from backend.app.models.user import UserRole, AccountStatus

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone_number: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    phone_number: str
    role: UserRole
    status: AccountStatus
    created_at: datetime

    class Config:
        from_attributes = True

class UserStatusUpdate(BaseModel):
    status: AccountStatus

class UserAdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone_number: str
    role: UserRole
    status: AccountStatus = AccountStatus.APPROVED

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[AccountStatus] = None
