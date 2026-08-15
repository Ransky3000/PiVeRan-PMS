# PiVeRan PMS — Project Development Documentation

---

## 📋 Document Metadata

| Field | Details |
| :--- | :--- |
| **Project Name** | **PiVeRan PMS** (Preventive Maintenance System) |
| **Document Version** | `v1.0.0` (Fresh Start) |
| **Primary Owner** | Ranian J. Rulona |
| **Current SDLC Phase** | **Phase 2: Requirement Analysis** `[ACTIVE]` |
| **Last Updated** | August 16, 2026 |

---

## 📌 SDLC Phase 1: Planning (Active Phase)

### 1.1 Operational Flow & Lifecycle
- **Actors:** Vehicle Owner (Customer), Front Desk (Service Advisor), Mechanic (Technician).
- **13-Step Workflow:** Arrival $\rightarrow$ Service Request $\rightarrow$ Service Inquiry $\rightarrow$ Package Selection $\rightarrow$ Garage Positioning $\rightarrow$ Job Order Creation $\rightarrow$ Inspection Start $\rightarrow$ Work In Progress $\rightarrow$ Checklist Complete $\rightarrow$ Job Completion $\rightarrow$ Pickup Notification $\rightarrow$ Billing Presentation $\rightarrow$ Payment Settlement.
- **Job Order Lifecycle:**
  `[ Job Created ] ──> [ In Progress ] ──> [ Checklist Complete ] ──> [ Job Complete ] ──> [ Ready for Pickup ] ──> [ Paid/Closed ]`
- **Inspection Matrix:** See [MASTER_PMS_LEVEL_PACKAGES_AND_INSPECTION_SEQUENCE.md](file:///c:/Users/USER/Desktop/Ranian's%20file/PiVeRan-PMS/MASTER_PMS_LEVEL_PACKAGES_AND_INSPECTION_SEQUENCE.md) for Level 1–3 packages and the 59-item, 3-stage physical garage inspection flow.

### 1.2 Technology Stack & Platform Strategy
- **Frontend Stack:** Next.js (App Router, React 19) · TypeScript · Vanilla CSS (CSS Modules + CSS Variables) · Framer Motion · Lucide React.
- **Backend Stack (MVP Phase):** **Python (FastAPI)** with **SQLite** (via SQLAlchemy ORM / Alembic) for rapid local development and schema flexibility.
- **Production Upgrade Roadmap (Sir Keith's Spec):** Migrate database to **PostgreSQL** and containerize frontend and backend servers using **Docker & Docker Compose**.
- **Platform Scope:** Responsive Web Application (Desktop, Tablet, Mobile). *PWA features deferred to post-MVP.*

### 1.3 Engineering & Architectural Principles
- **Maintainable OOP & Data Structure Patterns:** Apply clean domain modeling, typed data structures, and modular abstractions for developer readability and scalability.
- **Strict File Modularization ($\le$ 300 LOC):** Keep files under 300 lines of code unless strictly justified; enforce single-responsibility component design.
- **Anti-Bloat Clean Logic:** Write concise, readable, and idiomatic TypeScript code; avoid redundant boilerplate and over-nested logic.
- **Over-Designed UI Standard:** Deliver state-of-the-art UI aesthetics, glassmorphism, fluid Framer Motion micro-animations, custom typography, and curated color palettes.
- **Decoupled Folder Architecture (`frontend/` & `backend/`):** Enforce developer-standard directory separation into `frontend/` (Next.js app, UI components, styles) and `backend/` (Python FastAPI service, SQLite/PostgreSQL schemas, Alembic migrations).

---

## 📌 SDLC Phase 2: Requirement Analysis (Completed)

### 2.1 User Authentication & Registration Flow

#### 🔄 Multi-Step Registration (Sign-Up) Flow
1. **Form Step 1 (Credentials):** User enters Email / Google Account and creates a Password.
2. **Form Step 2 (Profile & Role):** User enters Full Name, Phone Number, and selects requested Role (strictly `"Front Desk"` or `"Mechanic"`).
3. **Submission & Gate:** User submits application $\rightarrow$ System sets account status to `PENDING_APPROVAL` and displays: *"Wait for Admin to confirm"*.

#### 🔐 Admin Approval & Sign-In Flow
1. **Admin Review:** Admin receives registration request and approves/accepts account (`status = 'APPROVED'`).
2. **Authentication:** User enters Email/Google Account and Password.
3. **Session & Redirect:** System verifies credentials + `APPROVED` status $\rightarrow$ grants session token and redirects user to their role-specific PiVeRan-PMS workspace view.

#### 🗄️ Initial Entity Schema: `Users_account`

| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID / String | `PRIMARY KEY` | Unique identifier. |
| `email` | String | `UNIQUE`, `NOT NULL` | Email address / OAuth identifier. |
| `password_hash` | String | `NOT NULL` | Hashed password string. |
| `name` | String | `NOT NULL` | User's full name. |
| `phone_number` | String | `NOT NULL` | Contact number. |
| `role` | Enum / String | `NOT NULL` | Selectable: `"Front Desk"`, `"Mechanic"` (System Admin seeded internally). |
| `status` | Enum / String | `NOT NULL`, `DEFAULT 'PENDING'` | `"PENDING"`, `"APPROVED"`, `"REJECTED"`. |
| `created_at` | Timestamp | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp. |

---

### 2.2 Role-Based Menus & Front Desk Data Entities

#### 🧭 Role Navigation Matrix
- **Admin Menu:** User Management (`Users_account` approvals and account status management).
- **Front Desk Menus:** Vehicle · Owner · Materials · Labor · Bundle · Job Order.
- **Mechanic Menu:** Job Order (Inspection sequence & checklist progress).

#### 🗄️ Front Desk Data Schemas & Operational Flows

##### 1. `Vehicle` Entity
- **Fields:** `vehicle_id` (PK), `make`, `model`, `year`, `color`, `plate_number` (UNIQUE), `photo` (Image URL / File Path).
- **Flow:** Front Desk inputs Make $\rightarrow$ Model $\rightarrow$ Year $\rightarrow$ Color $\rightarrow$ Plate Number $\rightarrow$ Vehicle Photo $\rightarrow$ Vehicle saved to database table.

##### 2. `Owner` Entity
- **Fields:** `owner_id` (PK), `name`, `facebook`, `contact_number`, `vehicles` (List / Junction table `owner_vehicles` linking `owner_id` $\leftrightarrow$ `vehicle_id`).
- **Flow:** Front Desk inputs Owner Name $\rightarrow$ Facebook link $\rightarrow$ Contact Number $\rightarrow$ Selects multiple Vehicles $\rightarrow$ Owner saved to database table.

##### 3. `Materials` Entity
- **Fields:** `materials_id` (PK), `name`, `description`, `price` (Decimal).
- **Flow:** Front Desk inputs Material Name $\rightarrow$ Description $\rightarrow$ Price $\rightarrow$ Material saved to database table.

##### 4. `Labor` Entity
- **Fields:** `labor_id` (PK), `labor_name`, `price` (Decimal), `category` (Enum: `"PMS"`, `"AIRCON SERVICES"`, `"MAJOR WORK"`, `"UNDER CHASSIS"`, `"COOLING SYSTEM RESTORATION"`).
- **Flow:** Front Desk inputs Labor Name $\rightarrow$ Price $\rightarrow$ Selects 1 of 5 Master Categories $\rightarrow$ Labor item saved to database table.

##### 5. `Bundle` Entity
- **Fields:** `bundle_id` (PK), `bundle_name`, `services` (List / Junction table `bundle_services` linking `bundle_id` $\leftrightarrow$ `labor_id`), `interval` (String), `original_price` (Decimal, auto-summed), `discounted_price` (Decimal).
- **Flow:** Front Desk inputs Bundle Name $\rightarrow$ Selects multiple Labor Services $\rightarrow$ Sets Service Interval $\rightarrow$ System auto-computes Original Price sum $\rightarrow$ Inputs Discounted Package Price $\rightarrow$ Bundle saved to database table.

#### 🧠 Relational Ecosystem (How Entities Feed the Job Order)
These five master data entities serve as the foundational building blocks for creating a Job Order efficiently:
1. **The Subjects (`Vehicle` & `Owner`):** The `Owner` table links to multiple `Vehicle` records (One-to-Many). Once registered, the Front Desk selects the existing profile for future visits without re-typing details.
2. **The Service Inventory (`Materials`, `Labor`, & `Bundle`):** `Materials` and `Labor` act as atomic inventory items. A `Bundle` is a composite entity aggregating multiple `Labor` records into a single packaged service with a discounted price.
3. **Job Order Synergy:** When generating a Job Order, the Front Desk simply selects the **Owner/Vehicle**, picks a **Bundle** (which automatically populates the Mechanic's labor checklist), and attaches any extra **Materials**. This OOP/Relational architecture guarantees data consistency, accelerates Job Order creation, and eliminates manual entry errors.

### 2.3 Job Order Flow & Data Architecture

The Job Order acts as the central hub bridging Front Desk creation and Mechanic execution. It enforces a strict separation of concerns: **Mechanics inspect and recommend (adding parts to Cart), while the Front Desk (acting for the customer) approves the actual purchase.**

#### 🗄️ Job Order Data Schemas

##### 1. `Job_order` (Parent Table)
- **Fields:** `JO_id` (PK), `owner_id` (FK), `vehicle_id` (FK), `odometer`, `service_type` (FK to `Bundle`), `incharge` (List of `user_id` where Role = "Mechanic"), `status` (Enum: `"New"`, `"Work in progress"`, `"Job Completed"`).
- **Purpose:** Holds high-level metadata connecting the Customer, Asset, Service Package, and assigned Technicians.

##### 2. `Checklist_details` (Child Table)
- **Fields:** `CD_id` (PK), `JO_id` (FK), `labor_type` (FK to `Labor`), `status` (Enum: `"Good"`, `"Issue"`, `"Monitor"`, default `"Pending"`), `diagnostic_notes` (Text), `visual_proof` (Image URL).
- **Purpose:** The specific inspection items tied to the Job Order. Holds the mechanic's findings for each step in the auto-generated DVI checklist.

##### 3. `Cart` (Grandchild Table)
- **Fields:** `cart_id` (PK), `CD_id` (FK), `materials_id` (FK), `quantity`, `price`, `decision` (Enum: `"Buy"`, default `"No"`).
- **Business Logic ("Buy" vs "No"):** Crucially accommodates real-world edge cases where customers bring their own parts (BYO) or defer replacements due to budget. A Mechanic recommends a part (adding to Cart), but the Front Desk retains final control to set `decision = "No"`—zeroing the shop's material cost while retaining the labor charge.

#### 🔄 Job Order State Machine & Actor Handoff
1. **Creation (Status: "New" - Front Desk):** Front Desk selects Owner, Vehicle, Bundle, and Mechanics. System auto-generates the `Checklist_details` (DVI checklist).
2. **Execution (Status: "Work in progress" - Mechanic):** Mechanic iterates through the checklist, marking status, adding notes/photos, and pushing recommended parts to the `Cart`.
3. **Approval (Status: "Job Completed" - Front Desk):** Front Desk reviews the `Cart`, finalizes the "Buy" or "No" decisions based on customer budget/BYO parts, and closes the Job Order.

---

## 📌 SDLC Phase 3: System Design & Architecture (Active Phase)

### 3.1 Authentication & Registration UI/UX Wireframe Specs

Based on the official mockups, the authentication flow features a modern, clean, emerald-themed design system.

#### 🎨 Design System & Theme Tokens
- **Brand Identity:** PiVeRan PMS flame logo emblem + bold typography.
- **Color Palette:** Emerald Green (`#047857` primary, `#064e3b` dark emerald hero card), soft slate text (`#475569`), light gray background (`#F8FAFC`), crisp white card containers (`#FFFFFF`).
- **Typography & Components:** Rounded input fields, pill-shaped step badges, smooth hover/focus transitions.

#### 📱 Layout Breakdown & Views

##### View 0: `/login` — Staff Sign In
- **Header:** Centralized PiVeRan PMS flame logo emblem.
- **Title:** `"Welcome back"`.
- **OAuth:** Full-width `Continue with Google` button with official Google SVG logo.
- **Divider:** Line divider labeled `"OR WORK EMAIL"`.
- **Inputs:** 
  - `Email` (text input with placeholder e.g. `name@reyauto.com`).
  - `Password` (password input with eye icon toggle for visibility + right-aligned `Forgot your password?` link).
- **Actions:** `Sign in` primary emerald button, `Don't have an account? Sign up` secondary link, and Terms of Service / Privacy Policy footer.

##### View 1: `/signup` — Step 1 of 2 (Credentials)
- **Header:** Centralized PiVeRan PMS logo + `Step 1 of 2 — Credentials` pill badge.
- **Title:** `"Create an account"`.
- **OAuth:** Full-width `Sign up with Google` button with official Google SVG logo.
- **Divider:** Line divider labeled `"OR WORK EMAIL"`.
- **Inputs:** 
  - `Work Email` (text input with placeholder e.g. `cedrick@reyauto.com`).
  - `Password` (password input with eye icon toggle for visibility).
- **Actions:** `Continue →` primary emerald button, `Already registered? Sign in` link, and Terms of Service / Privacy Policy footer.

##### View 2: `/signup` — Step 2 of 2 (Staff Profile Setup)
- **Header:** PiVeRan PMS logo + `Step 2 of 2 — Staff Profile Setup` pill badge.
- **Title:** `"Complete your profile"`.
- **Auth Banner:** Verified pill badge displaying `Google Authenticated: google.user@piveran.com`.
- **Inputs:**
  - `Your name` (text input e.g. `Alex Mercer`).
  - `Mobile Phone Number` (numeric text input e.g. `9473702512`).
  - `Role` (custom styled dropdown strictly featuring `"Front desk"` and `"Mechanic"` options).
- **Actions:** `Submit Application` primary emerald button, `← Back to Step 1` secondary button, and `Sign in` link.

##### View 3: `/pending-approval` — Verification Gate
- **Layout:** Split-card modal container.
- **Left Panel (Hero Brand Card):** Dark Emerald background featuring flame logo, `"Application Status"`, subtitle *"Your staff registration is undergoing verification by Admin."*, and baseline text *"PIVERAN AUTO MANAGEMENT SYSTEMS"*.
- **Right Panel (Details & Status):**
  - **Status Header:** `PENDING ADMIN REVIEW` amber pill badge.
  - **Summary Box:** Key-value pairs for `Applicant`, `Role`, `Email`, and `Phone`.
  - **Real-time Notice:** *"You will automatically be redirected once Admin approves your application. You can also check back here anytime."*
  - **Demo Toggles:** State switcher pill buttons (`Pending State` vs `Needs Revision Loop`).
  - **Footer Action:** `← Return to Sign In` link.

### 3.2 Admin Dashboard & User Management UI/UX Specs (`/admin/users`)

The Admin User Management view features a dark navy side navigation panel combined with a clean light workspace for reviewing staff applications and active user accounts.

#### 🎨 Admin Layout Design System
- **Sidebar Palette:** Dark Navy (`#0F172A`), Active Menu Item Emerald Green (`#047857`), Active Role Badge Card (`#1E293B`).
- **Main Workspace Palette:** Off-white background (`#F8FAFC`), pure white table cards (`#FFFFFF`), slate headers (`#64748B`).

#### 📱 Components Breakdown

##### 1. Left Sidebar Navigation
- **Branding Header:** PiVeRan PMS flame logo + shop subtitle `"REY AUTO REPAIR"` + collapse arrow (`<`).
- **Active Role Card:** Badge showing `ACTIVE ROLE: System Owner`.
- **Navigation Item:** `User Management` menu item with active emerald styling and an amber notification counter pill (e.g. `1` for pending applications).

##### 2. Top Navigation Bar
- **Global Search:** Light gray rounded search input (`Search vehicles, job orders, parts...`) with search icon.

##### 3. Main Workspace (`User Management`)
- **Header:** Title `"User Management"` + Subtitle *"Approve pending staff registration requests and manage active staff accounts"*.
- **Filter Tabs & Search:**
  - `Applicants (1)` tab with clock icon (Active dark pill tab).
  - `Active Staff (3)` tab with users icon (Inactive light tab).
  - Table Filter Search: `Search name or email...` input field.
- **Applicants Table Structure:**
  - **Columns:** `NAME` · `EMAIL ADDRESS` · `PHONE NUMBER` · `ROLE` · `ACTIONS`.
  - **Role Badge:** Soft blue pill badge for `"Front Desk"` or `"Mechanic"`.
  - **Action Buttons:**
    - Emerald Green checkmark button (`✓`) to Approve applicant (`status = 'APPROVED'`).
    - Soft Red cross button (`✕`) to Reject applicant (`status = 'REJECTED'`).

### 3.3 Front Desk Dashboard UI/UX Specs (`/frontdesk/job-orders`)

The Front Desk workspace features a comprehensive navigation system and visual card-based Job Order management system.

#### 🎨 Front Desk Layout Design System
- **Sidebar Palette:** Dark Navy (`#0F172A`), Active Role Card `Front Desk Manager` (`#1E293B`), Active Menu Emerald Pill (`#047857`).
- **Card Containers:** Rounded white cards (`#FFFFFF`) with top vehicle photo thumbnails, status pill badges, and progress bars.

#### 📱 Components & Layout Breakdown

##### 1. Left Sidebar Navigation
- **Header:** PiVeRan PMS flame emblem + shop subtitle `"REY AUTO REPAIR"` + collapse arrow (`<`).
- **Active Role Card:** Badge showing `ACTIVE ROLE: Front Desk Manager`.
- **Navigation Menus:**
  - `Job Order` (Active, Emerald rounded pill)
  - `Vehicles`
  - `Vehicle Owners`
  - `Mechanics`
  - `Services`
  - `Materials`
- **User Profile Footer:** Bottom-left avatar + User Name (e.g. `Sir Cedrick`), email (`cedrick@piveran.com`), and logout button (`↳`).

##### 2. Main Workspace (`Job Order Management`)
- **Header:** Title `"Job Order Management"` / Subtitle *"Front Desk Job Orders"* + Primary Action Button `+ Create Job Order` (Top-Right, Emerald Green).
- **Tab Filters (Simplified per User Specs):**
  - `New (2)` (Active dark pill)
  - `Work in progress (1)`
  - ~`Ready for pickup`~ *(Removed per user marking)*
  - `Job completed (2)`
  - **Search Bar (Right):** `Search JO #, Owner, Plate...` input field.
- **Job Order Visual Grid Cards:**
  - **Vehicle Thumbnail:** High-quality photo of vehicle at top of card.
  - **Status Badge (Top-Left of Image):** Gold pill for `New`, Blue pill for `Work in progress`.
  - **Vehicle Info:** Bold title (e.g. `Toyota Vios 2018`, `Nissan Navara 2022`, `Mitsubishi Montero 2020`) + Owner line (e.g. `Owner: Juan Dela Cruz`).
  - **Service Type:** Package name (e.g. `Basic PMS`, `Major / Full PMS`).
  - **Incharge Mechanics:** Pill tags listing assigned technicians (e.g. `Rodel Santos`, `Mark Rey`, `John Uy`).
  - **Inspection Progress Bar (In Progress Cards):** Green progress tracker bar with completion text (e.g. `7/11 Completed`).
  - **Card Footer:** Timestamp (e.g. `Today, 10:15 AM`) + right chevron navigation arrow (`>`).
- **Floating Widgets:** ~`Role view: Front Desk`~ widget removed per user explicit red marking.

### 3.4 Service Catalog & Master PMS Package Builder UI/UX Specs (`/frontdesk/bundles`)

*(Note: The `Services` sidebar menu has been renamed to **`Bundle`**)*

#### 📱 Layout Breakdown & Sub-Views

##### View 1: `/frontdesk/bundles` — `Labor (30)` Tab
- **Page Header:** `Service Catalog & Master PMS Package Builder` with subtitle `Manage shop labor rates, inspection services, and master PMS package bundles for Rey Auto Repair Shop`.
- **Top Right Action:** `+ Add New Labor` button (Emerald `#10B981`).
- **Tab Bar:** Dark active pill `Labor (30)` vs outline inactive pill `Package Service (3)`.
- **Search & Filters Bar:** `Search labor or packages...` input + `All Categories` filter dropdown.
- **Labor Items Table:**
  - Column Headers: `LABOR NAME`, `PRICE`, `CATEGORY`, `DESCRIPTION`.
  - Item Rows: Single-line display with formatted PHP prices (e.g. `₱650.00`), category tags (`PREVENTIVE MAINTENANCE SERVICE`), and detailed labor scope descriptions.

##### View 2: `/frontdesk/bundles` — `Package Service (3)` Tab
- **Top Right Action:** `+ Create New Package` button (Emerald `#10B981`).
- **3-Column PMS Package Card Grid:**
  - **Card Header:** Package ID badge (`PKG-LVL 1`, `PKG-LVL 2`, `PKG-LVL 3`) + optional `MOST POPULAR` green badge.
  - **Title & Interval Badge:** Level Title (e.g. `Level 1: Basic PMS Package`) + time/mileage pill (`🕒 Every 10,000 KM or 6 Months`).
  - **Included Services Checklist:** Bulleted list of constituent labor items with emerald checkmark icons (`✔`).
  - **Pricing Breakdown:** Strikethrough standalone total sum (`Standalone Sum: ₱4,800.00`) + bold discounted package price (`₱3,850.00`).
  - **Footer Action:** Full-width dark navy button `Assign PMS Level Package`.

##### View 3: Modal — `Create new bundle`
- **Dialog Form Controls:**
  - `Title (required)` input (`Add title`).
  - `Description` multiline textarea (`Add description`).
  - Two-Column Row: `Service Interval` (`e.g. Every 10,000 KM`) + `Package Rate (₱)` (`Default: ₱900`).
  - `Labors & Base Packages` selection bar with `+ Add labors & packages` trigger button and removable item chips (`Change Oil ✕`, `Replace Oil Filter ✕`).
- **Footer Actions:** `Cancel` text link + `Create` button.

##### View 4: Sub-Modal — `Add labors & packages`
- **Two-Pane Selection Drawer:**
  - **Left Pane (Catalog Search & Selection):** Search bar + `All Items` category filter. Checkbox list grouped by `EXISTING PMS PACKAGES` and `PREVENTIVE MAINTENANCE SERVICE` labor items.
  - **Right Pane (Reordering & Summary):** Draggable items list with drag handles (`::`) for sequence ordering + real-time standalone total sum (e.g. `₱15,100.00`).
- **Footer Actions:** `Cancel` text link + `Done` black pill button.

---

### 3.5 Backend Relational Database Schemas (SQLite / Python FastAPI)

The backend relational database architecture consists of **11 normalized tables**, formatted below with explicit DB column names, UI display labels, constraints, and foreign key relations:

#### 1. User & Staff Management

##### 📋 Table: `users_account`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `User ID` | String / UUID | `PRIMARY KEY` | Unique user account identifier. |
| `email` | `Email` | String | `UNIQUE`, `NOT NULL` | User email for authentication. |
| `password_hash` | *(Hidden)* | String | `NOT NULL` | Hashed password string. |
| `name` | `Name` | String | `NOT NULL` | User's full name. |
| `phone_number` | `Phone Number` | String | `NOT NULL` | Mobile phone contact. |
| `role` | `Role` | Enum | `NOT NULL` | Selectable: `'System Owner'`, `'Front Desk'`, `'Mechanic'`. |
| `status` | `Status` | Enum | `NOT NULL`, `DEFAULT 'PENDING'` | Account gate status: `'PENDING'`, `'APPROVED'`, `'REJECTED'`. |
| `created_at` | `Created Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Account registration timestamp. |

---

#### 2. Master Data Catalog Entities

##### 📋 Table: `owners`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description / Relationship Rule |
| :--- | :--- | :--- | :--- | :--- |
| `owner_id` | `owner_id` | String / UUID | `PRIMARY KEY` | Unique customer owner identifier. |
| `name` | `Name` | String | `NOT NULL` | Customer's full name. |
| `facebook` | `Facebook` | String | `NULLABLE` | Social profile URL / contact info. |
| `contact_number` | `Contact_number` | String | `NOT NULL` | Customer phone number. |
| *(Relationship)* | `Vehicles` | List / Rel | `ONE-TO-MANY (vehicles)` | List of vehicles owned (`Enumlist -> vehicle_id`). |
| `created_at` | `Created Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp. |

##### 📋 Table: `vehicles`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description / Relationship Rule |
| :--- | :--- | :--- | :--- | :--- |
| `vehicle_id` | `vehicle_id` | String / UUID | `PRIMARY KEY` | Unique vehicle asset identifier. |
| `owner_id` | `Owner` | String / UUID | `FK (owners.owner_id)` | Customer owner reference (`Enum -> owner_id.Name`). |
| `make` | `Make` | String | `NOT NULL` | Vehicle manufacturer (e.g. Toyota). |
| `model` | `Model` | String | `NOT NULL` | Model name (e.g. Vios). |
| `year` | `Year` | Integer | `NOT NULL` | Model manufacturing year (e.g. 2018). |
| `color` | `Color` | String | `NOT NULL` | Body paint color. |
| `plate_number` | `Plate Number` | String | `UNIQUE`, `NOT NULL` | License plate registration number. |
| `photo_url` | `Photo` | String | `NULLABLE` | Vehicle photo asset URL. |
| `created_at` | `Created Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp. |

##### 📋 Table: `materials`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description |
| :--- | :--- | :--- | :--- | :--- |
| `materials_id` | `Materials ID` | String / UUID | `PRIMARY KEY` | Unique material/part identifier. |
| `name` | `Material Name` | String | `NOT NULL` | Part item name (e.g. Engine Oil 5W-30). |
| `description` | `Description` | Text | `NULLABLE` | Item specifications or notes. |
| `price` | `Price` | Float | `NOT NULL` | Unit selling price. |
| `created_at` | `Created Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp. |

##### 📋 Table: `labor`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description |
| :--- | :--- | :--- | :--- | :--- |
| `labor_id` | `Labor ID` | String / UUID | `PRIMARY KEY` | Unique labor service identifier. |
| `labor_name` | `Labor Name` | String | `NOT NULL` | Service name (e.g. Throttle Body Cleaning). |
| `price` | `Price` | Float | `NOT NULL` | Base labor service cost. |
| `category` | `Category` | Enum | `NOT NULL` | Category: `'PMS'`, `'AIRCON SERVICES'`, `'MAJOR WORK'`, etc. |
| `created_at` | `Created Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp. |

##### 📋 Table: `bundles`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description / Relationship Rule |
| :--- | :--- | :--- | :--- | :--- |
| `bundle_id` | `Bundle_id` | String / UUID | `PRIMARY KEY` | Unique PMS bundle package identifier. |
| `bundle_name` | `Bundle_name` | String | `NOT NULL` | Package title (e.g. Basic PMS). |
| *(Relationship)* | `Services` | List / Rel | `MANY-TO-MANY (bundle_services)` | List of constituent labor items (`Enumlist -> labor_id.Labor_name`). |
| `interval` | `Interval` | String | `NOT NULL` | Service mileage/time rule (e.g. Every 5,000 km). |
| `original_price` | `Original Price` | Float | `NOT NULL` | Calculated sum of baseline labor items. |
| `discounted_price` | `Discounted Price` | Float | `NOT NULL` | Package discounted price. |
| `created_at` | `Created Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp. |

##### 📋 Table: `bundle_services` (Junction Table)
| DB Column Name | UI Display Label | Type | Constraint / FK | Description |
| :--- | :--- | :--- | :--- | :--- |
| `bundle_id` | `Bundle ID` | String / UUID | `PRIMARY KEY, FK (bundles.bundle_id)` | Linked bundle package. |
| `labor_id` | `Labor ID` | String / UUID | `PRIMARY KEY, FK (labor.labor_id)` | Linked constituent labor service item. |

---

#### 3. Job Order & Inspection Workflow

##### 📋 Table: `job_orders`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description / Relationship Rule |
| :--- | :--- | :--- | :--- | :--- |
| `jo_id` | `JO_id` | String / UUID | `PRIMARY KEY` | Unique Job Order identifier. |
| `owner_id` | `Owner` | String / Rel | `FK (owners.owner_id)` | Customer profile reference (`Enum -> owner_id.Name`). |
| `vehicle_id` | `Vehicle` | String / Rel | `FK (vehicles.vehicle_id)` | Vehicle asset reference (`Enum -> owner_id.Vehicles`). |
| *(Derived)* | `Vehicle Photo` | String / Lookup | `Lookup (vehicles.photo_url)` | Vehicle photo asset URL (`owner_id.Vehicles.Photo`). |
| `odometer` | `Odometer` | Integer | `NOT NULL` | Vehicle mileage reading at check-in (Km). |
| `bundle_id` | `Service_type` | String / Rel | `FK (bundles.bundle_id)` | Selected PMS bundle package (`Enum -> bundle_id.bundle_name`). |
| *(Derived)* | `Service_description` | String / Lookup | `Lookup (bundles.interval)` | Package mileage/interval rule (`bundle_id.Interval`). |
| *(Relationship)* | `DVI_checklist` | List / Rel | `ONE-TO-MANY (checklist_details)` | Checklist items list (`Enumlist -> CD_id`). |
| *(Relationship)* | `Incharge` | List / Rel | `MANY-TO-MANY (job_order_mechanics)` | Assigned mechanic staff list (`Enumlist -> user_id.Name \| Filter "Mechanic"`). |
| `status` | `Status` | Enum | `NOT NULL, DEFAULT 'New'` | Job state: `'New'`, `'Work in progress'`, `'Job completed'`. |
| `created_at` | `Created Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Job Order creation timestamp. |
| `updated_at` | `Updated Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Last status update timestamp. |

##### 📋 Table: `job_order_mechanics` (Junction Table)
| DB Column Name | UI Display Label | Type | Constraint / FK | Description |
| :--- | :--- | :--- | :--- | :--- |
| `jo_id` | `JO_id` | String / UUID | `PRIMARY KEY, FK (job_orders.jo_id)` | Target Job Order. |
| `user_id` | `Mechanic` | String / UUID | `PRIMARY KEY, FK (users_account.user_id)` | Assigned mechanic staff member. |

##### 📋 Table: `checklist_details`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description / Relationship Rule |
| :--- | :--- | :--- | :--- | :--- |
| `cd_id` | `CD_id` | String / UUID | `PRIMARY KEY` | Unique checklist item identifier. |
| `jo_id` | `JO_id` | String / UUID | `FK (job_orders.jo_id)` | Parent Job Order link. |
| `labor_id` | `Labor_type` | String / Rel | `FK (labor.labor_id)` | Constituent labor task inspected (`Enum -> bundle_id.Service`). |
| `status` | `Status` | Enum | `NOT NULL, DEFAULT 'Pending'` | Inspection finding (`'Good'`, `'Issue'`, `'Monitor'`, default: `'Pending'`). |
| *(Relationship)* | `Materials` | List / Rel | `ONE-TO-MANY (cart)` | Recommended parts list (`Enumlist -> Cart_id`). |
| `visual_proof` | `Visual_proof` | String | `NULLABLE` | Image path of visual evidence photo. |
| `diagnostic_notes` | `Diagnostic_notes` | Text | `NULLABLE` | Mechanic's observation comments. |
| `updated_at` | `Updated Date` | DateTime | `DEFAULT CURRENT_TIMESTAMP` | Last inspection timestamp. |

##### 📋 Table: `cart`
| DB Column Name | UI Display Label | Type | Constraint / FK | Description / Relationship Rule |
| :--- | :--- | :--- | :--- | :--- |
| `cart_id` | `Cart_id` | String / UUID | `PRIMARY KEY` | Unique recommended part cart entry. |
| `cd_id` | `CD_id` | String / UUID | `FK (checklist_details.cd_id)` | Associated inspection checklist item. |
| `materials_id` | `Name` | String / Rel | `FK (materials.materials_id)` | Material part item (`Enum -> materials_id.Name`). |
| `price` | `Price` | Float | `NOT NULL` | Price snapshot (`materials_id.Price`). |
| `quantity` | `Quantity` | Integer | `NOT NULL, DEFAULT 1` | Quantity of parts recommended/required. |
| `decision` | `Decision` | Enum | `NOT NULL, DEFAULT 'No'` | Customer buy approval (`'Buy'`, default: `'No'`). |

---

## 📌 SDLC Phase 4: Implementation & Coding (Active Phase)
*(Frontend and backend workspace initialization, decoupled architecture setup, schema implementation, and component build-out)*

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
| **August 02, 2026** | **Phase 1: Planning** | Outline system scope, PMS package breakdown, tech stack, and role views. | `[ACTIVE]` |
| **August 15, 2026** | **Phase 1: Planning** | Documented 13-step sequence flow, actor interactions, Job Order state lifecycle, Tech Stack (Next.js + Python/SQLite MVP, Postgres/Docker upgrade roadmap), platform strategy, and core engineering principles ($\le$300 LOC limit, OOP/data structures, anti-bloat logic, over-designed UI, decoupled `frontend/` & `backend/` directories). | `[COMPLETED]` |
| **August 16, 2026** | **Phase 2: Requirement Analysis** | Documented Authentication flow, role menus, Front Desk entities (`Vehicle`, `Owner`, `Materials`, `Labor`, `Bundle`), and the full Job Order flow bridging Front Desk creation, Mechanic execution (DVI checklists), and Customer part approval logic (Buy vs No). | `[COMPLETED]` |
| **August 16, 2026** | **Phase 3: System Design & Architecture** | Documented UI/UX specs (`/login`, `/signup`, `/pending-approval`, `/admin/users`, `/frontdesk/job-orders`) and 11-table backend SQLite relational database schema. | `[COMPLETED]` |
| **August 16, 2026** | **Phase 4: Implementation & Coding** | Kickoff Phase 4: Initializing decoupled `frontend/` and `backend/` project structures. | `[ACTIVE]` |
