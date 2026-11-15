'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  UserCheck,
  Users,
  LifeBuoy,
  ScrollText,
  Settings,
  Smartphone,
  Search,
  Bell,
  Plus,
  LogOut,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, currentAdmin, logoutAdmin, resetToFigmaSeed } = useAdminStore();
  const [compactSidebar, setCompactSidebar] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const openTicketCount = state.supportTickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length;

  const navItems: NavItem[] = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Shops',
      href: '/shops',
      icon: Store,
      badge: String(state.shops.length),
    },
    { label: 'Shop Owners', href: '/owners', icon: UserCheck },
    { label: 'Customer Overview', href: '/customers', icon: Users },
    {
      label: 'Support Requests',
      href: '/support',
      icon: LifeBuoy,
      badge: openTicketCount > 0 ? String(openTicketCount) : undefined,
    },
    { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    router.push(`/shops?q=${encodeURIComponent(globalSearch.trim())}`);
  };

  return (
    <div className="min-h-screen flex bg-[#F4F8F6] text-[#16241D]">
      {/* Left Navigation Sidebar (248px Desktop / 72px Tablet Rail A21 & A22) */}
      <aside
        className={`${
          compactSidebar ? 'w-[72px]' : 'w-[248px]'
        } shrink-0 bg-[#FFFFFF] border-r border-[#DCE7E1] flex flex-col justify-between transition-all duration-200 sticky top-0 h-screen z-20`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#DCE7E1] flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-[#0F4C31] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                SL
              </div>
              {!compactSidebar && (
                <div className="truncate">
                  <div className="text-[15px] font-semibold tracking-tight text-[#16241D] leading-tight">
                    ShopLedger
                  </div>
                  <div className="text-[11px] font-medium text-[#5C6F65] leading-tight">
                    Platform Admin
                  </div>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setCompactSidebar((prev) => !prev)}
              title={
                compactSidebar
                  ? 'Expand sidebar (Desktop 1440px mode)'
                  : 'Collapse to icon rail (Tablet 1024px mode — A21/A22)'
              }
              className="p-1.5 rounded-lg text-[#5C6F65] hover:text-[#16241D] hover:bg-[#F4F8F6] transition-colors"
            >
              {compactSidebar ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Primary Navigation */}
          <nav className="p-3 space-y-1">
            {!compactSidebar && (
              <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#5C6F65]">
                Administration
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={compactSidebar ? item.label : undefined}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[#D1ECE0] text-[#0F4C31] font-semibold'
                      : 'text-[#16241D] hover:bg-[#F4F8F6] text-opacity-85'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 ${
                        active ? 'text-[#0F4C31]' : 'text-[#5C6F65]'
                      }`}
                    />
                    {!compactSidebar && <span className="truncate">{item.label}</span>}
                  </div>
                  {!compactSidebar && item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                        active
                          ? 'bg-[#0F4C31] text-white'
                          : 'bg-[#E8F1EC] text-[#5C6F65]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Mobile Experience Interactive Simulator Link */}
            <div className="pt-3 mt-3 border-t border-[#DCE7E1]">
              {!compactSidebar && (
                <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#5C6F65]">
                  Connected Apps
                </div>
              )}
              <Link
                href="/mobile-preview"
                title={compactSidebar ? 'Mobile Apps (Owner & Customer)' : undefined}
                className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors ${
                  isActive('/mobile-preview')
                    ? 'bg-[#0F4C31] text-white font-semibold'
                    : 'bg-[#F4F8F6] text-[#0F4C31] hover:bg-[#D1ECE0]/60 border border-[#DCE7E1]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone className="w-[18px] h-[18px] shrink-0" />
                  {!compactSidebar && (
                    <div className="truncate">
                      <div className="leading-tight">Mobile Apps Live</div>
                      <div
                        className={`text-[11px] ${
                          isActive('/mobile-preview') ? 'text-[#D1ECE0]' : 'text-[#5C6F65]'
                        }`}
                      >
                        Owner & Customer (92 screens)
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom Admin Profile & Session Controls */}
        <div className="p-3 border-t border-[#DCE7E1] space-y-2 bg-[#F8FBFA]">
          {!compactSidebar && (
            <div className="px-2.5 py-2 rounded-[10px] bg-white border border-[#DCE7E1] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D1ECE0] text-[#0F4C31] font-semibold text-xs flex items-center justify-center shrink-0">
                DS
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[#16241D] truncate">
                  {currentAdmin.full_name}
                </div>
                <div className="text-[11px] text-[#5C6F65] truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#1B7A4E]" />
                  Platform Admin
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={resetToFigmaSeed}
              title="Reset state to initial Figma seed data"
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#5C6F65] hover:text-[#16241D] hover:bg-[#DCE7E1]/50 border border-[#DCE7E1] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {!compactSidebar && <span>Reset Seed</span>}
            </button>
            <button
              type="button"
              onClick={() => {
                logoutAdmin();
                router.push('/login');
              }}
              title="Sign out (A01 Admin Login)"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#5C6F65] hover:text-[#C6534B] hover:bg-[#FCECEB] border border-[#DCE7E1] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {!compactSidebar && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Utility Bar (64px) */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#DCE7E1] px-8 flex items-center justify-between sticky top-0 z-10">
          <form onSubmit={handleGlobalSearch} className="relative w-full max-w-[380px]">
            <Search className="w-4 h-4 text-[#5C6F65] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search shops, owners, shop codes (e.g. SH-0128)..."
              className="w-full h-10 pl-10 pr-4 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] text-[13px] text-[#16241D] placeholder-[#5C6F65] focus:outline-none focus:border-[#1B7A4E]"
            />
          </form>

          <div className="flex items-center gap-3">
            <Link
              href="/mobile-preview"
              className="hidden md:inline-flex items-center gap-2 h-9 px-3.5 rounded-[10px] border border-[#DCE7E1] bg-[#F4F8F6] text-[12px] font-medium text-[#0F4C31] hover:bg-[#D1ECE0]/50 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#1B7A4E]" />
              <span>Interactive Mobile Preview</span>
            </Link>

            <Link
              href="/support"
              className="relative w-9 h-9 rounded-[10px] border border-[#DCE7E1] bg-white flex items-center justify-center text-[#5C6F65] hover:text-[#16241D] transition-colors"
              title="Open support tickets"
            >
              <Bell className="w-4 h-4" />
              {openTicketCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D97736] text-white text-[10px] font-semibold flex items-center justify-center">
                  {openTicketCount}
                </span>
              )}
            </Link>

            <Link
              href="/shops/new"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[13px] font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create new shop</span>
            </Link>
          </div>
        </header>

        {/* Page Header + Content */}
        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
          {(title || subtitle || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                {title && (
                  <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#16241D]">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-[14px] text-[#5C6F65] mt-1">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

