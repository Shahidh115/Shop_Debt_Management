'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Store,
  UserPlus,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { CreateShopSchema } from '@shopledger/shared';
import { AdminShell } from '@/components/AdminShell';
import { useAdminStore } from '@/lib/store';

export default function CreateNewShopPage() {
  const router = useRouter();
  const { adminCreateShop } = useAdminStore();

  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Grocery & provisions');
  const [shopEmail, setShopEmail] = useState('');
  const [shopPhone, setShopPhone] = useState('+94 ');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Colombo');

  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+94 ');
  const [sendInviteEmail, setSendInviteEmail] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [createdShopId, setCreatedShopId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = CreateShopSchema.safeParse({
      shop_name: shopName,
      category,
      email: shopEmail,
      phone: shopPhone,
      address,
      city,
      owner_full_name: ownerFullName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      send_invitation_email: sendInviteEmail,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form fields.');
      return;
    }

    try {
      const shop = adminCreateShop(parsed.data);
      setCreatedShopId(shop.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shop');
    }
  };

  return (
    <AdminShell
      title="Create New Shop"
      subtitle="Frame A04 · Provision a new shop tenant and send an activation invite to the designated shop owner."
      actions={
        <Link
          href="/shops"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] border border-[#DCE7E1] bg-white hover:bg-[#F4F8F6] text-[13px] font-medium text-[#16241D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to shops</span>
        </Link>
      }
    >
      {createdShopId ? (
        <div className="max-w-xl mx-auto bg-white rounded-[14px] border border-[#DCE7E1] p-8 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-[#E7F3EC] text-[#388E5A] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-[20px] font-semibold text-[#16241D]">
            Shop provisioned & owner invited
          </h2>
          <p className="text-[14px] text-[#5C6F65] mt-2 leading-relaxed">
            <span className="font-semibold text-[#16241D]">{shopName}</span> has been registered and
            an activation link has been dispatched to{' '}
            <span className="font-semibold text-[#16241D]">{ownerEmail}</span>. The action has been
            recorded in the platform audit log.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/shops/${createdShopId}`)}
              className="h-10 px-5 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[13px] font-semibold transition-colors"
            >
              View shop details
            </button>
            <button
              type="button"
              onClick={() => router.push('/shops')}
              className="h-10 px-5 rounded-[10px] border border-[#DCE7E1] bg-white hover:bg-[#F4F8F6] text-[13px] font-medium text-[#16241D] transition-colors"
            >
              Return to directory
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {error && (
              <div className="p-4 rounded-[12px] bg-[#FCECEB] border border-[#C6534B]/30 flex items-start gap-2.5 text-[13px] text-[#C6534B]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Shop Details */}
            <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
              <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-[#DCE7E1]">
                <Store className="w-5 h-5 text-[#1B7A4E]" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[#16241D]">
                    1. Shop business profile
                  </h2>
                  <p className="text-[12px] text-[#5C6F65]">
                    Displayed on customer statements, receipts, and mobile shop switcher cards
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Shop name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Perera Family Super"
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Business category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] bg-white text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  >
                    <option value="Grocery & provisions">Grocery & provisions</option>
                    <option value="Hardware & building">Hardware & building</option>
                    <option value="General merchant">General merchant</option>
                    <option value="Produce & dairy">Produce & dairy</option>
                    <option value="Pharmacy & medical">Pharmacy & medical</option>
                    <option value="Wholesale provisions">Wholesale provisions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Shop contact email *
                  </label>
                  <input
                    type="email"
                    required
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    placeholder="shop@example.lk"
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Shop phone number *
                  </label>
                  <input
                    type="text"
                    required
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="+94 11 234 5678"
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Street address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="No. 142, Galle Road, Dehiwala"
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Colombo"
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Shop Owner Account Provisioning */}
            <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
              <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-[#DCE7E1]">
                <UserPlus className="w-5 h-5 text-[#1B7A4E]" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[#16241D]">
                    2. Shop owner account & invitation
                  </h2>
                  <p className="text-[12px] text-[#5C6F65]">
                    Creates or links the owner’s login identity and grants shop_owner role for this
                    shop
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Owner full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerFullName}
                    onChange={(e) => setOwnerFullName(e.target.value)}
                    placeholder="e.g. Chathura Perera"
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Owner login email *
                  </label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@example.lk"
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Owner mobile number *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-[10px] bg-[#F4F8F6] border border-[#DCE7E1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendInviteEmail}
                      onChange={(e) => setSendInviteEmail(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-[#DCE7E1] text-[#1B7A4E]"
                    />
                    <div>
                      <div className="text-[13px] font-semibold text-[#16241D] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#1B7A4E]" />
                        <span>Send onboarding & password setup email immediately</span>
                      </div>
                      <div className="text-[12px] text-[#5C6F65] mt-0.5">
                        Dispatches a magic invitation link to the shop owner to activate their
                        ShopLedger Mobile App account.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-[14px] border border-[#DCE7E1] p-6 shadow-card">
              <h3 className="text-[15px] font-semibold text-[#16241D] mb-3">
                Provisioning summary
              </h3>
              <ul className="space-y-3 text-[13px] text-[#5C6F65]">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1B7A4E] shrink-0 mt-0.5" />
                  <span>
                    Creates an isolated multi-tenant shop record with automatic RLS boundaries.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1B7A4E] shrink-0 mt-0.5" />
                  <span>
                    Assigns <code className="font-mono text-[#0F4C31]">shop_owner</code> role via
                    trusted server-side provisioning.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1B7A4E] shrink-0 mt-0.5" />
                  <span>
                    Records shop creation and owner invitation in the administrative audit log.
                  </span>
                </li>
              </ul>

              <div className="mt-6 pt-5 border-t border-[#DCE7E1] space-y-2.5">
                <button
                  type="submit"
                  className="w-full h-11 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[14px] font-semibold transition-colors"
                >
                  Create shop & send invite
                </button>
                <Link
                  href="/shops"
                  className="flex items-center justify-center w-full h-10 rounded-[10px] border border-[#DCE7E1] text-[13px] font-medium text-[#5C6F65] hover:text-[#16241D]"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      )}
    </AdminShell>
  );
}

