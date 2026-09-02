import { db } from './db.js';
import { migrate } from './database/migrator.js';

try {
  if (!db) throw new Error('DATABASE_URL is not configured');
  const count = await migrate(db);
  console.log(`Database migrations completed (${count} applied).`);
} finally {
  await db?.end();
}
