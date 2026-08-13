# PiVeRan PMS — Project Development Documentation

---

## 📋 Document Metadata

| Field | Details |
| :--- | :--- |
| **Project Name** | **PiVeRan PMS** (Preventive Maintenance System) |
| **Document Version** | `v1.0.0` (Fresh Start) |
| **Primary Owner** | Ranian J. Rulona |
| **Current SDLC Phase** | **Phase 1: Planning (High-Level Outlining)** `[ACTIVE]` |
| **Last Updated** | August 02, 2026 |

---

## 📌 SDLC Phase 1: Planning (Active Phase)

### 1.1 Executive Summary & Scope Directives
* **Stakeholders & Target:** **Sir Keith** (Owner of **PiVeRan**) providing custom PMS software to **Rey Auto Repair Shop** operated by PiVeRan front desk staff.
* **Technology Stack:**
  * **Backend API:** **Python** (FastAPI / Django REST API).
  * **Database & Media Storage:** **PostgreSQL / Supabase** (PostgreSQL relational DB, Supabase Auth, Supabase Media Storage for photos/videos).
  * **Frontend Client:** **Next.js / React (PWA)** with Service Workers & IndexedDB.
  * **Server Deployment:** **Docker** microservices deployed on Sir Keith's Cloud Server.
* **Product Scope Boundaries:**
  * **Routine PMS Focus:** Handles routine Preventive Maintenance Services (`Level 1`, `Level 2`, `Level 3`). Ad-hoc repairs handled by PiVeRan Auto Parts app.
  * **Operational Queue:** Direct Mechanic assignment via status queues (`Waiting` $\rightarrow$ `Inspecting` $\rightarrow$ `In Repair` $\rightarrow$ `Completed`). Fixed bay mapping excluded from MVP.
  * **Counter Payment Logging:** Counter payment recording (`Cash`, `GCash QR`, `Maya QR`, `Bank Transfer`, `Card`). Automated PayMongo/Xendit links deferred to v2.0.
  * **Customer Link Delivery:** Front Desk generates links with `[ 💬 Send via FB Messenger ]` & `[ 📋 Copy Link ]`. Paid SMS API integration deferred to v2.0.
  * **Multi-Tenant Ready DB Schema:** MVP targets Rey Auto Repair Shop (`shop_id = 1`), but database tables include `shop_id` keys from day 1 for future commercial scaling.

### 1.2 User Roles & Defined Responsibilities
*Detailed visual flow diagrams maintained in [workflow.excalidraw](file:///c:/Users/USER/Desktop/Ranian's%20file/PiVeRan-PMS/Conceptual%20Framework/workflow.excalidraw):*

1. 👑 **Admin Role (Sir Keith):** System management, staff user accounts, shop permissions, master catalog, and flat package pricing configuration.
2. 🖥️ **Front Desk Role (Sir Cedrick):** Vehicle intake, customer history lookup (`If Existed` branch), DVI estimate pricing, FB Messenger link delivery, counter payment logging, and deferred item CRM tracking.
3. 📱 **Technician / Mechanic Role (Garage Bay Tablet):** Walk-around DVI checklist inspection, 🟢/🟡/🔴 tagging, camera photo capture, IndexedDB offline queueing, and executing approved repairs.
4. 📲 **Customer / Car Owner Role (Zero-App Mobile Web):** Zero-app browser inspection review, interactive item approval checkboxes, finger digital signature, and real-time repair progress tracking.

### 1.3 Master PMS Level Packages & Physically Aligned Inspection Sequence
*Inspection scope derived directly from Master Garage Philippines inspection sheet ([YouTube: 34qISMedkrY](https://youtu.be/34qISMedkrY)), ordered by physical walk-around sequence across 5 Master Categories (59 items total):*

| Package Level | Target Service Interval | Physically Aligned Inspection Scope |
| :--- | :--- | :--- |
| **Level 1: Basic PMS** | Every 10,000 KM or 6 Months | **Stage 1 (Under Hood):**<br>☑️ Full ECU Scanning<br>☑️ Diagnose<br>☑️ Inspect Battery<br>☑️ Replace Sparkplug<br>☑️ Replace Air Filter<br>☑️ Replace Cabin Filter<br>☑️ Fluid Flushing<br><br>**Stage 2 (Wheels & Brakes):**<br>☑️ Inspect/Replace Brake pads and disk<br>☑️ Inspect and Clean brake lining and drum<br><br>**Stage 3 (Under Hoist):**<br>☑️ Change Oil<br>☑️ Replace Oil Filter<br>☑️ Inspect Front and rear suspension<br>☑️ Inspect Steering wheel, linkage and gear box |
| **Level 2: Full PMS** *(Diesel Engines)* | Every 50,000 KM or 5 Years | ☑️ **Includes EVERYTHING from Level 1 Basic PMS**<br><br>**Stage 1 Additions:**<br>☑️ Replace Fuel Filter<br>☑️ EGR and Intake Manifold Cleaning<br>☑️ Throttle Body Cleaning<br>☑️ Radiator Cleaning<br>☑️ Coolant Flushing<br><br>**Stage 3 Additions:**<br>☑️ Replace Transmission Oil<br>☑️ Replace Differential Oil |
| **Level 3: Heavy PMS** *(Engine Refresh)* | Every 80,000 KM and Up | ☑️ **Includes EVERYTHING from Level 2 Full PMS**<br><br>**Stage 1 Additions:**<br>☑️ Replace Timing Belt<br>☑️ Replace Tensioner Bearing<br>☑️ Valve Clearance Setting<br>☑️ Replace Valve Cover Gasket<br>☑️ Turbo Cleaning<br>☑️ Replace Turbo Actuator<br><br>**Stage 3 Additions:**<br>☑️ Replace Engine Support<br>☑️ Replace Transmission Support<br>☑️ Replace Shock Absorber<br>☑️ Replace Ball Joint<br>☑️ Replace Tie Rod<br>☑️ Replace Rack and Pinion |

#### 📋 Complete 5-Category Inspection Master List (59 Items Total)

##### Category 1: 🛠️ PREVENTIVE MAINTENANCE SERVICE (21 Items)
* Change Oil
* Replace Oil Filter
* Replace Air Filter
* Replace Fuel Filter
* Replace Sparkplug
* Replace Cabin Filter
* Replace Transmission Oil
* Replace Differential Oil
* Throttle Body Inspection
* Inspect and Clean brake lining and drum
* Inspect/Replace Brake pads and disk
* Inspect Steering wheel, linkage and gear box
* Inspect Front and rear suspension
* Inspect Battery
* Inspect Clutch System
* Inspect Airconditioning
* Inspect/Replace Drivebelt
* Engine Detailing
* Fluid Flushing
* Full ECU Scanning
* Diagnose

##### Category 2: ❄️ AIRCON SERVICES (10 Items)
* Aircon Cleaning
* Replace Compressor
* Replace Evaporator
* Replace Condenser
* Replace Auxiliary Fan
* Replace Expansion Valve Front
* Replace Expansion Valve Rear
* Replace Filter Drier
* Replace High Pressure Switch
* Replace O ring

##### Category 3: ⚙️ MAJOR WORK (13 Items)
* EGR and Intake Manifold Cleaning
* Intake Manifold Cleaning
* Radiator Cleaning
* Replace Timing Belt
* Turbo Cleaning
* Replace Turbo Actuator
* Replace Tensioner Bearing
* Replace Clutch Kit
* Valve Clearance Setting
* Replace Valve Cover Gasket
* Throttle Body Cleaning
* Top Overhaul
* Replace Transmission

##### Category 4: 🚗 UNDER CHASSIS (8 Items)
* Replace Ball Joint
* Replace Stabilizer Link
* Replace Shock Absorber
* Replace Engine Support
* Replace Transmission Support
* Replace Tie Rod
* Replace Rack and Pinion
* Replace Cross Joint

##### Category 5: 🌡️ COOLING SYSTEM RESTORATION (7 Items)
* Radiator Cleaning
* Coolant Flushing
* Inspect/Replace Water Pump
* Inspect/Replace Thermostat
* Inspect/Replace Radiator Hose
* Inspect/Replace Auxiliary Fan
* Silicon Oil Refill

### 1.4 System Architecture & Technical Strategies
1. **Dynamic Package Playlist Builder:** Services stored as independent items (`services`). Packages (`packages`) bundle services like playlists, calculating cumulative standalone totals and applying flat discounted package pricing.
2. **Historical Price Snapshotting:** Price snapshot saved at job creation to ensure future catalog updates do not alter past invoices or active estimates.
3. **Decoupled Parts Inventory (`InventoryService`):** Lightweight internal stock deduction module for MVP. Decoupled behind an interface for seamless future API sync with the main **PiVeRan Auto Parts** app.
4. **Offline-First PWA & IndexedDB Queue:** Tablet UI cached via Service Workers. Offline DVI tags and camera photos save locally in IndexedDB, auto-syncing to Cloud PostgreSQL upon network restoration.
5. **PWA Tooling, Install Banner & Security Rules:** Audited using **Google Chrome DevTools Application Panel & Lighthouse**. Includes custom in-app install banner (`[ 📲 Install Tablet App ]` via `beforeinstallprompt` event). Sensitive auth tokens are never cached in Service Workers; mandatory cache invalidation on deployment.

### 1.5 High-Level System Feature Modules & UI Views (Structured by Role)

#### 👑 1. Admin Role Views (Sir Keith)
* **Analytics:** Overview of shop metrics, revenue, completed jobs, and system logs.
* **User Management:** Create and manage staff accounts (Admin, Front Desk, Mechanic) and permissions.
* **Service Catalog:** Create, edit, and price individual labor and part service items.
* **Package Builder:** Bundle services into Level 1, 2, and 3 PMS packages with flat pricing.
* **Shop Settings:** Manage shop profile, business operating hours, and receipt notes.
* **Parts Inventory:** Manage master auto parts, supplier unit costs, retail prices, and stock levels.

#### 🖥️ 2. Front Desk Role Views (Sir Cedrick)
* **Live Dashboard:** Monitor active jobs (`Waiting` $\rightarrow$ `Inspecting` $\rightarrow$ `In Repair` $\rightarrow$ `Ready`) and network status.
* **Vehicle Intake:** Register customer, vehicle, odometer, and assign PMS level to mechanic.
* **Directory & History:** Search customers, vehicle timeline, mileage, and deferred service badges.
* **Estimate Builder:** Review DVI findings, add labor/parts pricing, and generate FB Messenger link.
* **Counter Checkout:** Invoice summary and counter payment logging (Cash, GCash, Maya, Bank, Card).
* **Reminders Queue:** Queue of 3-month deferred follow-ups and 6-month routine PMS reminders.

#### 📱 3. Technician / Mechanic Role Views (Garage Bay Tablet)
* **Job Board:** Tablet screen listing assigned vehicles for inspection or repair execution.
* **DVI Sheet:** 5 category tabs (`PMS`, `Aircon`, `Major Work`, `Chassis`, `Cooling`), 🟢/🟡/🔴 tags, camera photos, IndexedDB offline queue.
* **Task Execution:** Checklist of customer-approved repair items for mechanic to complete.
* **Job Sign-off:** ECU rescan log, diagnostic notes, and job completion sign-off.

#### 📲 4. Customer Role Views (Zero-App Mobile Web)
* **Approval Portal:** Zero-app web screen for 🟢/🟡/🔴 findings, photo evidence, checkboxes, real-time total, and digital signature.
* **Repair Tracker:** Real-time repair progress tracking (`In Repair` $\rightarrow$ `Ready for Pickup 🚗`) and shop contact info.

---

## 📌 SDLC Phase 2: Requirement Analysis (Active Phase)

### 2.1 Admin Role Requirements

#### 👑 View A1: Analytics (Admin Analytics Dashboard)
* **Purpose:** High-level operational metrics and real-time shop performance monitoring for Sir Keith.
* **KPI Cards:** Gross Revenue (Today / Month / YTD), Active Jobs Count (`Waiting`, `Inspecting`, `In Repair`, `Ready`), Completed Jobs Count, and Top PMS Package Ratio.
* **Data Charts:** Monthly Revenue & Job Volume bar chart, Category Distribution donut chart (PMS, Aircon, Major Work, Chassis, Cooling).
* **Audit Activity Feed:** Real-time log showing staff actions (intake registrations, DVI submissions, link dispatches, checkout payments).

#### 👑 View A2: User Management (Staff Account Management)
* **Purpose:** Onboarding and role access control for shop personnel. Supports both self-registration with admin approval and manual account creation by Sir Keith.
* **Self-Registration Flow:** Staff sign up via public login screen (`Name`, `Email/Username`, `Password`, `Requested Role`). Account enters `PENDING_APPROVAL` status (isolated from shop data).
* **Admin Review Queue:** Sir Keith receives notifications for pending requests with 3 actions: `[ ✅ Approve ]`, `[ 💬 Request Revision ]` (with comment box), or `[ ❌ Reject ]`.
* **Staff Revision Loop:** If admin requests a revision, staff pending screen switches to `NEEDS_REVISION` displaying the comment and a form to fix details immediately.
* **Account Statuses:** 🟡 `PENDING` | 🟠 `NEEDS_REVISION` | 🟢 `APPROVED` | 🔴 `REJECTED`.
* **Staff Directory & Actions:** Table listing active staff (`Name`, `Role`, `Username`, `Status`). Actions: `[ + Add Manually ]`, `[ ✏️ Edit ]`, `[ 🔑 Reset Password ]`, `[ ⛔ Deactivate ]`.

#### 👑 View A3: Service Catalog (Master Service Catalog)
* **Purpose:** Create and maintain individual standalone labor/service items for use across job orders and package building.
* **Streamlined Inputs (3 Fields Only):** `Labor/Service Name` (e.g., *Change Oil*), `Description` (e.g., *To change engine oil*), and `Price (₱)` (e.g., *1200*).
* **Service Table & Actions:** Directory table listing `Service Name`, `Description`, `Price (₱)`. Actions: `[ + Add Labor/Service ]`, `[ ✏️ Edit ]`, `[ 🗑️ Delete ]`.
* **Package Integration:** Service items created here are selectable via checkboxes when building packages in View A4.

#### 👑 View A4: Package Builder (PMS Package Builder)
* **Purpose:** Bundle individual service items from View A3 into flat-priced PMS packages (*Level 1 Basic, Level 2 Full, Level 3 Heavy*).
* **Inputs & Service Bundling:** `Package Name` (e.g., *Level 1: Basic PMS*), `Target Interval Note` (e.g., *Every 10,000 KM or 6 Months*), `Service Checklist Selector` (checkboxes selecting services from View A3), `Cumulative Standalone Sum` (auto-calculated sum of checked items), and `Flat Package Price (₱)` (discounted fee set by admin).
* **Package Display Cards & Actions:** Visual cards for Level 1, Level 2, Level 3 displaying package name, included items list, standalone total, and flat package price. Actions: `[ + Create New Package ]`, `[ ✏️ Edit Package ]`, `[ 📋 Duplicate ]`.

#### 👑 View A5: Shop Settings (Shop Profile & Configuration)
* **Purpose:** Configure shop profile details, business operating hours, and invoice footer notes for Rey Auto Repair Shop.
* **Inputs & Configuration:** `Shop Name` (*Rey Auto Repair Shop*), `Contact Phone Number`, `Shop Address`, `Shop Logo Upload` (used on receipts & web links), `Business Hours` (e.g., *Mon – Sat: 8:00 AM – 5:00 PM*), and `Invoice Footer Notes` (default disclaimer text on receipts).
* **Actions:** `[ 💾 Save Settings ]`, `[ 🖼️ Upload Logo ]`.

#### 👑 View A6: Parts Inventory (Master Parts & Materials Catalog)
* **Purpose:** Manage master auto parts inventory, supplier unit cost prices, retail selling prices, and stock quantities (decoupled behind `InventoryService` for future PiVeRan Auto Parts sync).
* **Inputs & Schema:** `Part Number/SKU` (e.g., *90915-YZZE1*), `Part Name/Description` (e.g., *Oil Filter Toyota Vios*), `Brand` (e.g., *Denso/Vic*), `Unit Cost Price (₱)` (cost price), `Selling Price (₱)` (retail price), `Stock Quantity`, and `Compatible Vehicles`.
* **Actions:** `[ + Add New Part ]`, `[ ✏️ Edit Details/Price ]`, `[ 📦 Adjust Stock Qty ]`, `[ 🗑️ Delete Part ]`.

### 2.2 Front Desk Role Requirements

#### 🖥️ View F1: Live Dashboard (Front Desk Live Operations Dashboard)
* **Purpose:** Real-time monitoring board for Sir Cedrick to track active shop vehicles across status stages and monitor offline network state.
* **Job Status Columns:** 🟡 `Waiting` (Checked in) $\rightarrow$ 🔵 `Inspecting` (Mechanic performing DVI) $\rightarrow$ 🟠 `Estimate Sent` (Awaiting customer web link approval) $\rightarrow$ 🟣 `In Repair` (Executing approved work) $\rightarrow$ 🟢 `Ready for Pickup` (QC complete, ready for checkout).
* **Header Bar & Actions:** Network Sync Banner (`🟢 Connected` vs `⚡ Offline Mode — Holding Queue`), `[ + New Vehicle Intake ]` button, and `[ 🔍 Search Vehicle / Customer ]` search bar.

#### 🖥️ View F2: Vehicle Intake (Vehicle Intake & Check-in)
* **Purpose:** Register customer/vehicle details at shop check-in, upload a vehicle profile avatar photo, and dispatch a PMS level inspection to an assigned mechanic.
* **Form Inputs:** Customer details (`Name`, `Phone Number`, `FB Messenger Handle`), Vehicle details (`Plate Number`, `Vehicle Profile Photo Upload` 📸 showing plate number, `Make & Model`, `Year`, `Engine Type`, `VIN`, `Odometer KM`), and Job Assignment (`PMS Level Template`, `Assigned Mechanic`).
* **Vehicle Photo Avatar Usage:** Uploaded car photo serves as the vehicle avatar across Front Desk cards, Mechanic tablet job board, and Customer web link header.
* **Duplicate Auto-Lookup (`If Existed` Branch):** Typing Plate # or Phone # checks existing profiles, pre-filling data and displaying badges for past `SKIPPED / DEFERRED` service items.
* **Actions:** `[ 🚀 Submit & Dispatch to Mechanic ]`, `[ 📋 Save Draft ]`.

#### 🖥️ View F3: Directory & History (Vehicle & Customer Directory)
* **Purpose:** Search and inspect customer profiles, interactive vehicle maintenance timelines, and skipped service liability logs.
* **Search & Filters:** Search bar (by Name, Phone #, Plate #, VIN) and filter tabs (`All`, `Active`, `Has Deferred Items`).
* **Interactive Vehicle Timeline:** Clicking a vehicle opens a chronological timeline of all visits (e.g., *Visit #1, Visit #2, Visit #3*).
* **Visit Detail Modal:** Clicking any specific visit in the timeline expands full historical details: past DVI report with 🟢/🟡/🔴 tags, mechanic inspection photos, approved estimate receipt, and captured digital signature.
* **`SKIPPED / DEFERRED` Liability Badge:** Dedicated tab listing repair items previously declined by the customer with exact timestamps for shop liability protection.
* **Actions:** `[ 🚀 Start New Check-in ]`, `[ ✏️ Edit Profile ]`, `[ 💬 Send FB Message ]`.

#### 🖥️ View F4: Estimate Builder (Estimate Curation & Link Dispatch)
* **Purpose:** Review mechanic DVI findings, attach required parts/materials and extra labor, and dispatch the customer web approval link.
* **Formula:** $\text{Total Estimate} = \text{Package Base Fee} + \text{Added Materials (Parts)} + \text{Additional Labor}$.
* **Mechanic DVI & Parts Review:** Shows mechanic's 🟢/🟡/🔴 findings, inspection photos, and parts attached by mechanic on tablet during inspection.
* **`[ + ADD MATERIALS / PARTS ]` Button:** Searches internal parts catalog (`parts` table). Supports **On-the-Fly Part Addition** (`[ ➕ Quick Add New Part ]`) if part is not in database, auto-saving it to the master catalog for future jobs.
* **`[ + ADD ADDITIONAL LABOR ]` Button:** Searches Service Catalog (View A3) for extra labor tasks (e.g., *Disc Resurfacing*).
* **Link Generation & Dispatch:** Generates secure web link (`piveran.com/approve/x89f2`). Buttons: `[ 💬 Send via FB Messenger ]` (opens pre-written FB message) and `[ 📋 Copy Link ]`.
* **Offline Holding Queue:** Offline status holds at `PENDING_LINK_GENERATION` and alerts Front Desk when internet restores.

#### 🖥️ View F5: Counter Checkout (Billing & Counter Checkout)
* **Purpose:** Review approved customer repair items, log counter payments, print/share official receipts, and complete vehicle checkout.
* **Itemized Billing Summary:** Customer & Vehicle profile header, list of approved PMS packages, extra labor, and consumed auto parts with final grand total.
* **Counter Payment Methods:** `Cash` (with change calculator), `GCash QR` (displays shop QR code & reference # input), `Maya QR` (displays shop QR code & reference #), `Bank Transfer` (logs bank & reference #), and `Card` (logs terminal reference #).
* **Checkout Actions:** `[ 🖨️ Print Official Invoice ]`, `[ 💬 Send Digital Receipt via FB Messenger ]`, and `[ 🏁 Complete Vehicle Checkout ]` (marks status `Completed`, updates timeline, and auto-deducts parts inventory).

#### 🖥️ View F6: Reminders Queue (CRM & Follow-up Reminders)
* **Purpose:** Track, queue, and dispatch follow-up messages for deferred service items and routine PMS maintenance visits.
* **Configurable Thresholds (Admin & Front Desk Access):** Reminder intervals are non-fixed and fully configurable by both Admin and Front Desk (`Deferred Item Follow-up`: Default 3 Months/90 Days; `Routine PMS Interval`: Default 6 Months/180 Days or 10,000 KM).
* **Reminder Queues:** 🟠 `Deferred Item Follow-ups` (lists customers who declined repairs reaching configured threshold) and 🔵 `Routine PMS Reminders` (lists vehicles reaching routine PMS interval).
* **Actions:** `[ ⚙️ Configure Thresholds ]`, `[ 💬 Send Reminder via FB Messenger ]`, `[ ⏰ Snooze Reminder ]`, and `[ ✅ Mark Resolved ]`.

### 2.3 Technician / Mechanic Role Requirements (Garage Bay Tablet PWA)

#### 📱 View M1: Job Board (Mechanic Assigned Job Board)
* **Purpose:** Home screen on garage bay tablet displaying assigned vehicles waiting for inspection or approved repair execution.
* **Assigned Vehicle Cards:** Vehicle Profile Photo avatar 📸, Plate Number, Car Model, Assigned PMS Package Level, and Job Status badge (🟡 `Assigned — Inspection Needed` or 🟣 `Approved — Repairs Ready`).
* **Card Actions:** `[ 🚀 Start Inspection ]` (opens View M2) and `[ 🛠️ Start Approved Repairs ]` (opens View M3).

#### 📱 View M2: DVI Sheet (Digital Vehicle Inspection Sheet)
* **Purpose:** Tablet checklist interface for mechanics to perform walk-around DVI inspections, tag item conditions (🟢/🟡/🔴), attach camera photos, attach required parts, and work offline via IndexedDB.
* **Level-Filtered Checklist:** Displays items corresponding to the selected PMS package (`Level 1 Basic`, `Level 2 Full`, `Level 3 Heavy`) ordered by the 3 physical walk-around stages (`Stage 1 Under Hood` $\rightarrow$ `Stage 2 Wheels & Brakes` $\rightarrow$ `Stage 3 Under Hoist`).
* **5 Category Tabs Navigation:** Tabs for `PMS (21 items)`, `Aircon (10 items)`, `Major Work (13 items)`, `Under Chassis (8 items)`, and `Cooling System (7 items)` to inspect extra items if requested.
* **Item Controls & Parts Attachment:** 🟢 Green (Passed), 🟡 Yellow (Wear Noted), 🔴 Red (Immediate Hazard), `[ 📷 Take Photo ]` (camera capture + compression), and `[ 📦 Attach Required Part ]` (searches parts catalog with `[ ➕ Quick Add New Part ]` if missing from DB).
* **Offline Resilience:** IndexedDB local storage saves tags & photos offline when Wi-Fi drops, auto-syncing to PostgreSQL when Wi-Fi reconnects.
* **Actions:** `[ 📤 Submit DVI Report to Front Desk ]`, `[ 💾 Save Offline Draft ]`.

#### 📱 View M3: Task Execution (Approved Task Execution View)
* **Purpose:** Tablet checklist display for mechanics to execute customer-approved repair items in the garage bay.
* **Task List & Display:** Vehicle profile header (with car photo), checklist showing **ONLY** customer-approved repair tasks (e.g., `[x] Level 1 Basic PMS`, `[x] Replace Brake Pads`), and a banner showing declined items (info only).
* **Task Controls & Notes:** Interactive checkbox updating task status (`In Progress` $\rightarrow$ `Completed`) and mechanic work notes input.
* **Actions:** `[ 🏁 Finish Repairs & Proceed to QC ]` (opens View M4 Quality Control).

#### 📱 View M4: Job Sign-off (Quality Control & Job Sign-off)
* **Purpose:** Tablet sign-off screen for mechanics to log quality control checks, post-repair ECU rescan status, digital signature, and mark the job complete.
* **QC Form Inputs:** Post-Repair ECU Rescan status dropdown (`Clear / 0 Fault Codes`, `Codes Cleared`, `Persistent Codes Noted`), Test Drive & Inspection notes, Final Sanity Checklist (`[x] Fluid Levels Checked`, `[x] Wheel Lugs Torqued`, `[x] Engine Bay Cleaned`), and Mechanic Finger Signature pad.
* **Actions:** `[ 🚗 Mark Job Completed & Notify Front Desk ]` (updates vehicle status to `Ready for Pickup 🚗`, notifies Front Desk Live Dashboard View F1, and updates Customer Tracker View C2).

### 2.4 Customer Role Requirements (Zero-App Mobile Web)

#### 📲 View C1: Approval Portal (Zero-App Mobile Web DVI Review & Approval)
* **Purpose:** Zero-app mobile web interface (opened via FB Messenger link) for customer to review inspection findings, high-resolution photos, interactively approve/decline items, and sign digitally.
* **Screen Components:** Shop & Vehicle header (with vehicle photo avatar), collapsible 🟢 Passed items section, 🟡/🔴 recommendation cards with inspection photos and interactive checkboxes (`[x] Approve` vs `[ ] Decline`), live dynamic total cost bar, and finger touch signature pad.
* **Actions:** `[ ✍️ Submit Approved Choices ]` (saves approvals/signature, dispatches task checklist to Mechanic Tablet View M3, updates Front Desk View F1, and redirects customer to View C2).

#### 📲 View C2: Repair Tracker (Live Repair Progress Tracker)
* **Purpose:** Zero-app mobile web tracker allowing customers to monitor real-time repair progress and know exactly when their vehicle is ready for pickup.
* **Progress Tracking Components:** Vehicle profile header (with car photo avatar), live 4-stage stepper bar (`Checked In` $\rightarrow$ `Inspecting` $\rightarrow$ `In Repair` $\rightarrow$ `Ready for Pickup 🚗`), real-time approved task checklist with live status badges (`Completed` vs `In Progress`), and shop contact/location card.
* **Actions:** `[ 📞 Call Front Desk ]`, `[ 💬 Open FB Messenger Chat ]`.

---

## 📌 SDLC Phase 3: System Design & Architecture (Pending)
*(Will be populated in Phase 3 — UI wireframes, database schemas, and API specs)*

---

## 📌 SDLC Phase 4: Implementation & Coding (Pending)
*(Will be populated in Phase 4 — frontend/backend code execution)*

---

## 📌 SDLC Phase 5: Testing & QA (Pending)
*(Will be populated in Phase 5 — test cases, bug tracking, and cross-browser QA)*

---

## 📌 SDLC Phase 6: Deployment & Maintenance (Pending)
*(Will be populated in Phase 6 — production launch & maintenance logs)*

---

## 📜 SDLC Progress Log

| Date | Phase | Action / Milestone | Status |
| :--- | :--- | :--- | :--- |
| **August 02, 2026** | **Phase 1: Planning** | Outline system scope, PMS package breakdown, tech stack, and role views. | `[COMPLETED]` |
| **August 06, 2026** | **Phase 2: Requirement Analysis** | Define all 18 detailed UI view requirements across Admin, Front Desk, Mechanic, and Customer roles. | `[COMPLETED]` |
