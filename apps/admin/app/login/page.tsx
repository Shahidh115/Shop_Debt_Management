'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';

type AuthStep = 'login' | 'forgot' | 'reset_sent';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAsAdmin } = useAdminStore();

  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('dilani@shopledger.lk');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = loginAsAdmin(email, password);
    if (!res.ok) {
      setError(res.error ?? 'Authentication failed');
      return;
    }
    router.push('/dashboard');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your administrator email address.');
      return;
    }
    setError(null);
    setStep('reset_sent');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F4F8F6]">
      {/* Left Brand Panel — Figma A01 / A19 / A20 Deep Forest #0F4C31 */}
      <div className="lg:col-span-5 bg-[#0F4C31] text-white p-10 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#1B7A4E] flex items-center justify-center font-semibold text-white text-base">
              SL
            </div>
            <div>
              <div className="text-[18px] font-semibold tracking-tight">ShopLedger</div>
              <div className="text-[12px] text-[#68B692]">Platform Administration</div>
            </div>
          </div>

          <div className="mt-16 max-w-md space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B7A4E]/40 border border-[#68B692]/30 text-[#D1ECE0] text-[12px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#68B692]" />
              <span>Trusted Multi-Tenant SaaS Control Plane</span>
            </div>
            <h1 className="text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] text-white">
              Credit, with clarity.
            </h1>
            <p className="text-[15px] text-[#D1ECE0]/90 leading-relaxed">
              Manage registered neighbourhood shops, provision shop-owner accounts, handle
              technical support requests, and audit platform operations with strict privacy
              boundaries.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 space-y-3 text-[12px] text-[#68B692]">
          <div className="flex items-center justify-between">
            <span>Zero public admin registration</span>
            <span className="text-[#D1ECE0] font-medium">Server-side RLS enforced</span>
          </div>
          <div className="text-[11px] text-[#68B692]/80">
            Authorized personnel only. All administrative sessions and actions are recorded in the
            immutable platform audit log.
          </div>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="lg:col-span-7 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[440px] bg-white rounded-[14px] border border-[#DCE7E1] p-8 shadow-card">
          {step === 'login' && (
            <>
              <div className="mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1B7A4E] mb-1">
                  Frame A01 · Administrator Sign In
                </div>
                <h2 className="text-[22px] font-semibold text-[#16241D] tracking-tight">
                  Sign in to Platform Admin
                </h2>
                <p className="text-[13px] text-[#5C6F65] mt-1">
                  Enter your @shopledger.lk administrator credentials to continue.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-[10px] bg-[#FCECEB] border border-[#C6534B]/30 flex items-start gap-2.5 text-[13px] text-[#C6534B]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Work email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5C6F65] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dilani@shopledger.lk"
                      className="w-full h-11 pl-10 pr-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] text-[#16241D] focus:outline-none focus:border-[#1B7A4E]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[13px] font-medium text-[#16241D]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep('forgot');
                      }}
                      className="text-[12px] font-medium text-[#1B7A4E] hover:text-[#0F4C31]"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5C6F65] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-10 rounded-[10px] border border-[#DCE7E1] text-[14px] text-[#16241D] focus:outline-none focus:border-[#1B7A4E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6F65] hover:text-[#16241D]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-[13px] text-[#5C6F65] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-[#DCE7E1] text-[#1B7A4E] focus:ring-[#1B7A4E]"
                  />
                  <span>Keep me signed in for 12 hours on this workstation</span>
                </label>

                <button
                  type="submit"
                  className="w-full h-11 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[14px] font-semibold transition-colors mt-2"
                >
                  Sign in to dashboard
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#DCE7E1]">
                <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#5C6F65] mb-2">
                  Quick Demo Accounts
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('dilani@shopledger.lk');
                      setPassword('Admin@2026');
                    }}
                    className="text-left p-2.5 rounded-lg border border-[#DCE7E1] hover:border-[#1B7A4E] bg-[#F4F8F6]/60 transition-colors"
                  >
                    <div className="text-[12px] font-semibold text-[#16241D]">
                      Dilani Senanayake
                    </div>
                    <div className="text-[11px] text-[#5C6F65] truncate">
                      dilani@shopledger.lk
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('nuwan@shopledger.lk');
                      setPassword('Admin@2026');
                    }}
                    className="text-left p-2.5 rounded-lg border border-[#DCE7E1] hover:border-[#1B7A4E] bg-[#F4F8F6]/60 transition-colors"
                  >
                    <div className="text-[12px] font-semibold text-[#16241D]">Nuwan Perera</div>
                    <div className="text-[11px] text-[#5C6F65] truncate">
                      nuwan@shopledger.lk
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Frame A19 — Forgot Password */}
          {step === 'forgot' && (
            <div>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1B7A4E] hover:text-[#0F4C31] mb-5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to sign in</span>
              </button>

              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1B7A4E] mb-1">
                Frame A19 · Password Recovery
              </div>
              <h2 className="text-[22px] font-semibold text-[#16241D] tracking-tight">
                Reset administrator password
              </h2>
              <p className="text-[13px] text-[#5C6F65] mt-1 mb-6">
                Enter your registered @shopledger.lk email address. We will send a single-use
                recovery link valid for 30 minutes.
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#16241D] mb-1.5">
                    Administrator email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[10px] border border-[#DCE7E1] text-[14px] text-[#16241D] focus:outline-none focus:border-[#1B7A4E]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[14px] font-semibold transition-colors"
                >
                  Send recovery link
                </button>
              </form>
            </div>
          )}

          {/* Frame A20 — Reset Link Sent */}
          {step === 'reset_sent' && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-[#E7F3EC] text-[#388E5A] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1B7A4E] mb-1">
                Frame A20 · Recovery Email Dispatched
              </div>
              <h2 className="text-[20px] font-semibold text-[#16241D]">
                Check your administrator inbox
              </h2>
              <p className="text-[13px] text-[#5C6F65] mt-2 leading-relaxed">
                If an active administrator profile matches{' '}
                <span className="font-medium text-[#16241D]">{email}</span>, a password reset link
                has been sent. The link expires in 30 minutes.
              </p>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full h-11 rounded-[10px] bg-[#1B7A4E] hover:bg-[#0F4C31] text-white text-[14px] font-semibold transition-colors mt-6"
              >
                Return to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

