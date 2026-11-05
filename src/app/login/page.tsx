'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConstructionStore } from '@/lib/store';
import {
  HardHat,
  ShieldCheck,
  Eye,
  KeyRound,
  ChevronRight,
  Lock,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/cards';

export default function LoginPage() {
  const router = useRouter();
  const users = useConstructionStore((s) => s.users);
  const loginAs = useConstructionStore((s) => s.loginAs);
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
    loginAs(user);
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
    <div className="min-h-screen bg-cream dark:bg-night flex flex-col lg:grid lg:grid-cols-[1.05fr_1fr] select-none">
      {/* Cột trái — panel thương hiệu (mobile: header gọn phía trên) */}
      <aside className="relative overflow-hidden bg-navy-900 text-white px-6 py-6 sm:px-8 lg:px-12 lg:py-10 flex flex-col">
        <div className="safety-stripe-accent absolute inset-x-0 top-0 h-1.5" />
        <div className="flex items-center gap-3 lg:mb-10">
          <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-2xl bg-gold-500 text-navy-950 flex items-center justify-center shrink-0">
            <HardHat className="w-6 h-6 lg:w-8 lg:h-8 stroke-[2.2]" />
          </div>
          <div className="lg:hidden">
            <div className="font-extrabold leading-tight">
              Quản lý Dự án <span className="text-gold-400">PXU</span>
            </div>
            <div className="text-[11px] text-navy-100/80">Đại học Phú Xuân</div>
          </div>
        </div>

        <div className="hidden lg:block max-w-md">
          <div className="eyebrow mb-3">Đại học Phú Xuân</div>
          <h1 className="text-4xl xl:text-[44px] font-extrabold leading-[1.08] tracking-tight">
            Quản lý Dự án <span className="text-gold-400">PXU</span>
          </h1>
          <p className="text-sm text-navy-100/85 mt-3 leading-relaxed">
            Giao việc, Giám sát &amp; Báo cáo Công trình — một nơi duy nhất để theo dõi tiến độ,
            kinh phí và minh chứng hiện trường.
          </p>

          <ul className="mt-8 space-y-4 text-[13.5px]">
            <li className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-white/10 text-gold-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </span>
              <span className="leading-relaxed">
                <strong className="block text-white">Admin — Chủ trì kế hoạch</strong>
                <span className="text-navy-100/75">Tạo dự án, giao việc và nghiệm thu kết quả.</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-white/10 text-gold-400 flex items-center justify-center shrink-0">
                <HardHat className="w-4.5 h-4.5" />
              </span>
              <span className="leading-relaxed">
                <strong className="block text-white">Kỹ sư — Thực hiện hiện trường</strong>
                <span className="text-navy-100/75">Báo cáo tiến độ, nộp minh chứng và báo trở ngại.</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-white/10 text-gold-400 flex items-center justify-center shrink-0">
                <Eye className="w-4.5 h-4.5" />
              </span>
              <span className="leading-relaxed">
                <strong className="block text-white">Lãnh đạo — Giám sát cấp cao</strong>
                <span className="text-navy-100/75">Xem chỉ số các dự án được cấp quyền và gửi chỉ đạo.</span>
              </span>
            </li>
          </ul>
        </div>

        <div className="hidden lg:flex items-center gap-2 mt-auto pt-10 text-[11px] text-navy-100/70">
          <Building2 className="w-3.5 h-3.5 text-gold-400/70" />
          <span>Đại học Phú Xuân • Hệ thống giám sát xây dựng thực tế • Tiêu chuẩn an toàn TCVN</span>
        </div>
      </aside>

      {/* Cột phải — chọn tài khoản / OTP */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="card p-6 sm:p-7">
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {step === 'credentials' ? (
              <div>
                <div className="eyebrow mb-1.5">Đăng nhập demo</div>
                <h2 className="text-lg font-extrabold text-ink dark:text-white">Chọn tài khoản để vào ngay</h2>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-1 mb-5">
                  Bấm vào một hàng tài khoản để đăng nhập với vai trò tương ứng.
                </p>

                <div className="divide-y divide-line dark:divide-night-line border border-line dark:border-night-line rounded-2xl overflow-hidden">
                  {users.map((u) => {
                    let roleIcon = <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />;
                    let roleBadge = 'Admin (Toàn quyền)';
                    if (u.role === 'assignee') {
                      roleIcon = <HardHat className="w-3.5 h-3.5 text-pine-600" />;
                      roleBadge = 'Kỹ sư (Thực hiện)';
                    } else if (u.role === 'leader') {
                      roleIcon = <Eye className="w-3.5 h-3.5 text-navy-700 dark:text-navy-100" />;
                      roleBadge = 'Lãnh đạo (Chỉ xem)';
                    }

                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelectRole(u)}
                        disabled={!u.isActive}
                        className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors ${
                          u.isActive
                            ? 'bg-white dark:bg-night-card hover:bg-cream dark:hover:bg-night-line/50 cursor-pointer'
                            : 'bg-cream/60 dark:bg-night-card/60 opacity-45 cursor-not-allowed'
                        }`}
                      >
                        <Avatar text={u.avatar} tone={u.role === 'admin' ? 'gold' : u.role === 'assignee' ? 'pine' : 'navy'} />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-ink dark:text-white truncate">{u.name}</span>
                            {!u.isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold shrink-0">
                                Đã khóa
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-ink-soft dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {roleIcon}
                            <span>{roleBadge}</span>
                          </span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-ink-soft/60 shrink-0" />
                      </button>
                    );
                  })}
                </div>

                <p className="mt-5 text-center text-xs text-ink-soft dark:text-slate-400">
                  Dữ liệu được lưu trong trình duyệt (LocalStorage).
                </p>
              </div>
            ) : (
              /* 2FA Step */
              <form onSubmit={handleVerify2FA}>
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gold-100 dark:bg-gold-500/15 text-gold-600 flex items-center justify-center mx-auto mb-2.5">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-ink dark:text-white">Xác thực hai yếu tố (2FA)</h3>
                  <p className="text-xs text-ink-soft dark:text-slate-400 mt-1">
                    Đang đăng nhập với tài khoản{' '}
                    <span className="text-gold-600 font-semibold">{selectedUser?.name}</span>. Vui
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
                      className="input w-11 h-13 sm:w-12 sm:h-14 !p-0 text-center text-xl font-mono font-bold text-gold-600"
                    />
                  ))}
                </div>

                <button type="submit" className="btn-primary w-full">
                  <Lock className="w-4 h-4" />
                  Xác nhận &amp; Vào hệ thống
                </button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="btn-quiet"
                  >
                    ← Quay lại chọn tài khoản khác
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
