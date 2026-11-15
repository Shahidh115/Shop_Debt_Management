# ShopLedger SaaS — Database Schema & Financial Ledger Specification

## 1. Core Principles

- **Primary Database**: PostgreSQL 15 (Supabase).
- **Exact Decimal Money**: All monetary columns use `NUMERIC(14, 2)`. Floating-point types (`REAL`, `DOUBLE PRECISION`, `FLOAT`) are never used.
- **UUID Primary Keys**: All tables use `UUID` primary keys (`gen_random_uuid()`) and `TIMESTAMPTZ` timestamps.
- **Immutable Ledger Source of Truth**: Customer balances are never stored as a mutable counter. Every balance is computed from `public.ledger_entries`:
  $$\text{Outstanding Balance} = \sum \text{debit\_amount} - \sum \text{credit\_amount}$$

---

## 2. Tables (`supabase/migrations/20261110000001_initial_schema.sql`)

| # | Table | Purpose | Key Constraints |
|---|---|---|---|
| 1 | `profiles` | User profile metadata (`id` references `auth.users`) | `status IN ('active', 'suspended')`; no passwords stored |
| 2 | `user_roles` | Trusted RBAC assignments | `role IN ('platform_admin', 'shop_owner', 'customer')`, `UNIQUE (user_id, role)` |
| 3 | `shops` | Registered shop tenants | `shop_code` auto-generated (`SH-0128`), `status IN ('active', 'suspended')` |
| 4 | `shop_customers` | Multi-shop customer link table | `UNIQUE (shop_id, customer_id)` prevents duplicate links |
| 5 | `purchases` | Credit purchase headers | `total_amount > 0`, optional `idempotency_key` |
| 6 | `purchase_items` | Optional itemized purchase lines | `CHECK (line_total = ROUND(quantity * unit_price, 2))` |
| 7 | `payments` | Customer payment records | `amount > 0`, `payment_method IN ('cash', 'bank_transfer', 'other')` |
| 8 | `ledger_entries` | Immutable financial ledger | `transaction_type IN ('opening_balance', 'purchase', 'payment', 'adjustment', 'reversal')` |
| 9 | `transaction_complaints` | Customer transaction disputes | `status IN ('pending', 'under_review', 'accepted', 'rejected', 'resolved')` |
| 10 | `audit_logs` | Immutable administrative & financial audit trail | Stores `old_values` and `new_values` as `JSONB` |
| 11 | `support_tickets` | Platform technical support queue | `status IN ('open', 'in_progress', 'resolved', 'closed')` |

---

## 3. Financial Immutability Triggers

Database trigger `trg_prevent_financial_mutation` on `purchases`, `payments`, and `ledger_entries` blocks `UPDATE` and `DELETE` operations. When a shop owner corrects an erroneous transaction (`O18` / `O19`), `rpc_reverse_or_adjust_transaction` inserts a new `adjustment` or `reversal` row in `ledger_entries` with `reversal_of` referencing the original entry.

---

## 4. Row Level Security (`supabase/migrations/20261110000003_rls_multi_tenant_security.sql`)

- **`shops`**: Platform admins can select/insert/update all shops; shop owners can select/update their own shop; customers can select shops they are linked to in `shop_customers`.
- **`purchases`, `purchase_items`, `payments`, `ledger_entries`**:
  - Shop owners can select/insert rows only where `shop_id` belongs to their active shop.
  - Customers can select rows only where `customer_id = auth.uid()` and `shop_id` is linked in `shop_customers`.
  - Platform admins have **no** select/insert/update policies on private financial tables.

