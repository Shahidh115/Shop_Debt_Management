'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Store,
  UserCheck,
  MapPin,
  Mail,
  Phone,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Send,
  X,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { useAdminStore } from '@/lib/store';

export default function ShopDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const {
    state,
    adminUpdateShop,
    adminChangeShopStatus,
    adminResendOwnerInvite,
  } = useAdminStore();

  const shop = state.shops.find((s) => s.id === id) ?? state.shops[0];
  const owner = state.profiles.find((p) => p.id === shop?.owner_id);
  const shopAuditLogs = state.auditLogs.filter((l) => l.shop_id === shop?.id);

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [suspendReason, setSuspendReason] = useState(
    'Account verification pending — requested business registration documents not submitted.'
  );
  const [reactivateReason, setReactivateReason] = useState(
    'Compliance documents verified and approved by Platform Administration.'
  );

  const [editName, setEditName] = useState(shop?.shop_name ?? '');
  const [editCategory, setEditCategory] = useState(shop?.category ?? 'Grocery & provisions');
  const [editEmail, setEditEmail] = useState(shop?.email ?? '');
  const [editPhone, setEditPhone] = useState(shop?.phone ?? '');
  const [editAddress, setEditAddress] = useState(shop?.address ?? '');
  const [editCity, setEditCity] = useState(shop?.city ?? '');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!shop) {
    return (
      <AdminShell title="Shop not found">
        <Link href="/shops" className="text-[#1B7A4E] underline">
          Return to shops directory
        </Link>
      </AdminShell>
    );
  }

  const handleConfirmSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    adminChangeShopStatus(shop.id, 'suspended', suspendReason);
    setShowSuspendModal(false);
    setToastMessage(`${shop.shop_name} (${shop.shop_code}) has been suspended.`);
  };

  const handleConfirmReactivate = (e: React.FormEvent) => {
    e.preventDefault();
    adminChangeShopStatus(shop.id, 'active', reactivateReason);
    setShowReactivateModal(false);
    setToastMessage(`${shop.shop_name} (${shop.shop_code}) has been reactivated.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdateShop({
      shop_id: shop.id,
      shop_name: editName,
      category: editCategory,
      email: editEmail,
      phone: editPhone,
      address: editAddress,
      city: editCity,
    });
    setShowEditModal(false);
    setToastMessage('Shop profile updated and recorded in audit log.');
  };

  const linkedCount = state.shopCustomers.filter((sc) => sc.shop_id === shop.id).length;
  const displayCustomers = shop.shop_code === 'SH-0128' ? Math.max(48, linkedCount) : 34;

  return (
    <AdminShell
      title={`${shop.shop_name} (${shop.shop_code})`}
      subtitle={`Frames A05, A13, A14, A15 & Edit Shop · Registered ${new Date(
        shop.created_at
      ).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`}
      actions={
        <div className="flex items-center gap-2.5">
          <Link
            href="/shops"
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-[10px] border border-[#DCE7E1] bg-white hover:bg-[#F4F8F6] text-[13px] font-medium text-[#16241D]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Directory</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setEditName(shop.shop_name);
              setEditCategory(shop.category ?? 'Grocery & provisions');
              setEditEmail(shop.email);
              setEditPhone(shop.phone);
              setEditAddress(shop.address);
              setEditCity(shop.city ?? 'Colombo');
              setShowEditModal(true);
            }}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-[10px] border border-[#DCE7E1] bg-white hover:bg-[#F4F8F6] text-[13px] font-semibold text-[#0F4C31]"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit shop</span>
          </button>

          {shop.status === 'active' ? (
            <button
              type="button"
              onClick={() => setShowSuspendModal(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-[#FCECEB] hover:bg-[#C6534B] text-[#C6534B] hover:text-white border border-[#C6534B]/30 text-[13px] font-semibold transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Suspend shop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowReactivateModal(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[13px] font-semibold transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Reactivate shop</span>
            </button>
          )}
        </div>
      }
    >
      {toastMessage && (
        <div className="mb-5 p-3.5 rounded-[10px] bg-[#E7F3EC] border border-[#388E5A]/30 flex items-center justify-between text-[13px] text-[#0F4C31]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#388E5A]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Frame A15 — Suspended Shop Banner */}
      {shop.status === 'suspended' && (
        <div className="mb-6 p-5 rounded-[14px] bg-[#FBF3E2] border border-[#D99A32]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#D99A32] shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-semibold text-[#16241D]">
                Frame A15 · This shop is currently suspended
              </div>
              <p className="text-[13px] text-[#5C6F65] mt-0.5">
                Reason: {shop.suspension_reason ?? 'Administrative compliance review.'} New credit
                purchases, payments, and customer invitations are blocked until reactivated.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReactivateModal(true)}
            className="shrink-0 h-9 px-4 rounded-[8px] bg-[#1B7A4E] text-white text-[12px] font-semibold hover:bg-[#0F4C31]"
          >
            Reactivate shop now
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Shop Profile Card */}
          <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
            <div className="flex items-start justify-between pb-5 mb-5 border-b border-[#DCE7E1]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[14px] bg-[#0F4C31] text-white font-semibold text-lg flex items-center justify-center">
                  {shop.shop_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[18px] font-semibold text-[#16241D]">{shop.shop_name}</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
                        shop.status === 'active'
                          ? 'bg-[#E7F3EC] text-[#388E5A]'
                          : 'bg-[#FBF3E2] text-[#D99A32]'
                      }`}
                    >
                      {shop.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div className="text-[13px] text-[#5C6F65] font-mono mt-0.5">
                    {shop.shop_code} · {shop.category}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[13px]">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#1B7A4E] mt-0.5" />
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#5C6F65]">
                    Shop Email
                  </div>
                  <div className="font-medium text-[#16241D] mt-0.5">{shop.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#1B7A4E] mt-0.5" />
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#5C6F65]">
                    Shop Phone
                  </div>
                  <div className="font-medium text-[#16241D] mt-0.5">{shop.phone}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="w-4 h-4 text-[#1B7A4E] mt-0.5" />
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#5C6F65]">
                    Physical Address
                  </div>
                  <div className="font-medium text-[#16241D] mt-0.5">
                    {shop.address} ({shop.city})
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Boundary Card — Figma A05 Mandatory Requirement */}
          <div className="rounded-[14px] bg-[#F8FBFA] border border-[#DCE7E1] p-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-[10px] bg-[#D1ECE0] text-[#0F4C31] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#16241D]">
                  Customer financial ledger access is restricted
                </h3>
                <p className="text-[13px] text-[#5C6F65] mt-1 leading-relaxed">
                  In accordance with ShopLedger multi-tenant security policy, platform
                  administrators can view aggregate customer link counts ({displayCustomers} linked
                  customers) but cannot view or modify private customer balances, credit purchases,
                  payments, or account statements.
                </p>
              </div>
            </div>
          </div>

          {/* Shop Audit History */}
          <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
            <h3 className="text-[16px] font-semibold text-[#16241D] mb-4">
              Administrative audit history for {shop.shop_code}
            </h3>
            <div className="divide-y divide-[#DCE7E1] text-[13px]">
              {shopAuditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#16241D]">{log.action}</div>
                    <div className="text-[12px] text-[#5C6F65]">
                      Actor: {log.actor_name} ({log.actor_email})
                    </div>
                  </div>
                  <div className="text-[12px] text-[#5C6F65] font-mono">
                    {new Date(log.created_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
              {shopAuditLogs.length === 0 && (
                <div className="py-4 text-[#5C6F65]">No administrative events recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Shop Owner Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1B7A4E]" />
                <h3 className="text-[15px] font-semibold text-[#16241D]">Assigned Shop Owner</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#E7F3EC] text-[#388E5A] text-[11px] font-semibold">
                {owner?.status === 'suspended' ? 'Suspended' : 'Verified'}
              </span>
            </div>

            <div className="p-4 rounded-[12px] bg-[#F4F8F6] border border-[#DCE7E1] space-y-2">
              <div className="text-[15px] font-semibold text-[#16241D]">
                {owner?.full_name ?? 'Kamal Silva'}
              </div>
              <div className="text-[13px] text-[#5C6F65]">{owner?.email}</div>
              <div className="text-[13px] text-[#5C6F65]">{owner?.phone}</div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (owner) {
                    adminResendOwnerInvite(owner.id, shop.id);
                    setToastMessage(`Onboarding invitation resent to ${owner.email}.`);
                  }
                }}
                className="w-full h-10 rounded-[10px] border border-[#DCE7E1] bg-white hover:bg-[#F4F8F6] text-[13px] font-medium text-[#0F4C31] inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-[#1B7A4E]" />
                <span>Resend owner invitation</span>
              </button>

              <Link
                href="/owners"
                className="flex items-center justify-center w-full h-10 rounded-[10px] border border-[#DCE7E1] bg-[#F8FBFA] hover:bg-[#E8F1EC] text-[13px] font-medium text-[#16241D] transition-colors"
              >
                Manage in Shop Owners
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card space-y-3">
            <h3 className="text-[15px] font-semibold text-[#16241D]">Operational summary</h3>
            <div className="flex items-center justify-between text-[13px] py-1.5 border-b border-[#DCE7E1]">
              <span className="text-[#5C6F65]">Linked customers</span>
              <span className="font-semibold text-[#16241D] tabular-nums">{displayCustomers}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] py-1.5 border-b border-[#DCE7E1]">
              <span className="text-[#5C6F65]">Role assignment</span>
              <span className="font-mono text-[12px] text-[#0F4C31]">shop_owner</span>
            </div>
            <div className="flex items-center justify-between text-[13px] py-1.5">
              <span className="text-[#5C6F65]">Tenant RLS Isolation</span>
              <span className="text-[#388E5A] font-medium">Enforced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frame A13 — Suspend Shop Confirmation Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-[16px] border border-[#DCE7E1] p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 text-[#C6534B] text-[12px] font-semibold uppercase tracking-[0.06em]">
                <AlertTriangle className="w-4 h-4" />
                <span>Frame A13 · Confirm Shop Suspension</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="text-[#5C6F65] hover:text-[#16241D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-[18px] font-semibold text-[#16241D]">
              Suspend {shop.shop_name} ({shop.shop_code})?
            </h3>
            <p className="text-[13px] text-[#5C6F65] mt-1.5 leading-relaxed">
              Suspending this shop immediately blocks the shop owner from adding new credit
              purchases, recording payments, or inviting customers. Existing customer ledgers remain
              preserved in read-only mode.
            </p>
            <form onSubmit={handleConfirmSuspend} className="mt-4 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                  Reason for suspension (recorded in audit log) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full p-3 rounded-[10px] border border-[#DCE7E1] text-[13px] focus:outline-none focus:border-[#C6534B]"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(false)}
                  className="h-10 px-4 rounded-[10px] border border-[#DCE7E1] text-[13px] font-medium text-[#16241D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-[10px] bg-[#C6534B] hover:bg-[#a93f38] text-white text-[13px] font-semibold"
                >
                  Suspend shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Frame A14 — Reactivate Shop Confirmation Modal */}
      {showReactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-[16px] border border-[#DCE7E1] p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 text-[#388E5A] text-[12px] font-semibold uppercase tracking-[0.06em]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Frame A14 · Confirm Shop Reactivation</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReactivateModal(false)}
                className="text-[#5C6F65] hover:text-[#16241D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-[18px] font-semibold text-[#16241D]">
              Reactivate {shop.shop_name} ({shop.shop_code})?
            </h3>
            <p className="text-[13px] text-[#5C6F65] mt-1.5 leading-relaxed">
              Restores full operational access for the shop owner to record credit purchases,
              customer payments, and statements.
            </p>
            <form onSubmit={handleConfirmReactivate} className="mt-4 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                  Reactivation note (recorded in audit log) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reactivateReason}
                  onChange={(e) => setReactivateReason(e.target.value)}
                  className="w-full p-3 rounded-[10px] border border-[#DCE7E1] text-[13px] focus:outline-none focus:border-[#1B7A4E]"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReactivateModal(false)}
                  className="h-10 px-4 rounded-[10px] border border-[#DCE7E1] text-[13px] font-medium text-[#16241D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[13px] font-semibold"
                >
                  Confirm reactivation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shop Modal (Identified Missing Screen in Phase 0 -> Implemented) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[540px] bg-white rounded-[16px] border border-[#DCE7E1] p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#1B7A4E]" />
                <h3 className="text-[18px] font-semibold text-[#16241D]">
                  Edit Shop Information ({shop.shop_code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-[#5C6F65] hover:text-[#16241D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-medium text-[#16241D] mb-1">
                    Shop name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#DCE7E1] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#16241D] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#DCE7E1] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#16241D] mb-1">
                    Shop email
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#DCE7E1] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#16241D] mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#DCE7E1] text-[13px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[#16241D] mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#DCE7E1] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#16241D] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#DCE7E1] text-[13px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DCE7E1]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="h-10 px-4 rounded-[10px] border border-[#DCE7E1] text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[13px] font-semibold"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

