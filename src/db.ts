import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const db = connectionString
  ? new Pool({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 10) })
  : null;

export async function assertDatabase(): Promise<void> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  await db.query('SELECT 1');
}
