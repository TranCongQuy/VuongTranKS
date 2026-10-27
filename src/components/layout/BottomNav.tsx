'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, CheckSquare, PlusCircle, Settings, FileText } from 'lucide-react';
import { useConstructionStore } from '@/lib/store';

export function BottomNav() {
  const pathname = usePathname();
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getUserTasks = useConstructionStore((s) => s.getUserTasks);
  const myTasksCount = getUserTasks(currentUser.id).length;

  return (
    <nav
      aria-label="Điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40 no-print"
    >
      <Link
        href="/"
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
          pathname === '/'
            ? 'text-amber-500 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Tổng quan</span>
      </Link>

      <Link
        href="/projects"
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
          pathname.startsWith('/projects')
            ? 'text-amber-500 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
        }`}
      >
        <Building2 className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Dự án</span>
      </Link>

      {currentUser.role === 'assignee' && (
        <Link
          href="/my-tasks"
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
            pathname === '/my-tasks'
              ? 'text-amber-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Việc của tôi</span>
          {myTasksCount > 0 && (
            <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
              {myTasksCount}
            </span>
          )}
        </Link>
      )}

      {currentUser.role === 'admin' && (
        <Link
          href="/tasks/new"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
            pathname === '/tasks/new'
              ? 'text-amber-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Giao task</span>
        </Link>
      )}

      {currentUser.role === 'leader' && (
        <Link
          href="/reports"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
            pathname === '/reports'
              ? 'text-amber-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Báo cáo</span>
        </Link>
      )}

      <Link
        href="/settings"
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
          pathname === '/settings'
            ? 'text-amber-500 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
        }`}
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Cài đặt</span>
      </Link>
    </nav>
  );
}

