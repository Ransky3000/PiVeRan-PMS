# PiVeRan PMS — Project Development Documentation

---

## 📋 Document Metadata

| Field | Details |
| :--- | :--- |
| **Project Name** | **PiVeRan PMS** (Preventive Maintenance System) |
| **Document Version** | `v1.2.0` (Active Implementation Sync) |
| **Primary Owner** | Ranian J. Rulona |
| **Current SDLC Phase** | **Phase 4: Implementation & Coding** `[ACTIVE]` |
| **Last Updated** | August 26, 2026 |

---

## 📌 SDLC Phase 1: Planning (Completed)

### 1.1 Operational Flow & Lifecycle
- **Actors:** Vehicle Owner (Customer), Front Desk (Service Advisor), Mechanic (Technician), System Admin, Developer.
- **13-Step Workflow:** Arrival $\rightarrow$ Service Request $\rightarrow$ Service Inquiry $\rightarrow$ Package Selection $\rightarrow$ Garage Positioning $\rightarrow$ Job Order Creation $\rightarrow$ Inspection Start $\rightarrow$ Work In Progress $\rightarrow$ Checklist Complete $\rightarrow$ Job Completion $\rightarrow$ Pickup Notification $\rightarrow$ Billing Presentation $\rightarrow$ Payment Settlement.
- **Job Order Lifecycle:**
  `[ Job Created / New ] ──> [ Work in progress ] ──> [ Checklist Complete ] ──> [ Job completed ] ──> [ Billing / Paid ]`
- **Inspection Matrix:** See [MASTER_PMS_LEVEL_PACKAGES_AND_INSPECTION_SEQUENCE.md](file:///c:/Users/USER/Desktop/Ranian's%20file/PiVeRan-PMS/MASTER_PMS_LEVEL_PACKAGES_AND_INSPECTION_SEQUENCE.md) for Level 1–3 packages and physical garage inspection flow.

### 1.2 Technology Stack & Platform Strategy
- **Frontend Stack:** Next.js 14+ (App Router) · React 19 · TypeScript · Vanilla CSS / Tailwind CSS · Framer Motion · Lucide React.
- **Backend Stack (Current Phase):** **Python (FastAPI)** with **SQLite** (via SQLAlchemy ORM & Uvicorn) running on `http://localhost:8000`.
- **Production Upgrade Roadmap:** Migration to **PostgreSQL** with **Alembic** migrations and containerization via **Docker & Docker Compose**.
- **Platform Scope:** Desktop & Mobile Responsive Web App (Chrome, Edge, Safari).

### 1.3 Engineering & Architectural Principles
- **Maintainable OOP & Data Structure Patterns:** Modular domain modeling, typed contracts (`types.ts` / Pydantic schemas), and decoupled service layer (`apiService.ts`).
- **Strict File Size Limit ($\le$ 300 LOC):** Modularizing large pages into sub-components, modal drawers, and helper utilities.
- **Anti-Bloat Clean Logic:** Short, readable, idiomatic logic without redundant boilerplate or swallowed exceptions.
- **Over-Designed UI Standard:** Glassmorphism, smooth Framer Motion micro-animations, curated emerald/slate themes, dynamic badges, and responsive card layouts.
- **Decoupled Architecture:** Strict physical separation into `frontend/` (Next.js app) and `backend/` (FastAPI REST service).

---

## 📌 SDLC Phase 2: Requirement Analysis & Feature Scope (Completed)

### 2.1 Authentication, Roles & Developer Impersonation Flow

#### 👥 Supported System Roles
1. **Developer (`DEVELOPER`):** Embedded test/super-user account (`dev@piveran.com` / `#include<piveran123>`). Unlocks the `DevRoleBar` inspector toolbar to view and test all account perspectives (Mechanics, Front Desk, Admin).
2. **System Owner / Admin (`ADMIN`):** Approves pending staff registration requests, manages active staff accounts, and views shop analytics.
3. **Front Desk (`FRONT_DESK`):** Creates Job Orders, manages Owner & Vehicle profiles, configures Bundles & Materials, handles estimates/billing, and manages Preventive Maintenance Reminders.
4. **Mechanic (`MECHANIC`):** Accesses Garage Bay Job Board, executes DVI (Digital Vehicle Inspection) checklists, uploads visual proof photos, and recommends material requirements.

#### 🔐 User Account Lifecycle
`[ Form Submission ] ──> [ Status: PENDING ] ──> [ Admin Review ] ──> [ Approved / Rejected ]`

---

## 📌 SDLC Phase 3: Implemented Features & Architecture (Active)

### 3.1 Front Desk Modules

#### 1. Preventive Maintenance Reminders (`/frontdesk/reminders`)
- **Tab Grouping:** `Pending`, `Due Soon`, `Overdue`, `Completed`.
- **7-Day Early Notice Threshold:**
  - **`Overdue`**: Next Schedule target date is in the past (`targetDate < today`).
  - **`Due Soon`**: Target date is within **7 days** from today (`0 <= targetDate - today <= 7 days`).
  - **`Pending`**: Target date is strictly more than 7 days in the future.
- **Approach A: Pure Linear Timeline Progress Bar:**
  $$\text{Progress \%} = \frac{\text{Current Date} - \text{Start Date}}{\text{Target Date} - \text{Start Date}} \times 100\%$$
  - Un-clamped, smooth day-by-day ratio based on elapsed time between Last Service (`startDate`) and Next Schedule (`targetDate`).
- **Reminder Drawer & Data Mapping:**
  - Dynamic display of Owner Phone (`contact_number`) and Facebook contact (`facebook` clickable hyperlink opening in new tab).
  - Editable Next Schedule date and odometer reading with a **Save Changes** button (without auto-completing reminder).

#### 2. Job Order Management (`/frontdesk/job-orders`)
- **Card Board:** Filterable by status (`New`, `Work in progress`, `Job completed`) and search query.
- **Create Job Order Drawer:** Owner & Vehicle selection, Service selection (Bundles/Labor), multi-mechanic assignment, and odometer check-in.
- **Customer Estimate Approval:** Line-item estimate review (`customerApproved`: `true` / `false` / `null`), discount input, and estimate summary comments.

#### 3. Master Data Management
- **Vehicles (`/frontdesk/vehicles`):** Make, Model, Year, Color, License Plate Number, Vehicle Photo asset link.
- **Owners (`/frontdesk/owners`):** Owner Name, Contact Number, Facebook link, linked vehicles.
- **Materials (`/frontdesk/materials`):** Part name, price, specification description.
- **Bundles & Labor Catalog (`/frontdesk/bundles`):** Labor item rates grouped by category, Package Service builder (calculating standalone labor sum vs discounted package rate).

---

### 3.2 Mechanic Modules

#### 1. Garage Bay Job Board (`/mechanic/job-board`)
- **Kanban Tabs:** `New` (Unstarted JOs), `Work in progress` (Active DVI), `Job completed`.
- **Incharge Mechanics Filtering:** Displays assigned technicians (`inchargeMechanics`) per job card.
- **Real-Time Data Sync:** Polling / SSE event subscription via `subscribeToJobOrders`.

#### 2. DVI Inspection & Recommended Parts Drawer
- **Checklist Items:** Status toggles (`GOOD`, `ISSUE`, `MONITOR`, `PENDING`).
- **Visual Evidence:** Multi-photo proof photo upload and lightbox modal viewer.
- **4-Step Inline Material Recommendation:**
  1. Trigger recommendation on inspection item.
  2. Search & Select part from inventory catalog (`SELECT_PART`).
  3. Specify required quantity (`SET_QUANTITY`).
  4. Save part requirement to Cart (`MaterialRequirement`).

---

### 3.3 Admin Modules

#### 1. User Management (`/admin/users`)
- Review pending staff registration requests (`PENDING`).
- One-click Approve (`APPROVED`) or Reject (`REJECTED`).
- Roster of active staff with role filters (`Front Desk`, `Mechanic`).

#### 2. Admin Analytics (`/admin/analytics`)
- High-level operational metrics and shop performance overview.

---

## 📌 SDLC Phase 4: Data Models & Backend API Schema

### 4.1 SQLite Database Schema (SQLAlchemy Models)

```
+------------------+         +------------------+         +------------------+
|  users_account   |         |      owners      |         |     vehicles     |
+------------------+         +------------------+         +------------------+
| user_id (PK)     |         | owner_id (PK)    |<------->| vehicle_id (PK)  |
| email (UNIQUE)   |         | name             | 1     * | owner_id (FK)    |
| password_hash    |         | contact_number   |         | make, model      |
| name, phone      |         | facebook         |         | year, color      |
| role, status     |         +------------------+         | plate_number(UQ) |
+------------------+                                      +------------------+
                                                                   |
                                                                   | 1
                                                                   v *
+------------------+         +------------------+         +------------------+
|    materials     |         |     bundles      |         |    job_orders    |
+------------------+         +------------------+         +------------------+
| materials_id(PK) |         | bundle_id (PK)   |         | jo_id (PK)       |
| name, price      |         | bundle_name      |         | vehicle_id (FK)  |
| description      |         | discounted_price |         | owner_id (FK)    |
+------------------+         +------------------+         | status, odometer |
                                                          +------------------+
                                                                   | 1
                                                                   v *
                                                          +------------------+
                                                          | checklist_details|
                                                          +------------------+
                                                          | cd_id (PK)       |
                                                          | jo_id (FK)       |
                                                          | status, notes    |
                                                          +------------------+
```

### 4.2 FastAPI REST Endpoints Summary

| Method | Endpoint | Router File | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | `auth.py` | Register new staff account (Status: `PENDING`). |
| `POST` | `/api/auth/login` | `auth.py` | Authenticate user & check approval status. |
| `GET` | `/api/users/pending` | `users.py` | List pending staff registration requests. |
| `PATCH`| `/api/users/{user_id}/status` | `users.py` | Approve or Reject staff account. |
| `GET` | `/api/master/owners` | `master.py` | Fetch all registered owners & linked vehicles. |
| `GET` | `/api/master/vehicles` | `master.py` | Fetch registered vehicles list. |
| `GET` | `/api/master/materials` | `master.py` | Fetch materials inventory catalog. |
| `GET` | `/api/master/bundles` | `master.py` | Fetch PMS bundles & constituent labors. |
| `GET` | `/api/job-orders` | `job_orders.py` | Fetch all job orders with inspection items. |
| `POST`| `/api/job-orders` | `job_orders.py` | Create new Job Order & auto-generate DVI checklist. |
| `PATCH`| `/api/job-orders/{jo_id}`| `job_orders.py` | Update Job Order status, DVI items, or cart approvals. |
| `GET` | `/api/reminders` | `reminders.py` | Fetch preventive maintenance reminders list. |
| `PATCH`| `/api/reminders/{id}` | `reminders.py` | Update reminder target date & odometer. |

---

## 📌 SDLC Phase 5: Upcoming Development Roadmap

### 🎯 Next Milestone: Developer Account & Account Impersonation Engine
1. **Developer Role Addition:** Add `DEVELOPER` to `UserRole` backend enum and seed fixed credentials (`dev@piveran.com` / `#include<piveran123>`).
2. **Conditional DevRoleBar:** Render `<DevRoleBar />` only when authenticated as a `DEVELOPER`.
3. **User Impersonation:**
   - Allow Developer to select specific registered staff accounts (e.g. Mechanic `Rodel Santos` vs `Mark Rey`).
   - Dynamically filter Mechanic Job Board by active impersonated mechanic.
