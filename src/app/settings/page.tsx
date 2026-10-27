'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useConstructionStore } from '@/lib/store';
import {
  Sun,
  Moon,
  Shield,
  RefreshCw,
  Database,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const theme = useConstructionStore((s) => s.theme);
  const setTheme = useConstructionStore((s) => s.setTheme);
  const isTwoFactorSimulated = useConstructionStore((s) => s.isTwoFactorSimulated);
  const toggleTwoFactor = useConstructionStore((s) => s.toggleTwoFactor);
  const resetDemoData = useConstructionStore((s) => s.resetDemoData);

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu mẫu (dự án, task, nhật ký)?')) {
      resetDemoData();
      toast.success('Đã đặt lại dữ liệu demo ban đầu thành công!');
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Tùy biến & Cấu hình
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Cài đặt Hệ thống & Giao diện
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tùy biến hiển thị, cơ chế bảo mật và quản lý bộ nhớ đệm demo
          </p>
        </div>

        {/* 1. Theme Configuration */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sun className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Chế độ hiển thị Giao diện
              </h3>
              <p className="text-xs text-slate-400">
                Hệ thống tự động lưu lựa chọn của bạn vào bộ nhớ trình duyệt
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setTheme('light');
                toast.success('Đã chuyển sang chế độ Sáng ấm');
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                theme === 'light'
                  ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-amber-500 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Giao diện Sáng (Ấm)
                  </div>
                  <div className="text-[11px] text-slate-400">Tông ấm chuẩn công trường</div>
                </div>
              </div>
              {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
            </button>

            <button
              onClick={() => {
                setTheme('dark');
                toast.success('Đã chuyển sang chế độ Tối sang trọng');
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                theme === 'dark'
                  ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-indigo-400 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Giao diện Tối
                  </div>
                  <div className="text-[11px] text-slate-400">Xanh đen sâu, êm mắt</div>
                </div>
              </div>
              {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
            </button>
          </div>
        </div>

        {/* 2. Security & 2FA Simulation */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Xác thực Hai yếu tố (2FA Simulation)
              </h3>
              <p className="text-xs text-slate-400">
                Mô phỏng lớp bảo mật OTP 6 số khi đăng nhập vào hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Kích hoạt bước nhập mã OTP 6 chữ số
                </div>
                <div className="text-[11px] text-slate-400">
                  Khi bật, đăng nhập vào tài khoản có bảo mật sẽ yêu cầu mã OTP
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                toggleTwoFactor(!isTwoFactorSimulated);
                toast.info(
                  !isTwoFactorSimulated
                    ? 'Đã bật mô phỏng 2FA'
                    : 'Đã tắt mô phỏng 2FA (vào thẳng)'
                );
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isTwoFactorSimulated ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isTwoFactorSimulated ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 3. Demo Data Reset */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Quản lý Dữ liệu Demo (LocalStorage)
              </h3>
              <p className="text-xs text-slate-400">
                Toàn bộ dữ liệu dự án, tiến độ, hình ảnh, chat được lưu trong bộ nhớ máy tính này
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-xs text-rose-600 dark:text-rose-400">
                Đặt lại toàn bộ dữ liệu demo về trạng thái ban đầu
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Xóa tất cả thay đổi thử nghiệm và nạp lại 4 dự án, các đầu việc mẫu và minh chứng
                gốc của Thầy Trần Quốc Vương, Thầy Nguyễn Văn Tuấn Kiệt và Ban Lãnh đạo.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Đặt lại dữ liệu demo
            </button>
          </div>
        </div>

        {/* 4. Architecture Note */}
        <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <strong className="block font-bold text-slate-700 dark:text-slate-300">
            Kiến trúc sẵn sàng mở rộng (Backend-Ready):
          </strong>
          <p>
            Hệ thống tuân thủ mô hình phân tách dữ liệu qua Store/Service. Khi kết nối cơ sở dữ
            liệu thật (Supabase / PostgreSQL), chỉ cần thay đổi phần implementation trong Store mà
            không cần viết lại giao diện người dùng.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

