-- =============================================================================
-- ShopLedger SaaS — Multi-Tenant Seed Data (Phase 12)
-- Matches exact Figma Design Data:
--   - Platform Admins: Dilani Senanayake, Nuwan Perera
--   - 6 Shops: Kamal Grocery (SH-0128), Nimal Hardware (SH-0127), Ravi Stores (SH-0126),
--              Saman Traders (SH-0125, Suspended), Lanka Fresh (SH-0124), City Mart (SH-0123)
--   - Customers: Ahmed Perera (multi-shop: Kamal Grocery, Nimal Hardware, Ravi Stores),
--                Ravi Fernando, Kamal Silva (customer), Nimal Jayasinghe (pending invite)
--   - Exact Purchases, Payments, Ledger Entries, Complaints, Support Tickets & Audit Logs
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Profiles (Assumes corresponding auth.users rows exist or are seeded in local dev)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, email, phone, status, created_at, updated_at)
VALUES
  ('00000000-0000-4000-a000-000000000001', 'Dilani Senanayake', 'dilani@shopledger.lk', '+94 77 100 0001', 'active', '2025-01-10T08:00:00Z', '2026-04-12T08:00:00Z'),
  ('00000000-0000-4000-a000-000000000002', 'Nuwan Perera', 'nuwan@shopledger.lk', '+94 77 100 0002', 'active', '2025-02-01T08:00:00Z', '2026-04-12T08:00:00Z'),
  ('00000000-0000-4000-b000-000000000001', 'Kamal Silva', 'kamal.silva@example.lk', '+94 77 234 5678', 'active', '2026-01-12T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-b000-000000000002', 'Nimal Perera', 'nimal.perera@example.lk', '+94 71 442 8890', 'active', '2026-01-09T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-b000-000000000003', 'Ravi Wijesinghe', 'ravi.w@example.lk', '+94 77 982 3110', 'active', '2025-12-28T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-b000-000000000004', 'Saman Bandara', 'saman.b@example.lk', '+94 76 610 1142', 'suspended', '2025-12-19T09:00:00Z', '2026-04-11T16:40:00Z'),
  ('00000000-0000-4000-b000-000000000005', 'Dilani Fernando', 'dilani.f@example.lk', '+94 71 305 7721', 'active', '2025-12-11T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-b000-000000000006', 'Ruwan Jayasuriya', 'ruwan.j@example.lk', '+94 77 820 4512', 'active', '2025-12-03T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-c000-000000000001', 'Ahmed Perera', 'ahmed.perera@example.lk', '+94 77 512 9081', 'active', '2026-01-18T10:00:00Z', '2026-04-12T10:00:00Z'),
  ('00000000-0000-4000-c000-000000000002', 'Ravi Fernando', 'ravi.fernando@example.lk', '+94 71 884 1920', 'active', '2026-01-20T10:00:00Z', '2026-04-12T10:00:00Z'),
  ('00000000-0000-4000-c000-000000000003', 'Kamal Silva', 'kamal.customer@example.lk', '+94 76 310 4490', 'active', '2026-02-02T10:00:00Z', '2026-04-12T10:00:00Z'),
  ('00000000-0000-4000-c000-000000000004', 'Nimal Jayasinghe', 'nimal.j@example.lk', '+94 77 998 1123', 'active', '2026-04-12T09:30:00Z', '2026-04-12T09:30:00Z')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status;

-- ---------------------------------------------------------------------------
-- 2. User Roles
-- ---------------------------------------------------------------------------
INSERT INTO public.user_roles (id, user_id, role, created_at)
VALUES
  ('00000000-0000-4000-a100-000000000001', '00000000-0000-4000-a000-000000000001', 'platform_admin', '2025-01-10T08:00:00Z'),
  ('00000000-0000-4000-a100-000000000002', '00000000-0000-4000-a000-000000000002', 'platform_admin', '2025-02-01T08:00:00Z'),
  ('00000000-0000-4000-b100-000000000001', '00000000-0000-4000-b000-000000000001', 'shop_owner', '2026-01-12T09:00:00Z'),
  ('00000000-0000-4000-b100-000000000002', '00000000-0000-4000-b000-000000000002', 'shop_owner', '2026-01-09T09:00:00Z'),
  ('00000000-0000-4000-b100-000000000003', '00000000-0000-4000-b000-000000000003', 'shop_owner', '2025-12-28T09:00:00Z'),
  ('00000000-0000-4000-b100-000000000004', '00000000-0000-4000-b000-000000000004', 'shop_owner', '2025-12-19T09:00:00Z'),
  ('00000000-0000-4000-b100-000000000005', '00000000-0000-4000-b000-000000000005', 'shop_owner', '2025-12-11T09:00:00Z'),
  ('00000000-0000-4000-b100-000000000006', '00000000-0000-4000-b000-000000000006', 'shop_owner', '2025-12-03T09:00:00Z'),
  ('00000000-0000-4000-c100-000000000001', '00000000-0000-4000-c000-000000000001', 'customer', '2026-01-18T10:00:00Z'),
  ('00000000-0000-4000-c100-000000000002', '00000000-0000-4000-c000-000000000002', 'customer', '2026-01-20T10:00:00Z'),
  ('00000000-0000-4000-c100-000000000003', '00000000-0000-4000-c000-000000000003', 'customer', '2026-02-02T10:00:00Z'),
  ('00000000-0000-4000-c100-000000000004', '00000000-0000-4000-c000-000000000004', 'customer', '2026-04-12T09:30:00Z')
ON CONFLICT (user_id, role) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Shops
-- ---------------------------------------------------------------------------
INSERT INTO public.shops (id, shop_code, shop_name, category, owner_id, email, phone, address, city, status, suspension_reason, created_at, updated_at)
VALUES
  ('00000000-0000-4000-d000-000000000128', 'SH-0128', 'Kamal Grocery', 'Grocery & provisions', '00000000-0000-4000-b000-000000000001', 'kamal.grocery@example.lk', '+94 11 234 5678', 'No. 142, Galle Road, Dehiwala', 'Dehiwala, Colombo', 'active', NULL, '2026-01-12T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-d000-000000000127', 'SH-0127', 'Nimal Hardware', 'Hardware & building', '00000000-0000-4000-b000-000000000002', 'nimal.hardware@example.lk', '+94 81 442 8890', '48 Peradeniya Road, Kandy', 'Kandy', 'active', NULL, '2026-01-09T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-d000-000000000126', 'SH-0126', 'Ravi Stores', 'General merchant', '00000000-0000-4000-b000-000000000003', 'ravi.stores@example.lk', '+94 31 982 3110', '19 Main Street, Negombo', 'Negombo', 'active', NULL, '2025-12-28T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-d000-000000000125', 'SH-0125', 'Saman Traders', 'Wholesale provisions', '00000000-0000-4000-b000-000000000004', 'saman.traders@example.lk', '+94 37 610 1142', '85 Colombo Road, Kurunegala', 'Kurunegala', 'suspended', 'Account verification pending — requested documents not submitted within 30 days.', '2025-12-19T09:00:00Z', '2026-04-11T16:40:00Z'),
  ('00000000-0000-4000-d000-000000000124', 'SH-0124', 'Lanka Fresh', 'Produce & dairy', '00000000-0000-4000-b000-000000000005', 'lanka.fresh@example.lk', '+94 91 305 7721', '12 Wakwella Road, Galle', 'Galle', 'active', NULL, '2025-12-11T09:00:00Z', '2026-04-12T09:00:00Z'),
  ('00000000-0000-4000-d000-000000000123', 'SH-0123', 'City Mart', 'Mini supermarket', '00000000-0000-4000-b000-000000000006', 'city.mart@example.lk', '+94 41 820 4512', '302 Station Road, Matara', 'Matara', 'active', NULL, '2025-12-03T09:00:00Z', '2026-04-12T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Shop-Customer Multi-Tenant Links
-- ---------------------------------------------------------------------------
INSERT INTO public.shop_customers (id, shop_id, customer_id, status, joined_at, created_at)
VALUES
  -- Ahmed Perera belongs to 3 independent shops under 1 login account
  ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'active', '2026-01-18T10:00:00Z', '2026-01-18T10:00:00Z'),
  ('00000000-0000-4000-e000-000000000005', '00000000-0000-4000-d000-000000000127', '00000000-0000-4000-c000-000000000001', 'active', '2026-02-01T10:00:00Z', '2026-02-01T10:00:00Z'),
  ('00000000-0000-4000-e000-000000000006', '00000000-0000-4000-d000-000000000126', '00000000-0000-4000-c000-000000000001', 'active', '2026-02-10T10:00:00Z', '2026-02-10T10:00:00Z'),
  -- Other customers at Kamal Grocery
  ('00000000-0000-4000-e000-000000000002', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000002', 'active', '2026-01-20T10:00:00Z', '2026-01-20T10:00:00Z'),
  ('00000000-0000-4000-e000-000000000003', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000003', 'active', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z'),
  ('00000000-0000-4000-e000-000000000004', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000004', 'pending_invitation', NULL, '2026-04-12T09:30:00Z')
ON CONFLICT (shop_id, customer_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Purchases & Optional Itemized Lines
-- ---------------------------------------------------------------------------
INSERT INTO public.purchases (id, reference_code, shop_id, customer_id, total_amount, description, notes, purchase_date, created_by, created_at)
VALUES
  ('00000000-0000-4000-f000-000000001047', 'TXN-KG-1047', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 2500.00, 'Weekly provisions', NULL, '2026-04-02T10:00:00Z', '00000000-0000-4000-b000-000000000001', '2026-04-02T10:00:00Z'),
  ('00000000-0000-4000-f000-000000001049', 'TXN-KG-1049', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 3200.00, 'Household supplies & cooking oil', NULL, '2026-04-09T16:15:00Z', '00000000-0000-4000-b000-000000000001', '2026-04-09T16:15:00Z'),
  ('00000000-0000-4000-f000-000000001050', 'TXN-KG-1050', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 2500.00, 'Grocery purchase — 3 items', 'Picked up by brother', '2026-04-12T10:42:00Z', '00000000-0000-4000-b000-000000000001', '2026-04-12T10:42:00Z'),
  ('00000000-0000-4000-f000-000000001046', 'TXN-KG-1046', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000002', 4800.00, 'Monthly dry rations', NULL, '2026-04-11T15:30:00Z', '00000000-0000-4000-b000-000000000001', '2026-04-11T15:30:00Z'),
  ('00000000-0000-4000-f000-000000000219', 'TXN-NH-0219', '00000000-0000-4000-d000-000000000127', '00000000-0000-4000-c000-000000000001', 5500.00, 'Paint & primer — 2 tins', NULL, '2026-04-06T11:20:00Z', '00000000-0000-4000-b000-000000000002', '2026-04-06T11:20:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.purchase_items (id, purchase_id, item_name, quantity, unit_price, line_total, created_at)
VALUES
  ('00000000-0000-4000-f100-000000000001', '00000000-0000-4000-f000-000000001050', 'Samba Rice 5kg', 1, 1450.00, 1450.00, '2026-04-12T10:42:00Z'),
  ('00000000-0000-4000-f100-000000000002', '00000000-0000-4000-f000-000000001050', 'Red Dhal 1kg', 2, 380.00, 760.00, '2026-04-12T10:42:00Z'),
  ('00000000-0000-4000-f100-000000000003', '00000000-0000-4000-f000-000000001050', 'White Sugar 1kg', 1, 290.00, 290.00, '2026-04-12T10:42:00Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Payments
-- ---------------------------------------------------------------------------
INSERT INTO public.payments (id, reference_code, shop_id, customer_id, amount, payment_method, reference_number, notes, payment_date, received_by, created_at)
VALUES
  ('00000000-0000-4000-f200-000000001048', 'TXN-KG-1048', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 2000.00, 'bank_transfer', 'BOC-8849201', 'Bank transfer — BOC #8849201', '2026-04-05T14:10:00Z', '00000000-0000-4000-b000-000000000001', '2026-04-05T14:10:00Z'),
  ('00000000-0000-4000-f200-000000001051', 'TXN-KG-1051', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 2000.00, 'cash', NULL, 'Paid in cash at counter', '2026-04-12T11:18:00Z', '00000000-0000-4000-b000-000000000001', '2026-04-12T11:18:00Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Ledger Entries (Immutable Financial Source of Truth)
-- ---------------------------------------------------------------------------
INSERT INTO public.ledger_entries (id, reference_code, shop_id, customer_id, transaction_type, reference_id, debit_amount, credit_amount, description, created_by, created_at, reversal_of)
VALUES
  -- Ahmed Perera @ Kamal Grocery: Opening 10,000 + Purchases 8,200 - Payments 4,000 = Rs. 14,200
  ('00000000-0000-4000-f300-000000000001', 'OPN-KG-0001', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'opening_balance', NULL, 10000.00, 0.00, 'Opening balance — 01 Apr 2026', '00000000-0000-4000-b000-000000000001', '2026-04-01T00:00:00Z', NULL),
  ('00000000-0000-4000-f300-000000000002', 'TXN-KG-1047', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'purchase', '00000000-0000-4000-f000-000000001047', 2500.00, 0.00, 'Weekly provisions', '00000000-0000-4000-b000-000000000001', '2026-04-02T10:00:00Z', NULL),
  ('00000000-0000-4000-f300-000000000003', 'TXN-KG-1048', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'payment', '00000000-0000-4000-f200-000000001048', 0.00, 2000.00, 'Bank transfer — BOC #8849201', '00000000-0000-4000-b000-000000000001', '2026-04-05T14:10:00Z', NULL),
  ('00000000-0000-4000-f300-000000000004', 'TXN-KG-1049', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'purchase', '00000000-0000-4000-f000-000000001049', 3200.00, 0.00, 'Household supplies & cooking oil', '00000000-0000-4000-b000-000000000001', '2026-04-09T16:15:00Z', NULL),
  ('00000000-0000-4000-f300-000000000005', 'TXN-KG-1050', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'purchase', '00000000-0000-4000-f000-000000001050', 2500.00, 0.00, 'Grocery purchase — 3 items', '00000000-0000-4000-b000-000000000001', '2026-04-12T10:42:00Z', NULL),
  ('00000000-0000-4000-f300-000000000006', 'TXN-KG-1051', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'payment', '00000000-0000-4000-f200-000000001051', 0.00, 2000.00, 'Cash payment received', '00000000-0000-4000-b000-000000000001', '2026-04-12T11:18:00Z', NULL),

  -- Ravi Fernando @ Kamal Grocery: Opening 20,000 + Purchase 4,800 = Rs. 24,800
  ('00000000-0000-4000-f300-000000000007', 'OPN-KG-0002', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000002', 'opening_balance', NULL, 20000.00, 0.00, 'Opening balance — 01 Apr 2026', '00000000-0000-4000-b000-000000000001', '2026-04-01T00:00:00Z', NULL),
  ('00000000-0000-4000-f300-000000000008', 'TXN-KG-1046', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000002', 'purchase', '00000000-0000-4000-f000-000000001046', 4800.00, 0.00, 'Monthly dry rations', '00000000-0000-4000-b000-000000000001', '2026-04-11T15:30:00Z', NULL),

  -- Kamal Silva (Customer) @ Kamal Grocery: Rs. 8,200
  ('00000000-0000-4000-f300-000000000009', 'OPN-KG-0003', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000003', 'opening_balance', NULL, 8200.00, 0.00, 'Opening balance — 01 Apr 2026', '00000000-0000-4000-b000-000000000001', '2026-04-01T00:00:00Z', NULL),

  -- Ahmed Perera @ Nimal Hardware: Rs. 5,500
  ('00000000-0000-4000-f300-000000000010', 'TXN-NH-0219', '00000000-0000-4000-d000-000000000127', '00000000-0000-4000-c000-000000000001', 'purchase', '00000000-0000-4000-f000-000000000219', 5500.00, 0.00, 'Paint & primer — 2 tins', '00000000-0000-4000-b000-000000000002', '2026-04-06T11:20:00Z', NULL),

  -- Ahmed Perera @ Ravi Stores: Opening 1,800 - Payment 1,800 = Rs. 0.00 (All settled)
  ('00000000-0000-4000-f300-000000000011', 'OPN-RS-0010', '00000000-0000-4000-d000-000000000126', '00000000-0000-4000-c000-000000000001', 'opening_balance', NULL, 1800.00, 0.00, 'Opening balance — Mar 2026', '00000000-0000-4000-b000-000000000003', '2026-03-01T09:00:00Z', NULL),
  ('00000000-0000-4000-f300-000000000012', 'TXN-RS-0088', '00000000-0000-4000-d000-000000000126', '00000000-0000-4000-c000-000000000001', 'payment', NULL, 0.00, 1800.00, 'Cash settlement — All settled', '00000000-0000-4000-b000-000000000003', '2026-03-28T11:00:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Transaction Complaints
-- ---------------------------------------------------------------------------
INSERT INTO public.transaction_complaints (id, complaint_code, shop_id, customer_id, transaction_type, transaction_id, transaction_ref_code, disputed_amount, complaint_type, description, evidence_url, status, owner_response, reviewed_by, created_at, resolved_at)
VALUES
  ('00000000-0000-4000-f400-000000000021', 'CMP-0021', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'purchase', '00000000-0000-4000-f000-000000001050', 'TXN-KG-1050', 2500.00, 'incorrect_amount', 'The bill included 2kg of Red Dhal (Rs. 760), but I only took 1kg (Rs. 380) and had Rs. 120 discount agreed on rice. Total should be Rs. 2,000 instead of Rs. 2,500.', 'receipt-photo-2026-04-12.jpg', 'pending', NULL, NULL, '2026-04-12T12:04:00Z', NULL),
  ('00000000-0000-4000-f400-000000000020', 'CMP-0020', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000002', 'purchase', '00000000-0000-4000-f000-000000001046', 'TXN-KG-1046', 4800.00, 'payment_not_updated', 'I transferred Rs. 1,500 via bank transfer on 11 Apr evening, please check.', NULL, 'under_review', 'Checking our BOC statement for 11 Apr, please share the slip reference number.', '00000000-0000-4000-b000-000000000001', '2026-04-11T18:20:00Z', NULL),
  ('00000000-0000-4000-f400-000000000019', 'CMP-0019', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-c000-000000000001', 'purchase', '00000000-0000-4000-f000-000000001047', 'TXN-KG-1047', 2500.00, 'incorrect_description', 'Requested item breakdown for the 02 Apr weekly provisions entry.', NULL, 'resolved', 'Verified with counter book and shared itemized details with customer.', '00000000-0000-4000-b000-000000000001', '2026-04-03T09:15:00Z', '2026-04-03T14:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Support Tickets
-- ---------------------------------------------------------------------------
INSERT INTO public.support_tickets (id, ticket_code, user_id, shop_id, category, priority, subject, description, status, created_at, updated_at)
VALUES
  ('00000000-0000-4000-f500-000000000208', 'SUP-208', '00000000-0000-4000-b000-000000000001', '00000000-0000-4000-d000-000000000128', 'Account & Invitations', 'high', 'Customer invitation email not received', 'Assalamu alaikum / Ayubowan team, I invited our regular customer Ahmed Perera (ahmed.perera@example.lk) yesterday at 4:15 PM, and also sent an invite to Nimal Jayasinghe today, but Nimal says he still hasn''t received the activation email. Could you check if the invitation was blocked and resend it?', 'open', '2026-04-12T10:18:00Z', '2026-04-12T10:24:00Z'),
  ('00000000-0000-4000-f500-000000000207', 'SUP-207', '00000000-0000-4000-b000-000000000002', '00000000-0000-4000-d000-000000000127', 'Statements & Exports', 'normal', 'Need help updating shop address on statements', 'We moved to 48 Peradeniya Road, Kandy and want to make sure exported PDF statements show the new address.', 'in_progress', '2026-04-11T15:10:00Z', '2026-04-11T16:00:00Z'),
  ('00000000-0000-4000-f500-000000000206', 'SUP-206', '00000000-0000-4000-b000-000000000004', '00000000-0000-4000-d000-000000000125', 'Verification & Compliance', 'urgent', 'Submitted business registration documents for review', 'Attached our scanned business registration certificate to lift the temporary suspension.', 'open', '2026-04-11T17:05:00Z', '2026-04-11T17:05:00Z'),
  ('00000000-0000-4000-f500-000000000205', 'SUP-205', '00000000-0000-4000-c000-000000000001', NULL, 'Mobile App & Login', 'low', 'Question about switching between shops in mobile app', 'How do I switch between Kamal Grocery and Nimal Hardware in the app?', 'resolved', '2026-04-09T11:00:00Z', '2026-04-09T12:30:00Z'),
  ('00000000-0000-4000-f500-000000000204', 'SUP-204', '00000000-0000-4000-b000-000000000003', '00000000-0000-4000-d000-000000000126', 'General Inquiry', 'low', 'Adding second phone number for shop contact', 'Can we list both landline and WhatsApp number in our shop profile?', 'resolved', '2026-04-07T09:40:00Z', '2026-04-07T14:20:00Z')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. Audit Logs
-- ---------------------------------------------------------------------------
INSERT INTO public.audit_logs (id, shop_id, user_id, actor_name, actor_email, action, entity_type, entity_id, target_label, ip_address, old_values, new_values, created_at)
VALUES
  ('00000000-0000-4000-f600-000000000001', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-a000-000000000001', 'Dilani Senanayake', 'dilani@shopledger.lk', 'Shop created', 'shop', '00000000-0000-4000-d000-000000000128', 'Kamal Grocery (SH-0128)', '112.134.89.14', NULL, '{"shop_name":"Kamal Grocery","status":"active"}'::jsonb, '2026-04-12T10:42:00Z'),
  ('00000000-0000-4000-f600-000000000002', '00000000-0000-4000-d000-000000000128', '00000000-0000-4000-a000-000000000001', 'Dilani Senanayake', 'dilani@shopledger.lk', 'Owner invited', 'user_role', '00000000-0000-4000-b000-000000000001', 'Kamal Silva · kamal.silva@example.lk', '112.134.89.14', NULL, '{"role":"shop_owner"}'::jsonb, '2026-04-12T10:42:00Z'),
  ('00000000-0000-4000-f600-000000000003', '00000000-0000-4000-d000-000000000125', '00000000-0000-4000-a000-000000000002', 'Nuwan Perera', 'nuwan@shopledger.lk', 'Shop suspended', 'shop', '00000000-0000-4000-d000-000000000125', 'Saman Traders (SH-0125)', '112.134.102.77', '{"status":"active"}'::jsonb, '{"status":"suspended","reason":"Account verification pending"}'::jsonb, '2026-04-11T16:40:00Z'),
  ('00000000-0000-4000-f600-000000000004', '00000000-0000-4000-d000-000000000124', '00000000-0000-4000-a000-000000000001', 'Dilani Senanayake', 'dilani@shopledger.lk', 'Shop reactivated', 'shop', '00000000-0000-4000-d000-000000000124', 'Lanka Fresh (SH-0124)', '112.134.89.14', '{"status":"suspended"}'::jsonb, '{"status":"active"}'::jsonb, '2026-04-09T11:22:00Z')
ON CONFLICT (id) DO NOTHING;

COMMIT;

