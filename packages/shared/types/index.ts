/**
 * ShopLedger — Shared Domain & Database Types
 * Aligned strictly with Phase 2, Phase 3, and Phase 4 specifications.
 */

export type UserRole = 'platform_admin' | 'shop_owner' | 'customer';
export type UserRoleType = UserRole;

export type AccountStatus = 'active' | 'suspended';

export type ShopStatus = 'active' | 'suspended';

export type ShopCustomerStatus = 'active' | 'pending_invitation' | 'expired' | 'suspended';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'other';

export type LedgerTransactionType =
  | 'opening_balance'
  | 'purchase'
  | 'payment'
  | 'adjustment'
  | 'reversal';

export type ComplaintStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'resolved';

export type ComplaintType =
  | 'incorrect_amount'
  | 'purchase_not_made'
  | 'payment_not_updated'
  | 'duplicate_transaction'
  | 'incorrect_description'
  | 'other';

export type SupportTicketCategory =
  | 'invitation_email'
  | 'login_problems'
  | 'account_problems'
  | 'technical_issues'
  | 'other'
  | string;

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Shop {
  id: string;
  shop_code: string; // e.g., SH-0128
  shop_name: string;
  category?: string;
  owner_id: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  logo_url: string | null;
  status: ShopStatus;
  suspension_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopCustomer {
  id: string;
  shop_id: string;
  customer_id: string;
  address: string | null;
  status: ShopCustomerStatus;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  joined_at: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  item_name: string;
  quantity: string; // Exact decimal string (e.g. "5.00")
  unit_price: string; // Exact decimal string (e.g. "400.00")
  line_total: string; // Exact decimal string (e.g. "2000.00")
  created_at: string;
}

export interface Purchase {
  id: string;
  transaction_code: string; // e.g., TXN-KG-1050
  reference_code?: string;
  shop_id: string;
  customer_id: string;
  total_amount: string; // Exact decimal string from NUMERIC(14,2)
  description: string | null;
  notes: string | null;
  purchase_date: string;
  created_by: string;
  idempotency_key: string;
  created_at: string;
  items?: PurchaseItem[];
}

export interface Payment {
  id: string;
  transaction_code: string; // e.g., TXN-KG-1051
  reference_code?: string;
  shop_id: string;
  customer_id: string;
  amount: string; // Exact decimal string from NUMERIC(14,2)
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  payment_date: string;
  received_by: string;
  idempotency_key: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  entry_code: string; // e.g., TXN-KG-1050, COR-KG-0022, REV-KG-0009
  reference_code?: string;
  shop_id: string;
  customer_id: string;
  transaction_type: LedgerTransactionType;
  reference_id: string | null;
  debit_amount: string; // Exact decimal string — increases customer debt
  credit_amount: string; // Exact decimal string — decreases customer debt
  description: string;
  created_by: string;
  created_at: string;
  reversal_of: string | null; // References original ledger_entries.id when correcting/reversing
  idempotency_key: string;
}

export interface TransactionComplaint {
  id: string;
  complaint_code: string; // e.g., CMP-0021
  shop_id: string;
  customer_id: string;
  transaction_type: 'purchase' | 'payment';
  transaction_id: string;
  transaction_code: string;
  transaction_ref_code?: string;
  transaction_amount: string;
  disputed_amount?: string;
  complaint_type: ComplaintType;
  description: string;
  evidence_url: string | null;
  status: ComplaintStatus;
  owner_response: string | null;
  reviewed_by: string | null;
  correction_entry_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AuditLog {
  id: string;
  shop_id: string | null; // Nullable for platform-level events
  user_id: string;
  actor_name: string;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  related_shop_name?: string | null;
  target_label?: string | null;
  ip_address?: string | null;
  result?: 'Success' | 'Failed';
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_code: string; // e.g., SUP-208
  user_id: string;
  user_name: string;
  shop_id: string | null;
  shop_name: string | null;
  category: SupportTicketCategory;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  subject: string;
  description: string;
  admin_reply: string | null;
  status: SupportTicketStatus;
  created_at: string;
  updated_at: string;
}

export interface CustomerBalanceSummary {
  shop_id: string;
  customer_id: string;
  customer_name?: string;
  opening_balance: string;
  total_purchases: string;
  total_debit_adjustments: string;
  total_payments: string;
  total_credit_adjustments: string;
  debit_adjustments?: string;
  credit_adjustments?: string;
  total_debits: string;
  total_credits: string;
  outstanding_balance: string;
}

export interface StatementLineItem {
  id: string;
  entry_code: string;
  reference_code?: string;
  date: string;
  created_at?: string;
  transaction_type: LedgerTransactionType;
  description: string;
  debit_amount: string;
  credit_amount: string;
  running_balance: string;
  reversal_of: string | null;
}

export interface CustomerStatement {
  shop: Pick<Shop, 'id' | 'shop_code' | 'shop_name' | 'address' | 'phone' | 'email'>;
  customer: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'> & { address?: string | null };
  period_start: string;
  period_end: string;
  generated_at: string;
  opening_balance: string;
  total_purchases: string;
  total_payments: string;
  net_adjustments: string;
  closing_balance: string;
  entries: StatementLineItem[];
}

export type StatementSummary = CustomerStatement;
