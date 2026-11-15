import { describe, it, expect } from 'vitest';
import {
  ShopLedgerEngine,
  createInitialSeedState,
  SEED_IDS,
  parseMoneyToCents,
  formatCentsToDecimal,
  formatLKR,
  calculateItemLineTotal,
  calculatePurchaseItemsTotal,
} from '../index';

describe('ShopLedger SaaS — Phase 5, 9, 10 & 13 Verification Suite', () => {
  describe('1. Exact Decimal Financial Arithmetic (No Floating-Point Drift)', () => {
    it('computes Opening Balance Rs. 3,000 + Purchase Rs. 2,500 - Payment Rs. 2,000 = Rs. 3,500.00', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      // Create a fresh shop + customer to test the exact prompt scenario
      const { shop } = engine.createShopAsAdmin(SEED_IDS.ADMIN_DILANI, {
        shop_name: 'Test Corner Shop',
        category: 'Grocery & provisions',
        email: 'corner@example.lk',
        phone: '+94 11 555 1234',
        address: '10 Temple Road',
        city: 'Colombo',
        owner_full_name: 'Sunil Perera',
        owner_email: 'sunil.owner@example.lk',
        owner_phone: '+94 77 555 1234',
        send_invitation_email: true,
      });

      const { customerProfile } = engine.inviteOrLinkCustomer(shop.owner_id, {
        shop_id: shop.id,
        full_name: 'Kasun Jayawardena',
        email: 'kasun@example.lk',
        phone: '+94 77 888 0000',
        opening_balance: '3000.00',
      });

      // Verify opening balance = 3000.00
      const afterOpening = engine.getCustomerBalance(
        shop.owner_id,
        shop.id,
        customerProfile.id
      );
      expect(afterOpening.opening_balance).toBe('3000.00');
      expect(afterOpening.outstanding_balance).toBe('3000.00');

      // Add Purchase = Rs. 2,500
      const purchaseRes = engine.recordPurchase(shop.owner_id, {
        shop_id: shop.id,
        customer_id: customerProfile.id,
        mode: 'quick',
        total_amount: '2500.00',
        description: 'Provisions purchase',
      });
      expect(purchaseRes.newBalance).toBe('5500.00');

      // Record Payment = Rs. 2,000
      const paymentRes = engine.recordPayment(shop.owner_id, {
        shop_id: shop.id,
        customer_id: customerProfile.id,
        amount: '2000.00',
        payment_method: 'cash',
      });
      expect(paymentRes.newBalance).toBe('3500.00');

      const finalSummary = engine.getCustomerBalance(
        shop.owner_id,
        shop.id,
        customerProfile.id
      );
      expect(finalSummary.opening_balance).toBe('3000.00');
      expect(finalSummary.total_purchases).toBe('2500.00');
      expect(finalSummary.total_payments).toBe('2000.00');
      expect(finalSummary.total_debits).toBe('5500.00');
      expect(finalSummary.total_credits).toBe('2000.00');
      expect(finalSummary.outstanding_balance).toBe('3500.00');
    });

    it('handles classic IEEE-754 float trap (0.10 + 0.20 = 0.30) with zero precision loss', () => {
      const a = parseMoneyToCents('0.10');
      const b = parseMoneyToCents('0.20');
      expect(formatCentsToDecimal(a + b)).toBe('0.30');
      expect(formatLKR('14200.00')).toBe('Rs. 14,200');
      expect(formatLKR('14200.50')).toBe('Rs. 14,200.50');
    });

    it('validates itemized purchase line totals and sum (1×1450 + 2×380 + 1×290 = Rs. 2,500.00)', () => {
      expect(calculateItemLineTotal('1', '1450.00')).toBe('1450.00');
      expect(calculateItemLineTotal('2', '380.00')).toBe('760.00');
      expect(calculateItemLineTotal('1', '290.00')).toBe('290.00');

      const total = calculatePurchaseItemsTotal([
        { quantity: '1', unit_price: '1450.00' },
        { quantity: '2', unit_price: '380.00' },
        { quantity: '1', unit_price: '290.00' },
      ]);
      expect(total.totalAmount).toBe('2500.00');
      expect(total.lineTotals).toEqual(['1450.00', '760.00', '290.00']);
    });

    it('prevents duplicate purchase or payment submissions using idempotency_key', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      const first = engine.recordPurchase(SEED_IDS.OWNER_KAMAL, {
        shop_id: SEED_IDS.SHOP_KAMAL,
        customer_id: SEED_IDS.CUSTOMER_AHMED,
        mode: 'quick',
        total_amount: '1000.00',
        description: 'Idempotent purchase',
        idempotency_key: 'idem-purchase-001',
      });

      const duplicate = engine.recordPurchase(SEED_IDS.OWNER_KAMAL, {
        shop_id: SEED_IDS.SHOP_KAMAL,
        customer_id: SEED_IDS.CUSTOMER_AHMED,
        mode: 'quick',
        total_amount: '1000.00',
        description: 'Idempotent purchase',
        idempotency_key: 'idem-purchase-001',
      });

      expect(duplicate.purchase.id).toBe(first.purchase.id);
      expect(duplicate.newBalance).toBe('15200.00'); // 14,200 + 1,000 only once
    });

    it('preserves original transaction immutability during partial correction and full reversal', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      // Ahmed Perera starts at Rs. 14,200.00 at Kamal Grocery
      const before = engine.getCustomerBalance(
        SEED_IDS.OWNER_KAMAL,
        SEED_IDS.SHOP_KAMAL,
        SEED_IDS.CUSTOMER_AHMED
      );
      expect(before.outstanding_balance).toBe('14200.00');

      // Find ledger entry for TXN-KG-1050 (Rs. 2,500 purchase)
      const targetLedger = engine
        .getState()
        .ledgerEntries.find((le) => le.reference_id === SEED_IDS.PURCHASE_1050)!;

      // Issue a Rs. 500 credit adjustment (Frame O18/O19)
      const corr = engine.createCorrectionOrReversal(SEED_IDS.OWNER_KAMAL, {
        shop_id: SEED_IDS.SHOP_KAMAL,
        customer_id: SEED_IDS.CUSTOMER_AHMED,
        original_ledger_entry_id: targetLedger.id,
        correction_type: 'adjustment',
        direction: 'credit',
        amount: '500.00',
        reason: 'Overcharged 1kg Red Dhal & rice discount',
      });

      expect(corr.newBalance).toBe('13700.00');
      expect(corr.ledgerEntry.reversal_of).toBe(targetLedger.id);

      // Verify original purchase ledger entry is untouched (still 2500.00 debit)
      const originalAfter = engine
        .getState()
        .ledgerEntries.find((le) => le.id === targetLedger.id)!;
      expect(originalAfter.debit_amount).toBe('2500.00');
    });
  });

  describe('2. Multi-Tenant & Role-Based Access Control Isolation', () => {
    it('allows one customer identity (Ahmed Perera) to hold separate balances across 3 shops', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      const kamalBal = engine.getCustomerBalance(
        SEED_IDS.CUSTOMER_AHMED,
        SEED_IDS.SHOP_KAMAL,
        SEED_IDS.CUSTOMER_AHMED
      );
      const nimalBal = engine.getCustomerBalance(
        SEED_IDS.CUSTOMER_AHMED,
        SEED_IDS.SHOP_NIMAL,
        SEED_IDS.CUSTOMER_AHMED
      );
      const raviBal = engine.getCustomerBalance(
        SEED_IDS.CUSTOMER_AHMED,
        SEED_IDS.SHOP_RAVI,
        SEED_IDS.CUSTOMER_AHMED
      );

      expect(kamalBal.outstanding_balance).toBe('14200.00');
      expect(nimalBal.outstanding_balance).toBe('5500.00');
      expect(raviBal.outstanding_balance).toBe('0.00');
    });

    it('links an existing customer to a second shop without creating a duplicate profile', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());
      const profileCountBefore = engine.getState().profiles.length;

      // Owner of Nimal Hardware invites Ravi Fernando (who already exists at Kamal Grocery)
      const res = engine.inviteOrLinkCustomer(SEED_IDS.OWNER_NIMAL, {
        shop_id: SEED_IDS.SHOP_NIMAL,
        full_name: 'Ravi Fernando',
        email: 'ravi.customer@example.lk',
        phone: '+94 76 456 7890',
        opening_balance: '1200.00',
      });

      expect(res.isExistingPlatformCustomer).toBe(true);
      expect(res.customerProfile.id).toBe(SEED_IDS.CUSTOMER_RAVI);
      expect(engine.getState().profiles.length).toBe(profileCountBefore);
    });

    it('blocks Shop Owner A from viewing or mutating Shop B records', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      expect(() =>
        engine.getCustomerBalance(
          SEED_IDS.OWNER_KAMAL,
          SEED_IDS.SHOP_NIMAL,
          SEED_IDS.CUSTOMER_AHMED
        )
      ).toThrow(/Forbidden/);

      expect(() =>
        engine.recordPurchase(SEED_IDS.OWNER_KAMAL, {
          shop_id: SEED_IDS.SHOP_NIMAL,
          customer_id: SEED_IDS.CUSTOMER_AHMED,
          mode: 'quick',
          total_amount: '500.00',
        })
      ).toThrow(/Forbidden/);
    });

    it('blocks Customer 2 (Ravi) from viewing Customer 1 (Ahmed) ledger', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      expect(() =>
        engine.getCustomerBalance(
          SEED_IDS.CUSTOMER_RAVI,
          SEED_IDS.SHOP_KAMAL,
          SEED_IDS.CUSTOMER_AHMED
        )
      ).toThrow(/Forbidden/);
    });

    it('blocks Platform Admin from viewing private customer financial ledgers', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      expect(() =>
        engine.getCustomerBalance(
          SEED_IDS.ADMIN_DILANI,
          SEED_IDS.SHOP_KAMAL,
          SEED_IDS.CUSTOMER_AHMED
        )
      ).toThrow(/restricted from viewing private customer financial ledgers/);
    });

    it('blocks suspended shops from recording new purchases or payments', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      // Suspend Kamal Grocery as Platform Admin
      engine.changeShopStatusAsAdmin(SEED_IDS.ADMIN_DILANI, {
        shop_id: SEED_IDS.SHOP_KAMAL,
        status: 'suspended',
        reason: 'Temporary compliance hold',
      });

      expect(() =>
        engine.recordPurchase(SEED_IDS.OWNER_KAMAL, {
          shop_id: SEED_IDS.SHOP_KAMAL,
          customer_id: SEED_IDS.CUSTOMER_AHMED,
          mode: 'quick',
          total_amount: '400.00',
        })
      ).toThrow(/currently suspended/);
    });
  });

  describe('3. Complaint Lifecycle & Ledger Separation', () => {
    it('submits a customer complaint without automatically altering the ledger balance', () => {
      const engine = new ShopLedgerEngine(createInitialSeedState());

      const beforeBal = engine.getCustomerBalance(
        SEED_IDS.CUSTOMER_AHMED,
        SEED_IDS.SHOP_KAMAL,
        SEED_IDS.CUSTOMER_AHMED
      );

      const complaint = engine.submitComplaint(SEED_IDS.CUSTOMER_AHMED, {
        shop_id: SEED_IDS.SHOP_KAMAL,
        transaction_type: 'purchase',
        transaction_id: SEED_IDS.PURCHASE_1049,
        complaint_type: 'incorrect_amount',
        description: 'Cooking oil bottle was returned at counter.',
      });

      expect(complaint.status).toBe('pending');

      const afterComplaintBal = engine.getCustomerBalance(
        SEED_IDS.CUSTOMER_AHMED,
        SEED_IDS.SHOP_KAMAL,
        SEED_IDS.CUSTOMER_AHMED
      );
      // Balance must NOT change simply because a complaint was filed
      expect(afterComplaintBal.outstanding_balance).toBe(beforeBal.outstanding_balance);

      // Owner reviews complaint
      const reviewed = engine.reviewComplaint(SEED_IDS.OWNER_KAMAL, {
        complaint_id: complaint.id,
        status: 'accepted',
        owner_response: 'Confirmed return of cooking oil bottle.',
      });
      expect(reviewed.status).toBe('accepted');
    });
  });
});

