-- ============================================================================
-- Migration 00002: Authoritative Financial Accounting Engine (PostgreSQL RPCs)
-- Phase 4 Requirements:
--   1. Every purchase atomically creates its corresponding ledger entry.
--   2. Every payment atomically creates its corresponding ledger entry.
--   3. Idempotency keys prevent duplicate financial entries on retries.
--   4. Balance is ALWAYS calculated from ledger_entries (Total Debits - Total Credits).
--   5. Corrections create a new linked adjustment or reversal ledger entry (`reversal_of`).
-- ============================================================================

-- Helper security function: verify caller is an active owner of an active shop
CREATE OR REPLACE FUNCTION public.assert_active_shop_owner(p_shop_id UUID)
RETURNS public.shops
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_shop public.shops;
  v_user_status TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT status INTO v_user_status FROM public.profiles WHERE id = v_uid;
  IF v_user_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Your user profile is suspended or inactive';
  END IF;

  SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id AND owner_id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this shop';
  END IF;

  IF v_shop.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Shop "%" is suspended. Financial operations are blocked while records remain intact.', v_shop.shop_name;
  END IF;

  RETURN v_shop;
END;
$$;

-- ============================================================================
-- 1. Calculate Customer Balance (Authoritative Database Function)
-- Formula: Outstanding Balance = Opening Balance + Purchases + Debit Adjustments
--                                - Payments - Credit Adjustments
--                              = Total Debits - Total Credits
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_calculate_customer_balance(
  p_shop_id UUID,
  p_customer_id UUID
)
RETURNS TABLE (
  shop_id UUID,
  customer_id UUID,
  opening_balance NUMERIC(14,2),
  total_purchases NUMERIC(14,2),
  total_debit_adjustments NUMERIC(14,2),
  total_payments NUMERIC(14,2),
  total_credit_adjustments NUMERIC(14,2),
  total_debits NUMERIC(14,2),
  total_credits NUMERIC(14,2),
  outstanding_balance NUMERIC(14,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_shop public.shops;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_shop FROM public.shops s WHERE s.id = p_shop_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shop not found';
  END IF;

  IF v_shop.status = 'suspended' THEN
    RAISE EXCEPTION 'Shop is currently suspended';
  END IF;

  -- Only the shop's owner OR the customer themselves may query this balance (never Platform Admin!)
  IF v_shop.owner_id <> v_uid AND p_customer_id <> v_uid THEN
    RAISE EXCEPTION 'Unauthorized access to customer financial balance';
  END IF;

  IF p_customer_id = v_uid THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.shop_customers sc
      WHERE sc.shop_id = p_shop_id AND sc.customer_id = v_uid AND sc.status <> 'suspended'
    ) THEN
      RAISE EXCEPTION 'Customer is not an active member of this shop';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    p_shop_id AS shop_id,
    p_customer_id AS customer_id,
    COALESCE(SUM(CASE WHEN le.transaction_type = 'opening_balance' THEN le.debit_amount ELSE 0.00 END), 0.00)::NUMERIC(14,2) AS opening_balance,
    COALESCE(SUM(CASE WHEN le.transaction_type = 'purchase' THEN le.debit_amount ELSE 0.00 END), 0.00)::NUMERIC(14,2) AS total_purchases,
    COALESCE(SUM(CASE WHEN le.transaction_type IN ('adjustment', 'reversal') THEN le.debit_amount ELSE 0.00 END), 0.00)::NUMERIC(14,2) AS total_debit_adjustments,
    COALESCE(SUM(CASE WHEN le.transaction_type = 'payment' THEN le.credit_amount ELSE 0.00 END), 0.00)::NUMERIC(14,2) AS total_payments,
    COALESCE(SUM(CASE WHEN le.transaction_type IN ('opening_balance', 'adjustment', 'reversal') THEN le.credit_amount ELSE 0.00 END), 0.00)::NUMERIC(14,2) AS total_credit_adjustments,
    COALESCE(SUM(le.debit_amount), 0.00)::NUMERIC(14,2) AS total_debits,
    COALESCE(SUM(le.credit_amount), 0.00)::NUMERIC(14,2) AS total_credits,
    COALESCE(SUM(le.debit_amount) - SUM(le.credit_amount), 0.00)::NUMERIC(14,2) AS outstanding_balance
  FROM public.ledger_entries le
  WHERE le.shop_id = p_shop_id
    AND le.customer_id = p_customer_id;
END;
$$;

-- ============================================================================
-- 2. Create Purchase Atomically (Quick or Itemized) + Ledger Entry
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_create_purchase(
  p_shop_id UUID,
  p_customer_id UUID,
  p_total_amount NUMERIC(14,2),
  p_purchase_date DATE,
  p_description TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_shop public.shops;
  v_existing_purchase public.purchases;
  v_purchase public.purchases;
  v_ledger public.ledger_entries;
  v_items_sum NUMERIC(14,2) := 0.00;
  v_item JSONB;
  v_line_total NUMERIC(14,2);
  v_balance RECORD;
BEGIN
  v_shop := public.assert_active_shop_owner(p_shop_id);

  IF p_idempotency_key IS NULL OR char_length(btrim(p_idempotency_key)) < 4 THEN
    RAISE EXCEPTION 'Idempotency key is required for financial transactions';
  END IF;

  -- Idempotency check
  SELECT * INTO v_existing_purchase
  FROM public.purchases
  WHERE shop_id = p_shop_id AND idempotency_key = p_idempotency_key;

  IF FOUND THEN
    SELECT * INTO v_ledger
    FROM public.ledger_entries
    WHERE reference_id = v_existing_purchase.id AND transaction_type = 'purchase';

    SELECT * INTO v_balance
    FROM public.rpc_calculate_customer_balance(p_shop_id, p_customer_id);

    RETURN jsonb_build_object(
      'purchase', to_jsonb(v_existing_purchase),
      'ledger_entry', to_jsonb(v_ledger),
      'balance', to_jsonb(v_balance),
      'idempotent_replay', true
    );
  END IF;

  -- Verify active shop-customer link
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_customers sc
    WHERE sc.shop_id = p_shop_id AND sc.customer_id = p_customer_id AND sc.status <> 'suspended'
  ) THEN
    RAISE EXCEPTION 'Customer is not an active member of this shop';
  END IF;

  -- Validate items if provided
  IF jsonb_array_length(COALESCE(p_items, '[]'::JSONB)) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      v_line_total := round(((v_item->>'quantity')::NUMERIC(12,3)) * ((v_item->>'unit_price')::NUMERIC(14,2)), 2);
      IF v_line_total <= 0 THEN
        RAISE EXCEPTION 'Purchase item line total must be greater than zero';
      END IF;
      v_items_sum := v_items_sum + v_line_total;
    END LOOP;

    IF p_total_amount IS NOT NULL AND round(p_total_amount, 2) <> v_items_sum THEN
      RAISE EXCEPTION 'Submitted total (%) does not match itemized total (%)', p_total_amount, v_items_sum;
    END IF;
    p_total_amount := v_items_sum;
  END IF;

  IF p_total_amount IS NULL OR p_total_amount <= 0 THEN
    RAISE EXCEPTION 'Purchase amount must be greater than Rs. 0.00';
  END IF;

  -- 1. Insert purchase
  INSERT INTO public.purchases (
    shop_id, customer_id, total_amount, description, notes, purchase_date, created_by, idempotency_key
  ) VALUES (
    p_shop_id, p_customer_id, round(p_total_amount, 2), NULLIF(btrim(p_description), ''), NULLIF(btrim(p_notes), ''),
    COALESCE(p_purchase_date, CURRENT_DATE), v_uid, btrim(p_idempotency_key)
  )
  RETURNING * INTO v_purchase;

  -- 2. Insert optional purchase items
  IF jsonb_array_length(COALESCE(p_items, '[]'::JSONB)) > 0 THEN
    INSERT INTO public.purchase_items (purchase_id, item_name, quantity, unit_price, line_total)
    SELECT
      v_purchase.id,
      btrim(item->>'item_name'),
      (item->>'quantity')::NUMERIC(12,3),
      round((item->>'unit_price')::NUMERIC(14,2), 2),
      round(((item->>'quantity')::NUMERIC(12,3)) * ((item->>'unit_price')::NUMERIC(14,2)), 2)
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  -- 3. Atomically insert corresponding debit ledger entry
  INSERT INTO public.ledger_entries (
    entry_code, shop_id, customer_id, transaction_type, reference_id,
    debit_amount, credit_amount, description, created_by, idempotency_key
  ) VALUES (
    v_purchase.transaction_code,
    p_shop_id,
    p_customer_id,
    'purchase',
    v_purchase.id,
    v_purchase.total_amount,
    0.00,
    COALESCE(v_purchase.description, 'Credit purchase'),
    v_uid,
    'ledger-' || v_purchase.idempotency_key
  )
  RETURNING * INTO v_ledger;

  -- 4. Record audit log
  INSERT INTO public.audit_logs (shop_id, user_id, action, entity_type, entity_id, new_values)
  VALUES (
    p_shop_id, v_uid, 'purchase_recorded', 'purchase', v_purchase.id,
    jsonb_build_object('transaction_code', v_purchase.transaction_code, 'amount', v_purchase.total_amount, 'customer_id', p_customer_id)
  );

  SELECT * INTO v_balance FROM public.rpc_calculate_customer_balance(p_shop_id, p_customer_id);

  RETURN jsonb_build_object(
    'purchase', to_jsonb(v_purchase),
    'ledger_entry', to_jsonb(v_ledger),
    'balance', to_jsonb(v_balance),
    'idempotent_replay', false
  );
END;
$$;

-- ============================================================================
-- 3. Record Payment Atomically + Ledger Entry
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_record_payment(
  p_shop_id UUID,
  p_customer_id UUID,
  p_amount NUMERIC(14,2),
  p_payment_method TEXT,
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_shop public.shops;
  v_existing_payment public.payments;
  v_payment public.payments;
  v_ledger public.ledger_entries;
  v_balance RECORD;
BEGIN
  v_shop := public.assert_active_shop_owner(p_shop_id);

  IF p_idempotency_key IS NULL OR char_length(btrim(p_idempotency_key)) < 4 THEN
    RAISE EXCEPTION 'Idempotency key is required for financial transactions';
  END IF;

  SELECT * INTO v_existing_payment
  FROM public.payments
  WHERE shop_id = p_shop_id AND idempotency_key = p_idempotency_key;

  IF FOUND THEN
    SELECT * INTO v_ledger
    FROM public.ledger_entries
    WHERE reference_id = v_existing_payment.id AND transaction_type = 'payment';

    SELECT * INTO v_balance
    FROM public.rpc_calculate_customer_balance(p_shop_id, p_customer_id);

    RETURN jsonb_build_object(
      'payment', to_jsonb(v_existing_payment),
      'ledger_entry', to_jsonb(v_ledger),
      'balance', to_jsonb(v_balance),
      'idempotent_replay', true
    );
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than Rs. 0.00';
  END IF;

  INSERT INTO public.payments (
    shop_id, customer_id, amount, payment_method, reference_number, notes, payment_date, received_by, idempotency_key
  ) VALUES (
    p_shop_id, p_customer_id, round(p_amount, 2), p_payment_method,
    NULLIF(btrim(p_reference_number), ''), NULLIF(btrim(p_notes), ''),
    COALESCE(p_payment_date, CURRENT_DATE), v_uid, btrim(p_idempotency_key)
  )
  RETURNING * INTO v_payment;

  INSERT INTO public.ledger_entries (
    entry_code, shop_id, customer_id, transaction_type, reference_id,
    debit_amount, credit_amount, description, created_by, idempotency_key
  ) VALUES (
    v_payment.transaction_code,
    p_shop_id,
    p_customer_id,
    'payment',
    v_payment.id,
    0.00,
    v_payment.amount,
    CASE
      WHEN p_payment_method = 'bank_transfer' THEN 'Bank transfer payment'
      WHEN p_payment_method = 'other' THEN 'Payment received (Other)'
      ELSE 'Payment received'
    END,
    v_uid,
    'ledger-' || v_payment.idempotency_key
  )
  RETURNING * INTO v_ledger;

  INSERT INTO public.audit_logs (shop_id, user_id, action, entity_type, entity_id, new_values)
  VALUES (
    p_shop_id, v_uid, 'payment_recorded', 'payment', v_payment.id,
    jsonb_build_object('transaction_code', v_payment.transaction_code, 'amount', v_payment.amount, 'method', v_payment.payment_method)
  );

  SELECT * INTO v_balance FROM public.rpc_calculate_customer_balance(p_shop_id, p_customer_id);

  RETURN jsonb_build_object(
    'payment', to_jsonb(v_payment),
    'ledger_entry', to_jsonb(v_ledger),
    'balance', to_jsonb(v_balance),
    'idempotent_replay', false
  );
END;
$$;

-- ============================================================================
-- 4. Reverse or Adjust Transaction (Immutable Correction Workflow)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_reverse_or_adjust_transaction(
  p_shop_id UUID,
  p_customer_id UUID,
  p_original_ledger_entry_id UUID,
  p_adjustment_type TEXT, -- 'partial_correction' | 'full_reversal' | 'debit_adjustment'
  p_amount NUMERIC(14,2),
  p_explanation TEXT,
  p_complaint_id UUID DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_shop public.shops;
  v_orig public.ledger_entries;
  v_correction public.ledger_entries;
  v_debit NUMERIC(14,2) := 0.00;
  v_credit NUMERIC(14,2) := 0.00;
  v_tx_type TEXT := 'adjustment';
  v_code TEXT;
  v_balance RECORD;
BEGIN
  v_shop := public.assert_active_shop_owner(p_shop_id);

  IF p_explanation IS NULL OR char_length(btrim(p_explanation)) < 5 THEN
    RAISE EXCEPTION 'A detailed audit explanation is required for transaction corrections';
  END IF;

  SELECT * INTO v_orig
  FROM public.ledger_entries
  WHERE id = p_original_ledger_entry_id AND shop_id = p_shop_id AND customer_id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Original ledger entry not found in this shop';
  END IF;

  IF p_adjustment_type = 'full_reversal' THEN
    v_tx_type := 'reversal';
    v_debit := v_orig.credit_amount;
    v_credit := v_orig.debit_amount;
    v_code := 'REV-' || nextval('public.txn_code_seq')::text;
  ELSIF p_adjustment_type = 'partial_correction' THEN
    IF p_amount IS NULL OR p_amount <= 0 THEN
      RAISE EXCEPTION 'Correction amount must be greater than Rs. 0.00';
    END IF;
    IF v_orig.debit_amount > 0 AND p_amount > v_orig.debit_amount THEN
      RAISE EXCEPTION 'Partial credit correction cannot exceed original purchase amount';
    END IF;
    v_credit := round(p_amount, 2);
    v_code := 'COR-' || nextval('public.txn_code_seq')::text;
  ELSIF p_adjustment_type = 'debit_adjustment' THEN
    IF p_amount IS NULL OR p_amount <= 0 THEN
      RAISE EXCEPTION 'Adjustment amount must be greater than Rs. 0.00';
    END IF;
    v_debit := round(p_amount, 2);
    v_code := 'COR-' || nextval('public.txn_code_seq')::text;
  ELSE
    RAISE EXCEPTION 'Invalid adjustment_type: %', p_adjustment_type;
  END IF;

  INSERT INTO public.ledger_entries (
    entry_code, shop_id, customer_id, transaction_type, reference_id,
    debit_amount, credit_amount, description, created_by, reversal_of, idempotency_key
  ) VALUES (
    v_code, p_shop_id, p_customer_id, v_tx_type, COALESCE(p_complaint_id, v_orig.reference_id),
    v_debit, v_credit, btrim(p_explanation), v_uid, v_orig.id, btrim(p_idempotency_key)
  )
  RETURNING * INTO v_correction;

  IF p_complaint_id IS NOT NULL THEN
    UPDATE public.transaction_complaints
    SET status = 'resolved',
        owner_response = btrim(p_explanation),
        reviewed_by = v_uid,
        correction_entry_id = v_correction.id,
        resolved_at = NOW()
    WHERE id = p_complaint_id AND shop_id = p_shop_id;
  END IF;

  INSERT INTO public.audit_logs (shop_id, user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    p_shop_id, v_uid, 'transaction_corrected', 'ledger_entry', v_correction.id,
    jsonb_build_object('original_entry_id', v_orig.id, 'original_code', v_orig.entry_code, 'original_debit', v_orig.debit_amount),
    jsonb_build_object('correction_code', v_correction.entry_code, 'debit', v_debit, 'credit', v_credit, 'explanation', btrim(p_explanation))
  );

  SELECT * INTO v_balance FROM public.rpc_calculate_customer_balance(p_shop_id, p_customer_id);

  RETURN jsonb_build_object(
    'correction_entry', to_jsonb(v_correction),
    'balance', to_jsonb(v_balance)
  );
END;
$$;

