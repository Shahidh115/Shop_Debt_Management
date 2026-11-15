'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Building2,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'roles'>('general');
  const [platformName, setPlatformName] = useState('ShopLedger SaaS (Sri Lanka)');
  const [supportEmail, setSupportEmail] = useState('support@shopledger.lk');
  const [inviteExpiryDays, setInviteExpiryDays] = useState('7');
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('12');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <AdminShell
      title="System Settings"
      subtitle="Frame A10 · Configure platform identity, invitation delivery policies, session security, and RBAC rules."
    >
      {savedNotice && (
        <div className="mb-5 p-3.5 rounded-[10px] bg-[#E7F3EC] border border-[#388E5A]/30 flex items-center gap-2 text-[13px] text-[#0F4C31]">
          <CheckCircle2 className="w-4 h-4 text-[#388E5A]" />
          <span>System configuration saved and logged in audit trail.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Sub-Navigation */}
        <div className="lg:col-span-3 space-y-1">
          {[
            { id: 'general', label: 'Platform Profile', icon: Building2 },
            { id: 'email', label: 'Email & Invitations', icon: Mail },
            { id: 'security', label: 'Security & Sessions', icon: Lock },
            { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-[#D1ECE0] text-[#0F4C31] font-semibold'
                    : 'bg-white text-[#16241D] hover:bg-[#F4F8F6] border border-[#DCE7E1]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#1B7A4E]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content Card */}
        <div className="lg:col-span-9 bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
          <form onSubmit={handleSave} className="space-y-5">
            {activeTab === 'general' && (
              <>
                <h2 className="text-[17px] font-semibold text-[#16241D] pb-3 border-b border-[#DCE7E1]">
                  Platform Profile & Regional Defaults
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                      Platform display name
                    </label>
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                      Technical support email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                      Default currency format
                    </label>
                    <input
                      type="text"
                      disabled
                      value="LKR (Rs. · NUMERIC(14,2) exact decimal)"
                      className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] bg-[#F4F8F6] text-[14px] text-[#5C6F65]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                      Default timezone
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Asia/Colombo (UTC+05:30)"
                      className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] bg-[#F4F8F6] text-[14px] text-[#5C6F65]"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'email' && (
              <>
                <h2 className="text-[17px] font-semibold text-[#16241D] pb-3 border-b border-[#DCE7E1]">
                  Email & Invitation Delivery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                      Invitation link expiration (days)
                    </label>
                    <input
                      type="number"
                      value={inviteExpiryDays}
                      onChange={(e) => setInviteExpiryDays(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                      Sender identity
                    </label>
                    <input
                      type="text"
                      disabled
                      value="ShopLedger Notifications <no-reply@shopledger.lk>"
                      className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] bg-[#F4F8F6] text-[14px] text-[#5C6F65]"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <h2 className="text-[17px] font-semibold text-[#16241D] pb-3 border-b border-[#DCE7E1]">
                  Security & Session Controls
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                      Admin session timeout (hours)
                    </label>
                    <input
                      type="number"
                      value={sessionTimeoutHours}
                      onChange={(e) => setSessionTimeoutHours(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                      Public admin sign-up
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Disabled (Server-side provisioning only)"
                      className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] bg-[#F4F8F6] text-[14px] text-[#388E5A] font-medium"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'roles' && (
              <>
                <h2 className="text-[17px] font-semibold text-[#16241D] pb-3 border-b border-[#DCE7E1]">
                  Role-Based Access Control Matrix
                </h2>
                <div className="space-y-3 text-[13px]">
                  <div className="p-4 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1]">
                    <div className="font-semibold text-[#0F4C31]">
                      1. Platform Administrator (platform_admin)
                    </div>
                    <p className="text-[#5C6F65] mt-1">
                      Provisions shops and shop owners, suspends/reactivates shops, manages support
                      requests, and audits platform operations. Cannot access private customer
                      ledgers.
                    </p>
                  </div>
                  <div className="p-4 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1]">
                    <div className="font-semibold text-[#0F4C31]">2. Shop Owner (shop_owner)</div>
                    <p className="text-[#5C6F65] mt-1">
                      Manages own shop customers, invites customers via email, records credit
                      purchases and payments, resolves complaints, and issues immutable adjustments.
                    </p>
                  </div>
                  <div className="p-4 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1]">
                    <div className="font-semibold text-[#0F4C31]">3. Customer (customer)</div>
                    <p className="text-[#5C6F65] mt-1">
                      Uses a single login across multiple independent shops. Views shop-scoped
                      balances, purchase/payment histories, statements, and raises/tracks
                      transaction complaints.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-[#DCE7E1] flex justify-end">
              <button
                type="submit"
                className="h-10 px-5 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[13px] font-semibold transition-colors"
              >
                Save configuration
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}

