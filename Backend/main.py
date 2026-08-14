from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
import schemas

DATABASE_URL = "sqlite:///./piveran_pms.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="PiVeRan PMS API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/job-orders", response_model=list[schemas.JobOrder])
def get_job_orders(db: Session = Depends(get_db)):
    """Fetch all active job orders with their relationships."""
    return db.query(models.JobOrder).all()

@app.get("/api/job-orders/{jo_id}", response_model=schemas.JobOrder)
def get_job_order(jo_id: str, db: Session = Depends(get_db)):
    """Fetch a specific job order."""
    jo = db.query(models.JobOrder).filter(models.JobOrder.id == jo_id).first()
    if not jo:
        raise HTTPException(status_code=404, detail="Job Order not found")
    return jo

@app.put("/api/inspection-items/{item_id}")
def update_inspection_item(item_id: int, payload: dict, db: Session = Depends(get_db)):
    """Update an inspection item's status and note."""
    item = db.query(models.InspectionItem).filter(models.InspectionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inspection Item not found")

    new_status = payload.get("status")
    if new_status:
        item.status = new_status
        db.commit()

        # Update or create the detail mapping for this status
        note = payload.get("note")
        if note is not None:
            detail = db.query(models.InspectionItemDetail).filter(
                models.InspectionItemDetail.inspection_item_id == item.id,
                models.InspectionItemDetail.status == new_status
            ).first()
            if detail:
                detail.note = note
            else:
                detail = models.InspectionItemDetail(
                    inspection_item_id=item.id,
                    status=new_status,
                    note=note
                )
                db.add(detail)
            db.commit()

    return {"message": "Updated successfully"}

@app.put("/api/job-orders/{jo_id}/status")
def update_jo_status(jo_id: str, payload: dict, db: Session = Depends(get_db)):
    jo = db.query(models.JobOrder).filter(models.JobOrder.id == jo_id).first()
    if not jo:
        raise HTTPException(status_code=404, detail="Job Order not found")
    
    if "status" in payload:
        jo.status = payload["status"]
    if "inspection_started" in payload:
        jo.inspection_started = payload["inspection_started"]
        
    db.commit()
    return {"message": "Job Order status updated"}

@app.get("/")
def read_root():
    return {"status": "PiVeRan PMS API Running"}
