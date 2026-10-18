# Aarogya Care — Apache JMeter Performance Benchmark Suite

This directory contains the Apache JMeter load and stress test plan for the **Aarogya Care Scalable Hospital Management System**.

---

## 1. Test Plan Overview (`aarogya_hospital_workload.jmx`)

The test plan exercises the live Spring Boot REST API backed by MongoDB and Redis under three concurrent workload profiles:

| Workload Level | Thread Group | Concurrent Users | Ramp-Up Period | Loops per User | Total Requests per Sampler |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Level 1: Low** | `Workload-Low-10Users` | 10 | 2 seconds | 20 | 200 |
| **Level 2: Medium** | `Workload-Medium-50Users` | 50 | 5 seconds | 20 | 1,000 |
| **Level 3: High** | `Workload-High-100Users` | 100 | 10 seconds | 20 | 2,000 |

### Tested Target Endpoints
1. `GET /health/ready` — Readiness probe (MongoDB + Redis connection health)
2. `GET /api/v1/departments` — Department catalogue (Redis cache-aside lookup)
3. `GET /api/v1/doctors?limit=10` & `?department_id=dept-cardio` — Doctor directory & availability
4. `GET /api/v1/autocomplete?q=card&limit=5` — Prefix Trie search engine (< 0.1 ms latency)
5. `GET /api/v1/system-design/telemetry` — Live telemetry metrics

---

## 2. Prerequisites & Setup

Ensure the Aarogya Care infrastructure and application services are running:
```bash
# 1. MongoDB (localhost:27017)
# 2. Redis (localhost:6379)
# 3. Spring Boot Backend on port 8000
# Verify readiness:
curl -s http://localhost:8000/health/ready
```

Install Apache JMeter 5.6+:
- **macOS:** `brew install jmeter`
- **Ubuntu/Debian:** `sudo apt-get install jmeter`
- **Windows:** Download binary zip from [jmeter.apache.org](https://jmeter.apache.org/download_jmeter.cgi) and extract.

---

## 3. Execution Instructions

### Non-GUI (Headless) Execution with HTML Dashboard Report
Run the following command from the project root:

```bash
# Execute JMeter load test and generate dashboard report
jmeter -n -t jmeter/aarogya_hospital_workload.jmx \
       -l jmeter/benchmark_results.jtl \
       -e -o jmeter/dashboard_report/ \
       -JHOST=localhost -JPORT=8000
```

### Parameter Reference
- `-n`: Non-GUI mode (mandatory for accurate performance testing)
- `-t`: Path to JMeter `.jmx` test plan
- `-l`: Path to output CSV/JTL sample log file
- `-e -o <dir>`: Generate complete HTML graphical dashboard report in `<dir>`
- `-JHOST=<host>`: Target host override (default: `localhost`)
- `-JPORT=<port>`: Target port override (default: `8000`)

---

## 4. Benchmark Result Status & Evidence Classification

In compliance with academic evaluation standards, all published performance claims in this project are strictly categorized:

| Metric Category | Source / Benchmark | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Target Stack Latencies & Throughput** | `backend/benchmarks/results/spring_boot_load_test_results.json` | **Actual Measurement** | Measured empirically on the live Spring Boot 3.4.3 + MongoDB 7.0 + Redis 5.0 stack using the asynchronous test harness. (Avg: 11.86 ms at 10 users, 182.96 ms at 100 users, peak throughput 447.35 RPS). |
| **Component Latency & Throughput** | `backend/benchmarks/results/component_benchmarks.json` | **Actual Measurement** | Empirically verified via unit benchmark suites for Snowflake ID generation (2,794,201 IDs/sec), Cache reads (< 1 ms), and Trie query (0.04 ms). |
| **Throttling & 429 Response Rates** | `backend/benchmarks/results/workload_benchmarks.csv` | **Actual Measurement** | Demonstrates Token Bucket rate limiter active throttling when client exceeds quota limits without emergency bypass. |
| **Consistent Hash Key Migration** | Ring Rebalance Experiment | **Actual Measurement** | Recorded 31.8% to 32.1% remapping during single-node removal from 3-node ring (150 virtual nodes/node). |
| **Theoretical Bounds** | Mathematical Limit ($1/N = 33.33\%$) | **Theoretical / Model** | The theoretical ideal minimum key remapping for an $N=3$ consistent hash ring. |
| **Third-Party Integrations** | Payment Gateway & SMS Dispatch | **Simulated / Mocked** | Intentionally mocked within the academic project boundary; idempotent receipts and transaction records are fully persisted in MongoDB. |
