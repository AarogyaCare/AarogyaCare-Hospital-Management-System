#!/bin/sh
set -eu

init_replica_set() {
  host="$1"; port="$2"; replica_set="$3"; member_host="$4"
  until mongosh --quiet --host "$host" --port "$port" --eval "db.adminCommand('ping').ok" >/dev/null 2>&1; do sleep 2; done
  mongosh --quiet --host "$host" --port "$port" --eval "try { rs.status(); } catch (error) { rs.initiate({_id: '$replica_set', members: [{_id: 0, host: '$member_host:$port'}]}); }" >/dev/null
}

init_replica_set configsvr "$MONGO_CONFIG_PORT" "$MONGO_CONFIG_REPLICA_SET" configsvr
init_replica_set shard1 "$MONGO_SHARD1_PORT" "$MONGO_SHARD1_REPLICA_SET" shard1
init_replica_set shard2 "$MONGO_SHARD2_PORT" "$MONGO_SHARD2_REPLICA_SET" shard2
init_replica_set shard3 "$MONGO_SHARD3_PORT" "$MONGO_SHARD3_REPLICA_SET" shard3
until mongosh --quiet --host mongos --port "$MONGOS_PORT" --eval "db.adminCommand('ping').ok" >/dev/null 2>&1; do sleep 2; done
exec mongosh --quiet --host mongos --port "$MONGOS_PORT" /scripts/init-sharded-cluster.js
