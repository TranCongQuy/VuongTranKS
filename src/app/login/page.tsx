'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConstructionStore } from '@/lib/store';
import {
  HardHat,
  ShieldCheck,
  Eye,
  KeyRound,
  ArrowRight,
  Lock,
  Building2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const users = useConstructionStore((s) => s.users);
  const setCurrentUser = useConstructionStore((s) => s.setCurrentUser);
  const isTwoFactorSimulated = useConstructionStore((s) => s.isTwoFactorSimulated);

  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [selectedUser, setSelectedUser] = useState<(typeof users)[0] | null>(null);
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectRole = (user: (typeof users)[0]) => {
    setErrorMessage(null);
    if (!user.isActive) {
      setErrorMessage(`Tài khoản "${user.name}" đang bị KHÓA bởi Quản trị viên. Không thể đăng nhập.`);
      toast.error('Tài khoản đã bị vô hiệu hóa', {
        description: 'Vui lòng liên hệ Thầy Trần Quốc Vương để kích hoạt lại tài khoản.',
      });
      return;
    }

    setSelectedUser(user);
    if (isTwoFactorSimulated && user.twoFactorEnabled) {
      setStep('2fa');
      toast.info('Yêu cầu xác thực 2 yếu tố (2FA)', {
        description: 'Mã xác thực 6 số đã được gửi tới thiết bị an toàn.',
      });
    } else {
      finalizeLogin(user);
    }
  };

  const finalizeLogin = (user: (typeof users)[0]) => {
    setCurrentUser(user);
    toast.success(`Đăng nhập thành công với vai trò: ${user.name}`);
    router.push('/');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    // Auto move to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã xác thực.');
      return;
    }
    finalizeLogin(selectedUser);
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="loginGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38BDF8" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginGrid)" />
        </svg>
      </div>

      {/* Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/20 mb-3">
            <HardHat className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            PXU CONSTRUCT <span className="text-amber-400">PRO</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hệ thống Giao việc & Theo dõi Công trình Xây dựng
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Chọn tài khoản Demo để vào ngay
                </span>
              </div>

              <div className="space-y-2.5">
                {users.map((u) => {
                  let roleIcon = <ShieldCheck className="w-4 h-4 text-amber-400" />;
                  let roleBadge = 'Admin (Toàn quyền)';
                  if (u.role === 'assignee') {
                    roleIcon = <HardHat className="w-4 h-4 text-blue-400" />;
                    roleBadge = 'Kỹ sư (Thực hiện)';
                  } else if (u.role === 'leader') {
                    roleIcon = <Eye className="w-4 h-4 text-emerald-400" />;
                    roleBadge = 'Lãnh đạo (Chỉ xem)';
                  }

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectRole(u)}
                      disabled={!u.isActive}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                        u.isActive
                          ? 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/5'
                          : 'bg-slate-950/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-700 text-amber-400 font-bold flex items-center justify-center text-sm group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                          {u.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                              {u.name}
                            </span>
                            {!u.isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium">
                                Đã khóa
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {roleIcon}
                            <span>{roleBadge}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
                <p className="text-xs text-slate-400">
                  Dữ liệu được lưu trong trình duyệt (LocalStorage).
                </p>
              </div>
            </div>
          ) : (
            /* 2FA Step */
            <form onSubmit={handleVerify2FA}>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-2.5">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Xác thực hai yếu tố (2FA)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đang đăng nhập với tài khoản{' '}
                  <span className="text-amber-300 font-semibold">{selectedUser?.name}</span>. Vui
                  lòng nhập 6 số mã OTP.
                </p>
              </div>

              {/* 6 OTP boxes */}
              <div className="flex justify-center gap-2 sm:gap-2.5 mb-6">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold bg-slate-800 border border-slate-700 rounded-xl text-amber-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Xác nhận & Vào hệ thống
              </button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Quay lại chọn tài khoản khác
              </button>
            </form>
          )}
        </div>

        {/* Security watermark */}
        <div className="text-center mt-6 text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-amber-500/60" />
          <span>Hệ thống giám sát xây dựng thực tế • Tiêu chuẩn an toàn TCVN</span>
        </div>
      </div>
    </div>
  );
}

