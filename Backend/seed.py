import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Owner, Vehicle, Mechanic, JobOrder, JobOrderMechanic, InspectionItem, InspectionItemDetail, EstimateItem, ServiceCatalog, PackageBundle, PackageService

DATABASE_URL = "sqlite:///./piveran_pms.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_db():
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    print("Seeding Mechanics...")
    mechanics = [
        Mechanic(id=1, name="Mark Rey", bay="Bay 1"),
        Mechanic(id=2, name="John Uy", bay="Bay 2"),
        Mechanic(id=3, name="Rodel Santos", bay="Bay 3"),
        Mechanic(id=4, name="Bernard Caermare", bay="Bay 4"),
        Mechanic(id=5, name="Rey Duran", bay="Bay 5"),
        Mechanic(id=6, name="Roderick Omisol", bay="Bay 6"),
    ]
    db.add_all(mechanics)
    db.commit()

    mechanic_map = {m.name: m.id for m in mechanics}

    print("Seeding Job Orders and associated data...")
    # Map mock data from TS
    mock_data = [
        {
            "id": "JO-1041",
            "ownerName": "Maria Santos",
            "ownerPhone": "0918-444-5678",
            "ownerFb": "@mariasantos",
            "vehicleModel": "Mitsubishi Montero 2020",
            "plateNumber": "XYZ 8888",
            "engineType": "Diesel",
            "odometer": "62,400 KM",
            "serviceType": "Major / Full PMS",
            "inchargeMechanics": ["Mark Rey", "John Uy"],
            "status": "AWAITING_ESTIMATE",
            "createdAt": "Today, 11:30 AM",
            "vehiclePhotoUrl": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
            "inspectionItems": [
                {"name": "Air Filter", "status": "ISSUE", "mechanicNote": "Air filter clogged with dirt, needs replacement"},
                {"name": "Replace spark plugs", "status": "ISSUE", "mechanicNote": "Worn out, misfiring on cylinder 3"},
                {"name": "Replace brake fluid", "status": "MONITOR", "mechanicNote": "Fluid dark, contaminated"},
                {"name": "Replace transmission fluid (manual/AT/CVT)", "status": "ISSUE", "mechanicNote": "Burnt smell, needs full flush"},
                {"name": "Replace coolant (radiator flush)", "status": "GOOD"},
                {"name": "Replace fuel filter (if applicable)", "status": "GOOD"},
                {"name": "Check timing belt or chain condition", "status": "MONITOR", "mechanicNote": "Minor fraying, replace within 10k km"},
                {"name": "Clean EGR valve/intake manifold (diesel cars)", "status": "ISSUE", "mechanicNote": "Heavy carbon buildup"},
                {"name": "Deep diagnostic scan", "status": "GOOD"},
                {"name": "Test battery load capacity", "status": "GOOD"},
                {"name": "Full vehicle road test", "status": "GOOD"}
            ],
            "mechanicFindings": "Brake pads worn at 20%, recommend replacement. Minor oil leak near valve cover gasket. Spark plugs misfiring on cylinder 3. Transmission fluid burnt — full flush recommended.",
            "estimateItems": [
                {"id": "E1", "description": "Spark Plugs (NGK Iridium)", "qty": 4, "unitPrice": 350, "customerApproved": True},
                {"id": "E2", "description": "Brake Fluid (DOT4 1L)", "qty": 1, "unitPrice": 450, "customerApproved": True},
                {"id": "E3", "description": "Transmission Fluid (ATF)", "qty": 3, "unitPrice": 800, "customerApproved": None},
                {"id": "E4", "description": "EGR Valve Cleaning Kit", "qty": 1, "unitPrice": 1200, "customerApproved": None},
            ],
            "discount": 500
        },
        {
            "id": "JO-1042",
            "ownerName": "Juan Dela Cruz",
            "ownerPhone": "0917-555-1234",
            "ownerFb": "@juandelacruz",
            "vehicleModel": "Toyota Vios 2018",
            "plateNumber": "ABC 1234",
            "engineType": "Gasoline",
            "odometer": "45,210 KM",
            "serviceType": "Basic PMS",
            "inchargeMechanics": ["Rodel Santos"],
            "status": "FOR_INSPECTION",
            "createdAt": "Today, 10:15 AM",
            "vehiclePhotoUrl": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
            "inspectionItems": [
                {"name": "Change engine oil & filter", "status": "PENDING"},
                {"name": "Inspect air filter & cabin filter", "status": "PENDING"},
                {"name": "Check brake pads & fluid levels", "status": "PENDING"},
                {"name": "Tire pressure & tread inspection", "status": "PENDING"},
                {"name": "Battery load test & terminal cleaning", "status": "PENDING"}
            ]
        },
        {
            "id": "JO-1045",
            "ownerName": "Cedrick Tan",
            "ownerPhone": "0917-777-8888",
            "ownerFb": "@cedricktan",
            "vehicleModel": "Nissan Navara 2022",
            "plateNumber": "NBD 4421",
            "engineType": "Diesel",
            "odometer": "28,600 KM",
            "serviceType": "Major / Full PMS",
            "inchargeMechanics": ["Bernard Caermare"],
            "status": "FOR_INSPECTION",
            "createdAt": "Today, 8:30 AM",
            "vehiclePhotoUrl": "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80",
            "inspectionItems": [
                {"name": "Includes everything from Basic and Intermediate Services", "status": "PENDING"},
                {"name": "Replace spark plugs", "status": "PENDING"},
                {"name": "Replace brake fluid", "status": "PENDING"},
                {"name": "Replace transmission fluid (manual/AT/CVT)", "status": "PENDING"},
                {"name": "Replace coolant (radiator flush)", "status": "PENDING"}
            ]
        },
        {
            "id": "JO-1038",
            "ownerName": "Carlos Reyes",
            "ownerPhone": "0920-333-9999",
            "ownerFb": "@carlosreyes",
            "vehicleModel": "Honda Civic 2019",
            "plateNumber": "NMO 5678",
            "engineType": "Gasoline",
            "odometer": "54,200 KM",
            "serviceType": "Basic PMS",
            "inchargeMechanics": ["Mark Rey", "Rey Duran"],
            "status": "READY_FOR_PICKUP",
            "createdAt": "Today, 9:15 AM",
            "vehiclePhotoUrl": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
            "inspectionItems": [
                {"name": "Change engine oil & filter", "status": "GOOD"},
                {"name": "Inspect air filter & cabin filter", "status": "GOOD"},
                {"name": "Check brake pads & fluid levels", "status": "GOOD"},
                {"name": "Tire pressure & tread inspection", "status": "GOOD"},
                {"name": "Battery load test & terminal cleaning", "status": "GOOD"}
            ],
            "mechanicFindings": "All inspection items passed. Engine running smooth, brake pads at 85%.",
            "estimateItems": [
                {"id": "E101", "description": "Engine Oil & Filter Change", "qty": 1, "unitPrice": 1800, "customerApproved": True},
            ]
        },
        {
            "id": "JO-1037",
            "ownerName": "Ana Lim",
            "ownerPhone": "0917-111-2222",
            "ownerFb": "@analim",
            "vehicleModel": "Ford Ranger 2021",
            "plateNumber": "RNG 9988",
            "engineType": "Diesel",
            "odometer": "38,500 KM",
            "serviceType": "Change Oil & Brake Check",
            "inchargeMechanics": ["John Uy"],
            "status": "READY_FOR_PICKUP",
            "createdAt": "Yesterday, 2:45 PM",
            "vehiclePhotoUrl": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80",
            "inspectionItems": [
                {"name": "Change engine oil & filter", "status": "GOOD"},
                {"name": "Inspect air filter & cabin filter", "status": "GOOD"},
                {"name": "Check brake pads & fluid levels", "status": "GOOD"}
            ],
            "mechanicFindings": "Oil and filter replaced. Brake fluid level topped up.",
            "estimateItems": [
                {"id": "E201", "description": "Fully Synthetic Diesel Oil (7L)", "qty": 7, "unitPrice": 450, "customerApproved": True},
                {"id": "E202", "description": "Oil Filter Assembly", "qty": 1, "unitPrice": 650, "customerApproved": True},
            ]
        },
        {
            "id": "JO-1036",
            "ownerName": "Bong Go",
            "ownerPhone": "0919-888-7777",
            "ownerFb": "@bonggo",
            "vehicleModel": "Toyota Fortuner 2021",
            "plateNumber": "NKN 9999",
            "engineType": "Diesel",
            "odometer": "68,400 KM",
            "serviceType": "Heavy PMS Refresh",
            "inchargeMechanics": ["Bernard Caermare", "Roderick Omisol"],
            "status": "COMPLETED",
            "createdAt": "Yesterday, 10:00 AM",
            "vehiclePhotoUrl": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
            "inspectionItems": [
                {"name": "Complete engine overhaul inspection", "status": "GOOD"},
                {"name": "Suspension & underchassis bushing overhaul", "status": "GOOD"},
                {"name": "Aircon system deep clean & freon recharge", "status": "GOOD"}
            ],
            "mechanicFindings": "Heavy PMS completed successfully. All suspension bushings replaced and aircon servicing done.",
            "estimateItems": [
                {"id": "E301", "description": "Heavy PMS Overhaul Package", "qty": 1, "unitPrice": 12500, "customerApproved": True},
            ]
        },
        {
            "id": "JO-1035",
            "ownerName": "Vicente Sotto",
            "ownerPhone": "0919-222-3333",
            "ownerFb": "@vicesotto",
            "vehicleModel": "Toyota Wigo 2021",
            "plateNumber": "NGA 5521",
            "engineType": "Gasoline",
            "odometer": "22,100 KM",
            "serviceType": "Basic PMS",
            "inchargeMechanics": ["Rodel Santos"],
            "status": "COMPLETED",
            "createdAt": "2 days ago",
            "vehiclePhotoUrl": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
            "inspectionItems": [
                {"name": "Change engine oil & filter", "status": "GOOD"},
                {"name": "Inspect air filter & cabin filter", "status": "GOOD"},
                {"name": "Check brake pads & fluid levels", "status": "GOOD"}
            ],
            "mechanicFindings": "Basic PMS completed. Vehicle picked up by owner.",
            "estimateItems": [
                {"id": "E401", "description": "Basic PMS Package", "qty": 1, "unitPrice": 3850, "customerApproved": True}
            ]
        }
    ]

    owner_count = 1
    vehicle_count = 1

    for jo_data in mock_data:
        # 1. Create or Find Owner (Using phone as unique)
        owner = db.query(Owner).filter(Owner.phone == jo_data["ownerPhone"]).first()
        if not owner:
            owner = Owner(
                id=f"OWN-{owner_count:03d}",
                name=jo_data["ownerName"],
                phone=jo_data["ownerPhone"],
                fb_handle=jo_data.get("ownerFb")
            )
            db.add(owner)
            db.commit()
            owner_count += 1
        
        # 2. Create or Find Vehicle
        vehicle = db.query(Vehicle).filter(Vehicle.plate_number == jo_data["plateNumber"]).first()
        if not vehicle:
            vehicle = Vehicle(
                id=f"VEH-{vehicle_count:03d}",
                owner_id=owner.id,
                plate_number=jo_data["plateNumber"],
                model=jo_data["vehicleModel"],
                engine_type=jo_data.get("engineType")
            )
            db.add(vehicle)
            db.commit()
            vehicle_count += 1
        
        # 3. Create Job Order
        jo = JobOrder(
            id=jo_data["id"],
            owner_id=owner.id,
            vehicle_id=vehicle.id,
            odometer=jo_data.get("odometer"),
            service_type=jo_data["serviceType"],
            status=jo_data["status"],
            created_at=jo_data["createdAt"],
            vehicle_photo_url=jo_data.get("vehiclePhotoUrl"),
            mechanic_findings=jo_data.get("mechanicFindings"),
            discount=jo_data.get("discount", 0.0)
        )
        db.add(jo)
        db.commit()

        # 4. Assign Mechanics
        for mech_name in jo_data.get("inchargeMechanics", []):
            if mech_name in mechanic_map:
                jom = JobOrderMechanic(job_order_id=jo.id, mechanic_id=mechanic_map[mech_name])
                db.add(jom)
        db.commit()

        # 5. Inspection Items
        for item_data in jo_data.get("inspectionItems", []):
            item = InspectionItem(
                job_order_id=jo.id,
                name=item_data["name"],
                status=item_data["status"]
            )
            db.add(item)
            db.commit()

            # Create InspectionItemDetail if there's a note
            if "mechanicNote" in item_data:
                detail = InspectionItemDetail(
                    inspection_item_id=item.id,
                    status=item_data["status"],
                    note=item_data["mechanicNote"]
                )
                db.add(detail)
                db.commit()

        # 6. Estimate Items
        for est_data in jo_data.get("estimateItems", []):
            est = EstimateItem(
                id=f"{jo.id}-{est_data['id']}",
                job_order_id=jo.id,
                description=est_data["description"],
                qty=est_data["qty"],
                unit_price=est_data["unitPrice"],
                customer_approved=est_data["customerApproved"]
            )
            db.add(est)
        db.commit()

    print("Seeding complete!")

if __name__ == "__main__":
    seed_db()
