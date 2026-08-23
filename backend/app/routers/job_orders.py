from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import json
from backend.app.database import get_db
from backend.app.models.job_order import JobOrder, ChecklistDetail, JobOrderStatus, InspectionStatus, Cart, CartDecision
from backend.app.models.master import Owner, Vehicle, Bundle, Labor, Material
from backend.app.models.user import UserAccount
from backend.app.schemas.job_order import (
    JobOrderCreate, JobOrderResponse, InspectionItemResponse, DetailItem,
    OwnerResponseSimple, VehicleResponseSimple, MechanicResponse, JobOrderUpdate
)
from backend.app.websocket_manager import ws_manager

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
        status_notes = {}
        if detail.diagnostic_notes:
            try:
                status_notes = json.loads(detail.diagnostic_notes)
                if not isinstance(status_notes, dict):
                    status_notes = {detail.status.value: detail.diagnostic_notes}
            except Exception:
                status_notes = {detail.status.value: detail.diagnostic_notes}

        status_photos = {}
        if detail.visual_proof:
            try:
                status_photos = json.loads(detail.visual_proof)
                if not isinstance(status_photos, dict):
                    status_photos = {detail.status.value: [detail.visual_proof]}
            except Exception:
                status_photos = {detail.status.value: [detail.visual_proof]}

        required_materials = []
        for cart in (detail.cart_items or []):
            mat_name = cart.material.name if cart.material else "Unknown Material"
            decision_val = cart.decision.value if hasattr(cart.decision, 'value') else (cart.decision or "No")
            required_materials.append({
                "cart_id": cart.cart_id,
                "material_id": cart.materials_id,
                "name": mat_name,
                "price": cart.price,
                "qty": cart.quantity,
                "decision": decision_val
            })

        current_note = status_notes.get(detail.status.value) or status_notes.get(detail.status.value.upper()) or ""
        current_photos = status_photos.get(detail.status.value) or status_photos.get(detail.status.value.upper()) or []
        photo_urls_str = json.dumps(current_photos) if isinstance(current_photos, list) else "[]"

        details_list = [
            DetailItem(
                status=detail.status.value,
                note=current_note,
                photo_urls=photo_urls_str
            )
        ]
        inspection_items.append(
            InspectionItemResponse(
                id=detail.cd_id,
                name=detail.labor.labor_name if detail.labor else "Unknown Task",
                status=detail.status.value,
                details=details_list,
                statusNotes=status_notes,
                statusPhotos=status_photos,
                requiredMaterials=required_materials
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
            "photo_url": vehicle_photo
        },
        "service_type": jo.bundle.bundle_name if jo.bundle else "Custom Service",
        "service_description": (jo.bundle.interval or jo.bundle.description) if jo.bundle else "",
        "service_fee": jo.bundle.discounted_price if jo.bundle else 0.0,
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
        "mechanic_findings": jo.mechanic_findings or ""
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
async def create_job_order(data: JobOrderCreate, db: Session = Depends(get_db)):
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
    await ws_manager.broadcast({"type": "JOB_ORDER_UPDATED", "jo_id": new_jo.jo_id})
    return map_job_order_to_response(new_jo)

@router.put("/{jo_id}/status", response_model=JobOrderResponse)
async def update_job_order_status(jo_id: str, payload: dict, db: Session = Depends(get_db)):
    jo = db.query(JobOrder).filter(JobOrder.jo_id == jo_id).first()
    if not jo:
        raise HTTPException(status_code=404, detail="Job Order not found")
        
    if "status" in payload:
        try:
            jo.status = JobOrderStatus(payload["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status value")
            
    db.commit()
    db.refresh(jo)
    await ws_manager.broadcast({"type": "JOB_ORDER_UPDATED", "jo_id": jo_id})
    return map_job_order_to_response(jo)

@router.put("/{jo_id}", response_model=JobOrderResponse)
async def update_job_order(jo_id: str, data: JobOrderUpdate, db: Session = Depends(get_db)):
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
    await ws_manager.broadcast({"type": "JOB_ORDER_UPDATED", "jo_id": jo_id})
    return map_job_order_to_response(jo)

@router.put("/checklist-items/{cd_id}")
async def update_checklist_item(cd_id: str, payload: dict, db: Session = Depends(get_db)):
    detail = db.query(ChecklistDetail).filter(ChecklistDetail.cd_id == cd_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Checklist item not found")
        
    if "status" in payload:
        raw_status = payload["status"].strip().title()
        try:
            detail.status = InspectionStatus(raw_status)
        except ValueError:
            pass

    if "statusNotes" in payload:
        detail.diagnostic_notes = json.dumps(payload["statusNotes"])
    elif "diagnostic_notes" in payload or "note" in payload:
        note_val = payload.get("diagnostic_notes") or payload.get("note")
        current_notes = {}
        if detail.diagnostic_notes:
            try:
                current_notes = json.loads(detail.diagnostic_notes)
                if not isinstance(current_notes, dict):
                    current_notes = {}
            except Exception:
                current_notes = {}
        current_notes[detail.status.value] = note_val
        detail.diagnostic_notes = json.dumps(current_notes)

    if "statusPhotos" in payload:
        detail.visual_proof = json.dumps(payload["statusPhotos"])
    elif "visual_proof" in payload or "photoUrl" in payload:
        photo_val = payload.get("visual_proof") or payload.get("photoUrl")
        current_photos = {}
        if detail.visual_proof:
            try:
                current_photos = json.loads(detail.visual_proof)
                if not isinstance(current_photos, dict):
                    current_photos = {}
            except Exception:
                current_photos = {}
        if photo_val:
            current_photos[detail.status.value] = [photo_val] if isinstance(photo_val, str) else photo_val
        detail.visual_proof = json.dumps(current_photos)
        
    db.commit()
    await ws_manager.broadcast({"type": "JOB_ORDER_UPDATED", "jo_id": detail.jo_id})
    return {"message": "Checklist item updated successfully"}

@router.post("/checklist-items/{cd_id}/cart")
async def add_cart_item(cd_id: str, payload: dict, db: Session = Depends(get_db)):
    detail = db.query(ChecklistDetail).filter(ChecklistDetail.cd_id == cd_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    material_id = payload.get("material_id")
    quantity = payload.get("quantity", 1)

    material = db.query(Material).filter(Material.materials_id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    existing = db.query(Cart).filter(Cart.cd_id == cd_id, Cart.materials_id == material_id).first()
    if existing:
        existing.quantity += quantity
    else:
        new_cart = Cart(
            cd_id=cd_id,
            materials_id=material_id,
            quantity=quantity,
            price=material.price,
            decision=CartDecision.NO
        )
        db.add(new_cart)

    db.commit()
    await ws_manager.broadcast({"type": "JOB_ORDER_UPDATED", "jo_id": detail.jo_id})
    return {"message": "Material added to cart"}

@router.put("/checklist-items/{cd_id}/cart/{cart_id}/decision")
async def update_cart_decision(cd_id: str, cart_id: str, payload: dict, db: Session = Depends(get_db)):
    detail = db.query(ChecklistDetail).filter(ChecklistDetail.cd_id == cd_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    cart_item = db.query(Cart).filter(Cart.cart_id == cart_id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    raw_decision = payload.get("decision", "No").strip().title()
    try:
        cart_item.decision = CartDecision(raw_decision)
    except ValueError:
        cart_item.decision = CartDecision.NO

    db.commit()
    await ws_manager.broadcast({"type": "JOB_ORDER_UPDATED", "jo_id": detail.jo_id})
    return {"message": "Cart decision updated successfully"}

@router.delete("/checklist-items/{cd_id}/cart/{cart_id}")
async def remove_cart_item(cd_id: str, cart_id: str, db: Session = Depends(get_db)):
    detail = db.query(ChecklistDetail).filter(ChecklistDetail.cd_id == cd_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    cart_item = db.query(Cart).filter(Cart.cart_id == cart_id).first()
    if cart_item:
        db.delete(cart_item)
        db.commit()

    await ws_manager.broadcast({"type": "JOB_ORDER_UPDATED", "jo_id": detail.jo_id})
    return {"message": "Material removed from cart"}

@router.delete("/{jo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_order(jo_id: str, db: Session = Depends(get_db)):
    jo = db.query(JobOrder).filter(JobOrder.jo_id == jo_id).first()
    if not jo:
        raise HTTPException(status_code=404, detail="Job Order not found")
        
    if jo.status != JobOrderStatus.NEW:
        raise HTTPException(status_code=400, detail="Cannot delete a Job Order that is no longer in New status")
        
    jo.mechanics = []
    db.delete(jo)
    db.commit()
    await ws_manager.broadcast({"type": "JOB_ORDER_UPDATED", "jo_id": jo_id})
    return None
