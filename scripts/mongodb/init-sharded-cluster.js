const database = process.env.MONGODB_DATABASE || 'aarogya';
const admin = db.getSiblingDB('admin');
function addShardIfMissing(name, connectionString) {
  if (!(admin.runCommand({ listShards: 1 }).shards || []).some((shard) => shard._id === name)) {
    const result = admin.runCommand({ addShard: connectionString, name });
    if (!result.ok) throw new Error(tojson(result));
  }
}
addShardIfMissing('shard1', `${process.env.MONGO_SHARD1_REPLICA_SET}/shard1:${process.env.MONGO_SHARD1_PORT}`);
addShardIfMissing('shard2', `${process.env.MONGO_SHARD2_REPLICA_SET}/shard2:${process.env.MONGO_SHARD2_PORT}`);
addShardIfMissing('shard3', `${process.env.MONGO_SHARD3_REPLICA_SET}/shard3:${process.env.MONGO_SHARD3_PORT}`);
const enabled = admin.runCommand({ enableSharding: database });
if (!enabled.ok && enabled.codeName !== 'AlreadyInitialized') throw new Error(tojson(enabled));
const applicationDb = db.getSiblingDB(database);
for (const collection of ['patients', 'doctors']) {
  if (!applicationDb.getCollectionNames().includes(collection)) applicationDb.createCollection(collection);
  applicationDb.getCollection(collection).createIndex({ _id: 'hashed' });
  const result = admin.runCommand({ shardCollection: `${database}.${collection}`, key: { _id: 'hashed' }, numInitialChunks: 12 });
  if (!result.ok && result.codeName !== 'AlreadyInitialized') throw new Error(tojson(result));
}
const shards = admin.runCommand({ listShards: 1 }).shards || [];
if (shards.length < 3) throw new Error(`Expected three shards but found ${shards.length}`);
printjson({ database, shards: shards.map((shard) => shard._id), status: 'sharding initialized' });
