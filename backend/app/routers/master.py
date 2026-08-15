from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models.master import Owner, Vehicle, Material, Labor, Bundle, BundleService
from backend.app.schemas.master import (
    OwnerCreate, OwnerResponse,
    VehicleCreate, VehicleResponse,
    MaterialCreate, MaterialResponse,
    LaborCreate, LaborResponse,
    BundleCreate, BundleResponse
)

router = APIRouter(prefix="/api/master", tags=["Master Data Catalog"])

# --- Owners Endpoints ---
@router.get("/owners", response_model=List[OwnerResponse])
def get_owners(db: Session = Depends(get_db)):
    return db.query(Owner).all()

@router.post("/owners", response_model=OwnerResponse, status_code=status.HTTP_201_CREATED)
def create_owner(data: OwnerCreate, db: Session = Depends(get_db)):
    new_owner = Owner(**data.model_dump())
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)
    return new_owner

# --- Vehicles Endpoints ---
@router.get("/vehicles", response_model=List[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).all()

@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    new_vehicle = Vehicle(**data.model_dump())
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

# --- Materials Endpoints ---
@router.get("/materials", response_model=List[MaterialResponse])
def get_materials(db: Session = Depends(get_db)):
    return db.query(Material).all()

@router.post("/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_material(data: MaterialCreate, db: Session = Depends(get_db)):
    new_mat = Material(**data.model_dump())
    db.add(new_mat)
    db.commit()
    db.refresh(new_mat)
    return new_mat

# --- Labor Endpoints ---
@router.get("/labor", response_model=List[LaborResponse])
def get_labor(db: Session = Depends(get_db)):
    return db.query(Labor).all()

@router.post("/labor", response_model=LaborResponse, status_code=status.HTTP_201_CREATED)
def create_labor(data: LaborCreate, db: Session = Depends(get_db)):
    new_labor = Labor(**data.model_dump())
    db.add(new_labor)
    db.commit()
    db.refresh(new_labor)
    return new_labor

# --- Bundles Endpoints ---
@router.get("/bundles", response_model=List[BundleResponse])
def get_bundles(db: Session = Depends(get_db)):
    return db.query(Bundle).all()

@router.post("/bundles", response_model=BundleResponse, status_code=status.HTTP_201_CREATED)
def create_bundle(data: BundleCreate, db: Session = Depends(get_db)):
    new_bundle = Bundle(
        bundle_name=data.bundle_name,
        interval=data.interval,
        description=data.description,
        original_price=data.original_price,
        discounted_price=data.discounted_price
    )
    db.add(new_bundle)
    db.flush()

    for lid in data.labor_ids:
        link = BundleService(bundle_id=new_bundle.bundle_id, labor_id=lid)
        db.add(link)
    
    db.commit()
    db.refresh(new_bundle)
    return new_bundle
