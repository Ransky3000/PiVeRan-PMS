# PiVeRan PMS — SDLC Master Tracker & Project Documentation

---

## 📋 Document Metadata

| Field | Details |
| :--- | :--- |
| **Project Name** | **PiVeRan PMS** (Preventive Maintenance System) |
| **Document Version** | `v1.3.0` (Document Restructure) |
| **Primary Owner** | Ranian J. Rulona |
| **Current SDLC Phase** | **Phase 4: Implementation & Coding** `[ACTIVE]` |
| **Last Updated** | August 26, 2026 |

---

## 📚 Specification Index

| Document | Description | Status |
| :--- | :--- | :--- |
| 📄 **[PROJECT_DOCUMENTATION.md](file:///c:/Users/USER/Desktop/Ranian's%20file/PiVeRan-PMS/PROJECT_DOCUMENTATION.md)** | SDLC Master Tracker, Phase History, and Engineering Principles | `[ACTIVE]` |
| 📄 **[SRS.md](file:///c:/Users/USER/Desktop/Ranian's%20file/PiVeRan-PMS/SRS.md)** | Software Requirements Specification (User Personas, Business Rules, Functional Requirements) | `[ACTIVE]` |
| 📄 **[DDS.md](file:///c:/Users/USER/Desktop/Ranian's%20file/PiVeRan-PMS/DDS.md)** | Detailed Design Specification (System Architecture, Component Hierarchy, DB Schemas, API Endpoints) | `[ACTIVE]` |
| 📄 **[MASTER_PMS_LEVEL_PACKAGES.md](file:///c:/Users/USER/Desktop/Ranian's%20file/PiVeRan-PMS/MASTER_PMS_LEVEL_PACKAGES_AND_INSPECTION_SEQUENCE.md)** | Inspection Sequences & PMS Level Package Matrix | `[ACTIVE]` |

---

## 📌 SDLC Overview & Current Status

```
[ Phase 1: Planning ] ──> [ Phase 2: Requirements ] ──> [ Phase 3: System Design ] ──> [ Phase 4: Implementation ] ──> [ Phase 5: Testing ] ──> [ Phase 6: Launch ]
      (COMPLETED)               (COMPLETED)                 (COMPLETED)                     (ACTIVE)                   (UPCOMING)             (UPCOMING)
```

### Key Milestones & Progress Log

| Date | SDLC Phase | Milestone / Action | Status |
| :--- | :--- | :--- | :--- |
| **Aug 02, 2026** | **Phase 1: Planning** | System concept, operational flow, tech stack, and role definitions defined. | `[COMPLETED]` |
| **Aug 15, 2026** | **Phase 1: Planning** | Documented 13-step operational sequence, tech stack (Next.js + FastAPI/SQLite), and core engineering principles ($\le 300$ LOC limit, decoupled `frontend/` & `backend/`). | `[COMPLETED]` |
| **Aug 16, 2026** | **Phase 2: Requirements** | Formulated user stories, business rules, master data entities (`Owner`, `Vehicle`, `Material`, `Labor`, `Bundle`), and Job Order lifecycle. | `[COMPLETED]` |
| **Aug 16, 2026** | **Phase 3: Design** | Designed UI/UX wireframes, role layouts, component contracts, and 11-table SQLite database schema. | `[COMPLETED]` |
| **Aug 20, 2026** | **Phase 4: Implementation** | Built decoupled Next.js frontend, FastAPI backend REST endpoints, SQLite ORM models, and user authentication flow. | `[COMPLETED]` |
| **Aug 25, 2026** | **Phase 4: Implementation** | Implemented Reminders module with **Approach A: Pure Linear Timeline** progress bar ($\frac{\text{Current}-\text{Start}}{\text{Target}-\text{Start}}\times 100\%$) and **7-day early notice** status rule. | `[COMPLETED]` |
| **Aug 26, 2026** | **Phase 4: Implementation** | Restructured documentation into dedicated `PROJECT_DOCUMENTATION.md` (SDLC Tracker), `SRS.md` (Requirements), and `DDS.md` (Detailed Design). | `[COMPLETED]` |
| **Aug 26, 2026** | **Phase 4: Implementation** | **[IN PROGRESS]** Developer Role (`DEVELOPER`) with fixed seed account (`dev@piveran.com` / `#include<piveran123>`) & Account Impersonation engine. | `[ACTIVE]` |

---

## 📌 Platform Architecture & Tech Stack Summary

- **Frontend:** Next.js 14+ (App Router, TypeScript, React 19) · Vanilla CSS / Tailwind CSS · Framer Motion · Lucide React.
- **Backend:** Python FastAPI REST Service (`http://localhost:8000`) · SQLite DB via SQLAlchemy ORM & Uvicorn.
- **Production Roadmap:** PostgreSQL database migration, Alembic schema migrations, and Docker containerization.
- **Engineering Principles:**
  1. Strict File Size Limit ($\le 300$ LOC per component/module).
  2. Decoupled Directory Architecture (`frontend/` & `backend/`).
  3. Clean OOP Domain Modeling & Anti-Bloat Code.
  4. Over-Designed UI Standard (Glassmorphism, fluid micro-animations, curated color palettes).
