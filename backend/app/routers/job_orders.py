from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from backend.app.database import get_db
from backend.app.models.job_order import JobOrder, ChecklistDetail, JobOrderStatus, InspectionStatus
from backend.app.models.master import Owner, Vehicle, Bundle, Labor
from backend.app.models.user import UserAccount
from backend.app.schemas.job_order import (
    JobOrderCreate, JobOrderResponse, InspectionItemResponse, DetailItem,
    OwnerResponseSimple, VehicleResponseSimple, MechanicResponse, JobOrderUpdate
)

router = APIRouter(prefix="/api/job-orders", tags=["Job Orders"])

def resolve_bundle_services(bundle_id: str, db: Session, resolved_ids: set = None) -> list:
    if resolved_ids is None:
        resolved_ids = set()
        
    bundle = db.query(Bundle).filter(Bundle.bundle_id == bundle_id).first()
    if not bundle:
        return []
        
    services = []
    # bundle.services is ordered by sequence
    for labor in bundle.services:
        if labor.labor_id.startswith("PKG-REF-"):
            parent_bundle_id = labor.labor_id.replace("PKG-REF-", "")
            if parent_bundle_id not in resolved_ids:
                resolved_ids.add(parent_bundle_id)
                parent_services = resolve_bundle_services(parent_bundle_id, db, resolved_ids)
                services.extend(parent_services)
        else:
            services.append(labor)
    return services

def format_datetime(dt: datetime) -> str:
    if not dt:
        return ""
    now = datetime.utcnow()
    if dt.date() == now.date():
        return f"Today, {dt.strftime('%I:%M %p')}"
    elif (now.date() - dt.date()).days == 1:
        return f"Yesterday, {dt.strftime('%I:%M %p')}"
    else:
        return dt.strftime("%b %d, %Y, %I:%M %p")

def map_job_order_to_response(jo: JobOrder) -> dict:
    inspection_items = []
    for detail in jo.checklist_items:
        details_list = [
            DetailItem(
                status=detail.status.value,
                note=detail.diagnostic_notes or "",
                photo_urls=detail.visual_proof or "[]"
            )
        ]
        inspection_items.append(
            InspectionItemResponse(
                id=detail.cd_id,
                name=detail.labor.labor_name if detail.labor else "Unknown Task",
                status=detail.status.value,
                details=details_list
            )
        )

    # Resolve vehicle photo url
    vehicle_photo = jo.vehicle.photo_url if jo.vehicle else None

    return {
        "id": jo.jo_id,
        "owner": {
            "owner_id": jo.owner.owner_id if jo.owner else "",
            "name": jo.owner.name if jo.owner else "",
            "phone": jo.owner.contact_number if jo.owner else "",
            "fb_handle": jo.owner.facebook if jo.owner else ""
        },
        "vehicle": {
            "vehicle_id": jo.vehicle.vehicle_id if jo.vehicle else "",
            "model": f"{jo.vehicle.make} {jo.vehicle.model}" if jo.vehicle else "",
            "plate_number": jo.vehicle.plate_number if jo.vehicle else "",
            "engine_type": "Gasoline",  # Default placeholder
            "photo_url": vehicle_photo
        },
        "service_type": jo.bundle.bundle_name if jo.bundle else "Custom Service",
        "odometer": f"{jo.odometer:,} KM",
        "status": jo.status.value,
        "created_at": format_datetime(jo.created_at),
        "vehicle_photo_url": vehicle_photo,
        "mechanics": [
            {"user_id": m.user_id, "name": m.name} for m in jo.mechanics
        ] if jo.mechanics else [],
        "inspection_items": inspection_items,
        "estimate_items": [],
        "discount": jo.discount or 0.0,
        "estimate_comment": jo.estimate_comment or "",
        "inspection_started": jo.inspection_started or False,
        "mechanic_findings": jo.mechanic_findings or "",
        "mechanic_marked_ready": jo.mechanic_marked_ready or False
    }

@router.get("", response_model=List[JobOrderResponse])
def get_job_orders(db: Session = Depends(get_db)):
    job_orders = db.query(JobOrder).all()
    return [map_job_order_to_response(jo) for jo in job_orders]

@router.get("/{jo_id}", response_model=JobOrderResponse)
def get_job_order(jo_id: str, db: Session = Depends(get_db)):
    jo = db.query(JobOrder).filter(JobOrder.jo_id == jo_id).first()
    if not jo:
        raise HTTPException(status_code=404, detail="Job Order not found")
    return map_job_order_to_response(jo)

@router.post("", response_model=JobOrderResponse, status_code=status.HTTP_201_CREATED)
def create_job_order(data: JobOrderCreate, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.owner_id == data.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
        
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    bundle = db.query(Bundle).filter(Bundle.bundle_id == data.bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
        
    new_jo = JobOrder(
        owner_id=data.owner_id,
        vehicle_id=data.vehicle_id,
        bundle_id=data.bundle_id,
        odometer=data.odometer,
        status=JobOrderStatus.NEW
    )
    
    if data.mechanic_names:
        mechanics = db.query(UserAccount).filter(UserAccount.name.in_(data.mechanic_names)).all()
        new_jo.mechanics = mechanics
        
    db.add(new_jo)
    db.flush()
    
    resolved_labors = resolve_bundle_services(data.bundle_id, db)
    
    for labor in resolved_labors:
        detail = ChecklistDetail(
            jo_id=new_jo.jo_id,
            labor_id=labor.labor_id,
            status=InspectionStatus.PENDING
        )
        db.add(detail)
        
    db.commit()
    db.refresh(new_jo)
    return map_job_order_to_response(new_jo)

@router.put("/{jo_id}/status", response_model=JobOrderResponse)
def update_job_order_status(jo_id: str, payload: dict, db: Session = Depends(get_db)):
    jo = db.query(JobOrder).filter(JobOrder.jo_id == jo_id).first()
    if not jo:
        raise HTTPException(status_code=404, detail="Job Order not found")
        
    if "status" in payload:
        try:
            jo.status = JobOrderStatus(payload["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status value")
            
    if "inspection_started" in payload:
        jo.inspection_started = bool(payload["inspection_started"])
        
    db.commit()
    db.refresh(jo)
    return map_job_order_to_response(jo)

@router.put("/{jo_id}", response_model=JobOrderResponse)
def update_job_order(jo_id: str, data: JobOrderUpdate, db: Session = Depends(get_db)):
    jo = db.query(JobOrder).filter(JobOrder.jo_id == jo_id).first()
    if not jo:
        raise HTTPException(status_code=404, detail="Job Order not found")
        
    if jo.status != JobOrderStatus.NEW:
        raise HTTPException(status_code=400, detail="Cannot edit a Job Order that is no longer in New status")
        
    if data.odometer is not None:
        jo.odometer = data.odometer
        
    if data.mechanic_names is not None:
        mechanics = db.query(UserAccount).filter(UserAccount.name.in_(data.mechanic_names)).all()
        jo.mechanics = mechanics
        
    if data.bundle_id is not None and data.bundle_id != jo.bundle_id:
        bundle = db.query(Bundle).filter(Bundle.bundle_id == data.bundle_id).first()
        if not bundle:
            raise HTTPException(status_code=404, detail="Bundle not found")
        jo.bundle_id = data.bundle_id
        
        # Re-resolve checklist items
        db.query(ChecklistDetail).filter(ChecklistDetail.jo_id == jo_id).delete()
        resolved_labors = resolve_bundle_services(data.bundle_id, db)
        for labor in resolved_labors:
            detail = ChecklistDetail(
                jo_id=jo_id,
                labor_id=labor.labor_id,
                status=InspectionStatus.PENDING
            )
            db.add(detail)
            
    db.commit()
    db.refresh(jo)
    return map_job_order_to_response(jo)

@router.delete("/{jo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_order(jo_id: str, db: Session = Depends(get_db)):
    jo = db.query(JobOrder).filter(JobOrder.jo_id == jo_id).first()
    if not jo:
        raise HTTPException(status_code=404, detail="Job Order not found")
        
    if jo.status != JobOrderStatus.NEW:
        raise HTTPException(status_code=400, detail="Cannot delete a Job Order that is no longer in New status")
        
    jo.mechanics = []
    db.delete(jo)
    db.commit()
    return None
