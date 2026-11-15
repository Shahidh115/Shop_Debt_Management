-- ============================================================================
-- Migration 00003: Multi-Tenant Row Level Security (RLS) & Private Storage
-- Phase 6 & Phase 12 Requirements:
--   - Enable RLS on all 11 tables
--   - Shop Owners can ONLY access their own active shop's records
--   - Customers can ONLY access their own profile, linked active shops,
--     and their own purchases, payments, ledger entries, and complaints
--   - Customers can NEVER insert/update/delete purchases, payments, or ledger entries
--   - Platform Administrators can manage shops, owners, support tickets, and audit logs,
--     but are strictly denied access to customer financial records (purchases, payments, ledger)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Trusted role helper functions
CREATE OR REPLACE FUNCTION public.has_role(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = p_role
      AND p.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_shop_owner_of(p_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops s
    JOIN public.profiles p ON p.id = s.owner_id
    WHERE s.id = p_shop_id
      AND s.owner_id = auth.uid()
      AND s.status = 'active'
      AND p.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_customer_of(p_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shop_customers sc
    JOIN public.shops s ON s.id = sc.shop_id
    JOIN public.profiles p ON p.id = sc.customer_id
    WHERE sc.shop_id = p_shop_id
      AND sc.customer_id = auth.uid()
      AND sc.status = 'active'
      AND s.status = 'active'
      AND p.status = 'active'
  );
$$;

-- ============================================================================
-- 1. profiles Policies
-- ============================================================================
CREATE POLICY "profiles_select_self_or_authorized"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR public.has_role('platform_admin')
    OR EXISTS (
      SELECT 1 FROM public.shop_customers sc
      JOIN public.shops s ON s.id = sc.shop_id
      WHERE sc.customer_id = public.profiles.id
        AND s.owner_id = auth.uid()
        AND s.status = 'active'
    )
  );

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() AND status = 'active')
  WITH CHECK (id = auth.uid() AND status = 'active');

-- ============================================================================
-- 2. user_roles Policies (Read-only for self/admin; NO user self-escalation)
-- ============================================================================
CREATE POLICY "user_roles_select_self_or_admin"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.has_role('platform_admin'));

-- ============================================================================
-- 3. shops Policies
-- ============================================================================
CREATE POLICY "shops_select_authorized"
  ON public.shops FOR SELECT
  USING (
    public.has_role('platform_admin')
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shop_customers sc
      WHERE sc.shop_id = public.shops.id
        AND sc.customer_id = auth.uid()
    )
  );

CREATE POLICY "shops_insert_admin_only"
  ON public.shops FOR INSERT
  WITH CHECK (public.has_role('platform_admin'));

CREATE POLICY "shops_update_admin_or_active_owner"
  ON public.shops FOR UPDATE
  USING (
    public.has_role('platform_admin')
    OR (owner_id = auth.uid() AND status = 'active')
  );

-- ============================================================================
-- 4. shop_customers Policies
-- ============================================================================
CREATE POLICY "shop_customers_select_owner_or_customer"
  ON public.shop_customers FOR SELECT
  USING (
    public.is_active_shop_owner_of(shop_id)
    OR customer_id = auth.uid()
  );

CREATE POLICY "shop_customers_insert_active_owner_only"
  ON public.shop_customers FOR INSERT
  WITH CHECK (public.is_active_shop_owner_of(shop_id));

-- ============================================================================
-- 5. purchases & purchase_items Policies (NO Platform Admin access, NO Customer writes)
-- ============================================================================
CREATE POLICY "purchases_select_owner_or_own_customer"
  ON public.purchases FOR SELECT
  USING (
    public.is_active_shop_owner_of(shop_id)
    OR (customer_id = auth.uid() AND public.is_active_customer_of(shop_id))
  );

CREATE POLICY "purchase_items_select_owner_or_own_customer"
  ON public.purchase_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = public.purchase_items.purchase_id
        AND (
          public.is_active_shop_owner_of(p.shop_id)
          OR (p.customer_id = auth.uid() AND public.is_active_customer_of(p.shop_id))
        )
    )
  );

-- ============================================================================
-- 6. payments Policies (NO Platform Admin access, NO Customer writes)
-- ============================================================================
CREATE POLICY "payments_select_owner_or_own_customer"
  ON public.payments FOR SELECT
  USING (
    public.is_active_shop_owner_of(shop_id)
    OR (customer_id = auth.uid() AND public.is_active_customer_of(shop_id))
  );

-- ============================================================================
-- 7. ledger_entries Policies (Authoritative Ledger — Read-Only via RLS, Written via RPC)
-- ============================================================================
CREATE POLICY "ledger_entries_select_owner_or_own_customer"
  ON public.ledger_entries FOR SELECT
  USING (
    public.is_active_shop_owner_of(shop_id)
    OR (customer_id = auth.uid() AND public.is_active_customer_of(shop_id))
  );

-- ============================================================================
-- 8. transaction_complaints Policies
-- ============================================================================
CREATE POLICY "complaints_select_owner_or_own_customer"
  ON public.transaction_complaints FOR SELECT
  USING (
    public.is_active_shop_owner_of(shop_id)
    OR (customer_id = auth.uid() AND public.is_active_customer_of(shop_id))
  );

CREATE POLICY "complaints_insert_customer_only"
  ON public.transaction_complaints FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    AND public.is_active_customer_of(shop_id)
  );

CREATE POLICY "complaints_update_shop_owner_only"
  ON public.transaction_complaints FOR UPDATE
  USING (public.is_active_shop_owner_of(shop_id))
  WITH CHECK (public.is_active_shop_owner_of(shop_id));

-- ============================================================================
-- 9. audit_logs & support_tickets Policies
-- ============================================================================
CREATE POLICY "audit_logs_select_admin_or_shop_owner"
  ON public.audit_logs FOR SELECT
  USING (
    public.has_role('platform_admin')
    OR (shop_id IS NOT NULL AND public.is_active_shop_owner_of(shop_id))
  );

CREATE POLICY "support_tickets_select_admin_or_creator"
  ON public.support_tickets FOR SELECT
  USING (
    public.has_role('platform_admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "support_tickets_insert_authenticated"
  ON public.support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_tickets_update_admin"
  ON public.support_tickets FOR UPDATE
  USING (public.has_role('platform_admin'));

-- ============================================================================
-- 10. Supabase Storage Buckets (Phase 12)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('shop-logos', 'shop-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('customer-avatars', 'customer-avatars', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('complaint-evidence', 'complaint-evidence', false, 5242880, ARRAY['image/png', 'image/jpeg', 'application/pdf']),
  ('statements', 'statements', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

