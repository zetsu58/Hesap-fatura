CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_number text,
  sector text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','accountant','operator','viewer')),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bank_code text,
  iban text NOT NULL,
  currency char(3) NOT NULL DEFAULT 'TRY',
  alias text,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, iban)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  tax_or_identity_number text,
  iban text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customers_tenant_tax_idx ON customers(tenant_id, tax_or_identity_number);
CREATE INDEX customers_tenant_iban_idx ON customers(tenant_id, iban);

CREATE TABLE bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  provider_reference text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('credit','debit')),
  amount numeric(20,4) NOT NULL CHECK (amount >= 0),
  currency char(3) NOT NULL DEFAULT 'TRY',
  counterparty_name text,
  counterparty_iban text,
  description text,
  booked_at timestamptz NOT NULL,
  customer_id uuid REFERENCES customers(id),
  classification text,
  decision_confidence numeric(5,4),
  review_required boolean NOT NULL DEFAULT true,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bank_account_id, provider_reference)
);
CREATE INDEX bank_transactions_tenant_booked_idx ON bank_transactions(tenant_id, booked_at DESC);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  bank_transaction_id uuid REFERENCES bank_transactions(id),
  document_type text NOT NULL CHECK (document_type IN ('e_invoice','e_archive','precious_metal','other')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','submitted','accepted','rejected','cancelled','failed')),
  currency char(3) NOT NULL DEFAULT 'TRY',
  subtotal numeric(20,4) NOT NULL DEFAULT 0,
  tax_total numeric(20,4) NOT NULL DEFAULT 0,
  grand_total numeric(20,4) NOT NULL DEFAULT 0,
  gib_uuid uuid,
  external_number text,
  ubl_xml text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE precious_metal_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  bank_transaction_id uuid REFERENCES bank_transactions(id),
  trade_type text NOT NULL CHECK (trade_type IN ('buy','sell')),
  metal_type text NOT NULL,
  fineness numeric(10,6),
  weight_grams numeric(20,6) NOT NULL CHECK (weight_grams > 0),
  unit_price numeric(20,6) NOT NULL CHECK (unit_price >= 0),
  total_amount numeric(20,4) NOT NULL CHECK (total_amount >= 0),
  currency char(3) NOT NULL DEFAULT 'TRY',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_tenant_created_idx ON audit_events(tenant_id, created_at DESC);
