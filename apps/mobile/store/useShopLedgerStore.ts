import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  ShopLedgerEngine,
  type EngineState,
  createInitialSeedState,
  SEED_IDS,
  type UserRoleType,
  type InviteCustomerInput,
  type CreatePurchaseInput,
  type RecordPaymentInput,
  type CreateCorrectionInput,
  type CreateComplaintInput,
  type ReviewComplaintInput,
} from '@shopledger/shared';

interface MobileStoreContextValue {
  engine: ShopLedgerEngine;
  state: EngineState;
  currentUserId: string;
  currentRole: UserRoleType;
  activeShopId: string;
  selectedCustomerId: string;
  setActiveShopId: (shopId: string) => void;
  setSelectedCustomerId: (customerId: string) => void;
  signInWithRole: (email: string, role?: 'shop_owner' | 'customer') => {
    ok: boolean;
    role?: UserRoleType;
    error?: string;
  };
  signOut: () => void;
  inviteCustomer: (input: InviteCustomerInput) => void;
  recordPurchase: (input: CreatePurchaseInput) => void;
  recordPayment: (input: RecordPaymentInput) => void;
  createCorrection: (input: CreateCorrectionInput) => void;
  reviewComplaint: (input: ReviewComplaintInput) => void;
  submitComplaint: (input: CreateComplaintInput) => void;
}

const MobileStoreContext = createContext<MobileStoreContextValue | null>(null);

export function MobileStoreProvider({ children }: { children: React.ReactNode }) {
  const [engine] = useState(() => new ShopLedgerEngine(createInitialSeedState()));
  const [state, setState] = useState<EngineState>(() => engine.getState());
  const [currentUserId, setCurrentUserId] = useState<string>(SEED_IDS.OWNER_KAMAL);
  const [currentRole, setCurrentRole] = useState<UserRoleType>('shop_owner');
  const [activeShopId, setActiveShopId] = useState<string>(SEED_IDS.SHOP_KAMAL);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(SEED_IDS.CUSTOMER_AHMED);

  const sync = useCallback(() => {
    setState(JSON.parse(JSON.stringify(engine.getState())));
  }, [engine]);

  const signInWithRole = useCallback(
    (email: string, preferredRole?: 'shop_owner' | 'customer') => {
      const normalized = email.trim().toLowerCase();
      const profile = state.profiles.find((p) => p.email.toLowerCase() === normalized);
      if (!profile) {
        return { ok: false, error: 'Account not found. Please check your email or invitation.' };
      }
      if (profile.status === 'suspended') {
        return { ok: false, error: 'Your account is currently suspended. Please contact support.' };
      }
      const roles = state.userRoles
        .filter((r) => r.user_id === profile.id)
        .map((r) => r.role);

      const resolvedRole: UserRoleType =
        preferredRole && roles.includes(preferredRole)
          ? preferredRole
          : roles.includes('shop_owner')
          ? 'shop_owner'
          : 'customer';

      setCurrentUserId(profile.id);
      setCurrentRole(resolvedRole);

      if (resolvedRole === 'shop_owner') {
        const ownedShop = state.shops.find((s) => s.owner_id === profile.id);
        if (ownedShop) setActiveShopId(ownedShop.id);
      } else {
        const firstLink = state.shopCustomers.find((sc) => sc.customer_id === profile.id);
        if (firstLink) setActiveShopId(firstLink.shop_id);
      }

      return { ok: true, role: resolvedRole };
    },
    [state.profiles, state.userRoles, state.shops, state.shopCustomers]
  );

  const signOut = useCallback(() => {
    setCurrentUserId('');
  }, []);

  const inviteCustomer = useCallback(
    (input: InviteCustomerInput) => {
      engine.inviteOrLinkCustomer(currentUserId, input);
      sync();
    },
    [engine, currentUserId, sync]
  );

  const recordPurchase = useCallback(
    (input: CreatePurchaseInput) => {
      engine.recordPurchase(currentUserId, input);
      sync();
    },
    [engine, currentUserId, sync]
  );

  const recordPayment = useCallback(
    (input: RecordPaymentInput) => {
      engine.recordPayment(currentUserId, input);
      sync();
    },
    [engine, currentUserId, sync]
  );

  const createCorrection = useCallback(
    (input: CreateCorrectionInput) => {
      engine.createCorrectionOrReversal(currentUserId, input);
      sync();
    },
    [engine, currentUserId, sync]
  );

  const reviewComplaint = useCallback(
    (input: ReviewComplaintInput) => {
      engine.reviewComplaint(currentUserId, input);
      sync();
    },
    [engine, currentUserId, sync]
  );

  const submitComplaint = useCallback(
    (input: CreateComplaintInput) => {
      engine.submitComplaint(currentUserId, input);
      sync();
    },
    [engine, currentUserId, sync]
  );

  return React.createElement(
    MobileStoreContext.Provider,
    {
      value: {
        engine,
        state,
        currentUserId,
        currentRole,
        activeShopId,
        selectedCustomerId,
        setActiveShopId,
        setSelectedCustomerId,
        signInWithRole,
        signOut,
        inviteCustomer,
        recordPurchase,
        recordPayment,
        createCorrection,
        reviewComplaint,
        submitComplaint,
      },
    },
    children
  );
}

export function useMobileStore(): MobileStoreContextValue {
  const ctx = useContext(MobileStoreContext);
  if (!ctx) {
    throw new Error('useMobileStore must be used inside MobileStoreProvider');
  }
  return ctx;
}

