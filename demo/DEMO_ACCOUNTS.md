# Aarogya Care — Synthetic Demonstration Accounts & Role Matrix

This document provides credentials and permissions for live evaluations and academic demonstrations of the **Aarogya Care Scalable Hospital Management System**.

All test accounts use synthetic data exclusively. No real patient health information (PHI) or production credentials exist in this system.

---

## 1. Master Demonstration Credentials

> **Default Password for All Synthetic Accounts:** `Aarogya#2026Secure`

| Role | Synthetic Email | Full Name | Department / Desk | Primary Permitted Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@aarogyacare.org` | System Administrator | Executive IT / Admin | View full system telemetry, health checks, rate limiter stats, database connection pool, doctor onboarding. |
| **Consultant Doctor** | `dr.ramanathan@aarogyacare.org` | Dr. K. Ramanathan | Cardiology (Tower A) | Review assigned OPD appointments, inspect patient medical records, author clinical consultation notes, issue e-prescriptions. |
| **Emergency Lead** | `dr.soundararajan@aarogyacare.org` | Dr. N. Soundararajan | Emergency & Trauma | STAT resuscitation queue, trauma intake, ESI-1 triage priority escalation. |
| **Front Desk Officer** | `receptionist@aarogyacare.org` | Anita Desk Officer | Outpatient Reception | Patient registration, doctor schedule lookup, booking/rescheduling slots. *Clinical records and prescriptions are strictly blocked.* |
| **Triage Lead Nurse** | `nurse@aarogyacare.org` | Sister Deepa | Emergency Triage Bay | Emergency intake queue, updating triage status (`TRIAGE_RECEIVED` $\rightarrow$ `IN_TREATMENT`), bed assignment. |
| **Chief Pharmacist** | `pharmacist@aarogyacare.org` | Suresh Pharmacy Officer | Central Dispensary | Medicine catalogue lookup, inventory adjustments, atomic prescription dispensing, low-stock alerts. |
| **Billing Officer** | `billing@aarogyacare.org` | Ramesh Billing Officer | Billing & Cashier Desk | Generating itemized hospital bills, viewing billing history, processing simulated payment transactions. |
| **Registered Patient (1)** | `patient.rajendran@aarogyacare.org` | S. Rajendran (UHID: AC-2024-9104) | Outpatient | View own appointments, personal medical history, invoices, book doctor slots. |
| **Registered Patient (2)** | `patient.meenakshi@aarogyacare.org` | Meenakshi Sundaram | Outpatient | Search specialists, book appointments, view own records. |

---

## 2. Role-Based Access Control (RBAC) Isolation Matrix

| Capability / Endpoint | Patient | Doctor | Receptionist | Nurse | Pharmacist | Billing | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Self-Registration & Profile** | Allowed | — | — | — | — | — | Allowed |
| **Search Doctors & Autocomplete** | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Book / Cancel Appointments** | Own Only | Allowed | Allowed | — | — | — | Allowed |
| **View Clinical Medical Records** | Own Only | Allowed | **Blocked (403)** | Allowed | **Blocked (403)** | **Blocked (403)** | Allowed |
| **Create Clinical Notes / Rx** | **Blocked (403)** | Allowed | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | Allowed |
| **Adjust Pharmacy Inventory** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | Allowed | **Blocked (403)** | Allowed |
| **Dispense Prescriptions** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | Allowed | **Blocked (403)** | Allowed |
| **Simulate Invoice Payments** | Own Only | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | Allowed | Allowed |
| **Update Emergency Triage Status** | **Blocked (403)** | Allowed | **Blocked (403)** | Allowed | **Blocked (403)** | **Blocked (403)** | Allowed |
| **System Telemetry & Benchmarks** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | **Blocked (403)** | Allowed |

---

## 3. Safe Database Reset Procedure

To reset all transactional data back to this pristine state at any point during live demonstration:

```bash
# Option 1: Drop MongoDB database using mongosh (DatabaseSeedService will re-seed on restart)
mongosh aarogya --eval "db.dropDatabase()"

# Option 2: Docker Compose full reset
docker compose down -v && docker compose up -d
```
