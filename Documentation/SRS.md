# PiVeRan PMS — Software Requirements Specification (SRS)

---

## 📋 Document Metadata

| Field | Details |
| :--- | :--- |
| **Document Title** | **Software Requirements Specification (SRS)** |
| **Project** | **PiVeRan PMS** (Preventive Maintenance System) |
| **Document Version** | `v1.0.0` |
| **Author / Owner** | Senior Dev Pair / Ranian J. Rulona |
| **Last Updated** | August 26, 2026 |

---

## 1. 🎯 Executive Summary & Purpose

PiVeRan PMS is an auto repair garage management platform designed for Rey Auto Repair Shop. The system streamlines vehicle check-in, Digital Vehicle Inspection (DVI), Job Order tracking, parts recommendation, preventive maintenance reminders, and staff role management.

---

## 2. 👥 User Personas & System Roles

The system supports 5 distinct role personas:

1. **Developer (`DEVELOPER`):**
   - **Credentials:** `dev@piveran.com` / `#include<piveran123>`
   - **Capabilities:** Accesses system inspector bar (`DevRoleBar`) to impersonate any registered account persona (Admin, Front Desk, specific Mechanics) for dev testing and debugging.

2. **System Owner / Admin (`ADMIN`):**
   - **Capabilities:** Reviews and approves/rejects pending staff registration requests (`Users_account`), manages active user accounts, and inspects shop analytics.

3. **Front Desk Manager (`FRONT_DESK`):**
   - **Capabilities:** Creates and tracks Job Orders, manages Owner & Vehicle profiles, configures Master Materials & Bundles catalog, reviews mechanic DVI findings, processes customer estimate approvals, and manages Preventive Maintenance Reminders.

4. **Service Technician (`MECHANIC`):**
   - **Capabilities:** Views assigned Job Orders on the Garage Bay Job Board, completes DVI inspection items with visual proof photo uploads, records diagnostic notes, and recommends material requirements.

5. **Vehicle Owner (`CUSTOMER`):**
   - **Capabilities:** Reviews digital inspection results, approves/rejects recommended line-item estimates, and receives maintenance reminder updates.

---

## 3. ⚙️ Functional Requirements (FR)

### FR-1: Authentication & Staff Registration Gate
- **FR-1.1:** Staff signup requires email, password, full name, phone number, and role selection (`Front Desk` or `Mechanic`).
- **FR-1.2:** New accounts default to status `PENDING`. Unapproved users are redirected to `/pending-approval` with a verification gate message.
- **FR-1.3:** Admin can approve (`APPROVED`) or reject (`REJECTED`) pending staff applications at `/admin/users`.
- **FR-1.4:** Only approved users can log in and access their role-specific dashboard.

### FR-2: Developer Role & User Impersonation Engine
- **FR-2.1:** A fixed Developer account (`dev@piveran.com` / `#include<piveran123>`) is seeded in the database with role `DEVELOPER` and status `APPROVED`.
- **FR-2.2:** When logged in as `DEVELOPER`, the system displays the floating `DevRoleBar` inspector toolbar.
- **FR-2.3:** The Dev bar permits switching active perspectives to test role workflows.
- **FR-2.4:** Under Mechanic role, the Dev bar presents a sub-identity dropdown of all registered mechanic accounts (e.g. `Rodel Santos`, `Mark Rey`). Selecting a mechanic filters the Garage Bay Job Board to show only job orders assigned to that technician (`inchargeMechanics`).

### FR-3: Preventive Maintenance Reminders
- **FR-3.1:** Reminders are grouped into 4 tabs: `Pending`, `Due Soon`, `Overdue`, and `Completed`.
- **FR-3.2 (7-Day Early Notice Rule):**
  - `Overdue`: Target date is strictly in the past (`targetDate < today`).
  - `Due Soon`: Target date is within **7 days** from today (`0 <= targetDate - today <= 7 days`).
  - `Pending`: Target date is more than 7 days in the future.
- **FR-3.3 (Approach A: Pure Linear Timeline Progress Bar):**
  $$\text{Progress \%} = \frac{\text{Current Date} - \text{Start Date}}{\text{Target Date} - \text{Start Date}} \times 100\%$$
  - Progress bar reflects exact un-clamped timeline ratio between Last Service (`startDate`) and Next Schedule (`targetDate`).
- **FR-3.4:** Reminder Drawer permits editing target date and odometer with a **Save Changes** button without prematurely completing the reminder.
- **FR-3.5 (Completed Reminder Conversion to Job Order):** When inspecting a reminder under the `Completed` status tab, the drawer displays a primary `"Create Job Order"` action button (replacing `"Save Changes"`). Clicking this button redirects the user to `/frontdesk/job-orders` and automatically opens the Create Job Order modal with pre-filled `Owner`, `Vehicle`, `Service Type`, and `Odometer` parameters.

### FR-4: Job Order Management & Lifecycle
- **FR-4.1:** Front Desk creates Job Orders by selecting Owner, Vehicle, Bundle package, assigned Mechanics, and odometer reading.
- **FR-4.2:** Job Orders transition through 3 core statuses: `New` $\rightarrow$ `Work in progress` $\rightarrow$ `Job completed`.
- **FR-4.3:** Creation of a Job Order automatically instantiates the constituent DVI inspection checklist details (`checklist_details`).

### FR-5: Digital Vehicle Inspection (DVI) & Proof Uploads
- **FR-5.1:** Mechanics assess DVI items using 4 status options: `GOOD`, `ISSUE`, `MONITOR`, and `PENDING`.
- **FR-5.2:** Mechanics can attach diagnostic notes and multiple proof photo URLs to any inspection item.
- **FR-5.3:** A lightbox viewer allows inspecting high-resolution proof photos.

### FR-6: 4-Step Inline Material Recommendation
- **FR-6.1:** From an inspection item, mechanics can recommend replacement parts via a 4-step inline workflow:
  1. Trigger "Add Material".
  2. Search & Select part from `materials` inventory catalog (`SELECT_PART`).
  3. Enter required quantity (`SET_QUANTITY`).
  4. Save requirement to `Cart` tied to the inspection item.

### FR-7: Customer Estimate Approval & Discounting
- **FR-7.1:** Front Desk reviews mechanic-recommended cart items and customer approvals (`customerApproved`: `true`, `false`, `null`).
- **FR-7.2:** Front Desk can apply a overall discount amount and record estimate comments.

### FR-8: Master Data Catalog Entities
- **FR-8.1 (Vehicles):** Make, Model, Year, Color, License Plate Number, Vehicle Photo asset URL.
- **FR-8.2 (Owners):** Full Name, Phone Number (`contact_number`), Facebook link (`facebook`), linked vehicle assets.
- **FR-8.3 (Materials):** Item Name, Unit Price, Description specs.
- **FR-8.4 (Labor & Categories):** Labor task name, base cost, category (`PMS`, `AIRCON SERVICES`, `MAJOR WORK`, `UNDER CHASSIS`, `COOLING SYSTEM RESTORATION`).
- **FR-8.5 (Bundles):** Bundle title, service interval, constituent labor list, baseline standalone sum, package discounted rate.
- **FR-8.6 (Formatted Number Inputs & Spinner Removal):** All numerical inputs for Interval (KM), Interval (Months), and Prices (Package Rate, Labor Price, Material Price) use clean text inputs with digit-only validation, live space/comma thousands separators, and global CSS spinner suppression (`-webkit-appearance: none; -moz-appearance: textfield;`).

---

## 4. 🛡️ Non-Functional Requirements (NFR)

- **NFR-1 (UI/UX Aesthetics):** State-of-the-art visual presentation with glassmorphism, Framer Motion animations, custom typography, dark navy sidebars, and emerald theme tokens. Baseline MVP UI is strictly prohibited.
- **NFR-2 (File Modularization):** Strictly enforce $\le 300$ lines of code per source file unless explicitly justified.
- **NFR-3 (Decoupled Architecture):** Maintain strict physical separation between `frontend/` (Next.js) and `backend/` (FastAPI).
- **NFR-4 (Performance & Real-Time Sync):** Fast page load times and real-time job order state updates via polling / event subscriptions (`subscribeToJobOrders`).
