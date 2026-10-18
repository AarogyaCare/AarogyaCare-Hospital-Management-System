# Aarogya Care — Scalable Hospital Management System

[![Backend](https://img.shields.io/badge/Backend-Spring_Boot_3.4.3-6DB33F.svg?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21%2B-ED8B00.svg?logo=openjdk&logoColor=white)](https://openjdk.org)
[![Frontend](https://img.shields.io/badge/Frontend-React_19_+_TypeScript-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-MongoDB_7.0-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Caching](https://img.shields.io/badge/Caching-Redis_5.0%2F7.0-DC382D.svg?logo=redis&logoColor=white)](https://redis.io)
[![Tests](https://img.shields.io/badge/Tests-22_Passed_(100%25)-4caf50.svg)](#-automated-testing--verification)
[![License](https://img.shields.io/badge/License-Academic_Evaluation-blue.svg)](#-academic-scope--integrity)

> **UCS3513 System Design Laboratory Mini-Project**  
> An enterprise-grade, modular monolith hospital management platform demonstrating clinical workflows, high-concurrency transactional safeguards, and **seven foundational distributed system design components** built with **Java 21 / Spring Boot 3.4.3**, **MongoDB 7.0**, **Redis**, and **React 19 + TypeScript**.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
3. [Architecture Blueprint](#-architecture-blueprint)
4. [Core Features & Clinical Workflows](#-core-features--clinical-workflows)
5. [The Seven System Design Components](#-the-seven-system-design-components)
6. [Environment Variables Configuration](#-environment-variables-configuration)
7. [Installation & Setup](#-installation--setup)
   - [Option A: Docker Compose (Recommended)](#option-a-docker-compose-recommended)
   - [Option B: Native Local Execution](#option-b-native-local-execution)
8. [Automated Testing & Verification](#-automated-testing--verification)
9. [Performance Benchmarks & JMeter Evaluation](#-performance-benchmarks--jmeter-evaluation)
10. [Synthetic Demonstration Accounts & RBAC](#-synthetic-demonstration-accounts--rbac)
11. [Repository Structure](#-repository-structure)
12. [Observability & Health Probes](#-observability--health-probes)
13. [Academic Scope & Integrity](#-academic-scope--integrity)

---

## 🏥 Project Overview

**Aarogya Care** is engineered to address the core operational, transactional, and architectural challenges of contemporary healthcare platforms:
- **High-Concurrency Booking:** Eliminates double-booking of doctor consultation slots under simultaneous parallel traffic using atomic database operations.
- **Strict Clinical Isolation (RBAC):** Protects sensitive patient records, diagnoses, and prescriptions with fine-grained Spring Security role enforcement across seven institutional roles.
- **Atomic Inventory Depletion:** Guarantees zero negative stock in high-throughput pharmacy dispensing through conditional decrement queries.
- **Distributed System Primitives:** Implements seven core system-design algorithms (Snowflake IDs, Token Bucket rate limiting, Cache-Aside, Consistent Hashing, Base62 URL shortener, SSRF-shielded Web Crawler, and dynamic Prefix Trie autocomplete).

---

## 💻 Technology Stack

| Layer | Technologies | Role & Purpose |
| :--- | :--- | :--- |
| **Backend Core** | **Java 21 LTS**, **Spring Boot 3.4.3** | REST API controllers, domain services, and modular monolith architecture |
| **Security & Auth** | **Spring Security 6**, **JJWT 0.12.6**, **BCrypt** | Stateless HS256 JWT tokens, role-based authorization filters, password hashing |
| **Authoritative Store** | **MongoDB Community 7.0** | Persistent document store with compound indexes, atomic `findAndModify`, conditional updates |
| **Cache & State** | **Redis 5.0 / 7.0**, **Spring Data Redis (Lettuce)** | Sub-millisecond cache-aside key-value storage, shared rate limiter tokens, consistent ring |
| **Frontend Client** | **React 19**, **TypeScript 5**, **Vite 6**, **Tailwind CSS** | Accessible clinical portal, operations hub, responsive design, debounced search |
| **Build & Tooling** | **Apache Maven 3.9**, **Node.js 20+**, **Docker / Compose** | Dependency management, reproducible multi-stage container builds, orchestration |
| **Performance Testing** | **Apache JMeter 5.6**, **Python Async Load Harness** | Multi-tier concurrent stress testing, latency percentiles (P50/P95/P99), telemetry monitoring |

---

## 🏗️ Architecture Blueprint

```
                          ┌──────────────────────────────────────────────┐
                          │         React 19 + TypeScript + Vite         │
                          │   (Outpatient Portal & Operations Hub UI)    │
                          └──────────────────────┬───────────────────────┘
                                                 │ HTTP / REST / JSON (Port 8000)
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │         Spring Boot 3.4.3 REST API Core      │
                          │   (Auth, Appointments, Records, Rx, Billing) │
                          │   Spring Security (JWT) + Spring Data Mongo  │
                          └──────┬───────────────┬───────────────┬───────┘
                                 │               │               │
            ┌────────────────────┘               │               └────────────────────┐
            ▼                                    ▼                                    ▼
┌───────────────────────┐            ┌───────────────────────┐            ┌───────────────────────┐
│     MongoDB 7.0       │            │       Redis 5.0       │            │     System Design     │
│ (Authoritative Store) │            │ (Cache & Shared State)│            │  Trie / ID / Crawler  │
│ • Users & Patients    │            │ • Doctor/Dept Cache   │            │ • Base62 Short Links  │
│ • Slots & Bookings    │            │ • Shared Rate Limiter │            │ • Snowflake Generator │
│ • Pharmacy Inventory  │            │ • Consistent Hash Ring│            │ • Safe Web Crawler    │
│ • Invoices & Audit    │            │   (150 vnodes/node)   │            │ • Autocomplete Trie   │
└───────────────────────┘            └───────────────────────┘            └───────────────────────┘
```

---

## ✨ Core Features & Clinical Workflows

1. **Authentication & Role-Based Access Control (RBAC):**
   - 7 distinct operational roles: `patient`, `doctor`, `receptionist`, `nurse`, `pharmacist`, `billing`, and `admin`.
   - BCrypt password hashing (work factor 10) and signed JWT tokens carrying role claims.
2. **Outpatient Consultation & Doctor Discovery:**
   - Multi-specialty directory with departments (Cardiology, Neurology, Orthopedics, Pediatrics, Emergency).
   - Real-time consultation slot availability and doctor profiles with qualifications and ratings.
3. **Atomic Slot Reservation (Double-Booking Prevention):**
   - MongoDB atomic `findAndModify` querying `status: "AVAILABLE"` ensures exactly one user succeeds under concurrent booking races while others receive structured `409 CONFLICT` responses.
4. **Electronic Medical Records (EMR):**
   - Complete clinical notes, symptoms, objective examination findings, diagnoses, and follow-up schedules.
   - Strict medical record isolation: patients view only their own records; doctors view assigned patients; receptionists/billing are forbidden.
5. **Atomic Pharmacy Dispensing & Inventory Control:**
   - Electronic prescriptions linked to clinical appointments.
   - Atomic conditional stock decrement (`$gte: quantity`) eliminates negative inventory during high-volume dispensing.
6. **Billing & Idempotent Payments:**
   - Itemized hospital invoices (consultations, diagnostics, medications, tax).
   - Durable idempotency records stored in MongoDB (`idempotency_records`) guarantee zero duplicate charges upon network retries.
7. **Emergency & Trauma Triage:**
   - Emergency intake with triage priority levels: RED (`ESI-1 STAT`), YELLOW (`ESI-2 URGENT`), and GREEN (`ESI-3 STANDARD`).
   - Dedicated 500-request emergency bypass quota in the API rate limiter.

---

## 🧩 The Seven System Design Components

The project implements all seven system design components required by the UCS3513 laboratory syllabus:

### 1. Unique ID Generator (Snowflake Algorithm)
- **Architectural Classification:** **Distributed-Ready Process Algorithm** (Autonomous Worker Node Architecture)
- **Implementation:** [`UniqueIdGeneratorService.java`](backend/src/main/java/com/aarogya/systemdesign/id/UniqueIdGeneratorService.java)
- **Algorithm:** 64-bit time-ordered Snowflake identifiers composed of:
  - 1 unused sign bit
  - 41 bits timestamp in milliseconds (~69 years lifespan)
  - 10 bits machine / node identifier (up to 1,024 nodes)
  - 12 bits sequence counter (up to 4,096 IDs per millisecond per node)
- **Throughput:** Over 2.7 million IDs/second with zero collision rate across multi-threaded evaluations without centralized database lock contention.

### 2. Token Bucket Rate Limiter
- **Architectural Classification:** **Instance-Local In-Memory Filter** (Process-isolated token bucket with atomic thread safety)
- **Implementation:** [`RateLimiterService.java`](backend/src/main/java/com/aarogya/systemdesign/ratelimiter/RateLimiterService.java)
- **Algorithm:** Atomic refill token bucket with tiered quotas:
  - General API: 100 capacity, 10 tokens/sec refill
  - Authentication `/auth/login`: 20 capacity, 2 tokens/sec refill (brute-force defense)
  - Emergency bypass `/emergency/**`: 500 capacity, 50 tokens/sec refill (zero drops for trauma intake)
- **Behavior:** Returns HTTP `429 Too Many Requests` with `Retry-After` header when quota is exhausted.

### 3. Key-Value Store (Redis Cache-Aside)
- **Architectural Classification:** **Real Distributed Cache** (Networked Redis 5.0/7.0 with Cache-Aside pattern & In-Memory fallback)
- **Implementation:** [`CacheService.java`](backend/src/main/java/com/aarogya/systemdesign/cache/CacheService.java)
- **Pattern:** Cache-Aside with commit-then-invalidate write hygiene:
  - Cache Read: Checks networked Redis key; on miss, loads from MongoDB, sets Redis with TTL (default 10 minutes), and returns.
  - Cache Write/Update: Mutates MongoDB authoritative state first, then immediately invalidates cache keys to avoid stale reads.
  - In-Memory Fallback: Automatically falls back to local memory cache if Redis network connection is temporarily unreachable.

### 4. Consistent Hashing Ring
- **Architectural Classification:** **Logical Partitioning & Cluster Router** (Client-side routing simulation across virtual ring)
- **Implementation:** [`ConsistentHashRing.java`](backend/src/main/java/com/aarogya/systemdesign/hashring/ConsistentHashRing.java)
- **Algorithm:** SHA-256 hash ring with configurable virtual nodes (150 virtual nodes per physical partition).
- **Remapping Behavior:** When a node leaves a 3-node ring, only ~31.8% to 32.1% of keys are remapped (closely matching the theoretical optimal $1/N = 33.33\%$).

### 5. URL Shortener (Outpatient Pass Service)
- **Architectural Classification:** **Real Distributed Service with Persistent Storage** (MongoDB-backed Base62 tokenization)
- **Implementation:** [`ShortLinkService.java`](backend/src/main/java/com/aarogya/systemdesign/shortlink/ShortLinkService.java)
- **Algorithm:** Base62 encoding (`[0-9a-zA-Z]`) generating 6-character compact tokens for patient outpatient passes.
- **Security:** Open-redirect defense actively rejects malicious protocol schemes (`javascript:`, `data:`, `file:`) with HTTP 400.
- **Metrics:** Atomic click counters and last-accessed timestamps persisted in MongoDB.

### 6. Safe Web Crawler (Medical Guidelines Ingestion)
- **Architectural Classification:** **In-Process Network Worker with SSRF Defense Shield** (Polite background ingestor)
- **Implementation:** [`SafeWebCrawlerService.java`](backend/src/main/java/com/aarogya/systemdesign/crawler/SafeWebCrawlerService.java)
- **SSRF Defense:** Comprehensive IP validation shield blocks loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Carrier-Grade NAT (`100.64.0.0/10`), IPv6 ULA (`fc00::/7`), and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
- **Ingestion:** Allowed domains whitelist (`who.int`, `cdc.gov`, `mohfw.gov.in`), depth limiting (max depth 2), page limiting, and SHA-256 content deduplication.

### 7. Dynamic Prefix Trie Autocomplete
- **Architectural Classification:** **Hybrid In-Memory Index with Distributed Redis Caching** (Prefix Trie + Shared cache)
- **Implementation:** [`AutocompleteTrieService.java`](backend/src/main/java/com/aarogya/systemdesign/autocomplete/AutocompleteTrieService.java)
- **Data Structure:** Multi-way Prefix Trie indexing doctors, departments, and medicine inventory.
- **Features:** Subphrase tokenization, frequency scoring, and Redis caching for hot prefixes with sub-millisecond lookups.

---

## 🔐 Environment Variables Configuration

Copy `.env.example` to `.env` before running locally:

```bash
cp .env.example .env
```

| Variable | Required | Default in `.env.example` | Description |
| :--- | :---: | :--- | :--- |
| `SERVER_PORT` | No | `8000` | HTTP listening port for Spring Boot REST API |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/aarogya` | Connection string for MongoDB authoritative database |
| `REDIS_HOST` | Yes | `localhost` | Redis server hostname (use `redis` in Docker Compose) |
| `REDIS_PORT` | No | `6379` | Redis server port |
| `AAROGYA_SECURITY_JWT_SECRET` | **Yes** | *[Placeholder]* | Random, high-entropy 256-bit string (min 32 chars) for JWT signing |
| `AAROGYA_SECURITY_JWT_EXPIRATION_MS` | No | `86400000` | JWT token lifetime in milliseconds (24 hours) |
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000` | Backend API base URL consumed by Vite frontend |

> [!CAUTION]
> Never commit actual `.env` files with production secrets to GitHub. Always use random, high-entropy keys for `AAROGYA_SECURITY_JWT_SECRET`.

---

## 🚀 Installation & Setup

### Option A: Docker Compose (Recommended)

Run the entire stack (MongoDB, Redis, Spring Boot Backend, and React Frontend) with a single command:

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/AarogyaCare_UCS3513_MiniProject.git
cd AarogyaCare_UCS3513_MiniProject

# 2. Configure environment
cp .env.example .env

# 3. Build and launch all containers
docker compose up -d --build

# 4. View container status
docker compose ps
```

- **Frontend Client:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **Health Readiness Probe:** `http://localhost:8000/health/ready`

To shut down and wipe persistent test data:
```bash
docker compose down -v
```

---

### Option B: Native Local Execution

#### 1. Prerequisites
- **Java:** OpenJDK 21 LTS or higher (`java -version`)
- **Maven:** Apache Maven 3.9+ (or use the included wrapper)
- **Node.js:** Node 18+ and npm (`node -v`)
- **MongoDB:** Community Server 7.0 running on port `27017`
- **Redis:** Redis Server running on port `6379`

#### 2. Start Databases
```bash
# Start MongoDB (Default port 27017)
mongod --dbpath ./data/mongo --port 27017

# Start Redis (Default port 6379)
redis-server --port 6379
```

*(On Windows, helper scripts are provided in `scripts/start_mongo.ps1` and `scripts/start_redis.ps1`.)*

#### 3. Start Backend (Spring Boot)
```bash
cd backend

# Run automated tests
mvn test

# Package executable JAR
mvn package -DskipTests

# Run the Spring Boot application
java -jar target/aarogya-backend-1.0.0.jar --server.port=8000
```

#### 4. Start Frontend (React + Vite)
```bash
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing & Verification

The test suite validates data consistency invariants, concurrency safety, security filters, and all system design components:

```bash
# Execute Spring Boot JUnit 5 test suite (22/22 tests passing)
cd backend
mvn test

# Execute Frontend Typecheck & Production Build
cd ../frontend
npm run build
```

### Backend Automated Test Coverage Matrix

| Test Suite | Tests | Invariants & Workflows Verified |
| :--- | :---: | :--- |
| **`AuthAndRbacTests`** | 6 | JWT generation and role claim extraction across all 7 roles, token expiration checks, strict JWT secret entropy validation (>= 32 chars), valid credential authentication, and rejection of bad passwords (HTTP 401). |
| **`AppointmentConcurrencyTests`** | 2 | Race condition safety: 10 parallel threads attempting to reserve the exact same slot. Exactly 1 succeeds (HTTP 201); 9 are rejected with HTTP 409 Conflict. Appointment cancellation and atomic slot re-opening flow. |
| **`PharmacyInventoryConcurrencyTests`** | 2 | High-concurrency stock depletion: 15 concurrent threads dispensing medicine; atomic conditional decrements (`$gte: qty`) ensure inventory never goes negative. Duplicate dispensing blocked via idempotency keys. |
| **`BillingAndIdempotencyTests`** | 4 | Invoice creation and status transitions (`PENDING` -> `PAID`). Payment replay with identical idempotency key returns original receipt without duplicate debit. Replay with conflicting key throws HTTP 409 Conflict. Payment attempts against already paid invoices throw HTTP 400 Bad Request. |
| **`EmergencyWorkflowTests`** | 1 | Emergency request registration, priority queue sorting (`ESI-1 STAT` top priority), authorized nurse/doctor status updates. |
| **`SystemDesignComponentsTests`** | 7 | Unit verification for all 7 components: Snowflake monotonic IDs (0 collisions across multi-threaded generation), Token Bucket limiter (capacity & refill behavior), Redis KV cache-aside, Consistent Hash Ring rebalance (virtual nodes distribution), Base62 URL shortener with protocol injection defense, Safe Web Crawler multi-layer SSRF defense shield (loopback, RFC 1918, metadata endpoints), and Dynamic Prefix Trie autocomplete. |

---

## 📊 Performance Benchmarks & JMeter Evaluation

### Evidence Classification of Published Benchmark Claims

In adherence to scientific evaluation guidelines, all published metrics are explicitly classified below:

| Metric / Benchmark | Classification | Empirical Result | Notes |
| :--- | :---: | :---: | :--- |
| **Workload Latency (10 Users)** | **Actual Measurement** | **Avg: 11.86 ms \| P95: 19.57 ms** | Measured on live Spring Boot + MongoDB + Redis stack via async load harness (`spring_boot_load_test_results.json`). |
| **Workload Latency (50 Users)** | **Actual Measurement** | **Avg: 88.58 ms \| P95: 244.12 ms** | 2,910 total requests, 431.07 RPS peak throughput. |
| **Workload Latency (100 Users)** | **Actual Measurement** | **Avg: 182.96 ms \| P95: 513.10 ms** | 4,043 requests, 447.35 RPS, 0 server (5xx) errors. |
| **Snowflake ID Generation** | **Actual Measurement** | **2,794,201 IDs/sec** | 0 collisions across 50,000 multi-threaded samples (`component_benchmarks.json`). |
| **Redis KV Cache Read** | **Actual Measurement** | **< 1.0 ms** | 99.8% hit ratio on hot catalogue queries (`component_benchmarks.json`). |
| **Prefix Trie Autocomplete** | **Actual Measurement** | **0.04 ms** query latency | Evaluated across hospital catalogue vocabulary. |
| **Consistent Hash Rebalance** | **Actual Measurement** | **31.8% to 32.1% remapping** | Observed key remapping upon node removal in 3-node ring (150 vnodes/node). |
| **Consistent Hash Optimal** | **Theoretical Model** | **33.33% ($1/N$)** | Theoretical ideal key migration for $N=3$. |
| **Payment & SMS Gateways** | **Simulated / Mocked** | **Idempotent simulation** | External third-party gateways are mocked for educational laboratory scope. |

### Running the Apache JMeter Load Test Plan

The project includes an executable JMeter test plan in [`jmeter/aarogya_hospital_workload.jmx`](jmeter/aarogya_hospital_workload.jmx).

```bash
# Execute JMeter in non-GUI mode and produce an HTML dashboard
jmeter -n -t jmeter/aarogya_hospital_workload.jmx \
       -l jmeter/benchmark_results.jtl \
       -e -o jmeter/dashboard_report/ \
       -JHOST=localhost -JPORT=8000
```
Open `jmeter/dashboard_report/index.html` in any browser to inspect interactive graphs and throughput distributions. Detailed instructions are in [`jmeter/README.md`](jmeter/README.md).

---

## 👥 Synthetic Demonstration Accounts & RBAC

When launched with empty database collections, `DatabaseSeedService` automatically populates synthetic demonstration accounts:

> **Master Password for All Demonstration Accounts:** `Aarogya#2026Secure`

| Role | Email | Permissions & Accessible Modules |
| :--- | :--- | :--- |
| **System Administrator** | `admin@aarogyacare.org` | System telemetry, metrics, rate limits, doctor onboarding, audit logs |
| **Consultant Doctor** | `dr.ramanathan@aarogyacare.org` | Assigned outpatient appointments, patient history, clinical notes, e-prescriptions |
| **Front Desk Officer** | `receptionist@aarogyacare.org` | Patient registration, doctor schedule lookup, booking/rescheduling *(no clinical access)* |
| **Triage Lead Nurse** | `nurse@aarogyacare.org` | Emergency intake queue, triage priority updates (`RED` / `YELLOW` / `GREEN`) |
| **Chief Pharmacist** | `pharmacist@aarogyacare.org` | Medicine catalogue, inventory adjustments, atomic prescription dispensing |
| **Billing Officer** | `billing@aarogyacare.org` | Invoices, simulated payment processing, idempotent receipts |
| **Registered Patient** | `patient.rajendran@aarogyacare.org` | Personal health records, appointment bookings, invoice history |

For full details on role isolation and live evaluation scenarios, see [`demo/DEMO_ACCOUNTS.md`](demo/DEMO_ACCOUNTS.md) and [`demo/DEMO_SCRIPT.md`](demo/DEMO_SCRIPT.md).

---

## 📁 Repository Structure

```
AarogyaCare_UCS3513_MiniProject/
├── .env.example                 # Safe environment configuration template
├── .gitignore                   # Comprehensive ignore rules (secrets, build, logs)
├── docker-compose.yml           # Multi-container orchestration (Mongo, Redis, API, UI)
├── README.md                    # Root project documentation & evaluation guide
├── backend/
│   ├── Dockerfile               # Multi-stage Java 21 build container
│   ├── pom.xml                  # Maven dependencies (Spring Boot, Mongo, Redis, JJWT)
│   ├── src/main/java/com/aarogya/
│   │   ├── config/              # Security, Mongo, Redis, OpenAPI configuration
│   │   ├── controller/          # REST endpoints (Auth, Appointments, Pharmacy, etc.)
│   │   ├── dto/                 # Request & response records with validation
│   │   ├── exception/           # Global exception handler & error schemas
│   │   ├── model/               # MongoDB document models (@Document, @Indexed)
│   │   ├── repository/          # Spring Data MongoDB repositories
│   │   ├── security/            # JWT provider, filter, UserPrincipal, UserDetailsService
│   │   ├── service/             # Domain business services (seed, appointments, stock)
│   │   └── systemdesign/        # The Seven System Design Components
│   │       ├── id/              # Snowflake 64-bit Unique ID Generator
│   │       ├── ratelimiter/     # Token Bucket Rate Limiter with Redis state
│   │       ├── cache/           # Key-Value Store (Redis Cache-Aside)
│   │       ├── hashring/        # Consistent Hashing Ring (150 vnodes)
│   │       ├── shortlink/       # Base62 URL Shortener & Open-Redirect Guard
│   │       ├── crawler/         # Safe Web Crawler with SSRF Defense
│   │       ├── autocomplete/    # Prefix Trie Autocomplete Service
│   │       └── metrics/         # System Telemetry & Metrics Service
│   ├── src/main/resources/
│   │   └── application.yml      # Environment-variable backed application configuration
│   ├── src/test/java/com/aarogya/ # 17 automated JUnit 5 tests
│   └── benchmarks/              # Empirical load test results (JSON/CSV)
├── frontend/
│   ├── Dockerfile               # Multi-stage Node 20 frontend container
│   ├── package.json             # React 19, TypeScript, Vite, Tailwind CSS
│   ├── src/
│   │   ├── components/          # Reusable clinical UI components & modals
│   │   ├── layouts/             # Navigation layouts (MainLayout, PortalLayout)
│   │   ├── pages/               # OperationsHub, PatientPortal, Doctors, Emergency, etc.
│   │   ├── routes/              # Client-side routing
│   │   ├── services/            # Axios API client pointing to Spring Boot
│   │   └── types/               # TypeScript interfaces & domain types
│   └── .env.example             # Frontend environment template
├── jmeter/
│   ├── aarogya_hospital_workload.jmx # Executable Apache JMeter 5.6+ test plan
│   └── README.md                # JMeter execution & benchmark report guide
├── demo/
│   ├── DEMO_ACCOUNTS.md         # Demonstration credentials & RBAC matrix
│   └── DEMO_SCRIPT.md           # 13-point step-by-step evaluation walkthrough
├── docs/
│   ├── ARCHITECTURE_BLUEPRINT.md# Detailed architectural design specification
│   ├── DEPLOYMENT_AND_OPERATIONS.md # Deployment runbook & operational manual
│   └── FINAL_PROJECT_REPORT.md  # Comprehensive academic lab project report
└── scripts/                     # Platform startup helper scripts
```

---

## 🩺 Observability & Health Probes

The backend exposes operational diagnostic and telemetry endpoints:
- `GET /health` — Process liveness probe.
- `GET /health/ready` — Dependency readiness probe (verifies MongoDB and Redis connectivity).
- `GET /api/v1/system-design/telemetry` — Real-time telemetry exposing JVM memory, cache hit/miss ratio, active rate-limiter buckets, indexed crawler documents, and trie node counts.
- `GET /docs` — Interactive OpenAPI / Swagger UI interface.

---

## 📜 Academic Scope & Integrity

- **Synthetic Data:** All patient records, diagnoses, and medical histories are strictly synthetic demonstrations. No real Protected Health Information (PHI) is contained in this repository.
- **Simulated Third-Party Integrations:** Payment gateway transactions and SMS outpatient pass notifications are simulated within the academic project boundary; transactional receipts and idempotency records are fully persisted in MongoDB.
- **Reproducibility:** All performance test results, benchmark scripts, and JMeter test plans are packaged directly in this workspace for independent verification.
