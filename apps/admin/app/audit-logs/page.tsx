'use client';

import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { useAdminStore } from '@/lib/store';

export default function AuditLogsPage() {
  const { state } = useAdminStore();

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = state.auditLogs.filter((log) => {
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        (log.actor_name?.toLowerCase().includes(q) ?? false) ||
        (log.target_label?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <AdminShell
      title="Administrative Audit Logs"
      subtitle="Frame A09 · Immutable chronological record of all administrative and security-sensitive actions."
    >
      {/* Toolbar */}
      <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-4 mb-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-[380px]">
          <Search className="w-4 h-4 text-[#5C6F65] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, target shop, or administrator..."
            className="w-full h-10 pl-10 pr-3.5 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] text-[13px] focus:outline-none focus:border-[#1B7A4E]"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[#5C6F65]" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-10 px-3 rounded-[10px] border border-[#DCE7E1] bg-white text-[13px]"
          >
            <option value="all">All entity types</option>
            <option value="shop">Shop provisioning & status</option>
            <option value="user_role">Owner invitations & roles</option>
            <option value="support_ticket">Support ticket actions</option>
            <option value="purchase">Ledger purchases</option>
            <option value="payment">Ledger payments</option>
            <option value="ledger_entry">Adjustments & reversals</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[14px] border border-[#DCE7E1] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE7E1] bg-[#F8FBFA] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5C6F65]">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">IP / Source</th>
                <th className="py-3.5 px-6">State Change Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7E1] text-[13px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F4F8F6]/60 transition-colors">
                  <td className="py-4 px-6 font-mono text-[12px] text-[#5C6F65] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-[#16241D]">
                      {log.actor_name ?? 'System'}
                    </div>
                    <div className="text-[12px] text-[#5C6F65]">{log.actor_email}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EBF7F1] text-[#0F4C31] font-medium text-[12px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1B7A4E]" />
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-[#16241D]">
                    {log.target_label ?? log.entity_id}
                  </td>
                  <td className="py-4 px-4 font-mono text-[12px] text-[#5C6F65]">
                    {log.ip_address ?? '112.134.89.14'}
                  </td>
                  <td className="py-4 px-6 font-mono text-[11px] text-[#5C6F65] max-w-[280px] truncate">
                    {log.new_values ? JSON.stringify(log.new_values) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

