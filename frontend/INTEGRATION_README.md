# Aarogya Care — Full Integrated Frontend

This archive contains the **complete frontend2 application**, not a reduced sample: all 24 hospital screens, layouts, shared components, and all seven System Design Lab screens are preserved. It is packaged as a `frontend/` directory for copying into the original Aarogya Care repository.

## Install
1. Back up the original repository's `frontend/` directory.
2. Extract this ZIP and copy its `frontend/` directory into the original repository, replacing the existing frontend folder.
3. Start MongoDB, Redis, and the original Spring Boot backend as specified in the repository README.
4. In this folder run `npm install` and then `npm run dev`.
5. Open `http://localhost:5173`. `.env` points to `http://localhost:8000`; change `VITE_API_BASE_URL` if your backend uses another address.
6. Run `npm run build` to type-check and build the frontend.

## Integrated backend flows
- Login calls `POST /api/v1/auth/login`, stores the returned access token, and the shared API client sends it as a Bearer token.
- Doctor directory loads from `/api/v1/doctors`.
- Appointment listing and cancellation call `/api/v1/appointments`.
- Appointment booking requires a logged-in user, looks up available doctor slots, and posts the selected slot to `/api/v1/appointments` with an idempotency key.
- Medical records load from `/api/v1/patients/me`.
- Billing reads invoices and submits simulated payment requests to the billing API.
- Pharmacy inventory loads from `/api/v1/pharmacy/inventory`.
- Autocomplete uses the backend trie endpoint.
- URL shortener creation and lookup use persistent backend short-link endpoints.
- `src/services/api.ts` also exposes helpers for departments, medicine listing, emergency queue/status, crawler jobs/search/stats, consistent hashing, rate-limit metrics, telemetry, and unique-ID benchmarks.

## Important limits
Preserving the full sample frontend does not make every original demo button persistent automatically. Some clinical, nursing, reception, pharmacy dispensing/adjustment, invoice desk, emergency, and system-design lab interactions still use sample state or local visualization. The backend has no general-purpose key-value-store CRUD endpoint, so that lab remains a frontend simulation unless a backend endpoint is added. Verify each workflow against the backend API and MongoDB before describing it as fully persistent. The backend DTOs and controller routes are the source of truth; do not fabricate successful persistence.

The seeded demo accounts and shared demo password are defined by the original backend's `DatabaseSeedService`. They are intended for local synthetic demonstration data only.
