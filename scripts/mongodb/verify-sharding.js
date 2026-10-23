const database = process.env.MONGODB_DATABASE || 'aarogya';
const applicationDb = db.getSiblingDB(database);
print('\n=== Sharding status ==='); sh.status();
for (const collection of ['patients', 'doctors']) {
  print(`\n=== ${collection} indexes ===`); printjson(applicationDb.getCollection(collection).getIndexes());
  print(`\n=== ${collection} shard distribution ===`);
  printjson(applicationDb.getCollection(collection).aggregate([
    { $collStats: { storageStats: {} } },
    { $project: { _id: 0, shard: 1, documents: '$storageStats.count', bytes: '$storageStats.size' } },
    { $sort: { shard: 1 } },
  ]).toArray());
  printjson(applicationDb.getCollection(collection).getShardDistribution());
}
