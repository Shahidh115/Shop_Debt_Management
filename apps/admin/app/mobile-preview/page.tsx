'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Home,
  Users,
  Receipt,
  AlertCircle,
  User,
  Plus,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Store,
  FileText,
  Scale,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  SEED_IDS,
  formatLKR,
  addMoney,
  calculateItemLineTotal,
  calculatePurchaseItemsTotal,
} from '@shopledger/shared';
import { AdminShell } from '@/components/AdminShell';
import { useAdminStore } from '@/lib/store';

type ExperienceMode = 'owner' | 'customer';
type OwnerTab = 'home' | 'customers' | 'transactions' | 'complaints' | 'profile';
type OwnerSubFlow =
  | null
  | 'add_customer'
  | 'quick_purchase'
  | 'itemized_purchase'
  | 'record_payment'
  | 'statement'
  | 'complaint_detail';

type CustomerTab = 'home' | 'history' | 'complaints' | 'profile';
type CustomerSubFlow = null | 'raise_complaint' | 'statement';

export default function InteractiveMobilePreviewPage() {
  const {
    state,
    ownerInviteCustomer,
    ownerRecordPurchase,
    ownerRecordPayment,
    ownerCreateCorrection,
    ownerReviewComplaint,
    customerSubmitComplaint,
    getCustomerBalance,
    getCustomerStatement,
  } = useAdminStore();

  const [mode, setMode] = useState<ExperienceMode>('owner');

  // Shop Owner Mobile State (Kamal Silva @ Kamal Grocery SH-0128)
  const ownerId = SEED_IDS.OWNER_KAMAL;
  const ownerShopId = SEED_IDS.SHOP_KAMAL;
  const ownerShop = state.shops.find((s) => s.id === ownerShopId)!;
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('home');
  const [ownerFlow, setOwnerFlow] = useState<OwnerSubFlow>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(SEED_IDS.CUSTOMER_AHMED);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>(SEED_IDS.COMPLAINT_21);
  const [ownerBanner, setOwnerBanner] = useState<string | null>(null);

  // Quick / Itemized Purchase Form State
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [items, setItems] = useState([
    { item_name: 'Samba Rice 5kg', quantity: '1', unit_price: '1450.00' },
    { item_name: 'Red Dhal 1kg', quantity: '2', unit_price: '380.00' },
    { item_name: 'White Sugar 1kg', quantity: '1', unit_price: '290.00' },
  ]);

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'other'>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Invite Customer Form State
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPhone, setInvPhone] = useState('+94 77 ');
  const [invOpening, setInvOpening] = useState('0.00');

  // Correction Form State
  const [corrType, setCorrType] = useState<'adjustment' | 'reversal'>('adjustment');
  const [corrDirection, setCorrDirection] = useState<'credit' | 'debit'>('credit');
  const [corrAmount, setCorrAmount] = useState('500.00');
  const [corrReason, setCorrReason] = useState(
    'Price correction on 1kg Red Dhal & agreed rice discount (CMP-0021)'
  );

  // Customer Mobile State (Ahmed Perera across 3 independent shops)
  const customerId = SEED_IDS.CUSTOMER_AHMED;
  const [activeCustomerShopId, setActiveCustomerShopId] = useState<string>(SEED_IDS.SHOP_KAMAL);
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  const [customerFlow, setCustomerFlow] = useState<CustomerSubFlow>(null);
  const [customerBanner, setCustomerBanner] = useState<string | null>(null);

  // Customer Raise Complaint State
  const [compTxId, setCompTxId] = useState<string>(SEED_IDS.PURCHASE_1050);
  const [compTxType, setCompTxType] = useState<'purchase' | 'payment'>('purchase');
  const [compTxSearch, setCompTxSearch] = useState<string>('');
  const [compType, setCompType] = useState<
    | 'incorrect_amount'
    | 'purchase_not_made'
    | 'payment_not_updated'
    | 'duplicate_transaction'
    | 'incorrect_description'
    | 'other'
  >('incorrect_amount');
  const [compDesc, setCompDesc] = useState('');

  // Computed Owner Data
  const ownerCustomerLinks = state.shopCustomers.filter((sc) => sc.shop_id === ownerShopId);
  const shopTotalSummary = ownerCustomerLinks.reduce(
    (acc, link) => {
      const bal = getCustomerBalance(ownerId, ownerShopId, link.customer_id);
      return {
        outstanding_balance: addMoney(acc.outstanding_balance, bal.outstanding_balance),
        total_debits: addMoney(acc.total_debits, bal.total_debits),
        total_credits: addMoney(acc.total_credits, bal.total_credits),
      };
    },
    { outstanding_balance: '0.00', total_debits: '0.00', total_credits: '0.00' }
  );
  const filteredOwnerCustomers = ownerCustomerLinks.filter((link) => {
    if (!customerSearchQuery.trim()) return true;
    const prof = state.profiles.find((p) => p.id === link.customer_id);
    const q = customerSearchQuery.toLowerCase();
    return (
      (prof?.full_name.toLowerCase().includes(q) ?? false) ||
      (prof?.email.toLowerCase().includes(q) ?? false) ||
      (prof?.phone.toLowerCase().includes(q) ?? false)
    );
  });
  const selectedCustomerBalance = getCustomerBalance(ownerId, ownerShopId, selectedCustomerId);
  const selectedCustomerStatement = getCustomerStatement(
    ownerId,
    ownerShopId,
    selectedCustomerId
  );
  const ownerComplaints = state.complaints.filter((c) => c.shop_id === ownerShopId);
  const activeComplaint =
    ownerComplaints.find((c) => c.id === selectedComplaintId) ?? ownerComplaints[0];

  // Computed Customer Multi-Shop Data
  const customerLinks = state.shopCustomers.filter((sc) => sc.customer_id === customerId);
  const customerActiveBalance = getCustomerBalance(
    customerId,
    activeCustomerShopId,
    customerId
  );
  const customerActiveStatement = getCustomerStatement(
    customerId,
    activeCustomerShopId,
    customerId
  );
  const customerShopComplaints = state.complaints.filter(
    (c) => c.shop_id === activeCustomerShopId && c.customer_id === customerId
  );
  const customerDisputableTransactions = [
    ...state.purchases
      .filter((p) => p.shop_id === activeCustomerShopId && p.customer_id === customerId)
      .map((p) => ({
        id: p.id,
        transaction_type: 'purchase' as const,
        code: p.reference_code ?? p.transaction_code,
        description: p.description ?? 'Credit Purchase',
        amount: p.total_amount,
        date: p.purchase_date ?? p.created_at,
      })),
    ...state.payments
      .filter((p) => p.shop_id === activeCustomerShopId && p.customer_id === customerId)
      .map((p) => ({
        id: p.id,
        transaction_type: 'payment' as const,
        code: p.reference_code ?? p.transaction_code,
        description: p.notes ?? `Payment (${p.payment_method})`,
        amount: p.amount,
        date: p.payment_date ?? p.created_at,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filteredDisputableTransactions = customerDisputableTransactions.filter((tx) => {
    if (!compTxSearch.trim()) return true;
    const q = compTxSearch.toLowerCase();
    return (
      tx.code.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      tx.amount.toLowerCase().includes(q)
    );
  });

  const selectedDisputedTransaction =
    customerDisputableTransactions.find((tx) => tx.id === compTxId) ??
    customerDisputableTransactions[0];

  const handleQuickPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = ownerRecordPurchase(ownerId, {
        shop_id: ownerShopId,
        customer_id: selectedCustomerId,
        mode: 'quick',
        total_amount: quickAmount,
        description: quickDesc,
      });
      setOwnerBanner(
        `Purchase ${res.purchase.reference_code} (+${formatLKR(
          res.purchase.total_amount
        )}) recorded. New balance: ${formatLKR(res.newBalance)}`
      );
      setQuickAmount('');
      setQuickDesc('');
      setOwnerFlow(null);
    } catch (err) {
      setOwnerBanner(err instanceof Error ? err.message : 'Error recording purchase');
    }
  };

  const handleItemizedPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = ownerRecordPurchase(ownerId, {
        shop_id: ownerShopId,
        customer_id: selectedCustomerId,
        mode: 'itemized',
        description: `Grocery purchase — ${items.length} items`,
        items,
      });
      setOwnerBanner(
        `Itemized Purchase ${res.purchase.reference_code} (+${formatLKR(
          res.purchase.total_amount
        )}) recorded. New balance: ${formatLKR(res.newBalance)}`
      );
      setOwnerFlow(null);
    } catch (err) {
      setOwnerBanner(err instanceof Error ? err.message : 'Error recording itemized purchase');
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = ownerRecordPayment(ownerId, {
        shop_id: ownerShopId,
        customer_id: selectedCustomerId,
        amount: payAmount,
        payment_method: payMethod,
        reference_number: payMethod === 'cash' ? null : payRef,
        notes: payNotes,
      });
      setOwnerBanner(
        `Payment ${res.payment.reference_code} (-${formatLKR(
          res.payment.amount
        )}) recorded. Updated balance: ${formatLKR(res.newBalance)}`
      );
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      setOwnerFlow(null);
    } catch (err) {
      setOwnerBanner(err instanceof Error ? err.message : 'Error recording payment');
    }
  };

  const handleInviteCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = ownerInviteCustomer(ownerId, {
        shop_id: ownerShopId,
        full_name: invName,
        email: invEmail,
        phone: invPhone,
        opening_balance: invOpening,
      });
      setOwnerBanner(
        res.isExistingPlatformCustomer
          ? `Linked existing ShopLedger account (${res.customerProfile.email}) to Kamal Grocery!`
          : `Invited new customer ${res.customerProfile.full_name} (${res.customerProfile.email})!`
      );
      setInvName('');
      setInvEmail('');
      setOwnerFlow(null);
    } catch (err) {
      setOwnerBanner(err instanceof Error ? err.message : 'Error inviting customer');
    }
  };

  const handleCreateCorrectionAndResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;
    try {
      // Find the ledger entry corresponding to the disputed transaction
      const originalEntry =
        state.ledgerEntries.find((le) => le.reference_id === activeComplaint.transaction_id) ??
        state.ledgerEntries.find((le) => le.shop_id === ownerShopId)!;

      const corr = ownerCreateCorrection(ownerId, {
        shop_id: ownerShopId,
        customer_id: activeComplaint.customer_id,
        original_ledger_entry_id: originalEntry.id,
        correction_type: corrType,
        direction: corrDirection,
        amount: corrAmount,
        reason: corrReason,
        complaint_id: activeComplaint.id,
      });

      ownerReviewComplaint(ownerId, {
        complaint_id: activeComplaint.id,
        status: 'resolved',
        owner_response: `Issued ${corr.ledgerEntry.reference_code} (${corrDirection} ${formatLKR(
          corrAmount
        )}): ${corrReason}`,
      });

      setOwnerBanner(
        `Created immutable adjustment ${corr.ledgerEntry.reference_code} and resolved ${activeComplaint.complaint_code}. New balance: ${formatLKR(
          corr.newBalance
        )}`
      );
      setOwnerFlow(null);
    } catch (err) {
      setOwnerBanner(err instanceof Error ? err.message : 'Error creating correction');
    }
  };

  const handleCustomerRaiseComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputedTransaction) {
      setCustomerBanner('Please select a transaction to raise a complaint.');
      return;
    }
    try {
      const comp = customerSubmitComplaint(customerId, {
        shop_id: activeCustomerShopId,
        transaction_type: selectedDisputedTransaction.transaction_type,
        transaction_id: selectedDisputedTransaction.id,
        complaint_type: compType,
        description: compDesc,
        evidence_url: 'receipt-photo-attached.jpg',
      });
      setCustomerBanner(
        `Complaint ${comp.complaint_code} submitted for transaction ${selectedDisputedTransaction.code} (${formatLKR(selectedDisputedTransaction.amount)}). Note: Raising a complaint does not automatically alter your ledger balance.`
      );
      setCompDesc('');
      setCustomerFlow(null);
      setCustomerTab('complaints');
    } catch (err) {
      setCustomerBanner(err instanceof Error ? err.message : 'Error submitting complaint');
    }
  };

  return (
    <AdminShell
      title="Interactive Mobile Apps Simulator (Owner O01–O53 & Customer C01–C39)"
      subtitle="Frame 2:7085 Experience Launchpad · Test the live React Native mobile flows connected to the shared multi-tenant Ledger Engine."
    >
      {/* Top Role Switcher Bar */}
      <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 mb-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center p-1 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1]">
          <button
            type="button"
            onClick={() => {
              setMode('owner');
              setOwnerFlow(null);
            }}
            className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors flex items-center gap-2 ${
              mode === 'owner'
                ? 'bg-[#0F4C31] text-white'
                : 'text-[#5C6F65] hover:text-[#16241D]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>03 — Shop Owner Mobile (O01–O53 · Kamal Grocery)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('customer');
              setCustomerFlow(null);
            }}
            className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors flex items-center gap-2 ${
              mode === 'customer'
                ? 'bg-[#0F4C31] text-white'
                : 'text-[#5C6F65] hover:text-[#16241D]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>04 — Customer Mobile (C01–C39 · Ahmed Perera · 3 Shops)</span>
          </button>
        </div>

        <div className="text-[12px] text-[#5C6F65] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1B7A4E]" />
          <span>
            Every purchase, payment, complaint, or correction here updates the live ledger in real
            time.
          </span>
        </div>
      </div>

      {/* Main Split View: 390x844 Mobile Viewport Frame + Live Ledger Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: 360x800 Mobile Viewport Frame */}
        <div className="xl:col-span-5 flex justify-center">
          <div className="w-[360px] h-[800px] rounded-[34px] border-[7px] border-[#16241D] bg-[#F4F8F6] shadow-elevated flex flex-col justify-between overflow-hidden">
            {/* Status Bar */}
            <div className="h-7 shrink-0 px-5 bg-[#0F4C31] text-white text-[11px] font-medium flex items-center justify-between">
              <span>9:41</span>
              <span>ShopLedger Mobile · 360×800</span>
              <span>5G · 100%</span>
            </div>

            {/* ================= SHOP OWNER MOBILE EXPERIENCE (O01–O53) ================= */}
            {mode === 'owner' && (
              <>
                <div className="flex-1 min-h-0 p-3.5 overflow-y-auto no-scrollbar space-y-3">
                  {/* Top App Bar */}
                  <div className="p-3 rounded-[12px] bg-[#0F4C31] text-white flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#68B692] font-medium">
                        {ownerShop.shop_code} · {ownerShop.status.toUpperCase()}
                      </div>
                      <div className="text-[16px] font-semibold">{ownerShop.shop_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-[#D1ECE0]">Kamal Silva</div>
                      <div className="text-[10px] text-[#68B692]">Shop Owner</div>
                    </div>
                  </div>

                  {ownerBanner && (
                    <div className="p-3 rounded-[10px] bg-[#E7F3EC] border border-[#388E5A]/30 text-[12px] text-[#0F4C31] flex items-start justify-between gap-2">
                      <span>{ownerBanner}</span>
                      <button
                        type="button"
                        onClick={() => setOwnerBanner(null)}
                        className="text-[11px] underline shrink-0"
                      >
                        OK
                      </button>
                    </div>
                  )}

                  {/* Sub-flows */}
                  {ownerFlow === 'quick_purchase' && (
                    <form
                      onSubmit={handleQuickPurchase}
                      className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => setOwnerFlow(null)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1B7A4E]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <div className="text-[11px] font-semibold uppercase text-[#1B7A4E]">
                        Frames O07 / O09 / O10 · Quick Credit Purchase
                      </div>

                      {/* Search & Select Customer */}
                      <div className="p-3 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] space-y-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0F4C31]">
                          1. Search & Select Customer *
                        </label>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#5C6F65] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            placeholder="Search customer by name, email, or phone..."
                            className="w-full h-9 pl-8 pr-3 rounded-[8px] bg-white border border-[#DCE7E1] text-[12px] text-[#16241D] focus:outline-none focus:border-[#1B7A4E]"
                          />
                        </div>
                        <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1 pr-0.5">
                          {filteredOwnerCustomers.map((link) => {
                            const prof = state.profiles.find((p) => p.id === link.customer_id);
                            const bal = getCustomerBalance(ownerId, ownerShopId, link.customer_id);
                            const isSel = link.customer_id === selectedCustomerId;
                            const isPending = link.status === 'pending_invitation';
                            return (
                              <button
                                key={link.id}
                                type="button"
                                disabled={isPending}
                                onClick={() => setSelectedCustomerId(link.customer_id)}
                                className={`w-full text-left px-2.5 py-2 rounded-[8px] border text-[12px] flex items-center justify-between transition-colors ${
                                  isSel
                                    ? 'bg-[#0F4C31] text-white border-[#0F4C31]'
                                    : isPending
                                    ? 'bg-white/50 text-[#5C6F65] border-[#DCE7E1] opacity-60 cursor-not-allowed'
                                    : 'bg-white text-[#16241D] border-[#DCE7E1] hover:border-[#1B7A4E]'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-semibold truncate">{prof?.full_name}</div>
                                  <div
                                    className={`text-[10px] truncate ${
                                      isSel ? 'text-[#D1ECE0]' : 'text-[#5C6F65]'
                                    }`}
                                  >
                                    {prof?.phone} · {prof?.email}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 tabular-nums">
                                  <div className="font-semibold">
                                    {formatLKR(bal.outstanding_balance)}
                                  </div>
                                  <div
                                    className={`text-[10px] ${
                                      isSel ? 'text-[#68B692]' : 'text-[#5C6F65]'
                                    }`}
                                  >
                                    {isSel ? 'Selected ✓' : link.status}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {filteredOwnerCustomers.length === 0 && (
                            <div className="text-[11px] text-[#5C6F65] py-2 text-center">
                              No customer matching &ldquo;{customerSearchQuery}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-3 py-2 rounded-[8px] bg-[#EBF7F1] border border-[#D1ECE0] flex items-center justify-between text-[12px]">
                        <span className="text-[#0F4C31] font-medium">
                          Adding purchase to: <strong>{selectedCustomerBalance.customer_name}</strong>
                        </span>
                        <span className="font-semibold text-[#0F4C31] tabular-nums">
                          Bal: {formatLKR(selectedCustomerBalance.outstanding_balance)}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium mb-1">
                          2. Purchase Amount (Rs.) *
                        </label>
                        <input
                          type="text"
                          required
                          value={quickAmount}
                          onChange={(e) => setQuickAmount(e.target.value)}
                          placeholder="Enter purchase amount (Rs.)"
                          className="w-full h-11 px-3 rounded-[10px] border border-[#DCE7E1] text-[15px] font-semibold tabular-nums focus:outline-none focus:border-[#1B7A4E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium mb-1">
                          3. Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={quickDesc}
                          onChange={(e) => setQuickDesc(e.target.value)}
                          placeholder="Enter purchase description (optional)"
                          className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] text-[13px] focus:outline-none focus:border-[#1B7A4E]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full h-11 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[13px] font-semibold transition-colors"
                      >
                        {quickAmount.trim()
                          ? `Add +Rs. ${quickAmount} to ${selectedCustomerBalance.customer_name}`
                          : `Add Purchase to ${selectedCustomerBalance.customer_name}`}
                      </button>
                    </form>
                  )}

                  {ownerFlow === 'itemized_purchase' && (
                    <form
                      onSubmit={handleItemizedPurchase}
                      className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => setOwnerFlow(null)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1B7A4E]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <div className="text-[11px] font-semibold uppercase text-[#1B7A4E]">
                        Frame O08 · Detailed Itemized Purchase
                      </div>

                      {/* Search & Select Customer */}
                      <div className="p-2.5 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#5C6F65] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            placeholder="Search customer name..."
                            className="w-full h-8 pl-8 pr-3 rounded-[8px] bg-white border border-[#DCE7E1] text-[12px]"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredOwnerCustomers.map((link) => {
                            const prof = state.profiles.find((p) => p.id === link.customer_id);
                            const isSel = link.customer_id === selectedCustomerId;
                            return (
                              <button
                                key={link.id}
                                type="button"
                                disabled={link.status === 'pending_invitation'}
                                onClick={() => setSelectedCustomerId(link.customer_id)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                  isSel
                                    ? 'bg-[#0F4C31] text-white border-[#0F4C31]'
                                    : 'bg-white text-[#16241D] border-[#DCE7E1]'
                                }`}
                              >
                                {prof?.full_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {items.map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] space-y-1.5"
                          >
                            <input
                              type="text"
                              value={it.item_name}
                              onChange={(e) => {
                                const copy = [...items];
                                copy[idx] = { ...it, item_name: e.target.value };
                                setItems(copy);
                              }}
                              className="w-full h-8 px-2 rounded bg-white border border-[#DCE7E1] text-[12px] font-medium"
                            />
                            <div className="flex items-center justify-between gap-2 text-[12px]">
                              <input
                                type="text"
                                value={it.quantity}
                                onChange={(e) => {
                                  const copy = [...items];
                                  copy[idx] = { ...it, quantity: e.target.value };
                                  setItems(copy);
                                }}
                                className="w-16 h-8 px-2 rounded bg-white border border-[#DCE7E1] tabular-nums"
                                placeholder="Qty"
                              />
                              <span>×</span>
                              <input
                                type="text"
                                value={it.unit_price}
                                onChange={(e) => {
                                  const copy = [...items];
                                  copy[idx] = { ...it, unit_price: e.target.value };
                                  setItems(copy);
                                }}
                                className="w-24 h-8 px-2 rounded bg-white border border-[#DCE7E1] tabular-nums"
                                placeholder="Unit Rs."
                              />
                              <span className="font-semibold text-[#0F4C31] tabular-nums">
                                {formatLKR(calculateItemLineTotal(it.quantity, it.unit_price))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#DCE7E1] text-[13px] font-semibold">
                        <span>Computed Total</span>
                        <span className="text-[#D97736] tabular-nums">
                          {formatLKR(calculatePurchaseItemsTotal(items).totalAmount)}
                        </span>
                      </div>
                      <button
                        type="submit"
                        className="w-full h-11 rounded-[10px] bg-[#1B7A4E] text-white text-[13px] font-semibold"
                      >
                        Record Itemized Bill for {selectedCustomerBalance.customer_name}
                      </button>
                    </form>
                  )}

                  {ownerFlow === 'record_payment' && (
                    <form
                      onSubmit={handleRecordPayment}
                      className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => setOwnerFlow(null)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1B7A4E]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <div className="text-[11px] font-semibold uppercase text-[#388E5A]">
                        Frames O11–O13, O37–O43 · Record Payment
                      </div>

                      {/* Search & Select Customer */}
                      <div className="p-2.5 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#5C6F65] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            placeholder="Search customer name..."
                            className="w-full h-8 pl-8 pr-3 rounded-[8px] bg-white border border-[#DCE7E1] text-[12px]"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredOwnerCustomers.map((link) => {
                            const prof = state.profiles.find((p) => p.id === link.customer_id);
                            const isSel = link.customer_id === selectedCustomerId;
                            return (
                              <button
                                key={link.id}
                                type="button"
                                disabled={link.status === 'pending_invitation'}
                                onClick={() => setSelectedCustomerId(link.customer_id)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                  isSel
                                    ? 'bg-[#0F4C31] text-white border-[#0F4C31]'
                                    : 'bg-white text-[#16241D] border-[#DCE7E1]'
                                }`}
                              >
                                {prof?.full_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-[13px] font-medium">
                        Customer: <strong>{selectedCustomerBalance.customer_name}</strong> (Owed:{' '}
                        {formatLKR(selectedCustomerBalance.outstanding_balance)})
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium mb-1">
                          Payment Amount (Rs.) *
                        </label>
                        <input
                          type="text"
                          required
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="Enter payment amount (Rs.)"
                          className="w-full h-11 px-3 rounded-[10px] border border-[#DCE7E1] text-[15px] font-semibold tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium mb-1">
                          Payment Method (O37)
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['cash', 'bank_transfer', 'other'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPayMethod(m)}
                              className={`py-2 rounded-[8px] text-[11px] font-semibold border ${
                                payMethod === m
                                  ? 'bg-[#0F4C31] text-white border-[#0F4C31]'
                                  : 'bg-[#F4F8F6] text-[#16241D] border-[#DCE7E1]'
                              }`}
                            >
                              {m === 'cash'
                                ? 'Cash'
                                : m === 'bank_transfer'
                                ? 'Bank Transfer'
                                : 'Other'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {payMethod !== 'cash' && (
                        <div>
                          <label className="block text-[12px] font-medium mb-1">
                            Reference Number (O38/O39)
                          </label>
                          <input
                            type="text"
                            value={payRef}
                            onChange={(e) => setPayRef(e.target.value)}
                            className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] text-[13px]"
                          />
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full h-11 rounded-[10px] bg-[#388E5A] text-white text-[13px] font-semibold"
                      >
                        {payAmount.trim()
                          ? `Record Credit Payment (-Rs. ${payAmount})`
                          : `Record Credit Payment for ${selectedCustomerBalance.customer_name}`}
                      </button>
                    </form>
                  )}

                  {ownerFlow === 'add_customer' && (
                    <form
                      onSubmit={handleInviteCustomer}
                      className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => setOwnerFlow(null)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1B7A4E]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <div className="text-[11px] font-semibold uppercase text-[#1B7A4E]">
                        Frames O04, O05, O23, O36 · Invite / Link Customer
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Customer full name"
                        value={invName}
                        onChange={(e) => setInvName(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] text-[13px]"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Customer email (links if existing)"
                        value={invEmail}
                        onChange={(e) => setInvEmail(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] text-[13px]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Mobile phone"
                        value={invPhone}
                        onChange={(e) => setInvPhone(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] text-[13px]"
                      />
                      <input
                        type="text"
                        placeholder="Opening balance (Rs.)"
                        value={invOpening}
                        onChange={(e) => setInvOpening(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] text-[13px]"
                      />
                      <button
                        type="submit"
                        className="w-full h-10 rounded-[10px] bg-[#1B7A4E] text-white text-[13px] font-semibold"
                      >
                        Send Invitation / Link Account
                      </button>
                    </form>
                  )}

                  {ownerFlow === 'statement' && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setOwnerFlow(null)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1B7A4E]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
                      </button>

                      {/* Customer Summary Card (Frame O06) */}
                      <div className="p-4 rounded-[14px] bg-white border border-[#DCE7E1] shadow-card space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[11px] font-semibold uppercase text-[#1B7A4E]">
                              Frames O06, O14, O15 · Customer Ledger & All Transactions
                            </div>
                            <div className="text-[16px] font-semibold text-[#16241D] mt-0.5">
                              {selectedCustomerBalance.customer_name}
                            </div>
                            <div className="text-[11px] text-[#5C6F65]">
                              {selectedCustomerStatement.customer.email} ·{' '}
                              {selectedCustomerStatement.customer.phone}
                            </div>
                          </div>
                          <div className="text-right tabular-nums">
                            <div className="text-[10px] uppercase text-[#5C6F65]">Outstanding</div>
                            <div className="text-[18px] font-semibold text-[#0F4C31]">
                              {formatLKR(selectedCustomerBalance.outstanding_balance)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#DCE7E1] text-[11px]">
                          <div>
                            <div className="text-[#5C6F65]">Opening</div>
                            <div className="font-semibold tabular-nums">
                              {formatLKR(selectedCustomerBalance.opening_balance)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#5C6F65]">Purchases</div>
                            <div className="font-semibold text-[#D97736] tabular-nums">
                              +{formatLKR(selectedCustomerBalance.total_purchases)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#5C6F65]">Payments</div>
                            <div className="font-semibold text-[#388E5A] tabular-nums">
                              -{formatLKR(selectedCustomerBalance.total_payments)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setOwnerFlow('quick_purchase')}
                            className="flex-1 h-8 rounded-[8px] bg-[#1B7A4E] text-white text-[11px] font-semibold"
                          >
                            + Add Purchase
                          </button>
                          <button
                            type="button"
                            onClick={() => setOwnerFlow('record_payment')}
                            className="flex-1 h-8 rounded-[8px] bg-white border border-[#DCE7E1] text-[#16241D] text-[11px] font-semibold"
                          >
                            + Record Payment
                          </button>
                        </div>
                      </div>

                      {/* Full Customer Transaction History */}
                      <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-[#16241D]">
                            All Transactions ({selectedCustomerStatement.entries.length})
                          </span>
                          <span className="text-[11px] text-[#5C6F65] tabular-nums">
                            Closing: {formatLKR(selectedCustomerStatement.closing_balance)}
                          </span>
                        </div>
                        <div className="divide-y divide-[#DCE7E1] text-[12px]">
                          {selectedCustomerStatement.entries
                            .slice()
                            .reverse()
                            .map((entry) => {
                              const isDebit = Number(entry.debit_amount) > 0;
                              return (
                                <div
                                  key={entry.id}
                                  className="py-2.5 flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <div className="font-medium text-[#16241D]">
                                      {entry.description}
                                    </div>
                                    <div className="text-[10px] text-[#5C6F65] font-mono">
                                      {entry.reference_code ?? entry.entry_code} ·{' '}
                                      {entry.transaction_type}
                                    </div>
                                  </div>
                                  <div className="text-right tabular-nums shrink-0">
                                    <div
                                      className={`font-semibold ${
                                        isDebit ? 'text-[#D97736]' : 'text-[#388E5A]'
                                      }`}
                                    >
                                      {isDebit
                                        ? `+${formatLKR(entry.debit_amount)}`
                                        : `-${formatLKR(entry.credit_amount)}`}
                                    </div>
                                    <div className="text-[10px] text-[#5C6F65]">
                                      Bal: {formatLKR(entry.running_balance)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {ownerFlow === 'complaint_detail' && activeComplaint && (
                    <form
                      onSubmit={handleCreateCorrectionAndResolve}
                      className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => setOwnerFlow(null)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1B7A4E]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <div className="text-[11px] font-semibold uppercase text-[#1B7A4E]">
                        Frames O17–O20 · Complaint & Immutable Correction
                      </div>
                      <div className="p-3 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] text-[12px] space-y-1">
                        <div className="font-mono font-semibold text-[#0F4C31]">
                          {activeComplaint.complaint_code} · Ref:{' '}
                          {activeComplaint.transaction_ref_code}
                        </div>
                        <p className="text-[#16241D]">{activeComplaint.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrType('adjustment')}
                          className={`py-2 rounded-[8px] text-[11px] font-semibold border ${
                            corrType === 'adjustment'
                              ? 'bg-[#0F4C31] text-white border-[#0F4C31]'
                              : 'bg-white text-[#16241D] border-[#DCE7E1]'
                          }`}
                        >
                          Partial Adjustment
                        </button>
                        <button
                          type="button"
                          onClick={() => setCorrType('reversal')}
                          className={`py-2 rounded-[8px] text-[11px] font-semibold border ${
                            corrType === 'reversal'
                              ? 'bg-[#0F4C31] text-white border-[#0F4C31]'
                              : 'bg-white text-[#16241D] border-[#DCE7E1]'
                          }`}
                        >
                          Full Reversal
                        </button>
                      </div>
                      {corrType === 'adjustment' && (
                        <input
                          type="text"
                          value={corrAmount}
                          onChange={(e) => setCorrAmount(e.target.value)}
                          placeholder="Adjustment amount (Rs.)"
                          className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] text-[13px] font-semibold tabular-nums"
                        />
                      )}
                      <input
                        type="text"
                        value={corrReason}
                        onChange={(e) => setCorrReason(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] text-[12px]"
                      />
                      <button
                        type="submit"
                        className="w-full h-10 rounded-[10px] bg-[#1B7A4E] text-white text-[12px] font-semibold"
                      >
                        Create Correction Entry & Mark Resolved
                      </button>
                    </form>
                  )}

                  {/* Default Owner Tabs when no subflow open */}
                  {!ownerFlow && ownerTab === 'home' && (
                    <>
                      {/* Hero Total Receivable Card (O02) */}
                      <div className="p-3.5 rounded-[12px] bg-white border border-[#DCE7E1] shadow-card">
                        <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#5C6F65]">
                          Frame O02 · Total Shop Credit Receivable
                        </div>
                        <div className="text-[24px] font-semibold text-[#16241D] tabular-nums mt-1">
                          {formatLKR(shopTotalSummary.outstanding_balance)}
                          <span className="text-[11px] font-normal text-[#5C6F65] ml-1.5">
                            (All {ownerCustomerLinks.length} Customers)
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOwnerFlow('quick_purchase')}
                          className="p-2.5 rounded-[10px] bg-[#1B7A4E] text-white text-left flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <div>
                            <div className="text-[12px] font-semibold leading-tight">Quick Purchase</div>
                            <div className="text-[10px] text-[#D1ECE0]">Frame O07</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOwnerFlow('itemized_purchase')}
                          className="p-2.5 rounded-[10px] bg-[#0F4C31] text-white text-left flex items-center gap-2"
                        >
                          <Receipt className="w-4 h-4 shrink-0" />
                          <div>
                            <div className="text-[12px] font-semibold leading-tight">Itemized Bill</div>
                            <div className="text-[10px] text-[#D1ECE0]">Frame O08</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOwnerFlow('record_payment')}
                          className="p-2.5 rounded-[10px] bg-white border border-[#DCE7E1] text-left flex items-center gap-2"
                        >
                          <CreditCard className="w-4 h-4 text-[#388E5A] shrink-0" />
                          <div>
                            <div className="text-[12px] font-semibold text-[#16241D] leading-tight">
                              Record Payment
                            </div>
                            <div className="text-[10px] text-[#5C6F65]">Frames O11–O13</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOwnerFlow('add_customer')}
                          className="p-2.5 rounded-[10px] bg-white border border-[#DCE7E1] text-left flex items-center gap-2"
                        >
                          <Users className="w-4 h-4 text-[#1B7A4E] shrink-0" />
                          <div>
                            <div className="text-[12px] font-semibold text-[#16241D] leading-tight">
                              Invite Customer
                            </div>
                            <div className="text-[10px] text-[#5C6F65]">Frames O04–O05</div>
                          </div>
                        </button>
                      </div>

                      {/* Recent Ledger Entries (All Shop Customers) */}
                      <div className="bg-white rounded-[12px] border border-[#DCE7E1] p-3">
                        <div className="text-[11px] font-semibold text-[#16241D] mb-1.5">
                          Recent Shop Ledger Activity (All Customers)
                        </div>
                        <div className="divide-y divide-[#DCE7E1] text-[11px]">
                          {state.ledgerEntries
                            .filter((entry) => entry.shop_id === ownerShopId)
                            .slice()
                            .reverse()
                            .slice(0, 3)
                            .map((entry) => {
                              const isDebit = Number(entry.debit_amount) > 0;
                              const custProf = state.profiles.find(
                                (p) => p.id === entry.customer_id
                              );
                              return (
                                <div
                                  key={entry.id}
                                  className="py-2 flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-medium text-[#16241D]">
                                      {entry.description}
                                    </div>
                                    <div className="text-[10px] text-[#5C6F65]">
                                      <span className="font-semibold text-[#0F4C31]">
                                        {custProf?.full_name ?? 'Customer'}
                                      </span>{' '}
                                      ·{' '}
                                      <span className="font-mono">
                                        {entry.reference_code ?? entry.entry_code} ·{' '}
                                        {entry.transaction_type}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right tabular-nums">
                                    <div
                                      className={`font-semibold ${
                                        isDebit ? 'text-[#D97736]' : 'text-[#388E5A]'
                                      }`}
                                    >
                                      {isDebit
                                        ? `+${formatLKR(entry.debit_amount)}`
                                        : `-${formatLKR(entry.credit_amount)}`}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}

                  {!ownerFlow && ownerTab === 'customers' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold">
                          Frame O03 · Shop Customers ({filteredOwnerCustomers.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setOwnerFlow('add_customer')}
                          className="text-[12px] font-semibold text-[#1B7A4E]"
                        >
                          + Invite
                        </button>
                      </div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#5C6F65] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          placeholder="Search customer by name, email, or phone..."
                          className="w-full h-9 pl-8 pr-3 rounded-[10px] border border-[#DCE7E1] bg-white text-[12px]"
                        />
                      </div>
                      {filteredOwnerCustomers.map((link) => {
                        const prof = state.profiles.find((p) => p.id === link.customer_id);
                        const bal = getCustomerBalance(ownerId, ownerShopId, link.customer_id);
                        const selected = link.customer_id === selectedCustomerId;
                        return (
                          <div
                            key={link.id}
                            onClick={() => {
                              setSelectedCustomerId(link.customer_id);
                              setOwnerFlow('statement');
                            }}
                            className={`w-full text-left p-3.5 rounded-[12px] border transition-colors cursor-pointer hover:border-[#1B7A4E] ${
                              selected
                                ? 'bg-[#EBF7F1] border-[#1B7A4E]'
                                : 'bg-white border-[#DCE7E1]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-[13px] font-semibold text-[#0F4C31] underline decoration-[#68B692] underline-offset-2">
                                  {prof?.full_name}
                                </div>
                                <div className="text-[11px] text-[#5C6F65]">
                                  {prof?.email} · {prof?.phone}
                                </div>
                                <div className="text-[10px] font-medium text-[#1B7A4E] mt-0.5">
                                  Click customer to view all transactions →
                                </div>
                              </div>
                              <div className="text-right tabular-nums">
                                <div className="text-[13px] font-semibold text-[#16241D]">
                                  {formatLKR(bal.outstanding_balance)}
                                </div>
                                <div className="text-[10px] text-[#5C6F65]">{link.status}</div>
                              </div>
                            </div>
                            <div className="mt-2.5 pt-2.5 border-t border-[#DCE7E1] flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCustomerId(link.customer_id);
                                  setOwnerFlow('statement');
                                }}
                                className="flex-1 h-8 rounded-[8px] bg-[#EBF7F1] border border-[#1B7A4E]/30 text-[#0F4C31] text-[11px] font-semibold"
                              >
                                View Transactions
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCustomerId(link.customer_id);
                                  setOwnerFlow('quick_purchase');
                                }}
                                className="flex-1 h-8 rounded-[8px] bg-[#1B7A4E] text-white text-[11px] font-semibold"
                              >
                                + Add Purchase
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCustomerId(link.customer_id);
                                  setOwnerFlow('record_payment');
                                }}
                                className="flex-1 h-8 rounded-[8px] bg-white border border-[#DCE7E1] text-[#16241D] text-[11px] font-semibold"
                              >
                                + Payment
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!ownerFlow && ownerTab === 'transactions' && (
                    <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-3.5 space-y-2">
                      <div className="text-[13px] font-semibold text-[#16241D]">
                        Frames O14 & O15 · Statement ({selectedCustomerBalance.customer_name})
                      </div>
                      <div className="divide-y divide-[#DCE7E1] text-[12px]">
                        {selectedCustomerStatement.entries.map((entry) => {
                          const isDebit = Number(entry.debit_amount) > 0;
                          return (
                            <div
                              key={entry.id}
                              className="py-2 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium text-[#16241D]">
                                  {entry.description}
                                </div>
                                <div className="text-[10px] text-[#5C6F65] font-mono">
                                  {entry.reference_code} · {entry.transaction_type}
                                </div>
                              </div>
                              <div className="text-right tabular-nums">
                                <div
                                  className={`font-semibold ${
                                    isDebit ? 'text-[#D97736]' : 'text-[#388E5A]'
                                  }`}
                                >
                                  {isDebit
                                    ? `+${formatLKR(entry.debit_amount)}`
                                    : `-${formatLKR(entry.credit_amount)}`}
                                </div>
                                <div className="text-[10px] text-[#5C6F65]">
                                  Run: {formatLKR(entry.running_balance)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!ownerFlow && ownerTab === 'complaints' && (
                    <div className="space-y-2.5">
                      <div className="text-[13px] font-semibold text-[#16241D]">
                        Frames O16–O20 · Customer Complaints ({ownerComplaints.length})
                      </div>
                      {ownerComplaints.map((comp) => (
                        <div
                          key={comp.id}
                          className="p-3.5 rounded-[12px] bg-white border border-[#DCE7E1] space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-semibold text-[#0F4C31]">
                              {comp.complaint_code} · {comp.transaction_ref_code}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#FDF0E6] text-[#D97736] font-medium">
                              {comp.status}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#16241D]">{comp.description}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedComplaintId(comp.id);
                              setOwnerFlow('complaint_detail');
                            }}
                            className="w-full h-8 rounded-[8px] bg-[#EBF7F1] text-[#0F4C31] text-[11px] font-semibold"
                          >
                            Review & Issue Separate Adjustment (O18)
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!ownerFlow && ownerTab === 'profile' && (
                    <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 space-y-2 text-[12px]">
                      <div className="text-[13px] font-semibold text-[#16241D]">
                        Frames O21 & O53 · Shop & Owner Profile
                      </div>
                      <div>
                        <strong>Shop:</strong> {ownerShop.shop_name} ({ownerShop.shop_code})
                      </div>
                      <div>
                        <strong>Address:</strong> {ownerShop.address}
                      </div>
                      <div>
                        <strong>Phone:</strong> {ownerShop.phone}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5-Tab Bottom Navigation Bar (Owner) */}
                <div className="h-14 shrink-0 bg-white border-t border-[#DCE7E1] grid grid-cols-5 text-[10px] font-medium">
                  {(
                    [
                      { id: 'home', label: 'Home', icon: Home },
                      { id: 'customers', label: 'Customers', icon: Users },
                      { id: 'transactions', label: 'Ledger', icon: Receipt },
                      { id: 'complaints', label: 'Complaints', icon: AlertCircle },
                      { id: 'profile', label: 'Profile', icon: User },
                    ] as const
                  ).map((t) => {
                    const Icon = t.icon;
                    const active = ownerTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setOwnerFlow(null);
                          setOwnerTab(t.id);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 ${
                          active ? 'text-[#0F4C31] font-semibold' : 'text-[#5C6F65]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ================= CUSTOMER MOBILE EXPERIENCE (C01–C39) ================= */}
            {mode === 'customer' && (
              <>
                <div className="flex-1 min-h-0 p-3.5 overflow-y-auto no-scrollbar space-y-3">
                  {/* Customer Header + Multi-Shop Switcher (C02 & C03) */}
                  <div className="p-3 rounded-[12px] bg-[#0F4C31] text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-[#68B692]">
                          Single Customer Identity (3 Shops)
                        </div>
                        <div className="text-[15px] font-semibold">Ahmed Perera</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B7A4E] text-[#D1ECE0]">
                        Frame C03 Switcher
                      </span>
                    </div>

                    {/* Multi-Shop Selector Pills */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {customerLinks.map((link) => {
                        const sh = state.shops.find((s) => s.id === link.shop_id);
                        const active = link.shop_id === activeCustomerShopId;
                        return (
                          <button
                            key={link.id}
                            type="button"
                            onClick={() => setActiveCustomerShopId(link.shop_id)}
                            className={`p-1.5 rounded-[8px] text-[10px] font-semibold truncate ${
                              active
                                ? 'bg-white text-[#0F4C31]'
                                : 'bg-[#1B7A4E]/40 text-[#D1ECE0]'
                            }`}
                          >
                            {sh?.shop_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {customerBanner && (
                    <div className="p-3 rounded-[10px] bg-[#E7F3EC] border border-[#388E5A]/30 text-[12px] text-[#0F4C31] flex items-start justify-between gap-2">
                      <span>{customerBanner}</span>
                      <button
                        type="button"
                        onClick={() => setCustomerBanner(null)}
                        className="text-[11px] underline shrink-0"
                      >
                        OK
                      </button>
                    </div>
                  )}

                  {customerFlow === 'raise_complaint' && (
                    <form
                      onSubmit={handleCustomerRaiseComplaint}
                      className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => setCustomerFlow(null)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1B7A4E]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <div className="text-[11px] font-semibold uppercase text-[#1B7A4E]">
                        Frames C08, C09, C33, C34 · Report Transaction Issue
                      </div>

                      {/* Step 1: Select Specific Transaction */}
                      <div className="p-3 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] space-y-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#0F4C31]">
                          1. Select Transaction to Dispute *
                        </label>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#5C6F65] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={compTxSearch}
                            onChange={(e) => setCompTxSearch(e.target.value)}
                            placeholder="Search by ref code, description, or amount..."
                            className="w-full h-8 pl-8 pr-3 rounded-[8px] bg-white border border-[#DCE7E1] text-[11px] focus:outline-none focus:border-[#1B7A4E]"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1.5">
                          {filteredDisputableTransactions.map((tx) => {
                            const isSel = selectedDisputedTransaction?.id === tx.id;
                            const isPurchase = tx.transaction_type === 'purchase';
                            return (
                              <button
                                key={tx.id}
                                type="button"
                                onClick={() => {
                                  setCompTxId(tx.id);
                                  setCompTxType(tx.transaction_type);
                                }}
                                className={`w-full text-left p-2.5 rounded-[8px] border text-[11px] flex items-center justify-between gap-2 transition-colors ${
                                  isSel
                                    ? 'bg-[#0F4C31] text-white border-[#0F4C31]'
                                    : 'bg-white text-[#16241D] border-[#DCE7E1] hover:bg-[#EBF7F1]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold truncate">{tx.description}</div>
                                  <div
                                    className={`text-[10px] font-mono ${
                                      isSel ? 'text-[#D1ECE0]' : 'text-[#5C6F65]'
                                    }`}
                                  >
                                    {tx.code} · {isPurchase ? 'Purchase' : 'Payment'}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 tabular-nums">
                                  <div
                                    className={`font-semibold ${
                                      isSel
                                        ? 'text-white'
                                        : isPurchase
                                        ? 'text-[#D97736]'
                                        : 'text-[#388E5A]'
                                    }`}
                                  >
                                    {isPurchase ? '+' : '-'}
                                    {formatLKR(tx.amount)}
                                  </div>
                                  <div
                                    className={`text-[10px] ${
                                      isSel ? 'text-[#68B692]' : 'text-[#5C6F65]'
                                    }`}
                                  >
                                    {isSel ? 'Selected ✓' : 'Select'}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {filteredDisputableTransactions.length === 0 && (
                            <div className="text-[11px] text-[#5C6F65] py-2 text-center">
                              No matching transactions found in this shop.
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedDisputedTransaction && (
                        <div className="px-3 py-2 rounded-[8px] bg-[#EBF7F1] border border-[#D1ECE0] flex items-center justify-between text-[11px]">
                          <span className="text-[#0F4C31]">
                            Disputing:{' '}
                            <strong className="font-mono">{selectedDisputedTransaction.code}</strong>{' '}
                            ({selectedDisputedTransaction.description})
                          </span>
                          <span className="font-semibold text-[#0F4C31] tabular-nums">
                            {formatLKR(selectedDisputedTransaction.amount)}
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-[#16241D] mb-1">
                          2. Complaint Category *
                        </label>
                        <select
                          value={compType}
                          onChange={(e) => setCompType(e.target.value as typeof compType)}
                          className="w-full h-10 px-3 rounded-[10px] border border-[#DCE7E1] bg-white text-[12px]"
                        >
                          <option value="incorrect_amount">Incorrect amount</option>
                          <option value="purchase_not_made">Purchase not made</option>
                          <option value="payment_not_updated">Payment not updated</option>
                          <option value="duplicate_transaction">Duplicate transaction</option>
                          <option value="incorrect_description">Incorrect description</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#16241D] mb-1">
                          3. Issue Description *
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Explain what is wrong with this transaction..."
                          value={compDesc}
                          onChange={(e) => setCompDesc(e.target.value)}
                          className="w-full p-2.5 rounded-[10px] border border-[#DCE7E1] text-[12px]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedDisputedTransaction}
                        className="w-full h-10 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] disabled:opacity-50 text-white text-[12px] font-semibold"
                      >
                        {selectedDisputedTransaction
                          ? `Submit Complaint for ${selectedDisputedTransaction.code}`
                          : 'Select a Transaction Above'}
                      </button>
                    </form>
                  )}

                  {!customerFlow && customerTab === 'home' && (
                    <>
                      {/* Balance Card (C02 / C14 / C15 All Settled) */}
                      <div className="p-4 rounded-[14px] bg-white border border-[#DCE7E1] shadow-card">
                        <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#5C6F65]">
                          {Number(customerActiveBalance.outstanding_balance) === 0
                            ? 'Frame C15 · All Settled Balance'
                            : 'Frames C02 & C04 · Outstanding Shop Balance'}
                        </div>
                        <div className="text-[26px] font-semibold text-[#16241D] tabular-nums mt-1">
                          {formatLKR(customerActiveBalance.outstanding_balance)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#DCE7E1] text-[11px]">
                          <div>
                            <div className="text-[#5C6F65]">Opening</div>
                            <div className="font-semibold tabular-nums">
                              {formatLKR(customerActiveBalance.opening_balance)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#5C6F65]">Purchases</div>
                            <div className="font-semibold text-[#D97736] tabular-nums">
                              +{formatLKR(customerActiveBalance.total_purchases)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#5C6F65]">Payments</div>
                            <div className="font-semibold text-[#388E5A] tabular-nums">
                              -{formatLKR(customerActiveBalance.total_payments)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCustomerFlow('raise_complaint')}
                        className="w-full h-10 rounded-[10px] border border-[#DCE7E1] bg-white text-[12px] font-semibold text-[#0F4C31] flex items-center justify-center gap-1.5"
                      >
                        <AlertCircle className="w-4 h-4 text-[#D97736]" />
                        <span>Report a transaction issue (Frame C08)</span>
                      </button>

                      {/* Shop-Scoped Ledger */}
                      <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-3.5">
                        <div className="text-[12px] font-semibold text-[#16241D] mb-2">
                          Frames C05, C06, C12 · Shop Statement (Tap Report Issue on any item)
                        </div>
                        <div className="divide-y divide-[#DCE7E1] text-[12px]">
                          {customerActiveStatement.entries
                            .slice()
                            .reverse()
                            .map((entry) => {
                              const isDebit = Number(entry.debit_amount) > 0;
                              const matchingTx = customerDisputableTransactions.find(
                                (tx) => tx.code === entry.reference_code
                              );
                              return (
                                <div
                                  key={entry.id}
                                  className="py-2.5 flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <div className="font-medium text-[#16241D]">
                                      {entry.description}
                                    </div>
                                    <div className="text-[10px] text-[#5C6F65] font-mono">
                                      {entry.reference_code} · {entry.transaction_type}
                                    </div>
                                    {matchingTx && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCompTxId(matchingTx.id);
                                          setCompTxType(matchingTx.transaction_type);
                                          setCustomerFlow('raise_complaint');
                                        }}
                                        className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FDF3EC] border border-[#D97736]/30 text-[#D97736] text-[10px] font-semibold hover:bg-[#D97736] hover:text-white transition-colors"
                                      >
                                        <AlertCircle className="w-2.5 h-2.5" />
                                        Report Issue
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-right tabular-nums shrink-0">
                                    <div
                                      className={`font-semibold ${
                                        isDebit ? 'text-[#D97736]' : 'text-[#388E5A]'
                                      }`}
                                    >
                                      {isDebit
                                        ? `+${formatLKR(entry.debit_amount)}`
                                        : `-${formatLKR(entry.credit_amount)}`}
                                    </div>
                                    <div className="text-[10px] text-[#5C6F65]">
                                      Bal: {formatLKR(entry.running_balance)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}

                  {!customerFlow && customerTab === 'history' && (
                    <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-3.5 space-y-2">
                      <div className="text-[13px] font-semibold text-[#16241D]">
                        Frames C05, C06, C07, C30 · Full History (Select any transaction to dispute)
                      </div>
                      {customerActiveStatement.entries.map((entry) => {
                        const matchingTx = customerDisputableTransactions.find(
                          (tx) => tx.code === entry.reference_code
                        );
                        return (
                          <div
                            key={entry.id}
                            className="py-2.5 border-b border-[#DCE7E1] last:border-b-0 flex items-center justify-between text-[12px] gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-medium">{entry.description}</div>
                              <div className="text-[10px] text-[#5C6F65] font-mono">
                                {entry.reference_code} · {entry.transaction_type}
                              </div>
                              {matchingTx && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompTxId(matchingTx.id);
                                    setCompTxType(matchingTx.transaction_type);
                                    setCustomerFlow('raise_complaint');
                                  }}
                                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FDF3EC] border border-[#D97736]/30 text-[#D97736] text-[10px] font-semibold hover:bg-[#D97736] hover:text-white transition-colors"
                                >
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  Raise Complaint on {matchingTx.code}
                                </button>
                              )}
                            </div>
                            <div className="font-semibold tabular-nums shrink-0">
                              {Number(entry.debit_amount) > 0
                                ? `+${formatLKR(entry.debit_amount)}`
                                : `-${formatLKR(entry.credit_amount)}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!customerFlow && customerTab === 'complaints' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold">
                          Frames C10, C11, C16–C19 · Your Complaints
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomerFlow('raise_complaint')}
                          className="text-[11px] font-semibold text-[#1B7A4E]"
                        >
                          + New
                        </button>
                      </div>
                      {customerShopComplaints.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-[12px] bg-white border border-[#DCE7E1] space-y-1 text-[12px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-[#0F4C31]">
                              {c.complaint_code} · Ref: {c.transaction_ref_code ?? c.transaction_code}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#EBF7F1] text-[#0F4C31] text-[10px] font-semibold">
                              {c.status}
                            </span>
                          </div>
                          <p>{c.description}</p>
                          {c.owner_response && (
                            <div className="p-2 rounded bg-[#F4F8F6] text-[11px] text-[#0F4C31]">
                              <strong>Shop response:</strong> {c.owner_response}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!customerFlow && customerTab === 'profile' && (
                    <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 space-y-2 text-[12px]">
                      <div className="text-[13px] font-semibold">
                        Frames C13 & C29 · Customer Profile
                      </div>
                      <div>
                        <strong>Name:</strong> Ahmed Perera
                      </div>
                      <div>
                        <strong>Email:</strong> ahmed.perera@example.lk
                      </div>
                      <div>
                        <strong>Linked Shops:</strong> Kamal Grocery, Nimal Hardware, Ravi Stores
                      </div>
                    </div>
                  )}
                </div>

                {/* 4-Tab Bottom Navigation Bar (Customer) */}
                <div className="h-14 shrink-0 bg-white border-t border-[#DCE7E1] grid grid-cols-4 text-[10px] font-medium">
                  {(
                    [
                      { id: 'home', label: 'Home', icon: Home },
                      { id: 'history', label: 'History', icon: FileText },
                      { id: 'complaints', label: 'Complaints', icon: AlertCircle },
                      { id: 'profile', label: 'Profile', icon: User },
                    ] as const
                  ).map((t) => {
                    const Icon = t.icon;
                    const active = customerTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setCustomerFlow(null);
                          setCustomerTab(t.id);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 ${
                          active ? 'text-[#0F4C31] font-semibold' : 'text-[#5C6F65]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Live Financial Accounting & Multi-Tenant Inspector */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#DCE7E1]">
              <Scale className="w-5 h-5 text-[#1B7A4E]" />
              <div>
                <h2 className="text-[16px] font-semibold text-[#16241D]">
                  Live Ledger & Multi-Shop Isolation Inspector
                </h2>
                <p className="text-[13px] text-[#5C6F65]">
                  Outstanding Balance = Opening Balance + Purchases + Debit Adjustments - Payments -
                  Credit Adjustments
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {customerLinks.map((link) => {
                const sh = state.shops.find((s) => s.id === link.shop_id);
                const bal = getCustomerBalance(customerId, link.shop_id, customerId);
                return (
                  <div
                    key={link.id}
                    className="p-4 rounded-[12px] bg-[#F8FBFA] border border-[#DCE7E1]"
                  >
                    <div className="text-[11px] font-mono text-[#5C6F65]">{sh?.shop_code}</div>
                    <div className="text-[14px] font-semibold text-[#16241D]">{sh?.shop_name}</div>
                    <div className="text-[20px] font-semibold text-[#0F4C31] tabular-nums mt-2">
                      {formatLKR(bal.outstanding_balance)}
                    </div>
                    <div className="text-[11px] text-[#5C6F65] mt-1">
                      Debits: {formatLKR(bal.total_debits)} · Credits: {formatLKR(bal.total_credits)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-[12px] bg-[#EBF7F1] border border-[#D1ECE0] text-[13px] text-[#0F4C31] space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#388E5A]" />
                <span>Verified Accounting & Security Invariants</span>
              </div>
              <ul className="list-disc list-inside text-[12px] space-y-1 text-[#16241D]/85">
                <li>
                  All financial calculations use exact <code className="font-mono">BigInt</code>{' '}
                  integer cents and PostgreSQL <code className="font-mono">NUMERIC(14,2)</code>.
                </li>
                <li>
                  Original <code className="font-mono">purchases</code>,{' '}
                  <code className="font-mono">payments</code>, and{' '}
                  <code className="font-mono">ledger_entries</code> are immutable.
                </li>
                <li>
                  Customer Ahmed Perera logs in once and switches cleanly between Kamal Grocery,
                  Nimal Hardware, and Ravi Stores with zero cross-shop leakage.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

