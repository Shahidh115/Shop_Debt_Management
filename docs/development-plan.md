# ShopLedger — Development Plan & Figma Design Inventory

> **Brand Identity**: **ShopLedger** — *"Credit, with clarity. A calmer way to manage everyday shop credit."*
> **Primary Source of Truth**: Connected Figma Desktop MCP file (`01 — Design system` through `05 — User flows and prototype`).

---

## Phase 0 — Complete Figma Inspection Report

### 1. Brand & Design System Tokens (`01 — Design system`, Node `0:1`)

| Token Category | Token Name | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Palette** | `primary` | `#606C38` | Primary Olive — main actions, active nav, primary highlights |
| | `deep` | `#283618` | Deep Olive — sidebar background, dark headers, high-emphasis cards |
| | `soft` | `#A3B18A` | Soft Olive — secondary accents, chart bars, muted badges |
| | `sage` | `#DADFCB` | Light Sage — subtle fills, active pill backgrounds, dividers |
| | `ivory` | `#F7F6EF` | Warm Ivory — primary app background across web and mobile |
| | `white` | `#FFFFFF` | Pure White — elevated surface cards, table containers, modals |
| | `charcoal` | `#252820` | Charcoal — primary body and heading text |
| | `muted` | `#77796F` | Muted Gray — secondary labels, timestamps, metadata |
| | `border` | `#E5E5D8` | Warm Border — 1px card/table/input borders |
| **Status Palette** | `paid` / `success` | `#388E5A` | Paid / Active / Resolved / Credit received |
| | `pending` / `warning` | `#D99A32` | Pending invitation / Under review |
| | `overdue` / `error` | `#C6534B` | Overdue / Suspended / Rejected / Danger actions |
| | `disputed` | `#D97736` | Disputed / Complaint raised |
| **Typography** | Font Family | `Inter` | Clean geometric sans-serif with tabular numerals for `Rs.` figures |
| | Financial Figures | `40px / 58px` ( Hero ), `28px–32px` ( Card ) | Always formatted as `Rs. X,XXX.XX` or `Rs. X,XXX` using exact decimal math |
| **Layout Grid** | Spacing & Radii | `8px` grid, `12px–16px` card radius, `48px` touch targets | Desktop `1440×1024`, Tablet `1024×1024`, Mobile `390×844` & `360×844` |

### 2. Core Reusable Components (`2:92` & `2:7268`)
- **Button (`2:103`)**: `Primary` (`#606C38`), `Secondary` (Ivory/Sage border), `Danger` (`#C6534B`), `Disabled`, `48px` height.
- **Input (`2:113`)**: `Default`, `Focus` (`#606C38` ring), `Error` (`#C6534B` border), `48–50px` height, `12px` radius.
- **Status Badge (`2:126`)**: `Active`, `Paid`, `Pending`, `Overdue`, `Disputed`, `Resolved`, `Suspended`, `Invited`, `Expired`.
- **Financial Card (`2:127`) & Transaction Row (`2:130`)**: Displays title, customer/shop subtitle, date, transaction code (`TXN-KG-1050`), and signed amount (`+ Rs. 2,500` debit / `− Rs. 2,000` credit).
- **Role-Specific Mobile Navigation (`2:7314`)**:
  - **Shop Owner (`2:7294`)**: 5 tabs (`Home`, `Customers`, `Transactions`, `Complaints`, `Profile`).
  - **Customer (`2:7313`)**: 4 tabs (`Home`, `History`, `Complaints`, `Profile`).
- **Confirmation Dialog (`2:7315`) & Financial Entry Anatomy (`2:7354`)**:
  - Enforces `Review → Confirm → Receipt` with `Selected shop → Customer → Amount → Previous balance → Resulting balance → Audit receipt`.

---

### 3. Complete Screen Inventory Across All 3 Experiences (114 Screens + 3 System Frames)

#### A. Platform Admin Web (`02 — Platform admin web`, Node `2:2`) — 22 Frames
| Code | Node ID | Screen Name | Dimensions | Main Components & Interactions | Destination / Route |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `A01` | `2:586` | Admin login | `1440×1024` | Split brand panel (`Local shops. Lasting trust.`) + email/password form, remember me, forgot password | `/login` |
| `A02` | `2:138` | Overview | `1440×1024` | 7 KPI cards (Registered, Active, Suspended, Owners, Unique customers, New this month, Transactions), Registration growth bar chart, Monthly activity progress bars, Recent shops, Recent audit activity | `/dashboard` |
| `A03` | `2:270` | Shop management | `1440×1024` | Search input, Account status filter, Registered date filter, 9-column shop data table, pagination, privacy notice | `/shops` |
| `A04` | `2:416` | Create new shop | `1440×1024` | Shop & owner registration form (Shop name, Owner name, Owner email, Phone, Status, Address, Logo upload) + 3-step Admin-only registration guidance card | `/shops/new` |
| `A05` | `2:501` | Shop details | `1440×1024` | Shop identity header (`KG Kamal Grocery`), Edit/Suspend buttons, 3 count cards (Customers, Purchases, Payments — metadata only, no private ledger), Owner info card, Privacy boundary card | `/shops/[id]` |
| `A06` | `2:606` | Shop owner management | `1440×1024` | Search owners, Invitation status filter (`All`, `Pending`, `Accepted`, `Expired`), Owners table with Resend invite / Manage owner actions | `/owners` |
| `A07` | `2:793` | Customer overview | `1440×1024` | 4 KPI cards (Unique customers, Active, Multiple shops, New this month), Customer account growth chart, Financial data restriction notice | `/customers` |
| `A08` | `2:953` | Support management | `1440×1024` | Search ticket ID/subject, Category filter, Status filter, Support tickets table (`SUP-208` etc.) | `/support` |
| `A09` | `2:1143` | Administrative audit logs | `1440×1024` | Filter by Administrator, Action, Date range; read-only audit log table (`Owner invitation sent`, `Shop reactivated`, `Shop suspended`, etc.) | `/audit-logs` |
| `A10` | `2:1334` | System settings | `1440×1024` | Platform name, Support email, Notification toggles, 2FA security toggle, Maintenance mode toggle, Subscriptions preview card | `/settings` |
| `A11` | `2:1492` | Manage owner | `1440×1024` | Edit owner form (Full name, Email, Phone, Associated shop, Invitation timestamp, Resend invitation, Save changes, Suspend owner access) | `/owners/[id]` |
| `A12` | `2:1643` | Support ticket | `1440×1024` | Ticket conversation view (`SUP-208`), owner message, reply box, `Send reply` & `Mark resolved` actions | `/support/[id]` |
| `A13` | `2:1788` | Suspend confirmation | `520×390` | Modal dialog: *"Suspend Kamal Grocery?"*, mandatory audit reason input, `Cancel` / `Confirm suspension` | Modal on `/shops/[id]` |
| `A14` | `2:1798` | Reactivate confirmation | `520×390` | Modal dialog: *"Reactivate Kamal Grocery?"*, mandatory audit reason input, `Cancel` / `Confirm reactivation` | Modal on `/shops/[id]` |
| `A15` | `2:1808` | Shop suspended | `1440×1024` | Shop details in suspended state with `Reactivate shop` primary action | `/shops/[id]` |
| `A16` | `2:5638` | Shop status filter | `400×331` | Dropdown/modal selector (`All statuses`, `Active`, `Suspended`) | Filter on `/shops` |
| `A17` | `2:5645` | Active shops | `1440×1024` | Filtered Shop management table showing only `Active` shops | `/shops?status=active` |
| `A18` | `2:5795` | Suspended shops | `1440×1024` | Filtered Shop management table showing only `Suspended` shops | `/shops?status=suspended` |
| `A19` | `2:5947` | Admin password reset | `400×305` | Password reset dialog (`Enter your administrator email`) | `/forgot-password` |
| `A20` | `2:5951` | Reset email sent | `400×191` | Confirmation dialog (`Check your inbox`) | `/forgot-password` |
| `A21` | `2:7358` | Overview — tablet 1024 | `1024×1024` | Collapsed 80px icon rail navigation + responsive 1024px dashboard grid | Responsive `/dashboard` |
| `A22` | `2:7490` | Shops — tablet 1024 | `1024×1024` | Collapsed 80px icon rail navigation + responsive 1024px shops table | Responsive `/shops` |

*(Note: In addition to `A05` Shop details, the Master Prompt specifies an **Edit Shop** flow triggered by the `Edit shop` button `2:553` on `A05`. We will implement the full Edit Shop modal/drawer & route matching `A04` styling.)*

#### B. Shop Owner Mobile (`03 — Shop owner mobile`, Node `2:3`) — 53 Frames
- **Auth**: `O01` Owner login (`2:2426`), `O50` Password reset (`2:6458`).
- **Home & Reports**: `O02` Home dashboard (`2:1893`), `O22` Collection report (`2:3315`), `O52` Compact 360px home (`2:7728`).
- **Customers**: `O03` Customers list (`2:1982`), `O04` Add customer (`2:2041`), `O05` Existing customer account-linking (`2:2094`), `O06` Customer profile (`2:2135`), `O23` Invitation sent (`2:3388`), `O30` Invitation expired (`2:4455`), `O36` Invite new customer (`2:6035`), `O45` Customer filters (`2:6412`).
- **Purchases (Quick & Itemized)**: `O07` Quick purchase (`2:2194`), `O08` Detailed itemized purchase (`2:2253`), `O09` Review purchase (`2:2341`), `O10` Purchase recorded receipt (`2:2384`).
- **Payments (Cash, Bank Transfer, Other)**: `O11` Record cash payment (`2:2473`), `O12` Review cash payment (`2:2561`), `O13` Payment recorded receipt (`2:2631`), `O37` Payment methods selector (`2:6089`), `O38`/`O40`/`O42` Bank transfer entry/review/receipt, `O39`/`O41`/`O43` Other payment entry/review/receipt.
- **Transactions & Statements**: `O14` Transactions list (`2:2701`), `O15` Account statement with horizontal ledger table (`2:2793`), `O44` Customer & date filters (`2:6403`), `O46` Statement export preview (`2:6426`), `O51` Corrected transaction detail (`2:7678`).
- **Complaints & Immutable Corrections**: `O16` Complaints list (`2:2868`), `O17` Complaint details (`2:2947`), `O18` Create correction (`2:3023`), `O19` Review correction (`2:3103`), `O20` Complaint resolved receipt (`2:3173`), `O24` Reject complaint (`2:3456`), `O25` Request more information (`2:3526`).
- **Shop Profile & Settings**: `O21` Shop & profile (`2:3242`), `O47` Account preferences (`2:6433`), `O48` Change password (`2:6442`), `O49` Contact support (`2:6452`), `O53` Edit shop profile (`2:7817`).
- **Empty, Error & Suspended States**: `O26` Empty customer list, `O27` No search results, `O28` No transactions, `O29` No complaints, `O31` Customer suspended, `O32` Shop suspended, `O33` Loading, `O34` Network error, `O35` Interaction states gallery.

#### C. Customer Mobile (`04 — Customer mobile`, Node `2:4`) — 39 Frames
- **Auth & Invitation**: `C01` Customer login (`2:4077`), `C20` Login failure (`2:4972`), `C21` Incorrect password (`2:5014`), `C27` Reset password (`2:5268`), `C28` Reset email sent (`2:5314`), `C31` Invitation setup (`2:5441`), `C32` Invitation expired (`2:5485`).
- **Home & Multi-Shop Selector**: `C02` Home (`2:3594`), `C03` Your shops selector (`2:3642`), `C04` Account details (`2:3684`), `C14` Nimal Hardware shop view (`2:4119`), `C15` All settled (`Rs. 0` balance at Ravi Stores, `2:4157`), `C39` Compact 360px home (`2:7864`).
- **History & Statements**: `C05` Purchase history (`2:3723`), `C06` Payment history (`2:3770`), `C07` Purchase transaction details (`2:3813`), `C30` Payment transaction details (`2:5398`), `C12` Account statement (`2:3999`), `C35` Statement export preview (`2:6780`), `C36` Statement period selector (`2:6787`).
- **Complaints & Dispute Tracking**: `C08` Report a problem (`2:3847`), `C09` Complaint submitted (`2:3890`), `C10` Your complaints (`2:3925`), `C11` Track complaint (`2:3962`), `C16` Complaint accepted (`2:4788`), `C17` Complaint rejected (`2:4834`), `C18` Transaction corrected (`2:4880`), `C19` Complaint resolved (`2:4926`), `C33` Complaint categories (`2:6747`), `C34` Evidence attachment (`2:6771`), `C37` Complaint status examples (`2:6796`).
- **Profile & States**: `C13` Your profile (`2:4039`), `C29` Notification preferences (`2:5355`), `C22` Account suspended, `C23` Shop suspended, `C24` No complaints, `C25` No transaction history, `C26` Network error, `C38` Interaction states.

---

## Development Checklist & Stage Tracker

- [x] **Phase 0**: Inspect Figma pages, frames, components, tokens, and user flows.
- [x] **Stage 1 – Project Foundation**: Monorepo structure (`apps/admin`, `apps/mobile`, `packages/shared`, `supabase`, `docs`), TypeScript, design tokens, Zod schemas, decimal accounting utilities.
- [x] **Stage 2 – Database and Security**: PostgreSQL migrations (`00001_initial_schema.sql`, `00002_financial_engine.sql`, `00003_rls_policies.sql`), triggers, atomic RPC functions, seed data (`supabase/seed.sql`), and automated financial + isolation tests.
- [x] **Stage 3 – Authentication**: Supabase Auth + Edge Functions (`admin-create-shop`, `owner-invite-customer`, `generate-statement`), role guards, session management, invitation acceptance, suspension enforcement.
- [x] **Stage 4 – Platform Admin (`apps/admin`)**: Complete Next.js App Router implementation of `A01`–`A22` + Edit Shop + Mobile/Prototype preview integration.
- [x] **Stage 5 – Shop Owner (`apps/mobile`)**: Complete Expo Router implementation of `O01`–`O53`.
- [x] **Stage 6 – Customer (`apps/mobile`)**: Complete Expo Router implementation of `C01`–`C39`.
- [x] **Stage 7 – Integrations**: Push notifications (`expo-notifications`), email invitations, HTML/PDF statement generation & sharing, private Supabase Storage evidence & logo uploads.
- [x] **Stage 8 – Testing and Optimization**: Automated Vitest suite for exact decimal accounting, idempotency, reversals, partial adjustments, complaint lifecycle, and multi-shop isolation.
- [x] **Stage 9 – Deployment Preparation**: Production configs, EAS config (`eas.json`), Supabase config (`supabase/config.toml`), backup & deployment documentation.

