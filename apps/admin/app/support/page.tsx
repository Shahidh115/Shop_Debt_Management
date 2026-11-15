'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LifeBuoy,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { useAdminStore } from '@/lib/store';

function SupportManagementContent() {
  const searchParams = useSearchParams();
  const initialTicketId = searchParams.get('ticket');

  const { state, supportMessages, adminReplySupportTicket } = useAdminStore();

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>(
    'all'
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    initialTicketId ?? state.supportTickets[0]?.id ?? ''
  );
  const [replyText, setReplyText] = useState('');

  const filteredTickets = state.supportTickets.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const activeTicket =
    state.supportTickets.find((t) => t.id === selectedTicketId) ??
    filteredTickets[0] ??
    state.supportTickets[0];

  const activeShop = activeTicket?.shop_id
    ? state.shops.find((s) => s.id === activeTicket.shop_id)
    : null;
  const activeRequester = activeTicket
    ? state.profiles.find((p) => p.id === activeTicket.user_id)
    : null;

  const thread = activeTicket ? supportMessages[activeTicket.id] ?? [] : [];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    adminReplySupportTicket(activeTicket.id, replyText, 'in_progress');
    setReplyText('');
  };

  return (
    <AdminShell
      title="Technical Support Management"
      subtitle="Frames A08 & A12 · Triage and resolve technical support requests from shop owners and customers."
    >
      {/* Filter Tabs */}
      <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-3.5 mb-6 shadow-card flex items-center justify-between">
        <div className="inline-flex items-center p-1 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1]">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-white text-[#16241D] font-semibold shadow-sm'
                  : 'text-[#5C6F65] hover:text-[#16241D]'
              }`}
            >
              {st === 'all'
                ? `All (${state.supportTickets.length})`
                : st === 'open'
                ? 'Open'
                : st === 'in_progress'
                ? 'In progress'
                : 'Resolved'}
            </button>
          ))}
        </div>

        <div className="text-[12px] text-[#5C6F65]">
          Click any ticket to inspect conversation & respond (Frame A12)
        </div>
      </div>

      {/* Master-Detail Split View (A08 List + A12 Conversation Thread) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (A08) */}
        <div className="lg:col-span-5 bg-white rounded-[14px] border border-[#DCE7E1] shadow-card overflow-hidden">
          <div className="p-4 border-b border-[#DCE7E1] bg-[#F8FBFA] text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5C6F65]">
            Support Queue ({filteredTickets.length})
          </div>
          <div className="divide-y divide-[#DCE7E1]">
            {filteredTickets.map((ticket) => {
              const shop = state.shops.find((s) => s.id === ticket.shop_id);
              const isSelected = activeTicket?.id === ticket.id;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    isSelected ? 'bg-[#EBF7F1]' : 'hover:bg-[#F4F8F6]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[12px] font-semibold text-[#0F4C31]">
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
                  <div className="text-[14px] font-semibold text-[#16241D] line-clamp-1">
                    {ticket.subject}
                  </div>
                  <div className="text-[12px] text-[#5C6F65] mt-1 flex items-center justify-between">
                    <span>
                      {shop ? `${shop.shop_name} (${shop.shop_code})` : 'Customer Mobile App'}
                    </span>
                    <span>{ticket.category}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Panel — Frame A12 */}
        <div className="lg:col-span-7 bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card flex flex-col justify-between">
          {activeTicket ? (
            <>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 mb-5 border-b border-[#DCE7E1]">
                  <div>
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1B7A4E]">
                      <span className="font-mono">{activeTicket.ticket_code}</span>
                      <span>·</span>
                      <span>{activeTicket.category}</span>
                      <span>·</span>
                      <span className="uppercase">{activeTicket.priority} priority</span>
                    </div>
                    <h2 className="text-[18px] font-semibold text-[#16241D] mt-1">
                      {activeTicket.subject}
                    </h2>
                    <div className="text-[12px] text-[#5C6F65] mt-1">
                      Submitted by{' '}
                      <strong className="text-[#16241D]">
                        {activeRequester?.full_name ?? 'User'}
                      </strong>{' '}
                      ({activeRequester?.email})
                      {activeShop ? ` · ${activeShop.shop_name} (${activeShop.shop_code})` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTicket.status !== 'resolved' ? (
                      <button
                        type="button"
                        onClick={() =>
                          adminReplySupportTicket(activeTicket.id, '', 'resolved')
                        }
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] bg-[#E7F3EC] hover:bg-[#388E5A] text-[#388E5A] hover:text-white text-[12px] font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark resolved</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => adminReplySupportTicket(activeTicket.id, '', 'open')}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] border border-[#DCE7E1] text-[12px] font-medium text-[#16241D]"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Reopen ticket</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Initial Ticket Description + Thread */}
                <div className="space-y-4 mb-6 max-h-[380px] overflow-y-auto pr-1">
                  {thread.length === 0 && (
                    <div className="p-4 rounded-[12px] bg-[#F4F8F6] border border-[#DCE7E1]">
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#16241D] mb-1">
                        <span>{activeRequester?.full_name ?? 'Requester'}</span>
                        <span className="text-[#5C6F65] font-normal">
                          {new Date(activeTicket.created_at).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#16241D] leading-relaxed">
                        {activeTicket.description}
                      </p>
                    </div>
                  )}

                  {thread.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-[12px] border ${
                        msg.sender_role === 'platform_admin'
                          ? 'bg-[#EBF7F1] border-[#D1ECE0] ml-6'
                          : 'bg-[#F4F8F6] border-[#DCE7E1] mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0F4C31] mb-1.5">
                        <span>{msg.sender_name}</span>
                        <span className="text-[11px] text-[#5C6F65] font-normal">
                          {msg.created_at}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#16241D] leading-relaxed">{msg.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-[#DCE7E1]">
                <label className="block text-[12px] font-semibold text-[#16241D] mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#1B7A4E]" />
                  <span>Reply as Platform Administrator</span>
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a clear technical resolution or update for the shop owner..."
                  className="w-full p-3 rounded-[10px] border border-[#DCE7E1] bg-[#F8FBFA] text-[13px] focus:outline-none focus:border-[#1B7A4E]"
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-[#5C6F65]">
                    Replies are emailed to the requester and logged in the audit trail.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (replyText.trim()) {
                          adminReplySupportTicket(activeTicket.id, replyText, 'resolved');
                          setReplyText('');
                        }
                      }}
                      className="h-9 px-3.5 rounded-[8px] border border-[#DCE7E1] bg-white hover:bg-[#F4F8F6] text-[12px] font-semibold text-[#0F4C31]"
                    >
                      Send & resolve
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[12px] font-semibold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send reply</span>
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="py-12 text-center text-[#5C6F65]">
              <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <div>Select a support ticket from the queue</div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#5C6F65]">Loading support queue...</div>}>
      <SupportManagementContent />
    </Suspense>
  );
}

