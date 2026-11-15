'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Send,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Store,
  Mail,
  Phone,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { useAdminStore } from '@/lib/store';

export default function ShopOwnersPage() {
  const {
    state,
    adminResendOwnerInvite,
    adminToggleOwnerStatus,
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const ownerRoleUserIds = new Set(
    state.userRoles.filter((r) => r.role === 'shop_owner').map((r) => r.user_id)
  );

  const owners = state.profiles.filter((p) => ownerRoleUserIds.has(p.id));
  const filteredOwners = owners.filter((owner) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const shop = state.shops.find((s) => s.owner_id === owner.id);
    return (
      owner.full_name.toLowerCase().includes(q) ||
      owner.email.toLowerCase().includes(q) ||
      (shop?.shop_name.toLowerCase().includes(q) ?? false) ||
      (shop?.shop_code.toLowerCase().includes(q) ?? false)
    );
  });

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId) ?? null;
  const selectedOwnerShop = selectedOwner
    ? state.shops.find((s) => s.owner_id === selectedOwner.id)
    : null;

  return (
    <AdminShell
      title="Shop Owner Management"
      subtitle="Frames A06 & A11 · Manage verified shop-owner accounts, resend onboarding invitations, and control owner access."
    >
      {feedback && (
        <div className="mb-5 p-3.5 rounded-[10px] bg-[#E7F3EC] border border-[#388E5A]/30 flex items-center justify-between text-[13px] text-[#0F4C31]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#388E5A]" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 mb-6 shadow-card flex items-center justify-between">
        <div className="relative w-full max-w-[360px]">
          <Search className="w-4 h-4 text-[#5C6F65] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owner name, email, or assigned shop..."
            className="w-full h-10 pl-10 pr-3.5 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] text-[13px] focus:outline-none focus:border-[#1B7A4E]"
          />
        </div>
        <div className="text-[13px] text-[#5C6F65]">
          Showing <span className="font-semibold text-[#16241D]">{filteredOwners.length}</span> shop
          owners
        </div>
      </div>

      {/* Owners Table (Frame A06) */}
      <div className="bg-white rounded-[14px] border border-[#DCE7E1] shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#DCE7E1] bg-[#F8FBFA] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5C6F65]">
              <th className="py-3.5 px-6">Shop Owner</th>
              <th className="py-3.5 px-4">Assigned Shop</th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4">Account Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7E1] text-[13px]">
            {filteredOwners.map((owner) => {
              const shop = state.shops.find((s) => s.owner_id === owner.id);
              return (
                <tr key={owner.id} className="hover:bg-[#F4F8F6]/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-[#16241D]">{owner.full_name}</div>
                    <div className="text-[12px] text-[#5C6F65]">{owner.email}</div>
                  </td>
                  <td className="py-4 px-4">
                    {shop ? (
                      <Link
                        href={`/shops/${shop.id}`}
                        className="font-medium text-[#0F4C31] hover:underline"
                      >
                        {shop.shop_name} ({shop.shop_code})
                      </Link>
                    ) : (
                      <span className="text-[#5C6F65]">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-[#5C6F65]">{owner.phone}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
                        owner.status === 'active'
                          ? 'bg-[#E7F3EC] text-[#388E5A]'
                          : 'bg-[#FBF3E2] text-[#D99A32]'
                      }`}
                    >
                      {owner.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOwnerId(owner.id)}
                      className="px-3 py-1.5 rounded-[8px] border border-[#DCE7E1] bg-white hover:bg-[#F4F8F6] text-[12px] font-semibold text-[#0F4C31]"
                    >
                      Manage owner (A11)
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Frame A11 — Shop Owner Detail & Actions Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] bg-white rounded-[16px] border border-[#DCE7E1] p-6 shadow-elevated">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DCE7E1]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1B7A4E]">
                  Frame A11 · Shop Owner Details
                </div>
                <h3 className="text-[18px] font-semibold text-[#16241D]">
                  {selectedOwner.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOwnerId(null)}
                className="text-[#5C6F65] hover:text-[#16241D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="p-3.5 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] space-y-2">
                <div className="flex items-center gap-2 text-[#16241D]">
                  <Mail className="w-4 h-4 text-[#1B7A4E]" />
                  <span className="font-medium">{selectedOwner.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#16241D]">
                  <Phone className="w-4 h-4 text-[#1B7A4E]" />
                  <span>{selectedOwner.phone ?? 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#16241D]">
                  <Store className="w-4 h-4 text-[#1B7A4E]" />
                  <span>
                    Assigned Shop:{' '}
                    <strong>
                      {selectedOwnerShop
                        ? `${selectedOwnerShop.shop_name} (${selectedOwnerShop.shop_code})`
                        : 'None'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#16241D]">
                  <ShieldCheck className="w-4 h-4 text-[#1B7A4E]" />
                  <span>
                    Trusted Role: <code className="font-mono text-[#0F4C31]">shop_owner</code>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedOwnerShop) {
                      adminResendOwnerInvite(selectedOwner.id, selectedOwnerShop.id);
                    }
                    setFeedback(`Invitation email resent to ${selectedOwner.email}.`);
                    setSelectedOwnerId(null);
                  }}
                  className="h-10 px-4 rounded-[10px] border border-[#DCE7E1] bg-white hover:bg-[#F4F8F6] text-[13px] font-semibold text-[#0F4C31] inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#1B7A4E]" />
                  <span>Resend invite link</span>
                </button>

                {selectedOwner.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => {
                      adminToggleOwnerStatus(selectedOwner.id, 'suspended');
                      setFeedback(`${selectedOwner.full_name}'s owner account suspended.`);
                      setSelectedOwnerId(null);
                    }}
                    className="h-10 px-4 rounded-[10px] bg-[#FCECEB] text-[#C6534B] hover:bg-[#C6534B] hover:text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Suspend owner</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      adminToggleOwnerStatus(selectedOwner.id, 'active');
                      setFeedback(`${selectedOwner.full_name}'s owner account reactivated.`);
                      setSelectedOwnerId(null);
                    }}
                    className="h-10 px-4 rounded-[10px] bg-[#1B7A4E] text-white hover:bg-[#0F4C31] text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reactivate owner</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

