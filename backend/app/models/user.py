import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum
import enum
from backend.app.database import Base

class UserRole(str, enum.Enum):
    SYSTEM_OWNER = "System Owner"
    FRONT_DESK = "Front Desk"
    MECHANIC = "Mechanic"

class AccountStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class UserAccount(Base):
    __tablename__ = "users_account"

    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(AccountStatus), nullable=False, default=AccountStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
