'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ShopLedgerEngine,
  type EngineState,
  createInitialSeedState,
  SEED_IDS,
  type Shop,
  type Profile,
  type SupportTicket,
  type AuditLog,
  type TransactionComplaint,
  type LedgerEntry,
  type Purchase,
  type PurchaseItem,
  type Payment,
  type CustomerBalanceSummary,
  type StatementSummary,
  type CreateShopInput,
  type UpdateShopInput,
  type InviteCustomerInput,
  type CreatePurchaseInput,
  type RecordPaymentInput,
  type CreateCorrectionInput,
  type CreateComplaintInput,
  type ReviewComplaintInput,
} from '@shopledger/shared';

const STORAGE_KEY = 'shopledger_v1_state';

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_name: string;
  sender_role: 'platform_admin' | 'shop_owner' | 'customer';
  body: string;
  created_at: string;
}

interface AdminStoreContextValue {
  engine: ShopLedgerEngine;
  state: EngineState;
  currentAdmin: Profile;
  isAuthenticated: boolean;
  supportMessages: Record<string, SupportMessage[]>;
  loginAsAdmin: (email: string, password?: string) => { ok: boolean; error?: string };
  logoutAdmin: () => void;
  resetToFigmaSeed: () => void;
  // Admin Actions
  adminCreateShop: (input: CreateShopInput) => Shop;
  adminUpdateShop: (input: UpdateShopInput) => Shop;
  adminChangeShopStatus: (shopId: string, status: 'active' | 'suspended', reason: string) => Shop;
  adminResendOwnerInvite: (ownerId: string, shopId: string) => void;
  adminToggleOwnerStatus: (ownerId: string, status: 'active' | 'suspended') => void;
  adminReplySupportTicket: (
    ticketId: string,
    replyText: string,
    nextStatus?: 'open' | 'in_progress' | 'resolved' | 'closed'
  ) => void;
  // Shop Owner & Customer Actions (for live cross-app sync & interactive mobile simulator)
  ownerInviteCustomer: (actorUserId: string, input: InviteCustomerInput) => {
    isExistingPlatformCustomer: boolean;
    customerProfile: Profile;
  };
  ownerRecordPurchase: (actorUserId: string, input: CreatePurchaseInput) => {
    purchase: Purchase;
    items: PurchaseItem[];
    ledgerEntry: LedgerEntry;
    newBalance: string;
  };
  ownerRecordPayment: (actorUserId: string, input: RecordPaymentInput) => {
    payment: Payment;
    ledgerEntry: LedgerEntry;
    newBalance: string;
  };
  ownerCreateCorrection: (actorUserId: string, input: CreateCorrectionInput) => {
    ledgerEntry: LedgerEntry;
    newBalance: string;
  };
  ownerReviewComplaint: (actorUserId: string, input: ReviewComplaintInput) => TransactionComplaint;
  customerSubmitComplaint: (actorUserId: string, input: CreateComplaintInput) => TransactionComplaint;
  getCustomerBalance: (actorUserId: string, shopId: string, customerId: string) => CustomerBalanceSummary;
  getCustomerStatement: (
    actorUserId: string,
    shopId: string,
    customerId: string,
    periodStart?: string,
    periodEnd?: string
  ) => StatementSummary;
}

const DEFAULT_SUPPORT_MESSAGES: Record<string, SupportMessage[]> = {
  [SEED_IDS.TICKET_208]: [
    {
      id: 'msg-208-1',
      ticket_id: SEED_IDS.TICKET_208,
      sender_name: 'Kamal Silva (Kamal Grocery)',
      sender_role: 'shop_owner',
      body: 'Assalamu alaikum / Ayubowan team, I invited our regular customer Ahmed Perera (ahmed.perera@example.lk) yesterday at 4:15 PM, and also sent an invite to Nimal Jayasinghe today, but Nimal says he still hasn’t received the activation email. Could you check if the invitation was blocked and resend it?',
      created_at: '12 Apr 2026 · 10:18 AM',
    },
    {
      id: 'msg-208-2',
      ticket_id: SEED_IDS.TICKET_208,
      sender_name: 'Dilani Senanayake · Platform Admin',
      sender_role: 'platform_admin',
      body: 'Hello Kamal, thank you for reaching out. I checked our delivery logs — the first email bounced due to a temporary mailbox quota issue on the recipient side. I have re-queued a fresh invitation link valid for 7 days and sent an SMS notification to +94 77 998 1123.',
      created_at: '12 Apr 2026 · 10:24 AM',
    },
  ],
};

const AdminStoreContext = createContext<AdminStoreContextValue | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [engine] = useState<ShopLedgerEngine>(() => new ShopLedgerEngine(createInitialSeedState()));
  const [state, setState] = useState<EngineState>(() => engine.getState());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentAdminId, setCurrentAdminId] = useState<string>(SEED_IDS.ADMIN_DILANI);
  const [supportMessages, setSupportMessages] =
    useState<Record<string, SupportMessage[]>>(DEFAULT_SUPPORT_MESSAGES);

  const syncFromEngine = useCallback(() => {
    const snapshot: EngineState = JSON.parse(JSON.stringify(engine.getState()));
    setState(snapshot);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [engine]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as EngineState;
          if (parsed && Array.isArray(parsed.shops) && parsed.shops.length > 0) {
            Object.assign(engine.getState(), parsed);
            setState(JSON.parse(JSON.stringify(engine.getState())));
          }
        }
      } catch {
        // Fallback to seed state
      }
    }
  }, [engine]);

  const currentAdmin =
    state.profiles.find((p) => p.id === currentAdminId) ??
    state.profiles.find((p) => p.id === SEED_IDS.ADMIN_DILANI)!;

  const loginAsAdmin = useCallback(
    (email: string, password?: string) => {
      const normalized = email.trim().toLowerCase();
      if (password && password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' };
      }
      const matched = state.profiles.find((p) => p.email.toLowerCase() === normalized);
      if (matched) {
        const hasAdminRole = state.userRoles.some(
          (r) => r.user_id === matched.id && r.role === 'platform_admin'
        );
        if (!hasAdminRole) {
          return {
            ok: false,
            error:
              'Access denied: This account does not have Platform Administrator privileges. Shop owners and customers must sign in via the ShopLedger Mobile App.',
          };
        }
        setCurrentAdminId(matched.id);
        setIsAuthenticated(true);
        return { ok: true };
      }
      // Allow demo admin login with dilani@shopledger.lk or admin@shopledger.lk
      if (normalized === 'admin@shopledger.lk' || normalized === 'dilani@shopledger.lk') {
        setCurrentAdminId(SEED_IDS.ADMIN_DILANI);
        setIsAuthenticated(true);
        return { ok: true };
      }
      return {
        ok: false,
        error: 'No Platform Administrator account found for this email address.',
      };
    },
    [state.profiles, state.userRoles]
  );

  const logoutAdmin = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const resetToFigmaSeed = useCallback(() => {
    const fresh = createInitialSeedState();
    Object.assign(engine.getState(), fresh);
    setSupportMessages(DEFAULT_SUPPORT_MESSAGES);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    syncFromEngine();
  }, [engine, syncFromEngine]);

  const adminCreateShop = useCallback(
    (input: CreateShopInput) => {
      const result = engine.createShopAsAdmin(currentAdmin.id, input);
      syncFromEngine();
      return result.shop;
    },
    [engine, currentAdmin.id, syncFromEngine]
  );

  const adminUpdateShop = useCallback(
    (input: UpdateShopInput) => {
      const updated = engine.updateShopAsAdmin(currentAdmin.id, input);
      syncFromEngine();
      return updated;
    },
    [engine, currentAdmin.id, syncFromEngine]
  );

  const adminChangeShopStatus = useCallback(
    (shopId: string, status: 'active' | 'suspended', reason: string) => {
      const updated = engine.changeShopStatusAsAdmin(currentAdmin.id, {
        shop_id: shopId,
        status,
        reason,
      });
      syncFromEngine();
      return updated;
    },
    [engine, currentAdmin.id, syncFromEngine]
  );

  const adminResendOwnerInvite = useCallback(
    (ownerId: string, shopId: string) => {
      const owner = engine.getState().profiles.find((p) => p.id === ownerId);
      const shop = engine.getState().shops.find((s) => s.id === shopId);
      if (!owner || !shop) return;
      const audit: AuditLog = {
        id: `aud-invite-${Date.now()}`,
        shop_id: shop.id,
        user_id: currentAdmin.id,
        actor_name: currentAdmin.full_name,
        actor_email: currentAdmin.email,
        action: 'Owner invitation resent',
        entity_type: 'user_role',
        entity_id: owner.id,
        target_label: `${owner.full_name} · ${owner.email}`,
        ip_address: '112.134.89.14',
        old_values: null,
        new_values: { shop_code: shop.shop_code, resent_at: new Date().toISOString() },
        created_at: new Date().toISOString(),
      };
      engine.getState().auditLogs.unshift(audit);
      syncFromEngine();
    },
    [engine, currentAdmin, syncFromEngine]
  );

  const adminToggleOwnerStatus = useCallback(
    (ownerId: string, status: 'active' | 'suspended') => {
      const owner = engine.getState().profiles.find((p) => p.id === ownerId);
      if (!owner) return;
      const oldStatus = owner.status;
      owner.status = status;
      owner.updated_at = new Date().toISOString();
      const audit: AuditLog = {
        id: `aud-owner-${Date.now()}`,
        shop_id: null,
        user_id: currentAdmin.id,
        actor_name: currentAdmin.full_name,
        actor_email: currentAdmin.email,
        action: status === 'suspended' ? 'Owner account suspended' : 'Owner account reactivated',
        entity_type: 'profile',
        entity_id: owner.id,
        target_label: `${owner.full_name} · ${owner.email}`,
        ip_address: '112.134.89.14',
        old_values: { status: oldStatus },
        new_values: { status },
        created_at: new Date().toISOString(),
      };
      engine.getState().auditLogs.unshift(audit);
      syncFromEngine();
    },
    [engine, currentAdmin, syncFromEngine]
  );

  const adminReplySupportTicket = useCallback(
    (
      ticketId: string,
      replyText: string,
      nextStatus?: 'open' | 'in_progress' | 'resolved' | 'closed'
    ) => {
      const ticket = engine.getState().supportTickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      if (replyText.trim()) {
        const msg: SupportMessage = {
          id: `msg-${Date.now()}`,
          ticket_id: ticketId,
          sender_name: `${currentAdmin.full_name} · Platform Admin`,
          sender_role: 'platform_admin',
          body: replyText.trim(),
          created_at: 'Just now',
        };
        setSupportMessages((prev) => ({
          ...prev,
          [ticketId]: [...(prev[ticketId] ?? []), msg],
        }));
      }

      if (nextStatus) {
        const prevStatus = ticket.status;
        ticket.status = nextStatus;
        ticket.updated_at = new Date().toISOString();
        const audit: AuditLog = {
          id: `aud-sup-${Date.now()}`,
          shop_id: ticket.shop_id,
          user_id: currentAdmin.id,
          actor_name: currentAdmin.full_name,
          actor_email: currentAdmin.email,
          action: `Support ticket ${nextStatus}`,
          entity_type: 'support_ticket',
          entity_id: ticket.id,
          target_label: `${ticket.ticket_code} · ${ticket.subject}`,
          ip_address: '112.134.89.14',
          old_values: { status: prevStatus },
          new_values: { status: nextStatus },
          created_at: new Date().toISOString(),
        };
        engine.getState().auditLogs.unshift(audit);
      }

      syncFromEngine();
    },
    [engine, currentAdmin, syncFromEngine]
  );

  const ownerInviteCustomer = useCallback(
    (actorUserId: string, input: InviteCustomerInput) => {
      const res = engine.inviteOrLinkCustomer(actorUserId, input);
      syncFromEngine();
      return {
        isExistingPlatformCustomer: res.isExistingPlatformCustomer,
        customerProfile: res.customerProfile,
      };
    },
    [engine, syncFromEngine]
  );

  const ownerRecordPurchase = useCallback(
    (actorUserId: string, input: CreatePurchaseInput) => {
      const res = engine.recordPurchase(actorUserId, input);
      syncFromEngine();
      return res;
    },
    [engine, syncFromEngine]
  );

  const ownerRecordPayment = useCallback(
    (actorUserId: string, input: RecordPaymentInput) => {
      const res = engine.recordPayment(actorUserId, input);
      syncFromEngine();
      return res;
    },
    [engine, syncFromEngine]
  );

  const ownerCreateCorrection = useCallback(
    (actorUserId: string, input: CreateCorrectionInput) => {
      const res = engine.createCorrectionOrReversal(actorUserId, input);
      syncFromEngine();
      return res;
    },
    [engine, syncFromEngine]
  );

  const ownerReviewComplaint = useCallback(
    (actorUserId: string, input: ReviewComplaintInput) => {
      const res = engine.reviewComplaint(actorUserId, input);
      syncFromEngine();
      return res;
    },
    [engine, syncFromEngine]
  );

  const customerSubmitComplaint = useCallback(
    (actorUserId: string, input: CreateComplaintInput) => {
      const res = engine.submitComplaint(actorUserId, input);
      syncFromEngine();
      return res;
    },
    [engine, syncFromEngine]
  );

  const getCustomerBalance = useCallback(
    (actorUserId: string, shopId: string, customerId: string) => {
      return engine.getCustomerBalance(actorUserId, shopId, customerId);
    },
    [engine]
  );

  const getCustomerStatement = useCallback(
    (
      actorUserId: string,
      shopId: string,
      customerId: string,
      periodStart?: string,
      periodEnd?: string
    ) => {
      return engine.getCustomerStatement(actorUserId, shopId, customerId, periodStart, periodEnd);
    },
    [engine]
  );

  return (
    <AdminStoreContext.Provider
      value={{
        engine,
        state,
        currentAdmin,
        isAuthenticated,
        supportMessages,
        loginAsAdmin,
        logoutAdmin,
        resetToFigmaSeed,
        adminCreateShop,
        adminUpdateShop,
        adminChangeShopStatus,
        adminResendOwnerInvite,
        adminToggleOwnerStatus,
        adminReplySupportTicket,
        ownerInviteCustomer,
        ownerRecordPurchase,
        ownerRecordPayment,
        ownerCreateCorrection,
        ownerReviewComplaint,
        customerSubmitComplaint,
        getCustomerBalance,
        getCustomerStatement,
      }}
    >
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore(): AdminStoreContextValue {
  const ctx = useContext(AdminStoreContext);
  if (!ctx) {
    throw new Error('useAdminStore must be used within AdminStoreProvider');
  }
  return ctx;
}

