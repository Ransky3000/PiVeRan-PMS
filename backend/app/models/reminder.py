from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from backend.app.database import Base
import enum
import uuid
from datetime import datetime

class ReminderStatus(str, enum.Enum):
    PENDING = "Pending"
    DUE = "Due"
    OVERDUE = "Overdue"
    DONE = "Done"

class Reminder(Base):
    __tablename__ = "reminders"

    reminder_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    jo_id = Column(String, ForeignKey("job_orders.jo_id"), nullable=True)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    owner_id = Column(String, ForeignKey("Owner.owner_id"), nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    target_date = Column(DateTime, nullable=False)
    start_odometer = Column(Integer, default=0)
    target_odometer = Column(Integer, default=10000)
    status = Column(SQLEnum(ReminderStatus), default=ReminderStatus.PENDING)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_order = relationship("JobOrder", backref="reminders")
    vehicle = relationship("Vehicle", backref="reminders")
    owner = relationship("Owner", backref="reminders")
