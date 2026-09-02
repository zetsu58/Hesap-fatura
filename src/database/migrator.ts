import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import type { Pool } from 'pg';

const MIGRATION_PATTERN = /^(\d{3,})_[a-z0-9_-]+\.sql$/;
const LOCK_KEY = 1_214_579_352;

export type Migration = Readonly<{ version: number; filename: string; checksum: string; sql: string }>;

export async function loadMigrations(directory = resolve(process.cwd(), 'db/migrations')): Promise<Migration[]> {
  const files = (await readdir(directory)).filter((file) => MIGRATION_PATTERN.test(file)).sort();
  const migrations = await Promise.all(files.map(async (filename) => {
    const sql = await readFile(resolve(directory, filename), 'utf8');
    return {
      version: Number(filename.match(MIGRATION_PATTERN)?.[1]),
      filename: basename(filename),
      checksum: createHash('sha256').update(sql).digest('hex'),
      sql
    };
  }));
  const versions = new Set<number>();
  for (const migration of migrations) {
    if (versions.has(migration.version)) throw new Error(`Duplicate migration version: ${migration.version}`);
    versions.add(migration.version);
  }
  return migrations;
}

export async function migrate(pool: Pool): Promise<number> {
  const client = await pool.connect();
  let appliedCount = 0;
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version integer PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now(),
      duration_ms integer NOT NULL CHECK (duration_ms >= 0)
    )`);

    const migrations = await loadMigrations();
    const existing = await client.query<{ version: number; filename: string; checksum: string }>(
      'SELECT version, filename, checksum FROM schema_migrations ORDER BY version'
    );
    const applied = new Map(existing.rows.map((row) => [row.version, row]));

    // V0.2 ran 001 directly. Recognise only that exact legacy state and record its immutable checksum.
    if (!applied.has(1) && migrations[0]?.version === 1) {
      const legacy = await client.query<{ present: boolean }>(
        "SELECT to_regclass('public.tenants') IS NOT NULL AS present"
      );
      if (legacy.rows[0]?.present) {
        await client.query(
          'INSERT INTO schema_migrations(version, filename, checksum, duration_ms) VALUES ($1, $2, $3, 0)',
          [1, migrations[0].filename, migrations[0].checksum]
        );
        applied.set(1, { version: 1, filename: migrations[0].filename, checksum: migrations[0].checksum });
      }
    }

    for (const migration of migrations) {
      const prior = applied.get(migration.version);
      if (prior) {
        if (prior.filename !== migration.filename || prior.checksum.trim() !== migration.checksum) {
          throw new Error(`Applied migration ${migration.version} has changed; restore ${prior.filename}`);
        }
        continue;
      }
      const started = performance.now();
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations(version, filename, checksum, duration_ms) VALUES ($1, $2, $3, $4)',
          [migration.version, migration.filename, migration.checksum, Math.max(0, Math.round(performance.now() - started))]
        );
        await client.query('COMMIT');
        appliedCount += 1;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    return appliedCount;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => undefined);
    client.release();
  }
}
