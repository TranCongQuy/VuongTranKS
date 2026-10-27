'use client';

import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useConstructionStore } from '@/lib/store';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { CommandPalette } from '@/components/layout/CommandPalette';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const theme = useConstructionStore((s) => s.theme);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Đang khởi tạo hệ thống công trình...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <RoleSwitcher />
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

