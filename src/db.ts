import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const connectionString = process.env.DATABASE_URL;

export const db = connectionString
  ? new Pool({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 10) })
  : null;

export async function assertDatabase(): Promise<void> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  await db.query('SELECT 1');
}

export async function runCoreMigration(): Promise<void> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  const sql = await readFile(resolve(process.cwd(), 'db/migrations/001_core.sql'), 'utf8');
  await db.query(sql);
}
