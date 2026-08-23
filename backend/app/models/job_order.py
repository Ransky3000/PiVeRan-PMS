import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, Enum, Boolean
import enum
from sqlalchemy.orm import relationship
from backend.app.database import Base
from backend.app.models.master import Material

class JobOrderStatus(str, enum.Enum):
    NEW = "New"
    WORK_IN_PROGRESS = "Work in progress"
    JOB_COMPLETED = "Job completed"

class InspectionStatus(str, enum.Enum):
    GOOD = "Good"
    ISSUE = "Issue"
    MONITOR = "Monitor"
    PENDING = "Pending"

class CartDecision(str, enum.Enum):
    BUY = "Buy"
    NO = "No"

class JobOrderMechanic(Base):
    __tablename__ = "job_order_mechanics"

    jo_id = Column(String, ForeignKey("job_orders.jo_id"), primary_key=True)
    user_id = Column(String, ForeignKey("users_account.user_id"), primary_key=True)

class JobOrder(Base):
    __tablename__ = "job_orders"

    jo_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, ForeignKey("Owner.owner_id"), nullable=False)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    bundle_id = Column(String, ForeignKey("bundles.bundle_id"), nullable=False)
    odometer = Column(Integer, nullable=False)
    status = Column(Enum(JobOrderStatus), nullable=False, default=JobOrderStatus.NEW)
    discount = Column(Float, nullable=False, default=0.0)
    estimate_comment = Column(Text, nullable=True)
    mechanic_findings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    checklist_items = relationship("ChecklistDetail", back_populates="job_order", cascade="all, delete-orphan")
    mechanics = relationship("UserAccount", secondary="job_order_mechanics")
    owner = relationship("Owner")
    vehicle = relationship("Vehicle")
    bundle = relationship("Bundle")

class ChecklistDetail(Base):
    __tablename__ = "checklist_details"

    cd_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    jo_id = Column(String, ForeignKey("job_orders.jo_id"), nullable=False)
    labor_id = Column(String, ForeignKey("labor.labor_id"), nullable=False)
    status = Column(Enum(InspectionStatus), nullable=False, default=InspectionStatus.PENDING)
    diagnostic_notes = Column(Text, nullable=True)
    visual_proof = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job_order = relationship("JobOrder", back_populates="checklist_items")
    labor = relationship("Labor")
    cart_items = relationship("Cart", back_populates="checklist_item", cascade="all, delete-orphan")

class Cart(Base):
    __tablename__ = "cart"

    cart_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cd_id = Column(String, ForeignKey("checklist_details.cd_id"), nullable=False)
    materials_id = Column(String, ForeignKey("materials.materials_id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False)
    decision = Column(Enum(CartDecision), nullable=False, default=CartDecision.NO)

    checklist_item = relationship("ChecklistDetail", back_populates="cart_items")
    material = relationship("Material")
