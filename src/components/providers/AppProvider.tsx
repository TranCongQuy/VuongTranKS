'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { useConstructionStore } from '@/lib/store';
import { CommandPalette } from '@/components/layout/CommandPalette';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const theme = useConstructionStore((s) => s.theme);
  const isAuthenticated = useConstructionStore((s) => s.isAuthenticated);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const isLoginPage = pathname === '/login';
  const needsAuthRedirect = mounted && !isAuthenticated && !isLoginPage;

  useEffect(() => {
    if (needsAuthRedirect) {
      router.replace('/login');
    }
  }, [needsAuthRedirect, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Đang khởi tạo Quản lý Dự án PXU...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập và không ở trang login: hiện màn hình chờ tối giản
  // trong lúc chuyển hướng tới /login, tránh chớp nội dung bên trong.
  if (needsAuthRedirect) {
    return (
      <div className="min-h-screen bg-cream dark:bg-night flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quản lý Dự án PXU</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Đang chuyển tới trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <CommandPalette />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: 'font-sans text-sm',
          style: { borderRadius: '12px' },
        }}
      />
    </>
  );
}
