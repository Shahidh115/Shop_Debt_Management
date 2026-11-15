# ShopLedger — Multi-Tenant Shop Credit & Debt Management SaaS

> *"Credit, with clarity."*

Production-grade **Shop Credit & Debt Management SaaS Platform** built directly from the connected Figma design system (`01 — Design system`, `02 — Platform admin web`, `03 — Shop owner mobile`, `04 — Customer mobile`, `05 — User flows and prototype`).

---

## Architecture & Applications

1. **`apps/admin` — Platform Admin Web Dashboard (Next.js 15 App Router + TypeScript + Tailwind CSS)**
   - Implements all 22 Figma Admin frames (`A01`–`A22`) + Edit Shop modal + Interactive Mobile Experience Simulator (`/mobile-preview`).
   - Features: Shop directory with status & city filtering (`A03`, `A16`–`A18`), Create New Shop & Owner Invitation (`A04`), Shop Details with Suspend (`A13`) / Reactivate (`A14`) / Suspended banner (`A15`) & Tenant Financial Privacy enforcement (`A05`), Shop Owner Management (`A06`, `A11`), Customer Aggregate Overview (`A07`), Support Ticket Queue & Conversation Thread (`A08`, `A12`), Administrative Audit Logs (`A09`), and System Settings (`A10`).

2. **`apps/mobile` — Shop Owner & Customer Mobile Application (React Native + Expo + Expo Router)**
   - Implements all 53 Shop Owner screens (`O01`–`O53`) and 39 Customer screens (`C01`–`C39`).
   - **Shop Owner (`(owner)`)**: Dashboard (`O02`), Customer Directory & Email Invitation/Linking (`O03`–`O06`), Quick & Detailed Itemized Credit Purchases (`O07`–`O10`), Cash/Bank/Other Payment Recording (`O11`–`O13`, `O37`–`O43`), Statements & PDF HTML generator (`O14`, `O15`, `O46`), Complaint Review & Separate Immutable Adjustments (`O16`–`O20`), Shop Profile (`O21`, `O53`).
   - **Customer (`(customer)`)**: Single login across multiple independent shops, Multi-Shop Switcher (`C03`), Shop-Scoped Balance & All-Settled States (`C02`, `C04`, `C14`, `C15`), Purchase & Payment History (`C05`–`C07`, `C30`), Statements (`C12`, `C35`), Raise & Track Transaction Complaints (`C08`–`C11`, `C16`–`C19`), Profile (`C13`).

3. **`packages/shared` — Shared Domain Types, Zod Schemas, Design Tokens & Exact-Decimal Ledger Engine**
   - Exact `BigInt` integer-cent financial arithmetic (zero floating-point drift).
   - `ShopLedgerEngine` enforcing atomic ledger entries, idempotency keys, immutable corrections/reversals, and strict role/shop isolation.

4. **`supabase` — PostgreSQL Migrations, RLS Policies, Edge Functions & Seed Data**
   - `20261110000001_initial_schema.sql`: All 11 required tables, check constraints, foreign keys, indexes, and immutability triggers.
   - `20261110000002_financial_accounting_engine.sql`: Transactional RPCs (`rpc_calculate_customer_balance`, `rpc_create_purchase`, `rpc_record_payment`, `rpc_reverse_or_adjust_transaction`).
   - `20261110000003_rls_multi_tenant_security.sql`: Complete Row Level Security policies and Storage bucket policies.
   - `seed.sql`: Complete multi-tenant seed data matching the Figma screens.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` in `apps/admin` and `.env` in `apps/mobile` and set your Supabase credentials:
```bash
cp .env.example .env
```

### 3. Run Automated Financial & Multi-Tenant Isolation Tests
```bash
npm test
```

### 4. Start the Platform Admin Web Dashboard (and Interactive Mobile Preview)
```bash
npm run dev:admin
```
Open `http://localhost:3000` in your browser.

### 5. Start the React Native Expo Mobile Application
```bash
npm run dev:mobile
```

