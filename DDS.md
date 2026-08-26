# PiVeRan PMS — Detailed Design Specification (DDS)

---

## 📋 Document Metadata

| Field | Details |
| :--- | :--- |
| **Document Title** | **Detailed Design Specification (DDS)** |
| **Project** | **PiVeRan PMS** (Preventive Maintenance System) |
| **Document Version** | `v1.0.0` |
| **Author / Owner** | Senior Dev Pair / Ranian J. Rulona |
| **Last Updated** | August 26, 2026 |

---

## 1. 🏗️ System Architecture & High-Level Design

```
+-------------------------------------------------------------------+
|                       CLIENT BROWSER                              |
|   Next.js 14+ App Router (React 19, TypeScript, Vanilla/Tailwind) |
|   - TailAdminLayout (Navigation Sidebar & Profile)                |
|   - DevRoleContext & DevRoleBar (Dev Inspector & Impersonation)   |
|   - Role Routes (/admin, /frontdesk, /mechanic, /login, /signup)  |
+-------------------------------------------------------------------+
                                 │
                                 │ HTTP REST API (Fetch / CORS)
                                 ▼
+-------------------------------------------------------------------+
|                       FASTAPI BACKEND                             |
|   Python 3.11+ / Uvicorn Server (http://localhost:8000)            |
|   - routers/auth.py       (Signup, Login, Password Hashing)       |
|   - routers/users.py      (Pending Approvals, User Status)        |
|   - routers/master.py     (Owners, Vehicles, Materials, Bundles)  |
|   - routers/job_orders.py (JO State, DVI Checklists, Cart)       |
|   - routers/reminders.py  (PMS Reminders & Schedule Edits)       |
+-------------------------------------------------------------------+
                                 │
                                 │ SQLAlchemy ORM
                                 ▼
+-------------------------------------------------------------------+
|                       SQLITE DATABASE                             |
|   backend/pms.db (Development MVP Database File)                  |
|   - Relational Tables: users_account, owners, vehicles,           |
|     materials, labor, bundles, bundle_services, job_orders,       |
|     job_order_mechanics, checklist_details, cart, reminders       |
+-------------------------------------------------------------------+
```

---

## 2. 💻 Frontend Component & Directory Design

### 2.1 App Router Directory Map
```
frontend/app/
├── admin/
│   ├── analytics/page.tsx   # Admin operational metrics
│   └── users/page.tsx       # Pending approvals & active staff roster
├── frontdesk/
│   ├── bundles/page.tsx     # Labor catalog & Package Builder
│   ├── job-orders/page.tsx  # JO cards grid & Create JO modal
│   ├── materials/page.tsx   # Parts inventory catalog
│   ├── mechanics/page.tsx   # Staff list & assignments
│   ├── owners/page.tsx      # Customer profiles & FB links
│   ├── reminders/page.tsx   # PMS Reminders table & 7-day notice
│   └── vehicles/page.tsx    # Vehicle profiles & photo assets
├── mechanic/
│   └── job-board/page.tsx   # Kanban bay tablet view & DVI drawer
├── login/page.tsx           # Staff Sign In view
├── signup/page.tsx          # 2-step Staff Sign Up view
└── pending-approval/page.tsx # Applicant verification gate
```

### 2.2 Shared Components & Contexts
- **`components/TailAdminLayout.tsx`:** Primary workspace wrapper with responsive dark navy sidebar (`#0F172A`), active role card, navigation links, search bar, and user profile footer.
- **`components/DevRoleBar.tsx`:** Floating inspector widget for dev mode role switching and account impersonation.
- **`context/DevRoleContext.tsx`:** Manages `activeRole`, `currentProfile`, `activeImpersonatedUser`, and `mockDataState`.
- **`app/apiService.ts`:** Decoupled REST client providing strongly-typed methods for all backend endpoints.

---

## 3. 🗄️ Database Architecture & Relational Schemas

### 3.1 Entity Relationship Diagram (ERD Summary)

```
[users_account] ◄── (Assigned Mechanics) ──► [job_orders] ◄── (1:N) ── [checklist_details] ◄── (1:N) ── [cart]
                                                  ▲                                                            │
                                                  │ (N:1)                                                      ▼
                                            [vehicles] ◄── (N:1) ── [owners]                            [materials]
```

### 3.2 Relational Tables Specification

#### 1. Table: `users_account`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | String / UUID | `PRIMARY KEY` | Unique account ID. |
| `email` | String | `UNIQUE`, `NOT NULL` | Account email address. |
| `password_hash` | String | `NOT NULL` | Hashed password string. |
| `name` | String | `NOT NULL` | Full name. |
| `phone_number` | String | `NOT NULL` | Mobile contact number. |
| `role` | Enum | `NOT NULL` | `'DEVELOPER'`, `'ADMIN'`, `'FRONT_DESK'`, `'MECHANIC'`. |
| `status` | Enum | `NOT NULL, DEFAULT 'PENDING'` | `'PENDING'`, `'APPROVED'`, `'REJECTED'`. |
| `created_at` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp. |

#### 2. Table: `owners`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `owner_id` | String / UUID | `PRIMARY KEY` | Unique customer ID. |
| `name` | String | `NOT NULL` | Owner full name. |
| `contact_number` | String | `NOT NULL` | Owner phone number. |
| `facebook` | String | `NULLABLE` | Owner Facebook profile URL. |
| `created_at` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp. |

#### 3. Table: `vehicles`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `vehicle_id` | String / UUID | `PRIMARY KEY` | Unique vehicle ID. |
| `owner_id` | String / UUID | `FK (owners.owner_id)` | Customer owner reference. |
| `make` | String | `NOT NULL` | Vehicle manufacturer (e.g. Toyota). |
| `model` | String | `NOT NULL` | Model name (e.g. Vios). |
| `year` | Integer | `NOT NULL` | Model manufacturing year. |
| `color` | String | `NOT NULL` | Body paint color. |
| `plate_number` | String | `UNIQUE, NOT NULL` | License plate number. |
| `photo_url` | String | `NULLABLE` | Vehicle photo asset link. |

#### 4. Table: `materials`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `materials_id` | String / UUID | `PRIMARY KEY` | Unique part ID. |
| `name` | String | `NOT NULL` | Material item name. |
| `description` | Text | `NULLABLE` | Specifications / notes. |
| `price` | Float | `NOT NULL` | Unit selling price. |

#### 5. Table: `labor`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `labor_id` | String / UUID | `PRIMARY KEY` | Unique labor task ID. |
| `labor_name` | String | `NOT NULL` | Service task name. |
| `price` | Float | `NOT NULL` | Base labor cost. |
| `category` | Enum | `NOT NULL` | `'PMS'`, `'AIRCON SERVICES'`, `'MAJOR WORK'`, etc. |

#### 6. Table: `bundles`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `bundle_id` | String / UUID | `PRIMARY KEY` | Unique package bundle ID. |
| `bundle_name` | String | `NOT NULL` | Package title (e.g. Basic PMS). |
| `interval` | String | `NOT NULL` | Service mileage/interval rule. |
| `original_price` | Float | `NOT NULL` | Sum of constituent labor costs. |
| `discounted_price` | Float | `NOT NULL` | Package discounted rate. |

#### 7. Table: `job_orders`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `jo_id` | String / UUID | `PRIMARY KEY` | Unique Job Order ID. |
| `vehicle_id` | String / UUID | `FK (vehicles.vehicle_id)` | Linked vehicle asset. |
| `owner_id` | String / UUID | `FK (owners.owner_id)` | Linked customer owner. |
| `bundle_id` | String / UUID | `FK (bundles.bundle_id)` | Selected package bundle. |
| `odometer` | Integer | `NOT NULL` | Check-in odometer reading. |
| `status` | Enum | `NOT NULL, DEFAULT 'New'` | `'New'`, `'Work in progress'`, `'Job completed'`. |
| `created_at` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp. |

#### 8. Table: `checklist_details`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `cd_id` | String / UUID | `PRIMARY KEY` | Inspection item ID. |
| `jo_id` | String / UUID | `FK (job_orders.jo_id)` | Parent Job Order link. |
| `labor_id` | String / UUID | `FK (labor.labor_id)` | Target labor task inspected. |
| `status` | Enum | `NOT NULL, DEFAULT 'Pending'` | `'GOOD'`, `'ISSUE'`, `'MONITOR'`, `'PENDING'`. |
| `diagnostic_notes` | Text | `NULLABLE` | Diagnostic comments. |
| `visual_proof` | String | `NULLABLE` | Proof image URL. |

#### 9. Table: `cart`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `cart_id` | String / UUID | `PRIMARY KEY` | Cart recommendation ID. |
| `cd_id` | String / UUID | `FK (checklist_details.cd_id)` | Linked inspection item. |
| `materials_id` | String / UUID | `FK (materials.materials_id)` | Recommended material item. |
| `price` | Float | `NOT NULL` | Price snapshot. |
| `quantity` | Integer | `NOT NULL, DEFAULT 1` | Required part quantity. |
| `decision` | Enum | `NOT NULL, DEFAULT 'No'` | Customer approval (`'Buy'`, `'No'`). |

#### 10. Table: `reminders`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `reminder_id` | String / UUID | `PRIMARY KEY` | Reminder record ID. |
| `vehicle_id` | String / UUID | `FK (vehicles.vehicle_id)` | Linked vehicle asset. |
| `owner_id` | String / UUID | `FK (owners.owner_id)` | Linked customer owner. |
| `start_date` | Date | `NOT NULL` | Last service date. |
| `target_date` | Date | `NOT NULL` | Next schedule date. |
| `status` | Enum | `NOT NULL` | `'Pending'`, `'Due Soon'`, `'Overdue'`, `'Completed'`. |

---

## 4. 🔌 REST API Endpoints Specification

### Auth & Users Endpoints (`/api/auth`, `/api/users`)
- `POST /api/auth/signup`: Body `{ email, password, name, phone_number, role }` $\rightarrow$ Returns UserResponse.
- `POST /api/auth/login`: Body `{ email, password }` $\rightarrow$ Returns JWT token & UserResponse.
- `GET /api/users/pending`: Returns List of `UserResponse` where `status == "PENDING"`.
- `PATCH /api/users/{user_id}/status`: Body `{ status: "APPROVED" | "REJECTED" }`.

### Master Data Endpoints (`/api/master`)
- `GET /api/master/owners`: Returns List of owners with nested `vehicles`.
- `GET /api/master/vehicles`: Returns List of vehicles with owner metadata.
- `GET /api/master/materials`: Returns List of materials inventory.
- `GET /api/master/bundles`: Returns List of bundles with constituent labors.

### Job Orders Endpoints (`/api/job-orders`)
- `GET /api/job-orders`: Returns List of Job Orders with `checklist_details`, `inchargeMechanics`, and `cart`.
- `POST /api/job-orders`: Body `{ vehicleId, ownerId, bundleId, odometer, inchargeMechanics }`.
- `PATCH /api/job-orders/{jo_id}`: Body `{ status, inspectionItems, estimateItems, discount, estimateComment }`.

### Reminders Endpoints (`/api/reminders`)
- `GET /api/reminders`: Returns List of reminders with owner contact number & FB link.
- `PATCH /api/reminders/{id}`: Body `{ targetDate, odometer }`.
