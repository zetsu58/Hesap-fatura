-- Cross-tenant references are rejected by PostgreSQL, independently of application code.
ALTER TABLE bank_accounts ADD CONSTRAINT bank_accounts_tenant_id_id_key UNIQUE (tenant_id, id);
ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_id_key UNIQUE (tenant_id, id);
ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_tenant_id_id_key UNIQUE (tenant_id, id);
ALTER TABLE tenant_memberships ADD CONSTRAINT tenant_memberships_tenant_user_key UNIQUE (tenant_id, user_id);

ALTER TABLE bank_transactions DROP CONSTRAINT bank_transactions_bank_account_id_fkey;
ALTER TABLE bank_transactions DROP CONSTRAINT bank_transactions_customer_id_fkey;
ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_tenant_bank_account_fkey
  FOREIGN KEY (tenant_id, bank_account_id) REFERENCES bank_accounts (tenant_id, id) ON DELETE CASCADE;
ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_tenant_customer_fkey
  FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id);

ALTER TABLE invoices DROP CONSTRAINT invoices_customer_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT invoices_bank_transaction_id_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_tenant_customer_fkey
  FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id);
ALTER TABLE invoices ADD CONSTRAINT invoices_tenant_bank_transaction_fkey
  FOREIGN KEY (tenant_id, bank_transaction_id) REFERENCES bank_transactions (tenant_id, id);

ALTER TABLE precious_metal_transactions DROP CONSTRAINT precious_metal_transactions_customer_id_fkey;
ALTER TABLE precious_metal_transactions DROP CONSTRAINT precious_metal_transactions_bank_transaction_id_fkey;
ALTER TABLE precious_metal_transactions ADD CONSTRAINT precious_metals_tenant_customer_fkey
  FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id);
ALTER TABLE precious_metal_transactions ADD CONSTRAINT precious_metals_tenant_bank_transaction_fkey
  FOREIGN KEY (tenant_id, bank_transaction_id) REFERENCES bank_transactions (tenant_id, id);

ALTER TABLE audit_events DROP CONSTRAINT audit_events_actor_user_id_fkey;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_tenant_actor_membership_fkey
  FOREIGN KEY (tenant_id, actor_user_id) REFERENCES tenant_memberships (tenant_id, user_id);
