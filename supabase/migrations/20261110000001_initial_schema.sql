-- ============================================================================
-- Migration 00001: ShopLedger Core Database Schema
-- Phase 3 Requirements:
--   - UUID primary keys
--   - NUMERIC(14,2) for all financial amounts (never floating-point)
--   - timestamptz for all timestamps
--   - Strict CHECK constraints, UNIQUE constraints, and Foreign Keys
--   - 11 required tables: profiles, user_roles, shops, shop_customers,
--     purchases, purchase_items, payments, ledger_entries,
--     transaction_complaints, audit_logs, support_tickets
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger function for updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(btrim(full_name)) >= 2),
  email TEXT NOT NULL UNIQUE CHECK (position('@' in email) > 1),
  phone TEXT NOT NULL CHECK (char_length(btrim(phone)) >= 7),
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- 2. user_roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'shop_owner', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

-- ============================================================================
-- 3. shops
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.shop_code_seq START WITH 129;

CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_code TEXT NOT NULL UNIQUE DEFAULT ('SH-' || lpad(nextval('public.shop_code_seq')::text, 4, '0')),
  shop_name TEXT NOT NULL CHECK (char_length(btrim(shop_name)) >= 2),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  email TEXT NOT NULL CHECK (position('@' in email) > 1),
  phone TEXT NOT NULL CHECK (char_length(btrim(phone)) >= 7),
  address TEXT NOT NULL CHECK (char_length(btrim(address)) >= 3),
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops (owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops (status);
CREATE INDEX IF NOT EXISTS idx_shops_created_at ON public.shops (created_at DESC);

CREATE TRIGGER set_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- 4. shop_customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shop_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending_invitation'
    CHECK (status IN ('active', 'pending_invitation', 'expired', 'suspended')),
  invitation_sent_at TIMESTAMPTZ DEFAULT NOW(),
  invitation_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_shop_customers_shop_customer UNIQUE (shop_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_customers_shop_id ON public.shop_customers (shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_customers_customer_id ON public.shop_customers (customer_id);
CREATE INDEX IF NOT EXISTS idx_shop_customers_status ON public.shop_customers (shop_id, status);

-- ============================================================================
-- 5. purchases
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.txn_code_seq START WITH 1052;

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_code TEXT NOT NULL UNIQUE DEFAULT ('TXN-' || nextval('public.txn_code_seq')::text),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
  description TEXT,
  notes TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_purchases_shop_idempotency UNIQUE (shop_id, idempotency_key),
  CONSTRAINT fk_purchases_shop_customer FOREIGN KEY (shop_id, customer_id)
    REFERENCES public.shop_customers(shop_id, customer_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_purchases_shop_customer ON public.purchases (shop_id, customer_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_shop_date ON public.purchases (shop_id, purchase_date DESC);

-- ============================================================================
-- 6. purchase_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL CHECK (char_length(btrim(item_name)) >= 1),
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price > 0),
  line_total NUMERIC(14,2) NOT NULL CHECK (line_total > 0 AND line_total = round(quantity * unit_price, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items (purchase_id);

-- ============================================================================
-- 7. payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_code TEXT NOT NULL UNIQUE DEFAULT ('TXN-' || nextval('public.txn_code_seq')::text),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'other')),
  reference_number TEXT,
  notes TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payments_shop_idempotency UNIQUE (shop_id, idempotency_key),
  CONSTRAINT fk_payments_shop_customer FOREIGN KEY (shop_id, customer_id)
    REFERENCES public.shop_customers(shop_id, customer_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_payments_shop_customer ON public.payments (shop_id, customer_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_shop_date ON public.payments (shop_id, payment_date DESC);

-- ============================================================================
-- 8. ledger_entries (THE AUTHORITATIVE FINANCIAL SOURCE OF TRUTH)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_code TEXT NOT NULL,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('opening_balance', 'purchase', 'payment', 'adjustment', 'reversal')),
  reference_id UUID,
  debit_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0),
  credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) >= 1),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reversal_of UUID REFERENCES public.ledger_entries(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  CONSTRAINT uq_ledger_entries_shop_idempotency UNIQUE (shop_id, idempotency_key),
  CONSTRAINT chk_ledger_non_zero_entry CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR
    (credit_amount > 0 AND debit_amount = 0)
  ),
  CONSTRAINT fk_ledger_shop_customer FOREIGN KEY (shop_id, customer_id)
    REFERENCES public.shop_customers(shop_id, customer_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_ledger_shop_customer_created
  ON public.ledger_entries (shop_id, customer_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ledger_reference_id
  ON public.ledger_entries (reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reversal_of
  ON public.ledger_entries (reversal_of);

-- Immutability trigger: historical financial records CANNOT be updated or deleted!
CREATE OR REPLACE FUNCTION public.prevent_financial_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Immutable financial history: % rows cannot be modified or deleted. Create a reversing or adjustment ledger entry instead.', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER trg_immutable_ledger_entries
  BEFORE UPDATE OR DELETE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_mutation();

CREATE TRIGGER trg_immutable_purchases
  BEFORE UPDATE OR DELETE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_mutation();

CREATE TRIGGER trg_immutable_payments
  BEFORE UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_mutation();

-- ============================================================================
-- 9. transaction_complaints
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.complaint_code_seq START WITH 22;

CREATE TABLE IF NOT EXISTS public.transaction_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_code TEXT NOT NULL UNIQUE DEFAULT ('CMP-' || lpad(nextval('public.complaint_code_seq')::text, 4, '0')),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'payment')),
  transaction_id UUID NOT NULL,
  complaint_type TEXT NOT NULL CHECK (
    complaint_type IN (
      'incorrect_amount',
      'purchase_not_made',
      'payment_not_updated',
      'duplicate_transaction',
      'incorrect_description',
      'other'
    )
  ),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) >= 5),
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'resolved')),
  owner_response TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  correction_entry_id UUID REFERENCES public.ledger_entries(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT fk_complaints_shop_customer FOREIGN KEY (shop_id, customer_id)
    REFERENCES public.shop_customers(shop_id, customer_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_complaints_shop_status ON public.transaction_complaints (shop_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_customer ON public.transaction_complaints (customer_id, shop_id, created_at DESC);

-- ============================================================================
-- 10. audit_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_shop_id ON public.audit_logs (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

CREATE TRIGGER trg_immutable_audit_logs
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_mutation();

-- ============================================================================
-- 11. support_tickets
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_seq START WITH 209;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code TEXT NOT NULL UNIQUE DEFAULT ('SUP-' || nextval('public.support_ticket_seq')::text),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (
    category IN ('invitation_email', 'login_problems', 'account_problems', 'technical_issues', 'other')
  ),
  subject TEXT NOT NULL CHECK (char_length(btrim(subject)) >= 3),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) >= 5),
  admin_reply TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_shop_id ON public.support_tickets (shop_id);

CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

