# Aarogya Care — Scalable Hospital Management System
## Architecture Blueprint & Frozen Design Specification (Phase 0)

### 1. System Design Context & Objectives
Aarogya Care is an enterprise-grade system-design-lab prototype demonstrating high-concurrency healthcare workflows and all seven core system design components on the target **Java 23 / Spring Boot 3.4.3 + MongoDB 7.0 + Redis 5.0 + React TypeScript** stack:
1. **Unique ID Generator**: 64-bit Snowflake monotonic ID generator (2.79M IDs/sec, 0 collisions).
2. **Rate Limiter**: Token-bucket algorithm with per-route policy and shared Redis atomic state returning RFC-compliant HTTP 429 responses with dedicated overload protection for emergency intake.
3. **Key-Value Store**: Redis caching layer with explicit TTL, cache-aside read strategy, and commit-then-invalidate write strategy for eligible non-authoritative data.
4. **Consistent Hashing**: Hash ring with 150 virtual nodes per physical cache node to minimize key remapping when nodes are added or removed.
5. **URL Shortener**: Base62 opaque short code mapping with MongoDB persistence, expiry, revocation, and open-redirect protection.
6. **Web Crawler**: Isolated background crawler with approved seed domain allowlists, SSRF loopback protection (blocking 127.0.0.1, 169.254.169.254, RFC 1918), and SHA-256 deduplication.
7. **Autocomplete**: Normalized Prefix Trie with client debounce (250ms), top-k suggestion ranking, and hot-prefix caching.

> **Authoritative Correctness Rule**: MongoDB Community Server 7.0 is the sole authoritative persistent database for all business state transitions (patient accounts, slot bookings, clinical records, stock inventory, invoices, and emergency requests). Redis and Trie serve strictly as performance/control layers. A cache miss or node failure must gracefully fall back to MongoDB.

---

### 2. Role-Permission Matrix (Frozen)

| Endpoint / Capability | Patient | Doctor | Receptionist | Triage / Nurse | Pharmacist | Billing Staff | Admin / Operator | Public (Unauthenticated) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Public Homepage / CoE Directory** | Read | Read | Read | Read | Read | Read | Read | Read |
| **Doctor Directory & Autocomplete** | Read | Read | Read | Read | Read | Read | Read | Read |
| **View Available Slots** | Read | Read | Read | Read | Read | Read | Read | Read |
| **Patient Registration & Login** | Self | - | Register | - | - | - | Manage | Register/Login |
| **Book Appointment** | Self | - | Any | - | - | - | Any | - |
| **Reschedule / Cancel Appointment** | Self (Own) | Assigned | Any | - | - | - | Any | - |
| **Clinical Records** | Self (Own) | Assigned Patients | Limited Profile | Triage Vitals | - | - | Audit only | Denied |
| **Prescription Creation** | Denied | Prescribe (Assigned) | Denied | Denied | Denied | Denied | Denied | Denied |
| **Medicine Catalogue** | Read (Name) | Read (Name/Dose) | Read (Name) | Read (Name) | Read + Stock | Read (Pricing) | Full Read | Read (Public Meds) |
| **Pharmacy Dispensing & Stock** | Denied | Denied | Denied | Denied | Atomic Dispense | Denied | Inventory Admin | Denied |
| **Invoice Generation** | Denied | Denied | Denied | Denied | Denied | Generate / Update | Audit only | Denied |
| **Payment Status Operations** | Self (Pay) | Denied | Collect Desk | Denied | Denied | Process / Settle | Audit only | Denied |
| **Emergency Request Intake** | Create | Create | Create | Create | - | - | Create | Create (Emergency) |
| **Emergency Status Transition** | Read Own | Consult | Desk Triage | Status Update (ESI-1..4) | - | - | Override | Denied |
| **Short Link Generation** | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped | Denied |
| **Operations Telemetry & Metrics** | Denied | Denied | Denied | Denied | Denied | Denied | Full Access | Denied |

---

### 3. Database Schema & Entities (Target Architecture: MongoDB 7.0 Document Collections)

> **Technology Migration Note**: All logical entities have been migrated from relational tables into MongoDB Document Collections (`users`, `patients`, `doctors`, `doctor_slots`, `appointments`, `clinical_records`, `prescriptions`, `medicines`, `inventory_transactions`, `invoices`, `payments`, `emergency_requests`, `short_links`, `crawler_documents`, `idempotency_records`, `audit_events`). High-contention workflows leverage MongoDB compound unique indexes (e.g. `(doctor_id, start_time)` on `doctor_slots`) and atomic conditional operations (`findAndModify` for booking, `$gte: qty` for inventory decrement) to preserve ACID invariants without table locks.
> Below is the original logical model and its corresponding MongoDB document mapping:

```sql
-- 1. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'receptionist', 'nurse', 'pharmacist', 'billing_staff', 'admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

-- 2. Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    uhid VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(10),
    phone VARCHAR(32) NOT NULL,
    address TEXT,
    emergency_contact_phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_patients_uhid ON patients(uhid);

-- 3. Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Doctors
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id),
    display_name VARCHAR(255) NOT NULL,
    qualifications VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    chamber_room VARCHAR(64) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    rating NUMERIC(3,2) NOT NULL DEFAULT 4.90,
    review_count INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_doctors_dept_name ON doctors(department_id, display_name);

-- 5. Doctor Specializations (Many-to-Many)
CREATE TABLE specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE doctor_specializations (
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    specialization_id UUID NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
    PRIMARY KEY (doctor_id, specialization_id)
);

-- 6. Doctor Slots
CREATE TABLE doctor_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED', 'CANCELLED')),
    consultation_mode VARCHAR(32) NOT NULL DEFAULT 'IN_PERSON' CHECK (consultation_mode IN ('IN_PERSON', 'TELE_CONSULT')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, start_at)
);
CREATE INDEX idx_slots_avail ON doctor_slots(doctor_id, status, start_at);

-- 7. Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number VARCHAR(64) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    slot_id UUID NOT NULL UNIQUE REFERENCES doctor_slots(id),
    status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    reason_for_visit TEXT,
    consultation_mode VARCHAR(32) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_appointments_patient ON appointments(patient_id, created_at DESC);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, status, created_at);

-- 8. Patient Records (EMR / Clinical Notes)
CREATE TABLE patient_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    record_type VARCHAR(64) NOT NULL CHECK (record_type IN ('OPD_NOTE', 'DISCHARGE_SUMMARY', 'LAB_RESULT', 'TRIAGE_VITALS', 'IMAGING')),
    summary TEXT NOT NULL,
    clinical_notes TEXT,
    vitals_telemetry JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_records_patient ON patient_records(patient_id, created_at DESC);

-- 9. Prescriptions & 10. Items
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    appointment_id UUID REFERENCES appointments(id),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED')),
    diagnosis TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(128) NOT NULL,
    frequency VARCHAR(64) NOT NULL,
    duration_days INTEGER NOT NULL,
    quantity_prescribed INTEGER NOT NULL,
    instructions TEXT
);

-- 11. Medicines (Inventory)
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalogue_code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(64) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
    reorder_threshold INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_medicines_name ON medicines(name, catalogue_code);

-- 12. Dispensings & 13. Items
CREATE TABLE dispensings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensing_number VARCHAR(64) NOT NULL UNIQUE,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    pharmacist_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE dispensing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensing_id UUID NOT NULL REFERENCES dispensings(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id),
    quantity_dispensed INTEGER NOT NULL CHECK (quantity_dispensed > 0)
);

-- 14. Stock Movements (Inventory Ledger)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id),
    delta INTEGER NOT NULL,
    reason VARCHAR(64) NOT NULL CHECK (reason IN ('DISPENSING', 'PURCHASE_RECEIPT', 'EXPIRED_SCRAP', 'RETURN', 'AUDIT_CORRECTION')),
    actor_id UUID NOT NULL REFERENCES users(id),
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Invoices & 16. Items
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    amount NUMERIC(10,2) NOT NULL
);

-- 17. Payment Operations (Simulated & Idempotent)
CREATE TABLE payment_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    idempotency_key VARCHAR(128) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(64) NOT NULL DEFAULT 'SIMULATED_UPI',
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED')),
    provider_reference VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_idempotency UNIQUE (invoice_id, idempotency_key)
);

-- 18. Emergency Requests
CREATE TABLE emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(64) NOT NULL UNIQUE,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(32) NOT NULL,
    reported_symptoms TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'ESI-1_STAT' CHECK (priority IN ('ESI-1_STAT', 'ESI-2_EMERGENT', 'ESI-3_URGENT', 'ESI-4_LESS_URGENT')),
    status VARCHAR(32) NOT NULL DEFAULT 'TRIAGE_RECEIVED' CHECK (status IN ('TRIAGE_RECEIVED', 'RESUS_ASSIGNED', 'BED_ALLOCATED', 'DISCHARGED', 'TRANSFERRED')),
    assigned_chamb_bed VARCHAR(64),
    assigned_team VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Idempotency Records
CREATE TABLE idempotency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL,
    operation VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    request_fingerprint VARCHAR(255) NOT NULL,
    state VARCHAR(32) NOT NULL CHECK (state IN ('PROCESSING', 'COMMITTED', 'FAILED')),
    status_code INTEGER,
    response_body JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_idempotency_scoped UNIQUE (caller_id, operation, idempotency_key)
);

-- 20. Short Links
CREATE TABLE short_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    resource_type VARCHAR(64) NOT NULL CHECK (resource_type IN ('APPOINTMENT', 'INVOICE', 'KNOWLEDGE', 'EMERGENCY')),
    resource_id UUID NOT NULL,
    destination_url VARCHAR(512) NOT NULL,
    scope VARCHAR(32) NOT NULL DEFAULT 'PRIVATE_AUTH',
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Crawler Documents (Allow-listed Public Knowledge)
CREATE TABLE crawler_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized_url VARCHAR(512) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    source_domain VARCHAR(128) NOT NULL,
    content_text TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. Audit Events
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id UUID,
    outcome VARCHAR(32) NOT NULL CHECK (outcome IN ('SUCCESS', 'DENIED', 'ERROR')),
    ip_address VARCHAR(45),
    correlation_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_created ON audit_events(created_at DESC);

-- 23. Notification Outbox
CREATE TABLE notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 4. API Contract Examples (Frozen)

#### 4.1 `POST /api/v1/appointments`
- **Headers**: `Authorization: Bearer <token>`, `Idempotency-Key: a4f8e3b1-729c-4821-b389-42b78912d091`
- **Request Body**:
```json
{
  "slot_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "patient_id": "c13d8d64-9271-419b-ba28-c178bf75d278",
  "reason_for_visit": "Persistent chest heaviness and hypertension review",
  "consultation_mode": "IN_PERSON"
}
```
- **Response `201 Created`**:
```json
{
  "status": "success",
  "data": {
    "appointment_id": "e0a13c32-21a4-4df1-8e01-1b9e59a72df2",
    "appointment_number": "AC-APT-2026-10492",
    "doctor_id": "5a4d9220-3b47-48f5-9fa3-b1d5e6834b99",
    "doctor_name": "Dr. K. Ramanathan",
    "department": "Cardiology",
    "start_at": "2026-10-24T10:15:00+05:30",
    "status": "CONFIRMED",
    "short_link": "http://localhost:5173/s/c9f2k1",
    "idempotency_replayed": false
  }
}
```
- **Error `409 Conflict` (Concurrent Slot Reservation Race)**:
```json
{
  "status": "error",
  "code": "SLOT_ALREADY_RESERVED",
  "message": "The selected appointment slot has already been booked by another request.",
  "correlation_id": "req-988319-conflict"
}
```

#### 4.2 `POST /api/v1/dispensings`
- **Headers**: `Authorization: Bearer <token>`, `Idempotency-Key: disp-8921-99`
- **Request Body**:
```json
{
  "prescription_id": "7f8b9c1d-6e5a-4b3c-2d1e-0f9a8b7c6d5e",
  "items": [
    {
      "medicine_id": "11111111-2222-3333-4444-555555555555",
      "quantity": 10
    }
  ]
}
```
- **Atomic SQL**:
```sql
UPDATE medicines
SET stock_quantity = stock_quantity - :qty
WHERE id = :medicine_id AND stock_quantity >= :qty
RETURNING stock_quantity;
```
- **Response `200 OK`**:
```json
{
  "status": "success",
  "data": {
    "dispensing_id": "22222222-3333-4444-5555-666666666666",
    "dispensing_number": "DISP-2026-0891",
    "prescription_id": "7f8b9c1d-6e5a-4b3c-2d1e-0f9a8b7c6d5e",
    "items_dispensed": 1,
    "low_stock_alerts": []
  }
}
```
- **Error `409 Conflict` (Insufficient Inventory)**:
```json
{
  "status": "error",
  "code": "INSUFFICIENT_STOCK",
  "message": "Medicine 'Meropenem Inj 1g' has insufficient units in stock to fulfill this order.",
  "correlation_id": "req-disp-fail-002"
}
```

---

### 5. Seven System Design Component Placements

1. **UUIDv4 Generator**: Implemented in `backend/app/system_design/ids.py`. Used for every row insertion; generation takes `<0.01ms`; zero coordination overhead.
2. **Token Bucket Rate Limiter**: Implemented in `backend/app/system_design/rate_limiter.py`. Evaluates quotas per route:
   - Auth endpoints: 5 req/min, burst 10
   - Autocomplete / Search: 60 req/min, burst 100
   - Emergency intake: Dedicated capacity bypass / priority overload path
3. **Key-Value Store (Redis Cache)**: Implemented in `backend/app/system_design/cache.py`.
   - Doctor directory, departments, medicine summaries: TTL 600s
   - Cache invalidation executed immediately after successful PostgreSQL commit.
4. **Consistent Hashing**: Implemented in `backend/app/system_design/consistent_hash.py`.
   - Ring with SHA-256 hash algorithm and 150 virtual nodes per physical node (`Node-A`, `Node-B`, `Node-C`).
   - Adding or removing a node remaps only $1/N$ keys on average.
5. **URL Shortener**: Implemented in `backend/app/system_design/short_links.py`.
   - Generates 6-character cryptographically random base62 tokens.
   - Resource authorization strictly enforced during `/s/:code` resolution.
6. **Web Crawler**: Implemented in `backend/app/system_design/crawler.py`.
   - Seeded with approved local simulated public health directories.
   - SSRF protection: resolves domain IP and rejects RFC1918 / loopback ranges.
7. **Autocomplete Trie**: Implemented in `backend/app/system_design/autocomplete.py`.
   - Normalized prefix lookup with client debounce (250ms).
   - Suggestions ranked by clinical relevance and doctor experience.
