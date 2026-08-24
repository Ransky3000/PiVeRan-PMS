from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base, SessionLocal
from backend.app.routers import auth_router, users_router, master_router, job_orders_router, reminders_router
from backend.app.models import UserAccount, UserRole, AccountStatus, Labor, Bundle, BundleService
from backend.app.websocket_manager import ws_manager
import bcrypt

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PiVeRan-PMS API",
    description="Backend API service for PiVeRan Preventative Maintenance System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/job-orders")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(master_router)
app.include_router(job_orders_router)
app.include_router(reminders_router)

@app.on_event("startup")
def seed_initial_data():
    db = SessionLocal()
    try:
        # Seed Admin if not present, otherwise update details
        owner = db.query(UserAccount).filter(UserAccount.email == "admin@reyauto.com").first()
        if not owner:
            db.add(UserAccount(
                email="admin@reyauto.com",
                password_hash=bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode("utf-8"),
                name="Bryan Keith",
                phone_number="09170000000",
                role=UserRole.ADMIN,
                status=AccountStatus.APPROVED
            ))
            db.commit()
        else:
            owner.name = "Bryan Keith"
            owner.role = UserRole.ADMIN
            db.commit()

        # Seed sample Labor items if empty
        if db.query(Labor).count() == 0:
            labors = [
                Labor(labor_name="Change Oil", price=650.0, category="PMS", description="Drain old engine oil, replace sealing washer, and refill fresh engine oil."),
                Labor(labor_name="Replace Oil Filter", price=250.0, category="PMS", description="Spin-off old oil filter and install new OEM oil filter element."),
                Labor(labor_name="Replace Air Filter", price=350.0, category="PMS", description="Inspect air intake box and replace engine air filter element."),
                Labor(labor_name="Replace Fuel Filter", price=550.0, category="PMS", description="Replace inline fuel filter to prevent injector clogging."),
                Labor(labor_name="Replace Sparkplug", price=450.0, category="PMS", description="Inspect spark plug electrode gap and replace set of spark plugs."),
                Labor(labor_name="Replace Cabin Filter", price=350.0, category="PMS", description="Replace interior AC cabin pollen hygiene filter."),
                Labor(labor_name="Full ECU Scanning", price=800.0, category="PMS", description="Diagnostic scan of engine control unit sensors and clear DTC codes."),
            ]
            db.add_all(labors)
            db.commit()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "PiVeRan-PMS Backend Service is Running", "docs_url": "/docs"}
