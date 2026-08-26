# Software Development Life Cycle (SDLC) — Complete Reference Guide

This document is your step-by-step handbook for building software. Whenever you start a new feature or project—or feel stuck on what to do next—refer to this guide to navigate through the 6 phases of the Software Development Life Cycle (SDLC).

---

## 🔄 The 6-Phase SDLC Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 1: Planning & Scope (Define MVP)                                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 2: Requirement Analysis (Write SRS Document)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 3: System Design (Write DDS & UI Wireframes)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 4: Implementation & Coding (Build the MVP)                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 5: Testing & Quality Assurance (QA & Bug Fixes)                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 6: Deployment & Maintenance (Launch & Iterate)                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📌 Phase 1: Planning & Scope Definition (Defining the MVP)

### 🎯 Objective
Understand the client's problem, discover user roles, and **filter out non-essential features** to define a tight Minimum Viable Product (MVP) scope.

### 💬 Key Questions to Ask
* *"What is the main problem we are trying to solve?"*
* *"Who are the target users (e.g. mechanics vs. car owners)?"*
* *"What is the 20% of features that delivers 80% of the value?"*

### 📋 Action Steps
- [ ] **Listen to Client Vision:** Gather all feature requests without filtering initially.
- [ ] **Identify Target Roles:** Determine who uses the system (Admins, Mechanics, Customers).
- [ ] **Apply MoSCoW Prioritization:**
  * **Must-Have (MVP):** Features without which the app cannot function.
  * **Should-Have:** Important features saved for v1.1.
  * **Could-Have:** Nice-to-have features for future releases.
  * **Won't-Have (For Now):** Features out of scope.
- [ ] **Assess Feasibility & Risks:** Check technical complexity, timeline, and budget.

### 📄 Deliverables
* **MVP Scope Agreement:** A list of core Must-Have features.
* **Project Roadmap:** High-level timeline and milestones.

### 🚗 PiVeRan PMS Concrete Example (High-Level Outlining)
*In Phase 1, the client and team agree on high-level feature modules only (no details yet):*
* **Feature #1: Vehicle Check-in** (Register car arrival at the shop).
* **Feature #2: Digital Vehicle Inspection (DVI)** (Mechanic tablet inspection).
* **Feature #3: Job Package Curation** (Creating an estimate for repairs).
* **Feature #4: Customer Mobile Web Approval** (Sending interactive approval link via SMS).

---

## 📌 Phase 2: Requirement Analysis (Writing the SRS)

### 🎯 Objective
Transform the high-level MVP scope from Phase 1 into **detailed technical requirements and user stories**.

### 💬 Key Questions to Ask
* *"What specific data inputs and outputs does each feature require?"*
* *"What are the step-by-step user actions and expected system responses?"*
* *"What performance, security, and browser requirements exist?"*

### 📋 Action Steps
- [ ] **Write User Stories:** Format: *"As a [User Role], I want to [Action], so that [Benefit]."*
- [ ] **Define Data Inputs/Outputs:** Detail exactly what data each form accepts and returns.
- [ ] **Specify Edge Cases & Validation:** Determine error messages for invalid inputs (e.g., wrong VIN length).
- [ ] **Create the SRS Document:** Compile functional and non-functional requirements.

### 📄 Deliverables
* **SRS (Software Requirement Specification):** Document detailing user stories, system inputs/outputs, and acceptance criteria.

### 🚗 PiVeRan PMS Concrete Example (Detailed Requirement Analysis)
*In Phase 2, the team breaks down EACH high-level feature from Phase 1 into exact input fields, buttons, and database actions:*

#### Breakdown of Feature #1: Vehicle Check-in
* **Input Fields Required:**
  * `VIN Input Field` (Text, 17 characters max, uppercase validation).
  * `License Plate Field` (Text).
  * `Customer Name Field` (Text).
  * `Customer Phone Number Field` (Phone format, required for SMS links).
  * `Vehicle Make/Model/Year Dropdowns`.
* **Buttons & Actions:**
  * `Check-in Button`: Validates inputs and saves the new vehicle record into the database.

#### Breakdown of Feature #2: Digital Vehicle Inspection (DVI)
* **Input Fields Required:**
  * `Odometer Reading Field` (Numeric input).
  * `Condition Tag Radios` (🟢 Green: OK, 🟡 Yellow: Wear noted, 🔴 Red: Immediate Hazard).
  * `Photo / Video Upload Button` (Triggers device camera or file picker).
  * `Technician Notes Field` (Textarea for inspection comments).
* **Buttons & Actions:**
  * `Complete Inspection Button`: Compiles all tagged items into an inspection report.

#### Breakdown of Feature #3: Customer Mobile Web Approval Link
* **Input Fields & Display Required:**
  * `Unique Web Token URL` (e.g. `piveran.com/approve/x89f2`).
  * `Visual Inspection Viewer` (Side-by-side photo modal).
  * `Approval Checkboxes` (`[x] Approve Oil Change ($50)`, `[ ] Decline New Tires ($400)`).
  * `Digital Signature Pad` (Finger touch canvas signature).
* **Buttons & Actions:**
  * `Submit Decision Button`: Recalculates total cost in real-time and notifies the mechanic's tablet screen.

---

## 📌 Phase 3: System Design & Architecture (Writing the DDS)

### 🎯 Objective
Design **how the software will look and work under the hood** before writing any code.

### 💬 Key Questions to Ask
* *"How should the user interface (UI) look on desktop, tablet, and mobile?"*
* *"What database tables and relationships do we need?"*
* *"What API endpoints will connect the frontend to the backend?"*

### 📋 Action Steps
- [ ] **Design UI Wireframes & Layouts:** Create mockups for key screens (Mechanic Tablet View, Customer Mobile Web View).
- [ ] **Design Database Schema:** Define tables, primary keys, foreign keys, and relationships (`Vehicles`, `Inspections`, `Estimates`).
- [ ] **Design API Endpoint Specs:** Map out request URLs, methods (GET/POST/PUT), and JSON payload structures.
- [ ] **Select Tech Stack:** Finalize libraries, frameworks, and database engines.

### 📄 Deliverables
* **DDS (Design Document Specification):** UI layout mockups, Database Entity-Relationship Diagrams (ERD), and API specs.

### 🚗 PiVeRan PMS Example
* **UI Layout:** DVI checklist screen with large touch buttons for 🟢 Green / 🟡 Yellow / 🔴 Red tags.
* **Database Table:** `InspectionItem` (`id`, `vehicle_id`, `name`, `status`, `photo_url`, `customer_approval`).

---

## 📌 Phase 4: Implementation & Coding (Building the MVP)

### 🎯 Objective
Write clean, modular, and maintainable code based directly on the DDS and SRS specs.

### 💬 Key Questions to Ask
* *"Am I following the agreed design specs and coding standards?"*
* *"Is this code modular and easy to read/test?"*
* *"Am I committing small, atomic changes with Git?"*

### 📋 Action Steps
- [ ] **Set Up Workspace & Git Repository:** Initialize folder structure and version control.
- [ ] **Build Database & Backend API:** Create database tables and API routes.
- [ ] **Build Frontend UI Components:** Implement responsive layouts and interactive elements.
- [ ] **Integrate Frontend & Backend:** Connect UI forms to API endpoints.
- [ ] **Perform Code Reviews:** Verify code quality and adherence to guidelines.

### 📄 Deliverables
* **Source Code:** Complete, executable codebase in version control.
* **Working Local Build:** App running locally on dev server.

### 🚗 PiVeRan PMS Example
* Writing the HTML/CSS/JS for the DVI tablet view and connecting the "Submit Inspection" button to save JSON data into the database.

---

## 📌 Phase 5: Testing & Quality Assurance (QA & Debugging)

### 🎯 Objective
Identify, document, and fix bugs, errors, and usability issues before releasing to real users.

### 💬 Key Questions to Ask
* *"Does every feature meet the acceptance criteria in the SRS?"*
* *"What happens if a user submits incomplete forms or loses internet connection?"*
* *"Does the app display properly across different browsers and screen sizes?"*

### 📋 Action Steps
- [ ] **Unit & Integration Testing:** Verify individual code modules and database queries.
- [ ] **UI & Cross-Browser Testing:** Test on Safari (iOS), Chrome (Android/Desktop), and tablets.
- [ ] **Bug Tracking & Debugging:** Log issues, find root causes, and apply fixes.
- [ ] **User Acceptance Testing (UAT):** Have a representative user test the full workflow.

### 📄 Deliverables
* **Test Cases & QA Report:** Record of passed tests and resolved bug logs.
* **Stable Release Candidate:** Verified build ready for deployment.

### 🚗 PiVeRan PMS Example
* Verifying that tapping "Approve" on an iPhone correctly updates the mechanic's tablet screen in real-time without crashing.

---

## 📌 Phase 6: Deployment & Maintenance (Launch & Iterate)

### 🎯 Objective
Publish the MVP to live production servers for real users, monitor performance, and plan future iterations.

### 💬 Key Questions to Ask
* *"Is the application deployed securely on live servers with SSL/HTTPS?"*
* *"Are error logging and monitoring tools active?"*
* *"What feedback are real users providing for Version 2.0?"*

### 📋 Action Steps
- [ ] **Deploy to Production:** Host frontend and backend on live cloud servers.
- [ ] **Setup Domain & SSL:** Configure HTTPS and domain links.
- [ ] **Monitor System Health:** Track server uptime, database response times, and runtime logs.
- [ ] **Gather User Feedback:** Collect insights from real mechanics and vehicle owners.
- [ ] **Plan Next Iteration:** Feed new feature requests back into **Phase 1 (Planning)** for Version 2.0.

### 📄 Deliverables
* **Live Product URL:** Accessible web application in production.
* **Feedback Log:** List of user suggestions for future SDLC cycles.

---

## 💡 Quick Cheat Sheet: "What Phase Am I In?"

| If you are... | You are in... | Next Step |
| :--- | :--- | :--- |
| Brainstorming features & cutting fluff | **Phase 1: Planning** | Decide MVP scope (Must-Haves) |
| Writing user stories & data rules | **Phase 2: Requirement Analysis** | Complete SRS document |
| Drawing screen layouts & DB schemas | **Phase 3: System Design** | Finalize DDS specs |
| Writing HTML, CSS, JavaScript, or API code | **Phase 4: Implementation** | Build components & connect backend |
| Finding bugs & testing on mobile | **Phase 5: Testing (QA)** | Fix errors & get QA signoff |
| Hosting live & getting user feedback | **Phase 6: Deployment** | Plan v2.0 in Phase 1 |

---

*Keep this file in your project workspace as a permanent guide for PiVeRan PMS and future software engineering projects!*
