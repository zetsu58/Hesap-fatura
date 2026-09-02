import assert from 'node:assert/strict';
import test from 'node:test';
import { Pool } from 'pg';
import { migrate } from '../src/database/migrator.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
test('fresh migration, replay and cross-tenant constraints', { skip: !databaseUrl }, async () => {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    assert.equal(await migrate(pool), 2);
    assert.equal(await migrate(pool), 0);
    const tenantA = (await pool.query<{ id: string }>("INSERT INTO tenants(name) VALUES ('A') RETURNING id")).rows[0]!.id;
    const tenantB = (await pool.query<{ id: string }>("INSERT INTO tenants(name) VALUES ('B') RETURNING id")).rows[0]!.id;
    const accountB = (await pool.query<{ id: string }>(
      "INSERT INTO bank_accounts(tenant_id, iban) VALUES ($1, 'TR0002') RETURNING id", [tenantB]
    )).rows[0]!.id;
    await assert.rejects(
      pool.query(`INSERT INTO bank_transactions
        (tenant_id, bank_account_id, provider_reference, direction, amount, booked_at)
        VALUES ($1, $2, 'cross-tenant', 'credit', 1, now())`, [tenantA, accountB]),
      /bank_transactions_tenant_bank_account_fkey/
    );
    const userB = (await pool.query<{ id: string }>(
      "INSERT INTO users(email, display_name) VALUES ('b@example.test', 'B') RETURNING id"
    )).rows[0]!.id;
    await pool.query("INSERT INTO tenant_memberships(tenant_id, user_id, role) VALUES ($1, $2, 'viewer')", [tenantB, userB]);
    await assert.rejects(
      pool.query("INSERT INTO audit_events(tenant_id, actor_user_id, entity_type, entity_id, action) VALUES ($1,$2,'test','1','read')", [tenantA, userB]),
      /audit_events_tenant_actor_membership_fkey/
    );
  } finally {
    await pool.end();
  }
});
