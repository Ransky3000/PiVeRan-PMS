from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Owner(Base):
    __tablename__ = 'owners'
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, unique=True)
    fb_handle = Column(String)

    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")
    job_orders = relationship("JobOrder", back_populates="owner")

class Vehicle(Base):
    __tablename__ = 'vehicles'
    id = Column(String, primary_key=True)
    owner_id = Column(String, ForeignKey('owners.id'))
    plate_number = Column(String, nullable=False, unique=True)
    model = Column(String, nullable=False)
    year = Column(String)
    engine_type = Column(String)

    owner = relationship("Owner", back_populates="vehicles")
    job_orders = relationship("JobOrder", back_populates="vehicle")

class Mechanic(Base):
    __tablename__ = 'mechanics'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    bay = Column(String)

class JobOrderMechanic(Base):
    __tablename__ = 'job_order_mechanics'
    job_order_id = Column(String, ForeignKey('job_orders.id', ondelete="CASCADE"), primary_key=True)
    mechanic_id = Column(Integer, ForeignKey('mechanics.id', ondelete="CASCADE"), primary_key=True)

class JobOrder(Base):
    __tablename__ = 'job_orders'
    id = Column(String, primary_key=True)
    owner_id = Column(String, ForeignKey('owners.id'))
    vehicle_id = Column(String, ForeignKey('vehicles.id'))
    odometer = Column(String)
    fuel_level = Column(String)
    service_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.now().isoformat())
    vehicle_photo_url = Column(String)
    inspection_started = Column(Boolean, default=False)
    mechanic_findings = Column(Text)
    discount = Column(Float, default=0.0)
    estimate_comment = Column(Text)
    mechanic_marked_ready = Column(Boolean, default=False)

    owner = relationship("Owner", back_populates="job_orders")
    vehicle = relationship("Vehicle", back_populates="job_orders")
    mechanics = relationship("Mechanic", secondary="job_order_mechanics")
    inspection_items = relationship("InspectionItem", back_populates="job_order", cascade="all, delete-orphan")
    estimate_items = relationship("EstimateItem", back_populates="job_order", cascade="all, delete-orphan")

class InspectionItem(Base):
    __tablename__ = 'inspection_items'
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_order_id = Column(String, ForeignKey('job_orders.id', ondelete="CASCADE"))
    category = Column(String)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default='PENDING')

    job_order = relationship("JobOrder", back_populates="inspection_items")
    details = relationship("InspectionItemDetail", back_populates="inspection_item", cascade="all, delete-orphan")

class InspectionItemDetail(Base):
    __tablename__ = 'inspection_item_details'
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_item_id = Column(Integer, ForeignKey('inspection_items.id', ondelete="CASCADE"))
    status = Column(String, nullable=False)
    note = Column(Text)
    photo_urls = Column(Text)

    __table_args__ = (UniqueConstraint('inspection_item_id', 'status', name='uq_inspection_status'),)
    
    inspection_item = relationship("InspectionItem", back_populates="details")

class EstimateItem(Base):
    __tablename__ = 'estimate_items'
    id = Column(String, primary_key=True)
    job_order_id = Column(String, ForeignKey('job_orders.id', ondelete="CASCADE"))
    description = Column(String, nullable=False)
    qty = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    customer_approved = Column(Boolean, nullable=True)
    provisioning = Column(String, default='BUY')
    linked_inspection_item_id = Column(Integer, ForeignKey('inspection_items.id', ondelete="SET NULL"), nullable=True)

    job_order = relationship("JobOrder", back_populates="estimate_items")

class ServiceCatalog(Base):
    __tablename__ = 'services_catalog'
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, nullable=False, default='Active')

class PackageBundle(Base):
    __tablename__ = 'package_bundles'
    id = Column(String, primary_key=True)
    package_name = Column(String, nullable=False)
    target_interval = Column(String, nullable=False)
    description = Column(Text)
    package_price = Column(Float, nullable=False)
    standalone_sum = Column(Float)
    popular_badge = Column(Boolean, default=False)

    services = relationship("ServiceCatalog", secondary="package_services")

class PackageService(Base):
    __tablename__ = 'package_services'
    package_id = Column(String, ForeignKey('package_bundles.id', ondelete="CASCADE"), primary_key=True)
    service_id = Column(String, ForeignKey('services_catalog.id', ondelete="CASCADE"), primary_key=True)
    sequence_order = Column(Integer, nullable=False)
