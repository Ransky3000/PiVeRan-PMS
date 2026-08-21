import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from backend.app.database import Base

owner_vehicles = Table(
    "owner_vehicles",
    Base.metadata,
    Column("owner_id", String, ForeignKey("Owner.owner_id"), primary_key=True),
    Column("vehicle_id", String, ForeignKey("vehicles.vehicle_id"), primary_key=True)
)

class Owner(Base):
    __tablename__ = "Owner"

    owner_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    facebook = Column(String, nullable=True)
    contact_number = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicles = relationship("Vehicle", secondary=owner_vehicles, backref="owners")

class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String, nullable=False)
    plate_number = Column(String, unique=True, nullable=False)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Material(Base):
    __tablename__ = "materials"

    materials_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

labor_materials = Table(
    "labor_materials",
    Base.metadata,
    Column("labor_id", String, ForeignKey("labor.labor_id"), primary_key=True),
    Column("materials_id", String, ForeignKey("materials.materials_id"), primary_key=True)
)

class Labor(Base):
    __tablename__ = "labor"

    labor_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    labor_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    materials = relationship("Material", secondary=labor_materials, backref="labors")

class BundleService(Base):
    __tablename__ = "bundle_services"

    bundle_id = Column(String, ForeignKey("bundles.bundle_id"), primary_key=True)
    labor_id = Column(String, ForeignKey("labor.labor_id"), primary_key=True)
    sequence = Column(Integer, default=0)

class Bundle(Base):
    __tablename__ = "bundles"

    bundle_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bundle_name = Column(String, nullable=False)
    interval = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    original_price = Column(Float, nullable=False)
    discounted_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    services = relationship("Labor", secondary="bundle_services", order_by="BundleService.sequence", backref="bundles")
