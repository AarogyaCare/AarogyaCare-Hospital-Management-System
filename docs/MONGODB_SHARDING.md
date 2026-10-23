# MongoDB sharding

The Docker environment runs a MongoDB config-server replica set, three single-member shard replica sets, and a `mongos` router. The backend connects only to `mongodb://mongos:27017/aarogya` inside Compose, or `mongodb://localhost:27017/aarogya` from the host.

`PatientDocument.id` and `DoctorDocument.id` are the current immutable record identifiers and are persisted as MongoDB `_id`. Both `aarogya.patients` and `aarogya.doctors` use `{ _id: "hashed" }` as their shard key. This avoids write concentration from sequential identifiers while preserving targeted reads, updates, and deletes by the existing identifier APIs. It also avoids introducing duplicate `patientId` or `doctorId` fields into the established documents.

## Start and initialize

```sh
cp .env.example .env
# Set AAROGYA_SECURITY_JWT_SECRET in .env before starting.
docker compose up -d --build
docker compose ps
docker compose logs mongo-init
```

`mongo-init` is idempotent: it initializes replica sets where needed, adds missing shards, enables sharding, creates the collections and hashed indexes, then shards both collections. Its successful completion gates backend startup.

## Seed and verify distribution

```sh
docker compose exec -e MONGODB_DATABASE=aarogya -e SHARD_SAMPLE_SIZE=3000 mongos \
  mongosh --quiet /scripts/seed-sharding-data.js
docker compose exec mongos mongosh --quiet /scripts/verify-sharding.js
```

The verify command prints `sh.status()`, collection indexes, MongoDB `$collStats` per-shard document totals, and each collection's `getShardDistribution()` result. A valid result lists `shard1`, `shard2`, and `shard3`, shows both collections sharded on hashed `_id`, and reports documents on multiple shards after synthetic data insertion.

On the local verification run with 3,000 synthetic records per collection, `patients` held 1,002 documents on `shard1`, 999 on `shard2`, and 999 on `shard3`; `doctors` held 946, 1,030, and 1,024 respectively. These figures come from `$collStats` queried through `mongos`, not from the number of running containers.

## Persistence and shutdown

```sh
docker compose down
docker compose up -d
docker compose logs mongo-init
```

Named `mongo_config_data` and `mongo_shard*_data` volumes retain config metadata and documents. Do not run `docker compose down -v` unless intentionally destroying the cluster.
