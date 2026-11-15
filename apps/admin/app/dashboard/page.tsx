'use client';

import React from 'react';
import Link from 'next/link';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  Users,
  ArrowUpRight,
  LifeBuoy,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { useAdminStore } from '@/lib/store';

const REGISTRATION_GROWTH = [
  { month: 'May', count: 74 },
  { month: 'Jun', count: 81 },
  { month: 'Jul', count: 88 },
  { month: 'Aug', count: 94 },
  { month: 'Sep', count: 101 },
  { month: 'Oct', count: 106 },
  { month: 'Nov', count: 111 },
  { month: 'Dec', count: 115 },
  { month: 'Jan', count: 119 },
  { month: 'Feb', count: 122 },
  { month: 'Mar', count: 125 },
  { month: 'Apr', count: 128 },
];

export default function AdminDashboardPage() {
  const { state } = useAdminStore();

  const activeShops = state.shops.filter((s) => s.status === 'active').length;
  const suspendedShops = state.shops.filter((s) => s.status === 'suspended').length;
  const openTickets = state.supportTickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  );

  // Combine baseline platform figures (from Figma A02: 128 total shops, 121 active, 7 suspended, 3,842 linked customers)
  // with any newly created shops or status changes in the live session
  const deltaShops = state.shops.length - 6;
  const displayTotalShops = 128 + Math.max(0, deltaShops);
  const displayActiveShops = 121 + (activeShops - 5);
  const displaySuspendedShops = 7 + (suspendedShops - 1);
  const displayTotalCustomers = 3842 + Math.max(0, state.shopCustomers.length - 6);

  return (
    <AdminShell
      title="Platform Overview"
      subtitle="Real-time operational health, shop registrations, and administrative queue across ShopLedger."
    >
      {/* Top 4 KPI Cards — Figma A02 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-5 shadow-card">
          <div className="flex items-center justify-between text-[13px] font-medium text-[#5C6F65]">
            <span>Total registered shops</span>
            <Store className="w-4 h-4 text-[#1B7A4E]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[28px] font-semibold text-[#16241D] tabular-nums">
              {displayTotalShops.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#388E5A] bg-[#E7F3EC] px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +8 this month
            </span>
          </div>
          <div className="mt-2 text-[12px] text-[#5C6F65]">
            Across 9 provinces in Sri Lanka
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-5 shadow-card">
          <div className="flex items-center justify-between text-[13px] font-medium text-[#5C6F65]">
            <span>Active shops</span>
            <CheckCircle2 className="w-4 h-4 text-[#388E5A]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[28px] font-semibold text-[#16241D] tabular-nums">
              {displayActiveShops.toLocaleString()}
            </span>
            <span className="text-[12px] font-medium text-[#388E5A]">
              {((displayActiveShops / displayTotalShops) * 100).toFixed(1)}% operational
            </span>
          </div>
          <div className="mt-2 text-[12px] text-[#5C6F65]">
            Owners active in last 7 days: 118
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-5 shadow-card">
          <div className="flex items-center justify-between text-[13px] font-medium text-[#5C6F65]">
            <span>Suspended shops</span>
            <AlertTriangle className="w-4 h-4 text-[#D99A32]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[28px] font-semibold text-[#16241D] tabular-nums">
              {displaySuspendedShops}
            </span>
            <Link
              href="/shops?status=suspended"
              className="text-[12px] font-medium text-[#D97736] hover:underline"
            >
              Review suspended →
            </Link>
          </div>
          <div className="mt-2 text-[12px] text-[#5C6F65]">
            Pending compliance or verification
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-5 shadow-card">
          <div className="flex items-center justify-between text-[13px] font-medium text-[#5C6F65]">
            <span>Linked customer accounts</span>
            <Users className="w-4 h-4 text-[#1B7A4E]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[28px] font-semibold text-[#16241D] tabular-nums">
              {displayTotalCustomers.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#388E5A] bg-[#E7F3EC] px-2 py-0.5 rounded-full">
              +142 (30d)
            </span>
          </div>
          <div className="mt-2 text-[12px] text-[#5C6F65]">
            412 multi-shop customer identities
          </div>
        </div>
      </div>

      {/* Middle Row: Shop Registration Growth Chart (8 cols) + Open Support Requests (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8 bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#16241D]">
                Shop registration growth
              </h2>
              <p className="text-[13px] text-[#5C6F65]">
                Cumulative registered shops over the past 12 months (May 2025 – Apr 2026)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-[#F4F8F6] border border-[#DCE7E1] text-[12px] font-medium text-[#0F4C31]">
              Last 12 months
            </span>
          </div>

          <div className="h-52 flex items-end gap-3 pt-6 px-2 border-b border-[#DCE7E1]">
            {REGISTRATION_GROWTH.map((item, idx) => {
              const isLatest = idx === REGISTRATION_GROWTH.length - 1;
              const value = isLatest ? displayTotalShops : item.count;
              const heightPct = Math.max(25, Math.min(100, Math.round((value / 135) * 100)));
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-medium text-[#5C6F65] tabular-nums">
                    {value}
                  </span>
                  <div className="w-full flex items-end justify-center h-36">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[36px] rounded-t-[6px] transition-all ${
                        isLatest
                          ? 'bg-[#1B7A4E]'
                          : idx >= 9
                          ? 'bg-[#68B692]'
                          : 'bg-[#D1ECE0]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-3 px-2">
            {REGISTRATION_GROWTH.map((item) => (
              <div
                key={item.month}
                className="flex-1 text-center text-[11px] font-medium text-[#5C6F65]"
              >
                {item.month}
              </div>
            ))}
          </div>
        </div>

        {/* Support Queue Panel */}
        <div className="lg:col-span-4 bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-[#1B7A4E]" />
                <h2 className="text-[16px] font-semibold text-[#16241D]">
                  Open support requests
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FDF0E6] text-[#D97736] text-[12px] font-semibold">
                {openTickets.length} active
              </span>
            </div>

            <div className="space-y-3">
              {state.supportTickets.slice(0, 3).map((ticket) => {
                const shop = state.shops.find((s) => s.id === ticket.shop_id);
                return (
                  <Link
                    key={ticket.id}
                    href={`/support?ticket=${ticket.id}`}
                    className="block p-3.5 rounded-[10px] border border-[#DCE7E1] hover:border-[#1B7A4E] bg-[#F8FBFA] transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#5C6F65] mb-1">
                      <span className="font-mono text-[#0F4C31] font-semibold">
                        {ticket.ticket_code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          ticket.status === 'open'
                            ? 'bg-[#FDF0E6] text-[#D97736]'
                            : ticket.status === 'in_progress'
                            ? 'bg-[#FBF3E2] text-[#D99A32]'
                            : 'bg-[#E7F3EC] text-[#388E5A]'
                        }`}
                      >
                        {ticket.status === 'in_progress'
                          ? 'In progress'
                          : ticket.status === 'open'
                          ? 'Open'
                          : 'Resolved'}
                      </span>
                    </div>
                    <div className="text-[13px] font-semibold text-[#16241D] line-clamp-1">
                      {ticket.subject}
                    </div>
                    <div className="text-[12px] text-[#5C6F65] mt-1">
                      {shop ? `${shop.shop_name} (${shop.shop_code})` : 'Customer Mobile App'}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <Link
            href="/support"
            className="mt-4 inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-[10px] border border-[#DCE7E1] text-[13px] font-medium text-[#0F4C31] hover:bg-[#F4F8F6] transition-colors"
          >
            <span>View all support tickets</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Bottom Row: Recently Registered Shops Table (8 cols) + Recent Audit Log (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-[14px] border border-[#DCE7E1] shadow-card overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between border-b border-[#DCE7E1]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#16241D]">
                Registered shops directory
              </h2>
              <p className="text-[13px] text-[#5C6F65]">
                Recent shop accounts provisioned by platform administrators
              </p>
            </div>
            <Link
              href="/shops"
              className="text-[13px] font-semibold text-[#1B7A4E] hover:text-[#0F4C31] inline-flex items-center gap-1"
            >
              <span>Manage all shops</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE7E1] bg-[#F8FBFA] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5C6F65]">
                  <th className="py-3 px-5">Shop</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE7E1] text-[13px]">
                {state.shops.slice(0, 6).map((shop) => {
                  const owner = state.profiles.find((p) => p.id === shop.owner_id);
                  return (
                    <tr key={shop.id} className="hover:bg-[#F4F8F6]/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#16241D]">{shop.shop_name}</div>
                        <div className="text-[12px] text-[#5C6F65] font-mono">
                          {shop.shop_code} · {shop.category}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#16241D]">
                          {owner?.full_name ?? 'Assigned Owner'}
                        </div>
                        <div className="text-[12px] text-[#5C6F65]">{owner?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#5C6F65]">{shop.city}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
                            shop.status === 'active'
                              ? 'bg-[#E7F3EC] text-[#388E5A]'
                              : 'bg-[#FBF3E2] text-[#D99A32]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              shop.status === 'active' ? 'bg-[#388E5A]' : 'bg-[#D99A32]'
                            }`}
                          />
                          {shop.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/shops/${shop.id}`}
                          className="text-[13px] font-semibold text-[#1B7A4E] hover:text-[#0F4C31]"
                        >
                          View details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Administrative Activity & Privacy Notice */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-[#16241D]">Recent audit trail</h2>
              <Link
                href="/audit-logs"
                className="text-[12px] font-semibold text-[#1B7A4E] hover:underline"
              >
                Full log →
              </Link>
            </div>
            <div className="space-y-3.5">
              {state.auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="pb-3 border-b border-[#DCE7E1] last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#16241D]">{log.action}</span>
                    <span className="text-[11px] text-[#5C6F65]">
                      {new Date(log.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#5C6F65] mt-0.5">{log.target_label}</div>
                  <div className="text-[11px] text-[#5C6F65] mt-0.5">
                    By {log.actor_name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] bg-[#EBF7F1] border border-[#D1ECE0] p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#0F4C31] shrink-0 mt-0.5" />
              <div>
                <div className="text-[13px] font-semibold text-[#0F4C31]">
                  Tenant Financial Privacy Enforced
                </div>
                <p className="text-[12px] text-[#16241D]/80 mt-1 leading-relaxed">
                  Platform administrators manage shop provisioning, account status, and technical
                  support. Individual customer balances, credit purchases, and ledger statements are
                  strictly isolated to the respective shop owner and customer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

