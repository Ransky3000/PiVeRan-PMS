# Front Desk & Mechanic Operational Workflow Specification

---

## 1. Overview & Master Component Architecture

The system focuses primarily on the operational handoff between the **Front Desk** (Customer intake, job order creation, estimate curation, checkout) and the **Mechanic / Garage Bay Tablet** (Inspection, parts attachment, repair execution, QC sign-off).

### Master Lookup Tables & Directories (Front Desk Navigation)
The Front Desk role maintains six primary modules/directories:
1. **Job Order Management:** Primary operational dashboard (main focus).
2. **Service Catalog:** Labor tasks and PMS package builder.
3. **Vehicle Directory:** Master vehicle lookup table.
4. **Owner Directory:** Master customer/owner lookup table.
5. **Mechanics Directory:** Staff mechanics and bay assignments table.
6. **Materials / Parts Directory:** Auto parts inventory table.

*Note: The Vehicle, Owner, Mechanics, and Materials tables act as master lookup registries. Inline quick-add mechanisms inside modal forms allow Front Desk users to populate these tables directly without leaving active job workflows.*

---

## 2. Front Desk Job Order Creation & Intake Flow

### 2.1 Tab Navigation Structure
The Front Desk Job Order board is structured into four sequential operational status tabs:
- **`New`** (`FOR_INSPECTION`, unstarted)
- **`Work in progress`** (`FOR_INSPECTION` with inspection active, or `IN_REPAIR`)
- **`Ready for pickup`** (`READY_FOR_PICKUP`, mechanic signed off)
- **`Job completed`** (`COMPLETED`, payment logged)

### 2.2 Intake Modal Field Dynamics & Quick-Add Inlines
When a customer requests a service (e.g., *Level 1 Basic PMS*), Front Desk opens the **Check-in / Create Job Order** modal:

```
[ Customer Intake Request ]
         │
         ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. Owner Field (Select existing OR Quick-Add new owner)    │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼ (Filters vehicle list)
 ┌─────────────────────────────────────────────────────────────┐
 │ 2. Vehicle Field (Filtered by Owner; Quick-Add if new)     │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼ (Auto-populates attributes & avatar)
 ┌─────────────────────────────────────────────────────────────┐
 │ 3. Details & Service Selection (Engine, Phone, PMS Level)   │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼ (Inline Quick-Add if unlisted)
 ┌─────────────────────────────────────────────────────────────┐
 │ 4. Mechanic Assignment (Assigned to Bay Tablet)            │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 [ Submit Intake ] ──> Placed into "New" Tab Queue
```

#### Detailed Field Specifications:
1. **Owner Selection (`ownerName` / `selectedOwnerId`):**
   - Front Desk selects an existing registered owner.
   - **Inline Quick-Add:** If owner does not exist, clicking `+ Add Owner` opens an inline creation form saving directly to the **Owner Directory** without closing or resetting the intake modal.
2. **Vehicle Selection (`vehicleModel` / `plateNumber`):**
   - **Dynamic Filtering:** Selecting an owner automatically filters the vehicle dropdown to show *only* vehicles linked to that specific owner.
   - **Inline Quick-Add:** If the owner brings a new vehicle, clicking `+ Add Vehicle` opens an inline vehicle form saving directly to the **Vehicle Directory**.
3. **Vehicle Profile Photo (`vehiclePhotoUrl`):**
   - Auto-displays the existing vehicle avatar if present.
   - Provides an immediate upload/camera capture button if missing.
4. **Service Package Selection (`serviceType`):**
   - Selects from Master PMS Packages (*Basic PMS*, *Major / Full PMS*, *Heavy PMS Refresh*).
   - Dynamically renders package target interval descriptions upon selection.
5. **Mechanic Assignment (`inchargeMechanics`):**
   - Selects assigned technician(s) and garage bay.
   - **Inline Quick-Add:** Allows adding a new mechanic on-the-fly, updating the **Mechanics Directory**.

---

## 3. Front Desk ↔ Mechanic Status Transition & Handoff

```
┌──────────────────────────────────────────────────────────────────────────┐
│ FRONT DESK                                                               │
│ 1. Submits Job Order ──> Appears under "New" Tab                         │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ (Job Sync)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ MECHANIC BAY TABLET                                                      │
│ 2. Job appears on Mechanic Board under "New" Queue                       │
│ 3. Mechanic clicks "Start Inspection"                                   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ (Automated Status Trigger)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FRONT DESK VIEW AUTO-UPDATE                                              │
│ 4. Job Order automatically moves from "New" tab to "Work in progress"   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.1 Four-State Condition Model
Each checklist item on the Mechanic DVI inspection sheet exists in one of 4 states:
1. **`PENDING`**: Uninspected baseline (no attachments or notes allowed).
2. **`GOOD`**: Verified in proper operational condition.
3. **`MONITOR`**: Wear or minor issue noted, but operational for now.
4. **`ISSUE`**: Defect detected; requires replacement/repair materials.

### 4.2 Status-Scoped Isolated Data Buckets
Each condition status (`GOOD`, `MONITOR`, `ISSUE`) maintains an **independent, isolated data scope**. Switching between status tags does NOT overwrite notes or photos taken under another status.

```
       ┌───────────────────────────────────────────────────────┐
       │                 INSPECTION ITEM STATE                 │
       └───────┬───────────────────┬───────────────────┬───────┘
               │                   │                   │
               ▼                   ▼                   ▼
      ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
      │   GOOD SCOPE    │ │  MONITOR SCOPE  │ │   ISSUE SCOPE   │
      ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
      │ • Post-Repair   │ │ • Wear Photos   │ │ • Defect Photos │
      │   Photos        │ │ • Monitor Notes │ │ • Diagnostic    │
      │ • Diagnostic    │ │                 │ │   Notes         │
      │   Notes         │ │                 │ │ • Required      │
      │ • Applied       │ │                 │ │   Materials     │
      │   Materials     │ │                 │ │   (No Price)    │
      └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 4.3 Material / Parts Attachment & Permission Boundary
- **Attachment Trigger:** Available when an item is tagged as **`ISSUE`**.
- **Material Lookup:** Mechanics select required parts and enter quantities from the master **Materials Inventory**.
- **Price Security Boundary:** Mechanics **CANNOT** view unit prices or subtotal costs. Financial pricing is restricted to Front Desk views.
- **Front Desk Synchronization:** Attached materials automatically stream to the **Front Desk Estimate View** under `Work in progress`.

### 4.4 Lifecycle Transition & Good Status Paths

There are two distinct operational paths by which an inspection item can be marked in the **`GOOD`** condition:

1. **Direct Good Path (No Previous Issue):**
   - If the mechanic inspects an item and finds no defects, they tag it directly as **`GOOD`**.
   - In this path, the item does not transition through an `ISSUE` state. As a result, **no materials or parts are associated with the item**. The interface displays only the optional diagnostic note and/or photo.

2. **Resolved Good Path (Post-Repair Resolution):**
   - If the mechanic detects a defect, they tag the item as an **`ISSUE`** and attach required parts/quantities.
   - Once the physical repair/replacement is completed, the mechanic changes the status from **`ISSUE`** to **`GOOD`**.
   - In this path, the **`GOOD`** status UI dynamically displays the **"Materials Applied"** sub-section showing the parts and quantities that were installed to resolve the issue.
   - The mechanic uploads a post-repair verification photo and diagnostic comment to complete the repair log.

### 4.5 Checklist Completion Criteria
An inspection checklist is only considered **fully completed** when all 59 items have been evaluated and resolved to one of the following status types:
- **Completed Statuses:**
  - **`GOOD`**: Directly evaluated as passed or resolved via repair.
  - **`MONITOR`**: Evaluated as having minor wear but acceptable for now.
- **Incomplete Statuses:**
  - **`PENDING`**: Untouched / unchecked items.
  - **`ISSUE`**: Active defects that have not yet been repaired.
Once all checklist items are resolved to `GOOD` or `MONITOR`, the system flags the checklist as complete (`isAllCompleted = true`). This enables/activates the "Ready for Pickup" transition option on the Front Desk dashboard.

---

## 5. Real-Time Synchronization & Front Desk Estimate Control

As the mechanic inspects the vehicle and performs checks on their Bay Tablet, actions dynamically synchronize and update the Front Desk’s active **Work in Progress (WIP)** dashboard.

### 5.1 Real-Time Checklist Monitoring
- **Checklist Mirroring:** Every tag status (`PENDING`, `GOOD`, `MONITOR`, `ISSUE`), diagnostic note, and photo uploaded by the mechanic is visible to the Front Desk in real time.
- **DVI Progress Tracking:** Front Desk can expand the job order details to monitor the inspection status of all 59 checklist items without needing physical updates from the garage bay.
- **Initial State:** All checklist items default to `PENDING` until evaluated by the mechanic. Any item still marked `PENDING` indicates it is untouched or unchecked.

### 5.2 Financial Control & Part Pricing
While the mechanic is restricted to viewing and adjusting part names and quantities, the Front Desk holds full financial control:
- **Price Resolution:** Attaching a material dynamically fetches the retail unit cost (`unitPrice`) from the master **Parts Inventory** and shows it in the Front Desk job order panel.
- **Dynamic Estimates:** The Front Desk can manually override quantities, apply custom line items, add labor fees, adjust discounts, and append estimate notes.

### 5.3 The "Buy" vs. "No" Toggle (Provisioning Logic)
Each material/part item listed on the estimate includes a critical toggle managed by the Front Desk: **`Buy`** or **`No`**.

```
                           [ Material Line Item ]
                                     │
                  ┌──────────────────┴──────────────────┐
                  ▼                                     ▼
         ┌─────────────────┐                   ┌─────────────────┐
         │     "BUY"       │                   │      "NO"       │
         ├─────────────────┤                   ├─────────────────┤
         │ • Shop-Provided │                   │ • Customer-     │
         │ • Full Cost     │                   │   Provided or   │
         │   Included      │                   │   Deferred      │
         │ • Deducted from │                   │ • Cost = ₱0.00  │
         │   Inventory     │                   │   in Estimate   │
         └─────────────────┘                   └─────────────────┘
```

#### Detailed Provisioning Rules:
1. **`Buy` Status (Shop-Provided):**
   - Indicates that the auto shop will provide the part from internal inventory.
   - The cost of the item ($\text{Qty} \times \text{Unit Price}$) is included in the subtotal and grand total.
   - Upon completing checkout, the quantity is automatically deducted from the master **Parts Inventory**.
2. **`No` Status (Customer-Provided / Deferred):**
   - Indicates that either the customer is bringing their own parts for the mechanic to install, or the repair/part is ignored/deferred for this visit.
   - The cost of the item is set to **₱0.00** in the estimate calculations (omitted from the invoice grand total).
   - The UI displays descriptive comments/badges indicating customer-provided or deferred provisioning.

### 5.4 Ready for Pickup Handoff & Controls
- **Front Desk Control:** Only the Front Desk user has permission to click the **`[ 🚗 Mark Ready for Pickup ]`** button. The button is disabled until the mechanic's checklist status reaches `isAllCompleted = true`.
- **Status Stepper Transition:** Clicking this button moves the Job Order card from the Front Desk's **`Work in progress`** tab into the **`Ready for pickup`** tab.
- **Rollback Logic (Discrepancy Handling):** If a discrepancy or dispute ("bikil") arises, the Front Desk has the authority to rollback the Job Order status from `Ready for pickup` back into `Work in progress`, resuming repair/inspection modes.
- **Mechanic View Sync:** When marked ready for pickup, the corresponding card on the **Mechanic's Job Board** dynamically shifts into the `Ready for pickup` tab. To prevent unauthorized modifications after QC sign-off, the card is set to a **read-only / view-only** state on the mechanic tablet.

### 5.5 Checkout & Job Completion
- When the customer arrives, pays, and picks up the vehicle, the Front Desk reviews the final invoice, logs the payment method, and clicks the completion action.
- This marks the Job Order status as **`COMPLETED`**, moving the card to the **`Job completed`** tab on both Front Desk and Mechanic views, archiving the transaction details to the customer timeline, and executing final inventory deductions for all `Buy` tagged materials.

---

## 6. Summary Matrix of Operational Rules

| Action / Feature | Front Desk Behavior | Mechanic Behavior | System / State Trigger |
| :--- | :--- | :--- | :--- |
| **Owner Selection** | Searchable dropdown + Inline Quick-Add | N/A | Links `owner_id` |
| **Vehicle Selection** | Dynamically filtered by `owner_id` + Inline Quick-Add | N/A | Links `vehicle_id` |
| **Mechanic Assignment** | Selects technician + Inline Quick-Add | Receives job on assigned tablet | Routes to Bay Tablet |
| **Job Submission** | Saved to queue | Appears under `New` queue | Status = `FOR_INSPECTION` (`New`) |
| **Start Inspection** | View updates automatically | Clicks `[ 🚀 Start Inspection ]` | Moves to `Work in progress` tab |
| **Attach Materials** | Views attached items & sets prices | Selects part SKU & quantity (Price Hidden) | Streams to Front Desk Estimate |
| **Photo & Note Buckets** | Views full inspection report | Isolated per status (`GOOD`, `MONITOR`, `ISSUE`) | Independent photo/note arrays |
| **Fix Resolution (`ISSUE` → `GOOD`)** | Receives updated job status | Uploads post-repair photo & diagnostic note | Confirms repair sign-off |
| **Provisioning Toggle** | Toggles `Buy` (Shop-Provided) vs `No` (Customer-Provided) | Executes repair using provided part | Adjusts invoice calculations & inventory deductions |
| **Service Catalog** | Admin manages labor rates & categories | N/A | Populates `services_catalog` table |
| **PMS Package Builder** | Admin bundles multiple labors with flat rates | N/A | Populates `package_bundles` & `package_services` |

