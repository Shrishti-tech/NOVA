require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const projects = await db.collection('projects').find({}).toArray();

  let migrated = 0;
  for (const project of projects) {
    const members = project.members || [];
    const needsMigration = members.some((m) => !m || typeof m !== 'object' || !m.user);
    if (!needsMigration) continue;

    const newMembers = members.filter(Boolean).map((m) => {
      const userId = m.user || m;
      const role = m.user ? m.role || 'member' : userId.toString() === project.owner.toString() ? 'admin' : 'member';
      return { user: userId, role };
    });

    await db.collection('projects').updateOne({ _id: project._id }, { $set: { members: newMembers } });
    migrated++;
    console.log(`Migrated project "${project.name}" (${project._id})`);
  }

  console.log(`Done. Migrated ${migrated} project(s) out of ${projects.length}.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
