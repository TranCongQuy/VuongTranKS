'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/cards';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Switch } from '@/components/ui/Switch';
import { useConstructionStore } from '@/lib/store';
import {
  Sun,
  Moon,
  Shield,
  RefreshCw,
  Database,
  Smartphone,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const theme = useConstructionStore((s) => s.theme);
  const setTheme = useConstructionStore((s) => s.setTheme);
  const isTwoFactorSimulated = useConstructionStore((s) => s.isTwoFactorSimulated);
  const toggleTwoFactor = useConstructionStore((s) => s.toggleTwoFactor);
  const resetDemoData = useConstructionStore((s) => s.resetDemoData);
  const projects = useConstructionStore((s) => s.projects);

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu mẫu (dự án, task, nhật ký)?')) {
      resetDemoData();
      toast.success('Đã đặt lại dữ liệu demo ban đầu thành công!');
    }
  };

  const handleThemeChange = (v: string) => {
    if (v === 'light') {
      setTheme('light');
      toast.success('Đã chuyển sang chế độ Sáng ấm');
    } else {
      setTheme('dark');
      toast.success('Đã chuyển sang chế độ Tối sang trọng');
    }
  };

  const handleToggleTwoFactor = (v: boolean) => {
    toggleTwoFactor(v);
    toast.info(
      v
        ? 'Đã bật mô phỏng 2FA'
        : 'Đã tắt mô phỏng 2FA (vào thẳng)'
    );
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <PageHeader
          eyebrow="Tùy biến & Cấu hình"
          title="Cài đặt Hệ thống & Giao diện"
          description="Tùy biến hiển thị, cơ chế bảo mật và quản lý bộ nhớ đệm demo"
        />

        <div className="space-y-5">
          {/* 1. Theme Configuration */}
          <SectionCard
            title="Chế độ hiển thị Giao diện"
            subtitle="Hệ thống tự động lưu lựa chọn của bạn vào bộ nhớ trình duyệt"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-[13.5px] text-ink dark:text-slate-100">
                    Giao diện Sáng (Ấm) / Tối
                  </div>
                  <div className="text-xs text-ink-soft">
                    Sáng: tông ấm chuẩn công trường · Tối: xanh đen sâu, êm mắt
                  </div>
                </div>
              </div>
              <SegmentedControl
                value={theme}
                onChange={handleThemeChange}
                options={[
                  { value: 'light', label: 'Sáng', icon: <Sun className="w-4 h-4" /> },
                  { value: 'dark', label: 'Tối', icon: <Moon className="w-4 h-4" /> },
                ]}
              />
            </div>
          </SectionCard>

          {/* 2. Security & 2FA Simulation */}
          <SectionCard
            title="Xác thực Hai yếu tố (2FA Simulation)"
            subtitle="Mô phỏng lớp bảo mật OTP 6 số khi đăng nhập vào hệ thống"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-pine-100 text-pine-700 dark:bg-pine-600/15 dark:text-pine-500 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-[13.5px] text-ink dark:text-slate-100 flex items-center gap-2">
                    Kích hoạt bước nhập mã OTP 6 chữ số
                    <Shield className="w-4 h-4 text-ink-soft shrink-0" />
                  </div>
                  <div className="text-xs text-ink-soft">
                    Khi bật, đăng nhập vào tài khoản có bảo mật sẽ yêu cầu mã OTP
                  </div>
                </div>
              </div>
              <Switch
                checked={isTwoFactorSimulated}
                onChange={handleToggleTwoFactor}
                label="Kích hoạt bước nhập mã OTP 6 chữ số"
              />
            </div>
          </SectionCard>

          {/* 3. Demo Data Reset — vùng nguy hiểm */}
          <section className="card overflow-hidden !border-rose-300 dark:!border-rose-500/40">
            <div className="px-5 pt-4 pb-3">
              <h2 className="text-[15px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Database className="w-4.5 h-4.5" />
                Quản lý Dữ liệu Demo (LocalStorage)
              </h2>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                Toàn bộ dữ liệu dự án, tiến độ, hình ảnh, chat được lưu trong bộ nhớ máy tính này
              </p>
            </div>
            <div className="px-5 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-bold text-[13.5px] text-rose-600 dark:text-rose-400">
                    Đặt lại toàn bộ dữ liệu demo về trạng thái ban đầu
                  </div>
                  <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                    Xóa tất cả thay đổi thử nghiệm và nạp lại {projects.length} dự án, các đầu việc mẫu và minh chứng
                    gốc của Thầy Trần Quốc Vương, Thầy Nguyễn Văn Tuấn Kiệt và Ban Lãnh đạo.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="btn-ghost !text-rose-600 dark:!text-rose-400 !border-rose-300 dark:!border-rose-500/40 hover:!bg-rose-50 dark:hover:!bg-rose-500/10 shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  Đặt lại dữ liệu demo
                </button>
              </div>
            </div>
          </section>

          {/* 4. Architecture Note */}
          <div className="rounded-[20px] bg-slate-100/70 dark:bg-night-line/50 border border-line dark:border-night-line p-5 text-[13px] text-ink-soft dark:text-slate-400 space-y-1.5">
            <strong className="flex items-center gap-2 font-bold text-ink dark:text-slate-200">
              <Info className="w-4 h-4 text-indigo-500" />
              Lưu trữ dữ liệu ở bản demo hiện tại:
            </strong>
            <p>
              Bản demo hiện tại lưu toàn bộ dữ liệu trong localStorage của trình duyệt — mỗi trình
              duyệt / mỗi thiết bị có một bộ dữ liệu riêng, không dùng chung và không có đăng nhập
              thật phía máy chủ. Lộ trình đợt sau sẽ nối Supabase để dùng chung dữ liệu giữa các
              thiết bị và có đăng nhập thật.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
