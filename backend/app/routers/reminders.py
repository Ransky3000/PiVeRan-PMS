from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from backend.app.database import get_db
from backend.app.models.reminder import Reminder, ReminderStatus
from backend.app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from backend.app.websocket_manager import ws_manager

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

@router.get("", response_model=List[ReminderResponse])
def get_reminders(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Reminder)
    reminders = query.order_by(Reminder.target_date.asc()).all()
    
    today = datetime.utcnow()
    due_threshold = today + timedelta(days=30)
    updated = False

    # Dynamic status update based on target_date
    for r in reminders:
        if r.status != ReminderStatus.DONE:
            if r.target_date.date() < today.date():
                if r.status != ReminderStatus.OVERDUE:
                    r.status = ReminderStatus.OVERDUE
                    updated = True
            elif r.target_date.date() <= due_threshold.date():
                if r.status != ReminderStatus.DUE:
                    r.status = ReminderStatus.DUE
                    updated = True
            else:
                if r.status != ReminderStatus.PENDING:
                    r.status = ReminderStatus.PENDING
                    updated = True

    if updated:
        db.commit()

    if status_filter and status_filter.upper() != "ALL":
        reminders = [r for r in reminders if r.status.value.upper() == status_filter.upper()]

    return reminders

@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(data: ReminderCreate, db: Session = Depends(get_db)):
    new_reminder = Reminder(
        jo_id=data.jo_id,
        vehicle_id=data.vehicle_id,
        owner_id=data.owner_id,
        start_date=data.start_date or datetime.utcnow(),
        target_date=data.target_date,
        start_odometer=data.start_odometer or 0,
        target_odometer=data.target_odometer,
        status=data.status or ReminderStatus.PENDING,
        notes=data.notes
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    await ws_manager.broadcast({"type": "REMINDER_UPDATED", "reminder_id": new_reminder.reminder_id})
    return new_reminder

@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(reminder_id: str, data: ReminderUpdate, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.reminder_id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    if data.target_date is not None:
        reminder.target_date = data.target_date
    if data.target_odometer is not None:
        reminder.target_odometer = data.target_odometer
    if data.status is not None:
        reminder.status = data.status
    if data.notes is not None:
        reminder.notes = data.notes

    db.commit()
    db.refresh(reminder)
    await ws_manager.broadcast({"type": "REMINDER_UPDATED", "reminder_id": reminder.reminder_id})
    return reminder

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(reminder_id: str, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.reminder_id == reminder_id).first()
    if reminder:
        db.delete(reminder)
        db.commit()
        await ws_manager.broadcast({"type": "REMINDER_UPDATED", "reminder_id": reminder_id})
    return None
