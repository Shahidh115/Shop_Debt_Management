# ShopLedger SaaS — API, RPC & Edge Functions Reference

## 1. PostgreSQL Transactional RPC Functions (`20261110000002_financial_accounting_engine.sql`)

### `public.rpc_calculate_customer_balance(p_shop_id UUID, p_customer_id UUID)`
Computes the exact shop-scoped balance breakdown from `public.ledger_entries`:
- `opening_balance` (`NUMERIC(14,2)`)
- `total_purchases` (`NUMERIC(14,2)`)
- `total_payments` (`NUMERIC(14,2)`)
- `debit_adjustments` (`NUMERIC(14,2)`)
- `credit_adjustments` (`NUMERIC(14,2)`)
- `total_debits` (`NUMERIC(14,2)`)
- `total_credits` (`NUMERIC(14,2)`)
- `outstanding_balance` (`NUMERIC(14,2)`)

### `public.rpc_create_purchase(...)`
Atomically:
1. Verifies caller is the active `shop_owner` of `p_shop_id` and shop is `active`.
2. Deduplicates against `p_idempotency_key` if provided.
3. Validates itemized line totals (`quantity * unit_price = line_total`) when `p_items` is non-empty.
4. Inserts into `public.purchases` and `public.purchase_items`.
5. Inserts a matching `purchase` debit entry into `public.ledger_entries`.
6. Records an `audit_logs` entry and returns the updated balance.

### `public.rpc_record_payment(...)`
Atomically:
1. Verifies caller is the active `shop_owner` of `p_shop_id`.
2. Deduplicates against `p_idempotency_key` if provided.
3. Inserts into `public.payments` (`cash`, `bank_transfer`, or `other`).
4. Inserts a matching `payment` credit entry into `public.ledger_entries`.
5. Records an `audit_logs` entry and returns the updated balance.

### `public.rpc_reverse_or_adjust_transaction(...)`
Atomically:
1. Verifies caller is the active `shop_owner` of `p_shop_id`.
2. Fetches the original `ledger_entries` row without modifying it.
3. Inserts a new `adjustment` or `reversal` row with `reversal_of = p_original_ledger_id`.
4. Optionally updates a linked `transaction_complaints` record and writes to `audit_logs`.

---

## 2. Supabase Edge Functions (`supabase/functions/`)

| Function | Endpoint | Role Required | Description |
|---|---|---|---|
| `admin-create-shop` | `POST /functions/v1/admin-create-shop` | `platform_admin` | Creates/invites shop owner auth user, assigns `shop_owner` role, creates `shops` record, logs to `audit_logs`. |
| `owner-invite-customer` | `POST /functions/v1/owner-invite-customer` | `shop_owner` | Links existing customer profile or invites new customer by email, creates `shop_customers` link + optional opening balance ledger entry. |
| `generate-statement` | `POST /functions/v1/generate-statement` | `shop_owner` or `customer` | Generates verified shop-scoped account statement with running balance. |

