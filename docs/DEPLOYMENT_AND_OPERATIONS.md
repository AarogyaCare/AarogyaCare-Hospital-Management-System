# Aarogya Care — Deployment, Operations, and Security Hardening Guide

**Document Version:** 1.0.0 (Phase 8 Production Readiness)  
**System:** Aarogya Care Scalable Hospital Management System  
**Course:** UCS3513 System Design Laboratory  

---

## 1. Architecture & Multi-Container Topology

Aarogya Care is containerized as an orchestrated multi-service architecture using Docker and Docker Compose:

```
                            ┌─────────────────────────────────────────┐
                            │    aarogya-frontend (Node 20 Alpine)    │
                            │      Vite Production-Preview (5173)     │
                            └────────────────────┬────────────────────┘
                                                 │ HTTP Reverse Proxy / REST
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │    aarogya-backend (Python 3.11 Slim)   │
                            │   Non-root user 'aarogya' (UID 1001)    │
                            │        Uvicorn ASGI Core (8000)         │
                            └─────────┬──────────────┬──────────────┬─┘
                                      │              │              │
                 ┌────────────────────┘              │              └────────────────────┐
                 │                                   │                                   │
                 ▼                                   ▼                                   ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│     aarogya-postgres (PG 16)    │ │   aarogya-redis-control (R-7)   │ │  Consistent Hash Cluster (3x)   │
│  Authoritative Relational ACID  │ │ Token Bucket Limiter State (6379│ │  • redis-cache-a (Port 6381)   │
│  Healthcheck: pg_isready        │ │ Healthcheck: redis-cli ping     │ │  • redis-cache-b (Port 6382)   │
│  Volume: aarogya_postgres_data  │ │                                 │ │  • redis-cache-c (Port 6383)   │
└─────────────────────────────────┘ └─────────────────────────────────┘ └─────────────────────────────────┘
```

---

## 2. Container Configuration & Hardening

### Multi-Stage Build & Security Hardening
1. **Non-Root Execution:**
   - Backend runs as system user `aarogya` (UID 1001 / GID 1001) to minimize container breakout risks.
   - Frontend runs as user `node` (UID 1000).
2. **Deterministic Startup Order (`depends_on` conditions):**
   - The backend service waits for `db` and `redis-control` to report healthy before starting (`condition: service_healthy`).
   - The backend `entrypoint.sh` executes a bounded database connection verification loop (30 retries, 60s timeout) before triggering migrations.
3. **Automated Migration & Seeding:**
   - `entrypoint.sh` automatically runs `alembic upgrade head` and `backend/scripts/seed.py` on container startup, ensuring schemas and synthetic baseline data are always current.
4. **Volume Persistence:**
   - PostgreSQL authoritative data is stored in named volume `aarogya_postgres_data`.

---

## 3. Environment Variables & Secret Management

Configuration is loaded via Pydantic Settings (`pydantic-settings 2.6+`) from `.env` or system environment variables:

| Variable | Type | Default Value | Description & Constraints |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | string | `development` | Operating mode: `development`, `production`, or `test`. |
| `DATABASE_URL` | string | `""` | Connection URL (e.g., `postgresql+psycopg://...` or `sqlite:///./aarogya_local.db`). |
| `SECRET_KEY` | string | — | Cryptographic JWT signing secret. **Must be at least 16 characters (32+ recommended). Cannot be empty.** |
| `ALGORITHM` | string | `HS256` | JWT cryptographic algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | integer | `1440` (24h) | Session token lifespan. |
| `REDIS_CONTROL_URL` | string | `redis://localhost:6379/0` | Redis instance for shared token-bucket rate limiter. |
| `REDIS_CACHE_A_URL` | string | `redis://localhost:6381/0` | Cache node A in consistent hashing ring. |
| `REDIS_CACHE_B_URL` | string | `redis://localhost:6382/0` | Cache node B in consistent hashing ring. |
| `REDIS_CACHE_C_URL` | string | `redis://localhost:6383/0` | Cache node C in consistent hashing ring. |
| `LOG_LEVEL` | string | `INFO` | Logging threshold (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `CORS_ORIGINS` | list | `["http://localhost:5173", ...]` | Allowed HTTP CORS origins. |

> [!CAUTION]
> In production deployments, never commit `.env` files to source control. Use the provided [`.env.example`](.env.example) template.

---

## 4. Operational Health & Telemetry Endpoints

Three operational endpoints provide monitoring without leaking sensitive credentials or patient health information (PHI):

### 1. Process Liveness (`GET /health` or `GET /api/v1/health`)
- **HTTP Status:** 200 OK
- **Payload:** `{"status": "healthy", "service": "Aarogya Care API", "version": "1.0.0", "timestamp": "..."}`
- **Usage:** Container liveness probes (Docker / Kubernetes).

### 2. Dependency Readiness (`GET /health/ready` or `GET /api/v1/health/ready`)
- **HTTP Status:** 200 OK (Ready) or 503 Service Unavailable (Degraded)
- **Payload:**
  ```json
  {
    "status": "ready",
    "database": "PostgreSQL connection operational",
    "environment": "development",
    "database_url_sanitized": "sqlite:///./aarogya_local.db",
    "details": {
      "database_connected": true,
      "pooling_enabled": true,
      "max_overflow": 20,
      "pool_size": 10
    }
  }
  ```
- **Usage:** Load balancer routing and traffic admission.

### 3. Component-Level Subsystem Health (`GET /health/components` or `GET /api/v1/health/components`)
- **HTTP Status:** 200 OK (Operational) or 503 Service Unavailable (Degraded)
- **Monitored Subsystems:**
  - `database`: Operational status, connection message, sanitized URL, pool settings.
  - `cache`: Hit ratio %, hits, misses, evictions.
  - `consistent_hashing`: Active nodes, virtual node count, total ring positions.
  - `rate_limiter`: Active policies, accepted/rejected counts, emergency bypass status.
  - `url_shortener`: Base62 link service status, open-redirect protection flag.
  - `web_crawler`: SSRF protection status, indexed documents count.
  - `autocomplete`: Total terms indexed, recommended debouncing interval (250ms).
  - `host_telemetry`: CPU utilization %, Memory %, available RAM in MB (via `psutil`).

---

## 5. Database Backup & Disaster Recovery

### Automated Backup Procedure
Run the automated backup script to create a verified, timestamped snapshot:

```powershell
$env:DATABASE_URL="sqlite:///./aarogya_local.db"
python backend/scripts/backup_db.py
```

**Artifacts Generated in `backups/`:**
1. Backup Archive: `backups/aarogya_backup_YYYYMMDD_HHMMSS.[db|sql]`
2. Integrity Manifest: `backups/aarogya_backup_YYYYMMDD_HHMMSS.manifest.json`
   - Records UTC timestamp, database engine, file size in bytes.
   - Contains a cryptographically verified SHA-256 checksum.
   - Contains exact record counts across all core tables (`users`, `patients`, `doctors`, `appointments`, `invoices`, `medicines`, etc.).

### Safe Restoration Procedure
To restore a backup into a designated target environment:

```powershell
# Restore latest backup
python backend/scripts/restore_db.py

# Restore specific archive into isolated test database
python backend/scripts/restore_db.py --backup-file backups/aarogya_backup_20261017_230941.db --target-url sqlite:///./aarogya_test.db
```

**Safety Controls:**
- Checks SHA-256 hash of archive against manifest before execution.
- Refuses to overwrite production databases unless `--force-production` is explicitly passed.
- Executes post-restoration table verification comparing actual row counts to expected manifest counts.

---

## 6. Security Hardening Audit Summary

| Security Vector | Implementation & Mechanism | Verification Status |
| :--- | :--- | :---: |
| **Authentication & Tokens** | JWT tokens signed with HS256; password hashing via PBKDF2-HMAC-SHA256 (600,000 iterations). | ✅ Verified |
| **Secret Validation** | Weak or empty `SECRET_KEY` (<16 chars) triggers startup validation error. | ✅ Verified |
| **Open-Redirect Protection** | URL Shortener strictly blocks external destinations outside internal routes (HTTP 400). | ✅ Verified |
| **SSRF Defense** | Web crawler blocks `127.0.0.1`, `localhost`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`. | ✅ Verified |
| **Data Sanitization in Logs** | `SafeRequestLoggingMiddleware` scrubs credentials, bearer tokens, and private health notes. | ✅ Verified |
| **Exception Masking** | Global exception handlers sanitize SQL syntax errors and internal stack traces (HTTP 500). | ✅ Verified |
| **RBAC Isolation** | Receptionists and pharmacists blocked from medical records & prescriptions (HTTP 403). | ✅ Verified |
| **Container Security** | Non-root users (`aarogya:aarogya`, UID 1001; `node:node`, UID 1000). | ✅ Configured |

---

## 7. Startup, Failure Scenarios, and Recovery Behavior

| Scenario | System Behavior & Failure Handling | Observed Outcome |
| :--- | :--- | :--- |
| **Database Down at Startup** | `entrypoint.sh` retries connection with bounded backoff (30 attempts). `/health/ready` returns 503 Service Unavailable. | Zero application crashes; traffic admission blocked until database is ready. |
| **Cache Node Severed** | Consistent hashing ring remaps only $1/N \approx 32\%$ of keys. Missing reads transparently fall back to PostgreSQL. | Zero data loss; surviving nodes maintain 100% cache hit rate; automatic rebalancing on recovery. |
| **Rate Limiter Spike** | Excessive burst traffic receives HTTP 429 (`Too Many Requests`) with `Retry-After`. | Server protected from starvation; **emergency requests bypass throttling 100%**. |
| **CORS Violation** | Requests from unauthorized origins rejected by Starlette CORS middleware. | Client-side isolation enforced. |
| **Unapproved Domain Crawl** | Crawler rejects domain outside whitelist (`who.int`, `mohfw.gov.in`, etc.). | Zero malicious internal or external hosts accessed. |

---

## 8. Docker Compose Orchestration Commands

```bash
# Build and start all 6 containers in detached mode
docker-compose up --build -d

# Inspect running container status and healthchecks
docker-compose ps

# Tail backend and frontend application logs
docker-compose logs -f backend frontend

# Stop and gracefully terminate containers
docker-compose down

# Reset containers and purge persistent data volume (Development only)
docker-compose down -v
```
