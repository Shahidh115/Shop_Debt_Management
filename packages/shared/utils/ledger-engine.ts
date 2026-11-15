/**
 * ShopLedger — Multi-Tenant Transactional Ledger Engine & RLS Enforcer
 *
 * Implements the exact transactional semantics of the Supabase PostgreSQL functions
 * (`00002_financial_engine.sql` and `00003_rls_policies.sql`) so that:
 *   1. Every purchase and payment atomically creates its `ledger_entries` record.
 *   2. Idempotency keys prevent duplicate financial entries on retry/concurrent requests.
 *   3. Historical transactions and ledger entries are IMMUTABLE (no UPDATE/DELETE of amounts).
 *   4. Corrections create a new linked `adjustment` or `reversal` entry (`reversal_of`).
 *   5. Row-Level Security (RLS) rules are strictly enforced per authenticated user identity:
 *      - Shop Owner A cannot read or write Shop B's records.
 *      - Customer Ahmed cannot read Customer Ravi's records or create purchases/payments.
 *      - Platform Admin can manage shops/owners/support/audit logs, but CANNOT read private customer ledgers.
 *      - Suspended shops block operational access for owners and customers while preserving historical records.
 */

import type {
  AuditLog,
  ComplaintStatus,
  ComplaintType,
  CustomerBalanceSummary,
  CustomerStatement,
  LedgerEntry,
  Payment,
  PaymentMethod,
  Profile,
  Purchase,
  PurchaseItem,
  Shop,
  ShopCustomer,
  SupportTicket,
  TransactionComplaint,
  UserRole,
  UserRoleRecord,
} from '../types';
import {
  addMoney,
  buildStatementLedger,
  calculateCustomerBalanceFromLedger,
  calculateItemLineTotal,
  calculatePurchaseItemsTotal,
  formatCentsToDecimal,
  parseMoneyToCents,
  subtractMoney,
} from './accounting';

export interface AuthActor {
  userId: string;
  role: UserRole;
}

export interface ShopLedgerDatabaseState {
  profiles: Profile[];
  user_roles: UserRoleRecord[];
  shops: Shop[];
  shop_customers: ShopCustomer[];
  purchases: Purchase[];
  purchase_items: PurchaseItem[];
  payments: Payment[];
  ledger_entries: LedgerEntry[];
  transaction_complaints: TransactionComplaint[];
  audit_logs: AuditLog[];
  support_tickets: SupportTicket[];
  // CamelCase aliases for UI convenience
  userRoles?: UserRoleRecord[];
  shopCustomers?: ShopCustomer[];
  purchaseItems?: PurchaseItem[];
  ledgerEntries?: LedgerEntry[];
  complaints?: TransactionComplaint[];
  auditLogs?: AuditLog[];
  supportTickets?: SupportTicket[];
}

export type EngineState = Required<ShopLedgerDatabaseState>;

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

let seqCounter = 2000;
function nextUuid(prefix = '00000000-0000-4000-8000'): string {
  seqCounter += 1;
  return `${prefix}-${seqCounter.toString().padStart(12, '0')}`;
}

export class ShopLedgerEngine {
  private state: EngineState;

  constructor(initialState: ShopLedgerDatabaseState) {
    this.state = this.normalizeState(structuredClone(initialState));
  }

  private normalizeState(raw: ShopLedgerDatabaseState): EngineState {
    for (const s of raw.shops) {
      if (!s.category) s.category = 'Grocery & provisions';
      if (!s.city) {
        const parts = s.address.split(',');
        s.city = parts[parts.length - 1]?.trim() || 'Colombo';
      }
    }
    for (const p of raw.purchases) {
      if (!p.reference_code) p.reference_code = p.transaction_code;
    }
    for (const pm of raw.payments) {
      if (!pm.reference_code) pm.reference_code = pm.transaction_code;
    }
    for (const le of raw.ledger_entries) {
      if (!le.reference_code) le.reference_code = le.entry_code;
    }
    for (const c of raw.transaction_complaints) {
      if (!c.transaction_ref_code) c.transaction_ref_code = c.transaction_code;
      if (!c.disputed_amount) c.disputed_amount = c.transaction_amount;
    }
    for (const a of raw.audit_logs) {
      if (!a.target_label) a.target_label = a.related_shop_name ?? a.entity_id;
      if (!a.ip_address) a.ip_address = '112.134.89.14';
    }
    for (const t of raw.support_tickets) {
      if (!t.priority) t.priority = t.status === 'open' ? 'high' : 'normal';
    }

    const enriched = raw as EngineState;
    enriched.userRoles = raw.user_roles;
    enriched.shopCustomers = raw.shop_customers;
    enriched.purchaseItems = raw.purchase_items;
    enriched.ledgerEntries = raw.ledger_entries;
    enriched.complaints = raw.transaction_complaints;
    enriched.auditLogs = raw.audit_logs;
    enriched.supportTickets = raw.support_tickets;
    return enriched;
  }

  public getState(): EngineState {
    return this.normalizeState(this.state);
  }

  public getRawStateForTestingOnly(): ShopLedgerDatabaseState {
    return structuredClone(this.state);
  }

  private resolveActor(actorOrId: AuthActor | string, preferredRole?: UserRole): AuthActor {
    if (typeof actorOrId !== 'string') {
      return actorOrId;
    }
    const roles = this.state.user_roles
      .filter((r) => r.user_id === actorOrId)
      .map((r) => r.role);
    if (preferredRole && roles.includes(preferredRole)) {
      return { userId: actorOrId, role: preferredRole };
    }
    if (roles.includes('platform_admin')) {
      return { userId: actorOrId, role: 'platform_admin' };
    }
    if (roles.includes('shop_owner')) {
      return { userId: actorOrId, role: 'shop_owner' };
    }
    return { userId: actorOrId, role: 'customer' };
  }

  private assertActiveUser(actor: AuthActor): Profile {
    const profile = this.state.profiles.find((p) => p.id === actor.userId);
    if (!profile) {
      throw new AuthorizationError('Authenticated profile not found.');
    }
    if (profile.status === 'suspended') {
      throw new AuthorizationError('Your account has been suspended. Please contact support.');
    }
    const hasRole = this.state.user_roles.some(
      (r) => r.user_id === actor.userId && r.role === actor.role,
    );
    if (!hasRole) {
      throw new AuthorizationError(`Unauthorized role assignment: ${actor.role}`);
    }
    return profile;
  }

  private assertShopOwnerAccess(
    actor: AuthActor,
    shopId: string,
    options: { allowSuspendedRead?: boolean } = {},
  ): Shop {
    this.assertActiveUser(actor);
    if (actor.role !== 'shop_owner') {
      throw new AuthorizationError('Forbidden: Only shop owners can perform this operation.');
    }
    const shop = this.state.shops.find((s) => s.id === shopId);
    if (!shop || shop.owner_id !== actor.userId) {
      throw new AuthorizationError('Forbidden: Access denied — you do not own this shop.');
    }
    if (shop.status === 'suspended' && !options.allowSuspendedRead) {
      throw new AuthorizationError(
        `Shop "${shop.shop_name}" is currently suspended. Operations are blocked while historical records remain intact.`,
      );
    }
    return shop;
  }

  private assertCustomerShopAccess(actor: AuthActor, shopId: string): Shop {
    this.assertActiveUser(actor);
    if (actor.role !== 'customer') {
      throw new AuthorizationError('Only customers can perform this operation.');
    }
    const shop = this.state.shops.find((s) => s.id === shopId);
    if (!shop) {
      throw new AuthorizationError('Shop not found.');
    }
    if (shop.status === 'suspended') {
      throw new AuthorizationError(
        `Shop "${shop.shop_name}" is currently suspended. Customer access to this shop is temporarily restricted.`,
      );
    }
    const membership = this.state.shop_customers.find(
      (sc) => sc.shop_id === shopId && sc.customer_id === actor.userId,
    );
    if (!membership) {
      throw new AuthorizationError('Access denied: You are not linked to this shop.');
    }
    if (membership.status === 'suspended') {
      throw new AuthorizationError('Your account at this shop is suspended.');
    }
    return shop;
  }

  private assertPlatformAdmin(actor: AuthActor): Profile {
    const profile = this.assertActiveUser(actor);
    if (actor.role !== 'platform_admin') {
      throw new AuthorizationError('Only platform administrators can perform this operation.');
    }
    return profile;
  }

  // ==========================================================================
  // PLATFORM ADMIN OPERATIONS (RLS: Metadata & Platform Stats ONLY — No Ledgers)
  // ==========================================================================

  public getAdminDashboardStats(actor: AuthActor) {
    this.assertPlatformAdmin(actor);
    const totalShops = this.state.shops.length;
    const activeShops = this.state.shops.filter((s) => s.status === 'active').length;
    const suspendedShops = this.state.shops.filter((s) => s.status === 'suspended').length;
    const totalOwners = new Set(this.state.shops.map((s) => s.owner_id)).size;
    const uniqueCustomers = new Set(this.state.shop_customers.map((sc) => sc.customer_id)).size;

    const customerShopCounts = new Map<string, number>();
    for (const sc of this.state.shop_customers) {
      customerShopCounts.set(sc.customer_id, (customerShopCounts.get(sc.customer_id) ?? 0) + 1);
    }
    let multiShopCustomers = 0;
    for (const count of customerShopCounts.values()) {
      if (count > 1) multiShopCustomers += 1;
    }

    const totalTransactions = this.state.ledger_entries.length;

    return {
      totalShops,
      activeShops,
      suspendedShops,
      totalOwners,
      uniqueCustomers,
      multiShopCustomers,
      totalTransactions,
    };
  }

  /**
   * Platform Admin CANNOT read customer ledger entries, purchases, or payments (Phase 6 RLS).
   */
  public getCustomerLedgerForAdmin(actor: AuthActor, _shopId: string): never {
    this.assertPlatformAdmin(actor);
    throw new AuthorizationError(
      'RLS Policy Violation: Platform administrators do not have access to private shop financial ledgers.',
    );
  }

  public adminCreateShop(
    actor: AuthActor,
    input: {
      shop_name: string;
      owner_full_name: string;
      owner_email: string;
      phone: string;
      address: string;
      status?: 'active' | 'suspended';
      logo_url?: string | null;
    },
  ): { shop: Shop; owner: Profile } {
    const adminProfile = this.assertPlatformAdmin(actor);
    const normalizedEmail = input.owner_email.trim().toLowerCase();

    let ownerProfile = this.state.profiles.find(
      (p) => p.email.toLowerCase() === normalizedEmail,
    );
    const now = new Date().toISOString();

    if (!ownerProfile) {
      ownerProfile = {
        id: nextUuid('11111111-0000-4000-8000'),
        full_name: input.owner_full_name.trim(),
        email: normalizedEmail,
        phone: input.phone.trim(),
        avatar_url: null,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      this.state.profiles.push(ownerProfile);
    }

    const hasOwnerRole = this.state.user_roles.some(
      (r) => r.user_id === ownerProfile.id && r.role === 'shop_owner',
    );
    if (!hasOwnerRole) {
      this.state.user_roles.push({
        id: nextUuid('22222222-0000-4000-8000'),
        user_id: ownerProfile.id,
        role: 'shop_owner',
        created_at: now,
      });
    }

    const nextShopNumber = 128 + this.state.shops.length + 1;
    const shop: Shop = {
      id: nextUuid('33333333-0000-4000-8000'),
      shop_code: `SH-${nextShopNumber.toString().padStart(4, '0')}`,
      shop_name: input.shop_name.trim(),
      owner_id: ownerProfile.id,
      email: normalizedEmail,
      phone: input.phone.trim(),
      address: input.address.trim(),
      logo_url: input.logo_url ?? null,
      status: input.status ?? 'active',
      created_at: now,
      updated_at: now,
    };
    this.state.shops.unshift(shop);

    this.state.audit_logs.unshift({
      id: nextUuid('99999999-0000-4000-8000'),
      shop_id: shop.id,
      user_id: adminProfile.id,
      actor_name: adminProfile.full_name,
      action: 'Shop created & owner invited',
      entity_type: 'shop',
      entity_id: shop.id,
      related_shop_name: shop.shop_name,
      result: 'Success',
      old_values: null,
      new_values: { shop_name: shop.shop_name, owner_email: ownerProfile.email },
      created_at: now,
    });

    return { shop, owner: ownerProfile };
  }

  public adminSetShopStatus(
    actor: AuthActor,
    input: { shop_id: string; status: 'active' | 'suspended'; reason: string },
  ): Shop {
    const adminProfile = this.assertPlatformAdmin(actor);
    if (!input.reason || input.reason.trim().length < 3) {
      throw new ValidationError('Audit reason is required.');
    }
    const shop = this.state.shops.find((s) => s.id === input.shop_id);
    if (!shop) {
      throw new ValidationError('Shop not found.');
    }
    const oldStatus = shop.status;
    shop.status = input.status;
    shop.updated_at = new Date().toISOString();

    this.state.audit_logs.unshift({
      id: nextUuid('99999999-0000-4000-8000'),
      shop_id: shop.id,
      user_id: adminProfile.id,
      actor_name: adminProfile.full_name,
      action: input.status === 'suspended' ? 'Shop suspended' : 'Shop reactivated',
      entity_type: 'shop',
      entity_id: shop.id,
      related_shop_name: shop.shop_name,
      result: 'Success',
      old_values: { status: oldStatus },
      new_values: { status: input.status, reason: input.reason.trim() },
      created_at: shop.updated_at,
    });

    return structuredClone(shop);
  }

  // ==========================================================================
  // SHOP OWNER — CUSTOMER INVITATION & ACCOUNT LINKING (No Duplicate Auth!)
  // ==========================================================================

  public ownerAddOrLinkCustomer(
    actor: AuthActor,
    input: {
      shop_id: string;
      full_name: string;
      email: string;
      phone: string;
      address?: string | null;
      opening_balance?: string;
      idempotency_key?: string;
    },
  ): {
    customer: Profile;
    membership: ShopCustomer;
    wasExistingIdentity: boolean;
  } {
    this.assertShopOwnerAccess(actor, input.shop_id);
    const normalizedEmail = input.email.trim().toLowerCase();
    const now = new Date().toISOString();

    // Check if customer identity already exists across the platform
    let customer = this.state.profiles.find((p) => p.email.toLowerCase() === normalizedEmail);
    const wasExistingIdentity = Boolean(customer);

    if (!customer) {
      customer = {
        id: nextUuid('44444444-0000-4000-8000'),
        full_name: input.full_name.trim(),
        email: normalizedEmail,
        phone: input.phone.trim(),
        avatar_url: null,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      this.state.profiles.push(customer);
    }

    const hasCustomerRole = this.state.user_roles.some(
      (r) => r.user_id === customer.id && r.role === 'customer',
    );
    if (!hasCustomerRole) {
      this.state.user_roles.push({
        id: nextUuid('22222222-0000-4000-8000'),
        user_id: customer.id,
        role: 'customer',
        created_at: now,
      });
    }

    // Enforce UNIQUE(shop_id, customer_id) constraint
    const existingLink = this.state.shop_customers.find(
      (sc) => sc.shop_id === input.shop_id && sc.customer_id === customer.id,
    );
    if (existingLink) {
      throw new ValidationError('This customer is already linked to your shop.');
    }

    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const membership: ShopCustomer = {
      id: nextUuid('55555555-0000-4000-8000'),
      shop_id: input.shop_id,
      customer_id: customer.id,
      address: input.address ?? null,
      status: wasExistingIdentity ? 'active' : 'pending_invitation',
      invitation_sent_at: now,
      invitation_expires_at: wasExistingIdentity ? null : expiresAt,
      joined_at: wasExistingIdentity ? now : null,
      created_at: now,
    };
    this.state.shop_customers.push(membership);

    // Optional opening balance in ledger
    if (input.opening_balance) {
      const openingCents = parseMoneyToCents(input.opening_balance);
      if (openingCents < 0n) {
        throw new ValidationError('Opening balance cannot be negative.');
      }
      if (openingCents > 0n) {
        const entry: LedgerEntry = {
          id: nextUuid('88888888-0000-4000-8000'),
          entry_code: `OPN-${this.state.ledger_entries.length + 1001}`,
          shop_id: input.shop_id,
          customer_id: customer.id,
          transaction_type: 'opening_balance',
          reference_id: null,
          debit_amount: formatCentsToDecimal(openingCents),
          credit_amount: '0.00',
          description: 'Opening balance',
          created_by: actor.userId,
          created_at: now,
          reversal_of: null,
          idempotency_key:
            input.idempotency_key ?? `opening-${input.shop_id}-${customer.id}`,
        };
        this.state.ledger_entries.push(entry);
      }
    }

    return {
      customer: structuredClone(customer),
      membership: structuredClone(membership),
      wasExistingIdentity,
    };
  }

  // ==========================================================================
  // FINANCIAL OPERATIONS — ATOMIC PURCHASE, PAYMENT, CORRECTION, BALANCE
  // ==========================================================================

  public createPurchase(
    actor: AuthActor,
    input: {
      shop_id: string;
      customer_id: string;
      purchase_date: string;
      total_amount?: string;
      description?: string | null;
      notes?: string | null;
      items?: Array<{ item_name: string; quantity: string; unit_price: string }>;
      idempotency_key: string;
    },
  ): { purchase: Purchase; ledgerEntry: LedgerEntry; balance: CustomerBalanceSummary } {
    const shop = this.assertShopOwnerAccess(actor, input.shop_id);

    if (!input.idempotency_key || input.idempotency_key.trim().length < 4) {
      throw new ValidationError('Idempotency key is required for financial transactions.');
    }

    // 1. Idempotency check: if already processed, return existing authoritative record
    const existingPurchase = this.state.purchases.find(
      (p) => p.shop_id === input.shop_id && p.idempotency_key === input.idempotency_key,
    );
    if (existingPurchase) {
      const existingEntry = this.state.ledger_entries.find(
        (e) => e.reference_id === existingPurchase.id && e.transaction_type === 'purchase',
      )!;
      const balance = this.getCustomerBalance(actor, input.shop_id, input.customer_id);
      return {
        purchase: structuredClone(existingPurchase),
        ledgerEntry: structuredClone(existingEntry),
        balance,
      };
    }

    // 2. Verify customer belongs to this shop and is not suspended
    const membership = this.state.shop_customers.find(
      (sc) => sc.shop_id === input.shop_id && sc.customer_id === input.customer_id,
    );
    if (!membership) {
      throw new AuthorizationError('Customer is not associated with this shop.');
    }
    if (membership.status === 'suspended') {
      throw new ValidationError('Cannot record a purchase for a suspended customer.');
    }

    // 3. Calculate & validate exact decimal amount
    let authoritativeTotal: string;
    const createdItems: PurchaseItem[] = [];
    const purchaseId = nextUuid('66666666-0000-4000-8000');
    const now = new Date().toISOString();

    if (input.items && input.items.length > 0) {
      const calc = calculatePurchaseItemsTotal(input.items);
      authoritativeTotal = calc.totalAmount;
      if (
        input.total_amount &&
        parseMoneyToCents(input.total_amount) !== parseMoneyToCents(authoritativeTotal)
      ) {
        throw new ValidationError(
          `Itemized total (${authoritativeTotal}) does not match submitted total (${input.total_amount}).`,
        );
      }
      input.items.forEach((item, idx) => {
        createdItems.push({
          id: nextUuid('66666667-0000-4000-8000'),
          purchase_id: purchaseId,
          item_name: item.item_name.trim(),
          quantity: item.quantity.trim(),
          unit_price: formatCentsToDecimal(parseMoneyToCents(item.unit_price)),
          line_total: calc.lineTotals[idx]!,
          created_at: now,
        });
      });
    } else {
      if (!input.total_amount) {
        throw new ValidationError('Purchase amount is mandatory.');
      }
      const cents = parseMoneyToCents(input.total_amount);
      if (cents <= 0n) {
        throw new ValidationError('Purchase amount must be greater than Rs. 0.00.');
      }
      authoritativeTotal = formatCentsToDecimal(cents);
    }

    const prefix = shop.shop_name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const txnCode = `TXN-${prefix}-${1050 + this.state.purchases.length + this.state.payments.length}`;

    // 4. Atomically insert purchase, purchase_items, and ledger_entry
    const purchase: Purchase = {
      id: purchaseId,
      transaction_code: txnCode,
      shop_id: input.shop_id,
      customer_id: input.customer_id,
      total_amount: authoritativeTotal,
      description: input.description?.trim() || null,
      notes: input.notes?.trim() || null,
      purchase_date: input.purchase_date,
      created_by: actor.userId,
      idempotency_key: input.idempotency_key,
      created_at: now,
      items: createdItems,
    };

    const ledgerEntry: LedgerEntry = {
      id: nextUuid('88888888-0000-4000-8000'),
      entry_code: txnCode,
      shop_id: input.shop_id,
      customer_id: input.customer_id,
      transaction_type: 'purchase',
      reference_id: purchase.id,
      debit_amount: authoritativeTotal,
      credit_amount: '0.00',
      description: purchase.description || 'Credit purchase',
      created_by: actor.userId,
      created_at: now,
      reversal_of: null,
      idempotency_key: `ledger-${input.idempotency_key}`,
    };

    this.state.purchases.unshift(purchase);
    this.state.purchase_items.push(...createdItems);
    this.state.ledger_entries.push(ledgerEntry);

    const balance = this.getCustomerBalance(actor, input.shop_id, input.customer_id);
    return {
      purchase: structuredClone(purchase),
      ledgerEntry: structuredClone(ledgerEntry),
      balance,
    };
  }

  public recordPayment(
    actorOrId: AuthActor | string,
    input: {
      shop_id: string;
      customer_id: string;
      amount: string;
      payment_date?: string;
      payment_method: PaymentMethod;
      reference_number?: string | null;
      notes?: string | null;
      idempotency_key?: string;
    },
  ): {
    payment: Payment;
    ledgerEntry: LedgerEntry;
    balance: CustomerBalanceSummary;
    newBalance: string;
  } {
    const actor = this.resolveActor(actorOrId, 'shop_owner');
    const shop = this.assertShopOwnerAccess(actor, input.shop_id);
    const idempotencyKey =
      input.idempotency_key && input.idempotency_key.trim().length >= 4
        ? input.idempotency_key.trim()
        : `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 1. Idempotency check
    const existingPayment = this.state.payments.find(
      (p) => p.shop_id === input.shop_id && p.idempotency_key === idempotencyKey,
    );
    if (existingPayment) {
      const existingEntry = this.state.ledger_entries.find(
        (e) => e.reference_id === existingPayment.id && e.transaction_type === 'payment',
      )!;
      const balance = this.getCustomerBalance(actor, input.shop_id, input.customer_id);
      return {
        payment: structuredClone(existingPayment),
        ledgerEntry: structuredClone(existingEntry),
        balance,
        newBalance: balance.outstanding_balance,
      };
    }

    // 2. Verify customer membership
    const membership = this.state.shop_customers.find(
      (sc) => sc.shop_id === input.shop_id && sc.customer_id === input.customer_id,
    );
    if (!membership) {
      throw new AuthorizationError('Forbidden: Customer is not associated with this shop.');
    }

    // 3. Validate amount > 0
    const cents = parseMoneyToCents(input.amount);
    if (cents <= 0n) {
      throw new ValidationError('Payment amount must be greater than Rs. 0.00.');
    }
    const authoritativeAmount = formatCentsToDecimal(cents);
    const now = new Date().toISOString();

    const prefix = shop.shop_name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const txnCode = `TXN-${prefix}-${1050 + this.state.purchases.length + this.state.payments.length}`;

    const payment: Payment = {
      id: nextUuid('77777777-0000-4000-8000'),
      transaction_code: txnCode,
      reference_code: txnCode,
      shop_id: input.shop_id,
      customer_id: input.customer_id,
      amount: authoritativeAmount,
      payment_method: input.payment_method,
      reference_number: input.reference_number?.trim() || null,
      notes: input.notes?.trim() || null,
      payment_date: input.payment_date ?? now,
      received_by: actor.userId,
      idempotency_key: idempotencyKey,
      created_at: now,
    };

    const ledgerEntry: LedgerEntry = {
      id: nextUuid('88888888-0000-4000-8000'),
      entry_code: txnCode,
      reference_code: txnCode,
      shop_id: input.shop_id,
      customer_id: input.customer_id,
      transaction_type: 'payment',
      reference_id: payment.id,
      debit_amount: '0.00',
      credit_amount: authoritativeAmount,
      description:
        input.payment_method === 'bank_transfer'
          ? 'Bank transfer payment'
          : input.payment_method === 'other'
            ? 'Payment received (Other)'
            : 'Payment received',
      created_by: actor.userId,
      created_at: now,
      reversal_of: null,
      idempotency_key: `ledger-${idempotencyKey}`,
    };

    this.state.payments.unshift(payment);
    this.state.ledger_entries.push(ledgerEntry);

    const balance = this.getCustomerBalance(actor, input.shop_id, input.customer_id);
    return {
      payment: structuredClone(payment),
      ledgerEntry: structuredClone(ledgerEntry),
      balance,
      newBalance: balance.outstanding_balance,
    };
  }

  /**
   * Immutable Transaction Correction / Reversal (Phase 4).
   * NEVER overwrites or deletes the original transaction or ledger entry.
   */
  public createCorrection(
    actor: AuthActor,
    input: {
      shop_id: string;
      customer_id: string;
      original_ledger_entry_id: string;
      complaint_id?: string | null;
      adjustment_type: 'partial_correction' | 'full_reversal' | 'debit_adjustment';
      amount?: string;
      explanation: string;
      idempotency_key: string;
    },
  ): { correctionEntry: LedgerEntry; balance: CustomerBalanceSummary } {
    const shop = this.assertShopOwnerAccess(actor, input.shop_id);
    const ownerProfile = this.assertActiveUser(actor);

    if (!input.explanation || input.explanation.trim().length < 5) {
      throw new ValidationError('Correction explanation is mandatory.');
    }

    // Idempotency check
    const existingCorrection = this.state.ledger_entries.find(
      (e) => e.shop_id === input.shop_id && e.idempotency_key === input.idempotency_key,
    );
    if (existingCorrection) {
      return {
        correctionEntry: structuredClone(existingCorrection),
        balance: this.getCustomerBalance(actor, input.shop_id, input.customer_id),
      };
    }

    const originalEntry = this.state.ledger_entries.find(
      (e) =>
        e.id === input.original_ledger_entry_id &&
        e.shop_id === input.shop_id &&
        e.customer_id === input.customer_id,
    );
    if (!originalEntry) {
      throw new ValidationError('Original ledger entry not found in this shop.');
    }

    const origDebitCents = parseMoneyToCents(originalEntry.debit_amount);
    const origCreditCents = parseMoneyToCents(originalEntry.credit_amount);

    let debitCents = 0n;
    let creditCents = 0n;
    let entryType: 'adjustment' | 'reversal' = 'adjustment';

    if (input.adjustment_type === 'full_reversal') {
      entryType = 'reversal';
      debitCents = origCreditCents;
      creditCents = origDebitCents;
    } else if (input.adjustment_type === 'partial_correction') {
      if (!input.amount) {
        throw new ValidationError('Correction amount is required.');
      }
      const adjCents = parseMoneyToCents(input.amount);
      if (adjCents <= 0n) {
        throw new ValidationError('Correction amount must be greater than Rs. 0.00.');
      }
      if (origDebitCents > 0n && adjCents > origDebitCents) {
        throw new ValidationError('Partial credit correction cannot exceed original purchase amount.');
      }
      creditCents = adjCents;
    } else {
      if (!input.amount) {
        throw new ValidationError('Adjustment amount is required.');
      }
      const adjCents = parseMoneyToCents(input.amount);
      if (adjCents <= 0n) {
        throw new ValidationError('Adjustment amount must be greater than Rs. 0.00.');
      }
      debitCents = adjCents;
    }

    const prefix = shop.shop_name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const codePrefix = entryType === 'reversal' ? 'REV' : 'COR';
    const entryCode = `${codePrefix}-${prefix}-${(this.state.ledger_entries.length + 18)
      .toString()
      .padStart(4, '0')}`;
    const now = new Date().toISOString();

    const correctionEntry: LedgerEntry = {
      id: nextUuid('88888888-0000-4000-8000'),
      entry_code: entryCode,
      shop_id: input.shop_id,
      customer_id: input.customer_id,
      transaction_type: entryType,
      reference_id: input.complaint_id ?? originalEntry.reference_id,
      debit_amount: formatCentsToDecimal(debitCents),
      credit_amount: formatCentsToDecimal(creditCents),
      description: `${entryType === 'reversal' ? 'Reversal' : 'Correction'} (${originalEntry.entry_code}): ${input.explanation.trim()}`,
      created_by: actor.userId,
      created_at: now,
      reversal_of: originalEntry.id,
      idempotency_key: input.idempotency_key,
    };

    this.state.ledger_entries.push(correctionEntry);

    // If linked to a complaint, mark complaint resolved and link the correction entry
    if (input.complaint_id) {
      const complaint = this.state.transaction_complaints.find(
        (c) => c.id === input.complaint_id && c.shop_id === input.shop_id,
      );
      if (complaint) {
        complaint.status = 'resolved';
        complaint.owner_response = input.explanation.trim();
        complaint.reviewed_by = actor.userId;
        complaint.correction_entry_id = correctionEntry.id;
        complaint.resolved_at = now;
      }
    }

    this.state.audit_logs.unshift({
      id: nextUuid('99999999-0000-4000-8000'),
      shop_id: input.shop_id,
      user_id: actor.userId,
      actor_name: ownerProfile.full_name,
      action: `Transaction ${entryType} created (${entryCode})`,
      entity_type: 'ledger_entry',
      entity_id: correctionEntry.id,
      related_shop_name: shop.shop_name,
      result: 'Success',
      old_values: {
        original_entry_id: originalEntry.id,
        original_entry_code: originalEntry.entry_code,
        original_debit: originalEntry.debit_amount,
      },
      new_values: {
        correction_entry_code: entryCode,
        debit_amount: correctionEntry.debit_amount,
        credit_amount: correctionEntry.credit_amount,
        explanation: input.explanation.trim(),
      },
      created_at: now,
    });

    const balance = this.getCustomerBalance(actor, input.shop_id, input.customer_id);
    return {
      correctionEntry: structuredClone(correctionEntry),
      balance,
    };
  }

  // ==========================================================================
  // AUTHORITATIVE BALANCE & STATEMENT QUERIES (Shared by Owner & Customer)
  // ==========================================================================

  public getCustomerBalance(
    actorOrId: AuthActor | string,
    shopId: string,
    customerId: string,
  ): CustomerBalanceSummary {
    const actor = this.resolveActor(actorOrId);
    if (actor.role === 'shop_owner') {
      this.assertShopOwnerAccess(actor, shopId, { allowSuspendedRead: false });
    } else if (actor.role === 'customer') {
      if (actor.userId !== customerId) {
        throw new AuthorizationError('Forbidden: Customers can only view their own balance.');
      }
      this.assertCustomerShopAccess(actor, shopId);
    } else {
      throw new AuthorizationError(
        'Platform administrators are restricted from viewing private customer financial ledgers.',
      );
    }

    const summary = calculateCustomerBalanceFromLedger(
      shopId,
      customerId,
      this.state.ledger_entries,
    );
    const customer = this.state.profiles.find((p) => p.id === customerId);
    return {
      ...summary,
      customer_name: customer?.full_name ?? 'Customer',
      debit_adjustments: summary.total_debit_adjustments,
      credit_adjustments: summary.total_credit_adjustments,
    };
  }

  public getCustomerPurchases(actor: AuthActor, shopId: string, customerId: string): Purchase[] {
    if (actor.role === 'shop_owner') {
      this.assertShopOwnerAccess(actor, shopId);
    } else if (actor.role === 'customer') {
      if (actor.userId !== customerId) {
        throw new AuthorizationError('Customers can only view their own purchase history.');
      }
      this.assertCustomerShopAccess(actor, shopId);
    } else {
      throw new AuthorizationError('Platform administrators cannot view customer purchases.');
    }

    return structuredClone(
      this.state.purchases.filter((p) => p.shop_id === shopId && p.customer_id === customerId),
    );
  }

  public getCustomerPayments(actor: AuthActor, shopId: string, customerId: string): Payment[] {
    if (actor.role === 'shop_owner') {
      this.assertShopOwnerAccess(actor, shopId);
    } else if (actor.role === 'customer') {
      if (actor.userId !== customerId) {
        throw new AuthorizationError('Customers can only view their own payment history.');
      }
      this.assertCustomerShopAccess(actor, shopId);
    } else {
      throw new AuthorizationError('Platform administrators cannot view customer payments.');
    }

    return structuredClone(
      this.state.payments.filter((p) => p.shop_id === shopId && p.customer_id === customerId),
    );
  }

  public generateCustomerStatement(
    actor: AuthActor,
    params: {
      shop_id: string;
      customer_id: string;
      period_start?: string;
      period_end?: string;
    },
  ): CustomerStatement {
    let shop: Shop;
    if (actor.role === 'shop_owner') {
      shop = this.assertShopOwnerAccess(actor, params.shop_id);
    } else if (actor.role === 'customer') {
      if (actor.userId !== params.customer_id) {
        throw new AuthorizationError('Customers can only generate their own statement.');
      }
      shop = this.assertCustomerShopAccess(actor, params.shop_id);
    } else {
      throw new AuthorizationError('Platform administrators cannot generate customer statements.');
    }

    const customer = this.state.profiles.find((p) => p.id === params.customer_id);
    if (!customer) {
      throw new ValidationError('Customer profile not found.');
    }
    const membership = this.state.shop_customers.find(
      (sc) => sc.shop_id === params.shop_id && sc.customer_id === params.customer_id,
    );

    const ledgerReport = buildStatementLedger({
      shopId: params.shop_id,
      customerId: params.customer_id,
      entries: this.state.ledger_entries,
      periodStart: params.period_start,
      periodEnd: params.period_end,
    });

    return {
      shop: {
        id: shop.id,
        shop_code: shop.shop_code,
        shop_name: shop.shop_name,
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
      },
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        address: membership?.address ?? null,
      },
      period_start: params.period_start ?? '2026-11-01',
      period_end: params.period_end ?? '2026-11-10',
      generated_at: new Date().toISOString(),
      opening_balance: ledgerReport.opening_balance,
      total_purchases: ledgerReport.total_purchases,
      total_payments: ledgerReport.total_payments,
      net_adjustments: ledgerReport.net_adjustments,
      closing_balance: ledgerReport.closing_balance,
      entries: ledgerReport.lines,
    };
  }

  // ==========================================================================
  // COMPLAINT WORKFLOW (Customer Raises → Owner Reviews → Separate Correction)
  // ==========================================================================

  public raiseComplaint(
    actor: AuthActor,
    input: {
      shop_id: string;
      transaction_type: 'purchase' | 'payment';
      transaction_id: string;
      complaint_type: ComplaintType;
      description: string;
      evidence_url?: string | null;
    },
  ): TransactionComplaint {
    this.assertCustomerShopAccess(actor, input.shop_id);

    let txnCode = '';
    let txnAmount = '0.00';

    if (input.transaction_type === 'purchase') {
      const purchase = this.state.purchases.find(
        (p) =>
          p.id === input.transaction_id &&
          p.shop_id === input.shop_id &&
          p.customer_id === actor.userId,
      );
      if (!purchase) {
        throw new AuthorizationError('Purchase not found or does not belong to your account.');
      }
      txnCode = purchase.transaction_code;
      txnAmount = purchase.total_amount;
    } else {
      const payment = this.state.payments.find(
        (p) =>
          p.id === input.transaction_id &&
          p.shop_id === input.shop_id &&
          p.customer_id === actor.userId,
      );
      if (!payment) {
        throw new AuthorizationError('Payment not found or does not belong to your account.');
      }
      txnCode = payment.transaction_code;
      txnAmount = payment.amount;
    }

    const complaint: TransactionComplaint = {
      id: nextUuid('aaaaaaaa-0000-4000-8000'),
      complaint_code: `CMP-${(this.state.transaction_complaints.length + 21)
        .toString()
        .padStart(4, '0')}`,
      shop_id: input.shop_id,
      customer_id: actor.userId,
      transaction_type: input.transaction_type,
      transaction_id: input.transaction_id,
      transaction_code: txnCode,
      transaction_amount: txnAmount,
      complaint_type: input.complaint_type,
      description: input.description.trim(),
      evidence_url: input.evidence_url ?? null,
      status: 'pending',
      owner_response: null,
      reviewed_by: null,
      correction_entry_id: null,
      created_at: new Date().toISOString(),
      resolved_at: null,
    };

    // Raising a complaint NEVER alters the ledger balance
    this.state.transaction_complaints.unshift(complaint);
    return structuredClone(complaint);
  }

  public reviewComplaint(
    actorOrId: AuthActor | string,
    input: {
      complaint_id: string;
      shop_id?: string;
      decision?: ComplaintStatus;
      status?: ComplaintStatus;
      owner_response: string;
    },
  ): TransactionComplaint {
    const actor = this.resolveActor(actorOrId, 'shop_owner');
    const complaint = this.state.transaction_complaints.find(
      (c) => c.id === input.complaint_id && (!input.shop_id || c.shop_id === input.shop_id),
    );
    if (!complaint) {
      throw new ValidationError('Complaint not found in your shop.');
    }
    this.assertShopOwnerAccess(actor, complaint.shop_id);

    const nextStatus = input.decision ?? input.status ?? 'under_review';
    complaint.status = nextStatus;
    complaint.owner_response = input.owner_response.trim();
    complaint.reviewed_by = actor.userId;
    if (nextStatus === 'rejected' || nextStatus === 'resolved') {
      complaint.resolved_at = new Date().toISOString();
    }

    return structuredClone(complaint);
  }

  // ==========================================================================
  // CONVENIENCE METHODS FOR UI & TESTS (String Actor ID Overloads)
  // ==========================================================================

  public createShopAsAdmin(
    adminUserId: string,
    input: {
      shop_name: string;
      category?: string;
      email?: string;
      phone: string;
      address: string;
      city?: string;
      owner_full_name: string;
      owner_email: string;
      owner_phone?: string;
      send_invitation_email?: boolean;
    },
  ): { shop: Shop; owner: Profile } {
    const actor = this.resolveActor(adminUserId, 'platform_admin');
    const res = this.adminCreateShop(actor, {
      shop_name: input.shop_name,
      owner_full_name: input.owner_full_name,
      owner_email: input.owner_email,
      phone: input.phone,
      address: input.address,
    });
    const shopRef = this.state.shops.find((s) => s.id === res.shop.id);
    if (shopRef) {
      shopRef.category = input.category ?? 'Grocery & provisions';
      shopRef.city = input.city ?? 'Colombo';
      if (input.email) shopRef.email = input.email;
    }
    return { shop: shopRef ? structuredClone(shopRef) : res.shop, owner: res.owner };
  }

  public updateShopAsAdmin(
    adminUserId: string,
    input: {
      shop_id: string;
      shop_name?: string;
      category?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
    },
  ): Shop {
    const actor = this.resolveActor(adminUserId, 'platform_admin');
    const adminProfile = this.assertPlatformAdmin(actor);
    const shop = this.state.shops.find((s) => s.id === input.shop_id);
    if (!shop) {
      throw new ValidationError('Shop not found.');
    }
    if (input.shop_name) shop.shop_name = input.shop_name.trim();
    if (input.category) shop.category = input.category.trim();
    if (input.email) shop.email = input.email.trim();
    if (input.phone) shop.phone = input.phone.trim();
    if (input.address) shop.address = input.address.trim();
    if (input.city) shop.city = input.city.trim();
    shop.updated_at = new Date().toISOString();

    this.state.audit_logs.unshift({
      id: nextUuid('99999999-0000-4000-8000'),
      shop_id: shop.id,
      user_id: adminProfile.id,
      actor_name: adminProfile.full_name,
      actor_email: adminProfile.email,
      action: 'Shop profile updated',
      entity_type: 'shop',
      entity_id: shop.id,
      related_shop_name: shop.shop_name,
      target_label: `${shop.shop_name} (${shop.shop_code})`,
      result: 'Success',
      old_values: null,
      new_values: { shop_name: shop.shop_name, address: shop.address },
      created_at: shop.updated_at,
    });
    return structuredClone(shop);
  }

  public changeShopStatusAsAdmin(
    adminUserId: string,
    input: { shop_id: string; status: 'active' | 'suspended'; reason: string },
  ): Shop {
    const actor = this.resolveActor(adminUserId, 'platform_admin');
    const updated = this.adminSetShopStatus(actor, input);
    const shopRef = this.state.shops.find((s) => s.id === input.shop_id);
    if (shopRef) {
      shopRef.suspension_reason = input.status === 'suspended' ? input.reason : null;
    }
    return shopRef ? structuredClone(shopRef) : updated;
  }

  public inviteOrLinkCustomer(
    ownerUserId: string,
    input: {
      shop_id: string;
      full_name: string;
      email: string;
      phone: string;
      opening_balance?: string;
    },
  ): {
    isExistingPlatformCustomer: boolean;
    customerProfile: Profile;
    shopCustomer: ShopCustomer;
  } {
    const actor = this.resolveActor(ownerUserId, 'shop_owner');
    const res = this.ownerAddOrLinkCustomer(actor, input);
    return {
      isExistingPlatformCustomer: res.wasExistingIdentity,
      customerProfile: res.customer,
      shopCustomer: res.membership,
    };
  }

  public recordPurchase(
    ownerUserId: string,
    input: {
      shop_id: string;
      customer_id: string;
      mode?: 'quick' | 'itemized' | 'detailed';
      total_amount?: string;
      description?: string | null;
      notes?: string | null;
      purchase_date?: string;
      items?: Array<{ item_name: string; quantity: string; unit_price: string }>;
      idempotency_key?: string;
    },
  ): {
    purchase: Purchase;
    items: PurchaseItem[];
    ledgerEntry: LedgerEntry;
    newBalance: string;
  } {
    const actor = this.resolveActor(ownerUserId, 'shop_owner');
    const idempotencyKey =
      input.idempotency_key && input.idempotency_key.trim().length >= 4
        ? input.idempotency_key.trim()
        : `pur-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const res = this.createPurchase(actor, {
      shop_id: input.shop_id,
      customer_id: input.customer_id,
      purchase_date: input.purchase_date ?? new Date().toISOString(),
      total_amount: input.total_amount,
      description: input.description,
      notes: input.notes,
      items: input.items,
      idempotency_key: idempotencyKey,
    });
    res.purchase.reference_code = res.purchase.transaction_code;
    res.ledgerEntry.reference_code = res.ledgerEntry.entry_code;
    return {
      purchase: res.purchase,
      items: res.purchase.items ?? [],
      ledgerEntry: res.ledgerEntry,
      newBalance: res.balance.outstanding_balance,
    };
  }

  public createCorrectionOrReversal(
    ownerUserId: string,
    input: {
      shop_id: string;
      customer_id: string;
      original_ledger_entry_id: string;
      correction_type: 'adjustment' | 'reversal';
      direction?: 'credit' | 'debit';
      amount?: string;
      reason: string;
      complaint_id?: string | null;
      idempotency_key?: string;
    },
  ): { ledgerEntry: LedgerEntry; newBalance: string } {
    const actor = this.resolveActor(ownerUserId, 'shop_owner');
    const adjType =
      input.correction_type === 'reversal'
        ? 'full_reversal'
        : input.direction === 'debit'
          ? 'debit_adjustment'
          : 'partial_correction';
    const res = this.createCorrection(actor, {
      shop_id: input.shop_id,
      customer_id: input.customer_id,
      original_ledger_entry_id: input.original_ledger_entry_id,
      complaint_id: input.complaint_id,
      adjustment_type: adjType,
      amount: input.amount,
      explanation: input.reason,
      idempotency_key:
        input.idempotency_key ?? `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    res.correctionEntry.reference_code = res.correctionEntry.entry_code;
    return {
      ledgerEntry: res.correctionEntry,
      newBalance: res.balance.outstanding_balance,
    };
  }

  public submitComplaint(
    customerUserId: string,
    input: {
      shop_id: string;
      transaction_type: 'purchase' | 'payment';
      transaction_id: string;
      complaint_type: ComplaintType;
      description: string;
      evidence_url?: string | null;
    },
  ): TransactionComplaint {
    const actor = this.resolveActor(customerUserId, 'customer');
    const comp = this.raiseComplaint(actor, input);
    comp.transaction_ref_code = comp.transaction_code;
    comp.disputed_amount = comp.transaction_amount;
    return comp;
  }

  public getCustomerStatement(
    actorOrId: AuthActor | string,
    shopId: string,
    customerId: string,
    periodStart?: string,
    periodEnd?: string,
  ): CustomerStatement {
    const actor = this.resolveActor(actorOrId);
    return this.generateCustomerStatement(actor, {
      shop_id: shopId,
      customer_id: customerId,
      period_start: periodStart,
      period_end: periodEnd,
    });
  }
}

