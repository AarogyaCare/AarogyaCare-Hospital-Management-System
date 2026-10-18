# Aarogya Care — End-to-End Academic Demonstration Walkthrough

**Course:** UCS3513 System Design Laboratory  
**Project:** Aarogya Care — Scalable Hospital Management System  
**Evaluation Target:** 13-Point Complete System Demonstration  

---

## Prerequisites & Pre-Flight Checklist

1. **Start MongoDB & Redis:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/start_mongo.ps1
   powershell -ExecutionPolicy Bypass -File scripts/start_redis.ps1
   ```

2. **Start Spring Boot Backend Server (Port 8000):**
   ```powershell
   cd backend
   java -jar target\aarogya-backend-1.0.0.jar --server.port=8000
   ```
   *Health Check:* Open `http://localhost:8000/health/ready` (returns HTTP 200 `database_mongodb: UP`, `cache_redis: UP`, `status: ready`).

3. **Frontend Client Running:**
   ```powershell
   cd frontend
   npm run dev
   ```
   *Application URL:* Open `http://localhost:5173/` in a modern browser.

---

## Demonstration Script: Step-by-Step

### Step 1: Architecture Overview and Technology Stack
- **Action:** Open `docs/TECHNOLOGY_STACK_MIGRATION_REPORT.md` or display the system architecture diagram.
- **Talking Points:**
  - **Modular Monolith Architecture:** Java 23 / Spring Boot 3.4.3 enterprise core with clean domain services and Spring Data repositories (Auth, Outpatient, Clinical Records, Pharmacy, Billing, Emergency, System Design).
  - **Data Tier:** MongoDB Community Server 7.0 (Authoritative persistent document store with compound indexes, atomic conditional updates for slots and inventory).
  - **Caching & Control Tier:** Redis 5.0 (Token bucket shared rate limiting, cache-aside key-value store, 150-vnode consistent hash ring).
  - **Client Tier:** React 19 + TypeScript + Vite + Tailwind CSS with clinical sanctuary design aesthetics.
- **Expected Outcome:** Clear understanding of architectural separation between authoritative MongoDB database and Redis performance/control layers.

---

### Step 2: Patient Registration and Authentication
- **Action:**
  1. Navigate to `http://localhost:5173/` and click **"Patient Portal"** or the login trigger.
  2. Switch to **"Register"** tab.
  3. Enter:
     - Name: `Vikram Raman`
     - Email: `vikram.demo@aarogyacare.org`
     - Phone: `+91 98409 11223`
     - Password: `Aarogya#2026Secure`
  4. Submit registration, then log in.
- **Expected Visible Outcome:** Successful registration (HTTP 201), JWT access token issued and stored in local auth state, welcome banner showing patient dashboard. Privilege escalation attempt to staff role is blocked by server.

---

### Step 3: Doctor Discovery and Autocomplete Suggestions
- **Action:**
  1. On the home search bar, type the prefix: `car`
  2. Observe live autocomplete dropdown: `Cardiology`, `Dr. K. Ramanathan`, etc.
  3. Notice client-side 250ms debouncing (reduces server query traffic by 90%).
  4. Click `Cardiology` or navigate to `/doctors`.
- **Expected Visible Outcome:** Instant suggestions ranked by relevance from the in-memory Trie index; clicking filters the directory to Cardiology specialists.

---

### Step 4: Appointment Availability and Booking
- **Action:**
  1. Click **"Book Appointment"** on Dr. K. Ramanathan's card.
  2. Select an available time slot (e.g., `Tomorrow 09:00 AM`).
  3. Review consultation fee (₹850.00).
  4. Confirm booking.
- **Expected Visible Outcome:** Real-time slot transition from `AVAILABLE` to `BOOKED`. Confirmation page displayed with unique Base62 Short Link (e.g., `/s/Ac81Kd`) for outpatient pass.

---

### Step 5: Concurrent Booking Protection (Double-Booking Prevention)
- **Action:** Explain and demonstrate concurrency invariant test:
  ```powershell
  python -m pytest backend/tests/test_concurrency.py::test_concurrent_bookings_single_slot_winner -v
  ```
- **Talking Points:**
  - 10 simultaneous asynchronous requests submitted against a single exclusive slot.
  - The database row-level locking / PostgreSQL unique constraint `(doctor_id, start_at)` guarantees exactly **1 winner (HTTP 201)** and **9 conflict rejections (HTTP 409)**.
- **Expected Visible Outcome:** Test passes in <1s. Zero double-booking possible.

---

### Step 6: Authorized Clinical Records and Consultation Notes
- **Action:**
  1. In the browser, navigate to `/staff/operations` and select the **"Doctor"** role from the header switcher.
  2. View active outpatient queue.
  3. Open patient `S. Rajendran` (UHID: `AC-2024-9104`).
  4. Review past ECG & lipid reports.
  5. Add consultation notes: *"Patient stable, BP 124/80 mmHg, continue Atorvastatin 20mg."*
- **RBAC Boundary Check:**
  - Explain that Front Desk (`receptionist@aarogyacare.org`) attempting to view clinical records receives **HTTP 403 Forbidden** (`INSUFFICIENT_PERMISSIONS`).
- **Expected Visible Outcome:** Clinical records are rendered for attending physician; non-attending staff blocked.

---

### Step 7: Pharmacy Dispensing and Inventory Consistency
- **Action:**
  1. Switch role to **"Pharmacist"** in `/staff/operations`.
  2. Navigate to **"Pharmacy & Dispensary"** tab.
  3. View inventory table: `Meropenem 1g Inj`, `Colistin`, `Paracetamol 650mg`.
  4. Notice low-stock indicator for `Colistin` (stock 6, reorder threshold 10).
  5. Dispense 10 units of Paracetamol. Stock decrements atomically from 5,000 to 4,990.
  6. Demonstrate invariant test:
     ```powershell
     python -m pytest backend/tests/test_pharmacy_dispensing.py::test_concurrent_dispensing_against_limited_stock -v
     ```
- **Expected Visible Outcome:** Stock quantity never becomes negative; concurrent requests exceeding stock are rejected.

---

### Step 8: Invoice Generation and Idempotent Payment
- **Action:**
  1. Switch role to **"Billing Desk"** in `/staff/operations`.
  2. Review invoice `INV-2026-9104-01` (Total: ₹850.00).
  3. Trigger payment simulation via UPI.
  4. Replay the identical payment request with the same `Idempotency-Key`.
- **Talking Points:**
  - Simulated payment gateway is clearly labeled as an academic prototype simulation.
  - Idempotency records in `idempotency_records` table prevent double billing.
- **Expected Visible Outcome:** First request marks invoice `PAID`; second request safely returns original payment receipt with `idempotency_replayed: true`.

---

### Step 9: Emergency Request Intake and Triage Queue
- **Action:**
  1. Click the red **"Emergency 24/7"** button in the header.
  2. Enter:
     - Patient Name: `K. Murugan`
     - Phone: `+91 99403 99881`
     - Symptoms: `Crushing chest pain radiating to left jaw, sweating`
     - Priority: `ESI-1 STAT`
  3. Submit request.
  4. In `/staff/operations`, switch to **"Triage / Nurse"** role.
  5. Notice the new STAT ticket highlighted at the top of the queue.
  6. Transition status: `TRIAGE_RECEIVED` $\rightarrow$ `IN_TREATMENT`, assign `Resus Bay 01`.
- **Expected Visible Outcome:** Real-time triage status progression with audit log entry.

---

### Step 10: The Seven System-Design Components
- **Action:** Display `/api/v1/system-design/telemetry` or explain each component's live implementation:
  1. **Unique ID Generator:** 50k UUIDv7/Base62 IDs generated at **323,517 IDs/sec** with **0 collisions**.
  2. **Rate Limiter:** Token bucket algorithm; standard burst throttles at 120 reqs (HTTP 429); **emergency intake bypass allows 100% of emergency requests**.
  3. **Key-Value Store:** Redis cache aside with **99.8% hit ratio** and 0.0019 ms warm hit latency.
  4. **Consistent Hashing:** 3 nodes, 150 vnodes each; **31.8% remapping on node removal** (vs 100% modulo remapping).
  5. **URL Shortener:** 6-character Base62 keys ($56.8 \text{ billion}$ capacity); open-redirect prevention verified.
  6. **Web Crawler:** WHO/CDC medical guideline crawler with 100% SSRF loopback protection and SHA-256 deduplication.
  7. **Autocomplete:** Normalized Prefix Trie with client-side 250ms debouncing (90% network call reduction).
- **Expected Visible Outcome:** All seven components verified with empirical metrics in `backend/benchmarks/results/comprehensive_evaluation_summary.json`.

---

### Step 11: Performance Benchmarks and Visual Charts
- **Action:** Open generated PNG graphs located in `backend/benchmarks/results/`:
  - `workload_latencies.png`: Low (11.38ms), Medium (198.74ms), High (256.51ms) latency percentiles.
  - `baseline_vs_optimized.png`: DB query (0.578ms) vs. Cache (0.004ms) $\rightarrow$ **99.3% latency reduction**.
  - `consistent_hashing_distribution.png`: Ring balance and remapping minimal perturbation.
  - `failure_recovery_timeline.png`: Hit ratio drop to 67.93% and seamless DB fallback recovery.
- **Expected Visible Outcome:** Professional, publication-ready graphs matching underlying JSON/CSV numbers.

---

### Step 12: Controlled Scaling / Failure Scenario
- **Action:** Run the failure simulation script:
  ```powershell
  python backend/benchmarks/failure_experiment.py
  ```
- **Talking Points:**
  - Ring starts with 3 nodes (`Node-A`, `Node-B`, `Node-C`) across 1,500 active keys.
  - Controlled failure: `Node-C` is severed.
  - Only **32.07% of keys** are affected (surviving nodes `Node-A` and `Node-B` remain 100% hit rate).
  - 481 missed keys cleanly fall back to PostgreSQL and repopulate onto surviving nodes.
  - **Zero data loss, zero application crashes**.
- **Expected Visible Outcome:** Demonstrates high-availability degradation without catastrophic cache stampede.

---

### Step 13: Security, RBAC, and Privacy Safeguards
- **Action:** Run the automated acceptance test suite:
  ```powershell
  python -m pytest backend/tests/test_phase7_acceptance_workflows.py -v
  ```
- **Talking Points:**
  - Password hashing: PBKDF2-HMAC-SHA256 with 600,000 iterations.
  - No plaintext credentials or secrets in Git.
  - SafeRequestLoggingMiddleware scrubs passwords, bearer tokens, and private patient health information from logs.
  - Database error messages sanitized against SQL injection leaks.
- **Expected Visible Outcome:** All 7 acceptance tests pass (100% pass rate).

---

## Evaluation Conclusion

The **Aarogya Care Scalable Hospital Management System** fulfills all requirements across Phases 1 through 7:
- ✅ Production-grade frontend and backend integration.
- ✅ All 7 system-design components empirically benchmarked.
- ✅ ACID transactional invariants verified under concurrent load.
- ✅ Reproducible benchmark data, publication-ready charts, and final report.
