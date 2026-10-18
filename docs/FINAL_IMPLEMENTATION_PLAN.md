# AarogyaCare — Final Implementation Plan & Engineering Audit

**Project:** AarogyaCare — Scalable Hospital Management System  
**Course:** UCS3513 System Design Laboratory Mini-Project  
**Audit Date:** October 18, 2026  
**Auditor:** Senior Software Architect & Engineering Lead  
**Document Status:** ACTIVE EXECUTION PLAN  

---

## 1. Executive Audit Overview

An exhaustive code-level audit was conducted across the entire AarogyaCare codebase, covering Spring Boot backend services, security configurations, MongoDB persistence models, Redis cache-aside logic, the seven required system-design components, frontend React/TypeScript pages and API clients, Dockerfiles, and Apache JMeter test assets.

### 1.1 Key Strengths Identified
1. **Clean Modular Monolith Architecture:** Separation of concerns across `config`, `controller`, `dto`, `exception`, `model`, `repository`, `security`, `service`, and `systemdesign`.
2. **Spring Boot 3.4.3 & Java 21 Foundation:** Modern Java records for DTOs, Spring Data MongoDB, and Spring Data Redis with Lettuce client.
3. **Atomic Slot Reservation & Inventory Control:** Baseline implementation utilizes MongoDB atomic `findAndModify` checking slot availability and inventory stock `$gte: qty`.
4. **Local Runtime Verification:** OpenJDK 21, Maven 3.9, Node 25, MongoDB (PID 857), Redis (PID 862), Docker 29.3, and Apache JMeter 5.6 are all installed and operational on the host machine.

---

## 2. Requirement-to-Code Defect Matrix

| ID | Requirement Area | Current Implementation State | Identified Deficiency / Risk | Planned Correction | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Public User Registration | `AuthService.register()` allows request to specify any role except "admin". | **Privilege Escalation:** Public users can register directly as `doctor`, `nurse`, `pharmacist`, `receptionist`, or `billing_staff`. | Enforce that public `register()` ALWAYS forces `role = "patient"`. Provide a protected `@PreAuthorize("hasRole('ADMIN')")` endpoint for staff creation. | Public registration with `role: "doctor"` creates a patient. Unauthenticated call to staff creation returns 401/403. |
| **SEC-02** | Horizontal & Vertical Access Control | `PatientController` exposes `/{id}/records`, `/{id}/prescriptions`, `/{id}/invoices` without checking caller identity. | **Information Disclosure / IDOR:** Any authenticated patient can read another patient's medical history, prescriptions, and invoices by altering the URL ID. | Implement server-side ownership and role checks: Patients may only read their own records; Staff may access only within role permissions. | Accessing another patient's records as a patient returns HTTP 403 Forbidden. Accessing own records returns HTTP 200. |
| **SEC-03** | Appointment Ownership & State Machine | `AppointmentService.cancelAppointment()` and `rescheduleAppointment()` do not verify caller ownership or current status. | **State Corruption:** Patient A can cancel Patient B's appointment. Repeated cancellations restore already booked slots. Completed appointments can be cancelled. | Implement explicit appointment state machine (`CONFIRMED -> CANCELLED`, `CONFIRMED -> RESCHEDULED`). Check ownership or staff privileges. Idempotent slot release. | Cancelling another user's appointment returns 403. Cancelling a `COMPLETED` appointment returns 409/400. Re-cancelling does not double-increment slot availability. |
| **SEC-04** | Billing & Payment Invariants | `BillingService.simulatePayment()` marks invoice `PAID` without verifying if already paid (if new key is passed) or amount validation. | **Double Payment / Underpayment:** Invoices can be paid multiple times with different keys. Underpayment is accepted. | Validate amount >= netPayable. Atomically transition invoice from `PENDING` to `PAID` via `findAndModify`. Reject duplicate payments for already paid invoices. | Paying an already paid invoice throws 409 Conflict. Paying with insufficient amount throws 400 Bad Request. |
| **SYS-01** | Distributed Rate Limiter (Section 8.1) | `RateLimiterService` uses in-memory `ConcurrentHashMap<String, LocalTokenBucket>`. | **Not Distributed:** Rate limit state is not shared across application instances; does not leverage Redis atomic Lua execution as required. | Implement Redis-backed token bucket using atomic Lua script with failover to bounded local memory cache. Add counters for allowed, rejected, Redis failures, and fallbacks. | Multi-instance shared throttling verified in tests. Emergency requests bypass standard limits. Redis failure falls back safely. |
| **SYS-02** | Unique ID Generator (Section 8.4) | `UniqueIdGeneratorService` uses static worker ID. `AuthService` and `AppointmentService` perform modulo `id % 100000`. | **Collision Risk:** Modulo 100,000 destroys Snowflake uniqueness, capping IDs at 100k. Clock rollback handling is simplistic. | Externalize worker ID configuration (`aarogya.snowflake.worker-id`). Remove all modulo truncation. Robust clock rollback handling (busy-wait or exception). | 50,000 generated IDs produce 0 collisions. Worker ID configurable via environment. |
| **SYS-03** | Web Crawler (Section 8.6) | `SafeWebCrawlerService` hardcodes a simulated snippet instead of fetching real HTTP content. | **Simulated Implementation:** Does not actually perform network requests, parse HTML, or extract live links. | Implement real `java.net.http.HttpClient` crawler with domain whitelist, IP-level SSRF blocking, title/text/link extraction, SHA-256 deduplication, and max page/depth bounds. | Crawler successfully fetches allowed URLs, extracts text and links, and blocks loopback, private subnets, and cloud metadata. |
| **SYS-04** | Autocomplete Engine (Section 8.7) | `AutocompleteTrieService` initializes with hardcoded sample vocabulary. | **Stale / Detached Data:** Does not index actual MongoDB database entities (doctors, departments, medicines). | Dynamically build Trie from MongoDB repositories on application startup and update on entity creation/mutation. Cache queries in Redis with versioned invalidation. | Real doctors and medicines stored in MongoDB appear in autocomplete results. Ingestion metrics exposed. |
| **SYS-05** | Consistent Hashing (Section 8.2) | `ConsistentHashRing` exists as standalone class with no operational routing integration. | **Unintegrated Component:** Key routing does not influence any caching or data path. | Create `HashRingCacheRouter` exposing ring routing and node management endpoints (`/api/v1/system-design/hashring/...`). Map keys to virtual node partitions. | Endpoints allow adding/removing nodes and simulating remapping. Key routing verified deterministically. |
| **SYS-06** | URL Shortener (Section 8.5) | `SystemDesignController` only returns JSON metadata for short-links; hardcodes port 8080. | **No HTTP Redirect:** Does not return HTTP 302/307 redirect for short-code resolution. | Add `GET /s/{code}` and `GET /api/v1/short-links/{code}/redirect` returning HTTP 302 with `Location` header. Retain `/api/v1/short-links/{code}` for metadata. Enforce SSRF and open redirect guards. | Resolving short-link returns HTTP 302 redirect. Unsafe protocols (e.g. `javascript:`) rejected. |
| **UI-01** | Frontend Silent Mock Fallback | `frontend/src/services/api.ts` catches all errors and silently falls back to `mockData.ts`. | **Hidden Failures:** UI masks backend errors, network disconnections, and 4xx/5xx responses with synthetic data in normal operation. | Add explicit `VITE_DEMO_MODE` environment variable and UI toggle. In normal mode, bubble real API errors to UI. In demo mode, display prominent banner indicating offline mode. | Normal mode displays error banners when API fails. Demo mode displays amber warning banner. |
| **OPS-01** | Frontend Dockerfile Build Context | `frontend/Dockerfile` specifies `COPY frontend/package*.json ./` when Docker Compose context is `./frontend`. | **Build Failure:** Docker build fails because nested path `frontend/frontend` does not exist in context. | Fix paths in `frontend/Dockerfile` to `COPY package*.json ./` and `COPY . ./`. | `docker build` succeeds without path errors. |
| **DOC-01** | Documentation Alignment | Discrepancies between legacy documentation and target Java/Spring Boot/Mongo/Redis architecture. | **Audit Confusion:** Mentions of FastAPI or SQLite linger in some historical report sections. | Update `README.md`, `ARCHITECTURE_BLUEPRINT.md`, and produce dedicated documents for RBAC, consistency, and JMeter reports. | All documentation accurately reflects Spring Boot 3.4.3, MongoDB 7.0, and Redis 5.0/7.0. |

---

## 3. Phased Implementation Roadmap

1. **Phase 1: Security & RBAC Hardening** (SEC-01, SEC-02, SEC-03, SEC-04)
   - Restrict public registration to `ROLE_PATIENT`.
   - Add admin staff creation endpoint.
   - Secure patient records, appointments, prescriptions, and billing endpoints with ownership and role guards.
   - Enforce appointment state machine.
   - Enforce payment validation (prevent double payments and underpayments).

2. **Phase 2: System Design Components Hardening** (SYS-01, SYS-02, SYS-03, SYS-04, SYS-05, SYS-06)
   - Implement Redis Lua Token Bucket Rate Limiter with fallback telemetry.
   - Fix Unique ID Generator: externalize worker ID, remove modulo truncation, robust clock check.
   - Implement Real Safe Web Crawler using `HttpClient` with SSRF shield and mock HTTP test harness.
   - Build dynamic Autocomplete Trie indexing live MongoDB entities with Redis caching.
   - Integrate Consistent Hash Ring with partition router and administrative endpoints.
   - Enhance URL Shortener with HTTP 302 redirect and open redirect security.

3. **Phase 3: Frontend Refactoring & Explicit Demo Mode** (UI-01, OPS-01)
   - Configure explicit Demo Mode vs Live API Mode in `api.ts`.
   - Add visual banner for Demo Mode.
   - Fix `frontend/Dockerfile`.

4. **Phase 4: Automated Testing Suite Expansion**
   - Unit tests for ID generator, rate limiter, hash ring, crawler, autocomplete, and state machines.
   - Concurrency tests for appointments, inventory, and payments.
   - Security tests for IDOR and privilege escalation.
   - Run complete test suite and record results.

5. **Phase 5: Apache JMeter Performance Evaluation**
   - Run JMeter non-GUI load tests across 10, 50, and 100 concurrent threads.
   - Record JTL logs, compute latencies and throughput, and generate performance analysis.

6. **Phase 6: Final Verification & Documentation Delivery**
   - Create required architecture, RBAC, data model, and testing guides.
   - Produce final verification report with full requirement completion matrix.
