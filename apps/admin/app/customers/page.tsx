'use client';

import React from 'react';
import {
  Users,
  ShieldAlert,
  Share2,
  UserCheck,
  Clock,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { useAdminStore } from '@/lib/store';

const CUSTOMER_GROWTH_SERIES = [
  { month: 'May', total: 2610 },
  { month: 'Jun', total: 2740 },
  { month: 'Jul', total: 2890 },
  { month: 'Aug', total: 3020 },
  { month: 'Sep', total: 3180 },
  { month: 'Oct', total: 3310 },
  { month: 'Nov', total: 3420 },
  { month: 'Dec', total: 3510 },
  { month: 'Jan', total: 3605 },
  { month: 'Feb', total: 3690 },
  { month: 'Mar', total: 3765 },
  { month: 'Apr', total: 3842 },
];

export default function CustomerOverviewPage() {
  const { state } = useAdminStore();

  const extraLinks = Math.max(0, state.shopCustomers.length - 6);
  const totalCustomers = 3842 + extraLinks;
  const activeCustomers30d = 3518 + extraLinks;
  const multiShopCustomers = 412;
  const pendingInvitations =
    194 + state.shopCustomers.filter((sc) => sc.status === 'pending_invitation').length - 1;

  return (
    <AdminShell
      title="Customer Overview (Platform Aggregate)"
      subtitle="Frame A07 · High-level customer adoption and multi-shop identity metrics across the platform."
    >
      {/* Mandatory Privacy Restriction Notice — Figma A07 */}
      <div className="mb-6 p-5 rounded-[14px] bg-[#EBF7F1] border border-[#D1ECE0] flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-[10px] bg-[#0F4C31] text-white flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#0F4C31]">
            Private Customer Financial Data is Restricted from Platform Admin
          </h2>
          <p className="text-[13px] text-[#16241D]/85 mt-1 leading-relaxed">
            In compliance with ShopLedger’s multi-tenant data governance and PostgreSQL Row Level
            Security policies, platform administrators only have access to anonymized, platform-wide
            adoption counts. Individual customer names, balances, credit purchases, payments, and
            statements are never exposed on this screen.
          </p>
        </div>
      </div>

      {/* 4 Aggregate Metric Cards — Figma A07 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-5 shadow-card">
          <div className="flex items-center justify-between text-[13px] font-medium text-[#5C6F65]">
            <span>Total customer accounts</span>
            <Users className="w-4 h-4 text-[#1B7A4E]" />
          </div>
          <div className="mt-2 text-[28px] font-semibold text-[#16241D] tabular-nums">
            {totalCustomers.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-[#388E5A] font-medium">
            +142 new accounts in last 30 days
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-5 shadow-card">
          <div className="flex items-center justify-between text-[13px] font-medium text-[#5C6F65]">
            <span>Active customers (30d)</span>
            <UserCheck className="w-4 h-4 text-[#388E5A]" />
          </div>
          <div className="mt-2 text-[28px] font-semibold text-[#16241D] tabular-nums">
            {activeCustomers30d.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-[#5C6F65]">
            91.5% monthly active retention
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-5 shadow-card">
          <div className="flex items-center justify-between text-[13px] font-medium text-[#5C6F65]">
            <span>Linked to multiple shops</span>
            <Share2 className="w-4 h-4 text-[#1B7A4E]" />
          </div>
          <div className="mt-2 text-[28px] font-semibold text-[#16241D] tabular-nums">
            {multiShopCustomers.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-[#5C6F65]">
            Single login identity across 2+ shops
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-5 shadow-card">
          <div className="flex items-center justify-between text-[13px] font-medium text-[#5C6F65]">
            <span>Pending shop invitations</span>
            <Clock className="w-4 h-4 text-[#D99A32]" />
          </div>
          <div className="mt-2 text-[28px] font-semibold text-[#16241D] tabular-nums">
            {pendingInvitations.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-[#5C6F65]">
            Awaiting first-time password activation
          </div>
        </div>
      </div>

      {/* Platform Customer Growth Chart */}
      <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[16px] font-semibold text-[#16241D]">
              Platform-wide customer account growth
            </h3>
            <p className="text-[13px] text-[#5C6F65]">
              Cumulative verified customer identities across all active shops (12-month trend)
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F4F8F6] border border-[#DCE7E1] text-[12px] font-medium text-[#0F4C31]">
            Aggregate Telemetry Only
          </span>
        </div>

        <div className="h-56 flex items-end gap-3 pt-6 px-2 border-b border-[#DCE7E1]">
          {CUSTOMER_GROWTH_SERIES.map((point, index) => {
            const isLast = index === CUSTOMER_GROWTH_SERIES.length - 1;
            const val = isLast ? totalCustomers : point.total;
            const pct = Math.max(30, Math.round((val / 4000) * 100));
            return (
              <div key={point.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-medium text-[#5C6F65] tabular-nums">
                  {(val / 1000).toFixed(2)}k
                </span>
                <div className="w-full flex items-end justify-center h-40">
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-full max-w-[38px] rounded-t-[6px] ${
                      isLast ? 'bg-[#1B7A4E]' : 'bg-[#68B692]/70'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between pt-3 px-2">
          {CUSTOMER_GROWTH_SERIES.map((point) => (
            <div
              key={point.month}
              className="flex-1 text-center text-[11px] font-medium text-[#5C6F65]"
            >
              {point.month}
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

