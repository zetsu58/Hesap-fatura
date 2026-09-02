import { db, runCoreMigration } from './db.js';

try {
  await runCoreMigration();
  console.log('Core database migration completed.');
} finally {
  await db?.end();
}
