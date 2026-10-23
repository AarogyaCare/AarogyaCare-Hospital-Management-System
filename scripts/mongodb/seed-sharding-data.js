const database = process.env.MONGODB_DATABASE || 'aarogya';
const count = Number(process.env.SHARD_SAMPLE_SIZE || 3000);
const applicationDb = db.getSiblingDB(database);
for (const collection of ['patients', 'doctors']) applicationDb.getCollection(collection).deleteMany({ syntheticShardTest: true });
const patients = []; const doctors = [];
for (let index = 0; index < count; index += 1) {
  patients.push({ _id: `shard-patient-${index}-${new ObjectId().valueOf()}`, uhid: `AC-SHARD-${String(index).padStart(6, '0')}`, userId: `shard-user-${index}`, dateOfBirth: '1990-01-01', gender: 'Other', bloodGroup: 'O+', createdAt: new Date(), syntheticShardTest: true });
  doctors.push({ _id: `shard-doctor-${index}-${new ObjectId().valueOf()}`, userId: `shard-doctor-user-${index}`, departmentId: `shard-department-${index % 12}`, qualification: 'Synthetic MD', experienceYears: 5, roomNumber: `S-${index % 100}`, specializations: ['Synthetic verification'], consultationFee: 0, syntheticShardTest: true });
  if (patients.length === 500) { applicationDb.patients.insertMany(patients); applicationDb.doctors.insertMany(doctors); patients.length = 0; doctors.length = 0; }
}
if (patients.length) { applicationDb.patients.insertMany(patients); applicationDb.doctors.insertMany(doctors); }
printjson({ patients: applicationDb.patients.countDocuments({ syntheticShardTest: true }), doctors: applicationDb.doctors.countDocuments({ syntheticShardTest: true }) });
