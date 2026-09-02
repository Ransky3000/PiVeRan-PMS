from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List
from backend.app.database import get_db
from backend.app.models.master import Owner, Vehicle, Material, Labor, Bundle, BundleService
from backend.app.schemas.master import (
    OwnerCreate, OwnerResponse, OwnerUpdate,
    VehicleCreate, VehicleResponse, VehicleUpdate,
    MaterialCreate, MaterialResponse, MaterialUpdate,
    LaborCreate, LaborResponse, LaborUpdate,
    BundleCreate, BundleResponse, BundleUpdate
)

router = APIRouter(prefix="/api/master", tags=["Master Data Catalog"])

# --- Owners Endpoints ---
@router.get("/owners", response_model=List[OwnerResponse])
def get_owners(db: Session = Depends(get_db)):
    return db.query(Owner).options(selectinload(Owner.vehicles)).all()

@router.post("/owners", response_model=OwnerResponse, status_code=status.HTTP_201_CREATED)
def create_owner(data: OwnerCreate, db: Session = Depends(get_db)):
    owner_data = data.model_dump()
    vehicle_ids = owner_data.pop("vehicle_ids", [])
    new_owner = Owner(**owner_data)
    if vehicle_ids:
        vehicles = db.query(Vehicle).filter(Vehicle.vehicle_id.in_(vehicle_ids)).all()
        new_owner.vehicles = vehicles
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)
    return new_owner

@router.put("/owners/{owner_id}", response_model=OwnerResponse)
def update_owner(owner_id: str, data: OwnerUpdate, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.owner_id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    update_data = data.model_dump(exclude_unset=True)
    vehicle_ids = update_data.pop("vehicle_ids", None)
    for key, value in update_data.items():
        setattr(owner, key, value)
    if vehicle_ids is not None:
        vehicles = db.query(Vehicle).filter(Vehicle.vehicle_id.in_(vehicle_ids)).all()
        owner.vehicles = vehicles
    db.commit()
    db.refresh(owner)
    return owner

# --- Vehicles Endpoints ---
@router.get("/vehicles", response_model=List[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).options(selectinload(Vehicle.owners)).all()

@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    vehicle_data = data.model_dump()
    owner_id = vehicle_data.pop("owner_id", None)
    owner_ids = vehicle_data.pop("owner_ids", [])
    if owner_id and owner_id not in owner_ids:
        owner_ids.append(owner_id)

    new_vehicle = Vehicle(**vehicle_data)
    if owner_ids:
        owners = db.query(Owner).filter(Owner.owner_id.in_(owner_ids)).all()
        new_vehicle.owners = owners

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: str, data: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return None

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

@router.put("/materials/{materials_id}", response_model=MaterialResponse)
def update_material(materials_id: str, data: MaterialUpdate, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.materials_id == materials_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(material, key, value)
    db.commit()
    db.refresh(material)
    return material

@router.delete("/materials/{materials_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(materials_id: str, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.materials_id == materials_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    db.delete(material)
    db.commit()
    return None

# --- Labor Endpoints ---
@router.get("/labor", response_model=List[LaborResponse])
def get_labor(db: Session = Depends(get_db)):
    return db.query(Labor).options(selectinload(Labor.materials)).all()

@router.post("/labor", response_model=LaborResponse, status_code=status.HTTP_201_CREATED)
def create_labor(data: LaborCreate, db: Session = Depends(get_db)):
    new_labor = Labor(**data.model_dump())
    db.add(new_labor)
    db.commit()
    db.refresh(new_labor)
    return new_labor

@router.put("/labor/{labor_id}", response_model=LaborResponse)
def update_labor(labor_id: str, data: LaborUpdate, db: Session = Depends(get_db)):
    labor = db.query(Labor).filter(Labor.labor_id == labor_id).first()
    if not labor:
        raise HTTPException(status_code=404, detail="Labor not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(labor, key, value)
    db.commit()
    db.refresh(labor)
    return labor

@router.delete("/labor/{labor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_labor(labor_id: str, db: Session = Depends(get_db)):
    labor = db.query(Labor).filter(Labor.labor_id == labor_id).first()
    if not labor:
        raise HTTPException(status_code=404, detail="Labor not found")
    db.delete(labor)
    db.commit()
    return None

# --- Bundles Endpoints ---
@router.get("/bundles", response_model=List[BundleResponse])
def get_bundles(db: Session = Depends(get_db)):
    return db.query(Bundle).options(selectinload(Bundle.services).selectinload(Labor.materials)).all()

@router.post("/bundles", response_model=BundleResponse, status_code=status.HTTP_201_CREATED)
def create_bundle(data: BundleCreate, db: Session = Depends(get_db)):
    km = data.interval_km if data.interval_km is not None else 10000
    months = data.interval_months if data.interval_months is not None else 6
    interval_str = data.interval or f"Every {km:,} KM or {months} Months"

    new_bundle = Bundle(
        bundle_name=data.bundle_name,
        interval_km=km,
        interval_months=months,
        interval=interval_str,
        description=data.description,
        original_price=data.original_price,
        discounted_price=data.discounted_price
    )
    db.add(new_bundle)
    db.flush()

    # Create virtual labor item representing "Everything included in..."
    virtual_labor = Labor(
        labor_id=f"PKG-REF-{new_bundle.bundle_id}",
        labor_name=f"Everything included in {new_bundle.bundle_name}",
        price=new_bundle.discounted_price,
        category="📦 EXISTING PMS PACKAGES",
        description=new_bundle.description or ""
    )
    db.add(virtual_labor)

    for idx, lid in enumerate(data.labor_ids):
        link = BundleService(bundle_id=new_bundle.bundle_id, labor_id=lid, sequence=idx)
        db.add(link)
    
    db.commit()
    db.refresh(new_bundle)
    return new_bundle

@router.put("/bundles/{bundle_id}", response_model=BundleResponse)
def update_bundle(bundle_id: str, data: BundleUpdate, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.bundle_id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    update_data = data.model_dump(exclude_unset=True)
    labor_ids = update_data.pop("labor_ids", None)
    for key, value in update_data.items():
        setattr(bundle, key, value)
    
    if labor_ids is not None:
        db.query(BundleService).filter(BundleService.bundle_id == bundle_id).delete()
        for idx, lid in enumerate(labor_ids):
            db.add(BundleService(bundle_id=bundle_id, labor_id=lid, sequence=idx))

    # Update corresponding virtual labor item
    virtual_labor = db.query(Labor).filter(Labor.labor_id == f"PKG-REF-{bundle_id}").first()
    if virtual_labor:
        virtual_labor.labor_name = f"Everything included in {bundle.bundle_name}"
        virtual_labor.price = bundle.discounted_price
        virtual_labor.description = bundle.description or ""
    else:
        virtual_labor = Labor(
            labor_id=f"PKG-REF-{bundle_id}",
            labor_name=f"Everything included in {bundle.bundle_name}",
            price=bundle.discounted_price,
            category="📦 EXISTING PMS PACKAGES",
            description=bundle.description or ""
        )
        db.add(virtual_labor)

    db.commit()
    db.refresh(bundle)
    return bundle

@router.delete("/bundles/{bundle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bundle(bundle_id: str, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.bundle_id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    db.query(BundleService).filter(BundleService.bundle_id == bundle_id).delete()
    db.query(Labor).filter(Labor.labor_id == f"PKG-REF-{bundle_id}").delete()
    db.delete(bundle)
    db.commit()
    return None
