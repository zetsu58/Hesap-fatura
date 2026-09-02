import assert from 'node:assert/strict';
import test from 'node:test';
import { loadMigrations } from '../src/database/migrator.js';

test('migration dosyalarını sürüm sırasında ve checksum ile yükler', async () => {
  const migrations = await loadMigrations();
  assert.deepEqual(migrations.map(({ version }) => version), [1, 2]);
  assert.match(migrations[0]?.checksum ?? '', /^[a-f0-9]{64}$/);
});
