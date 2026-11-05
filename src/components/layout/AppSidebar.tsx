'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  CheckSquare,
  Users,
  FileText,
  History,
  Settings,
  ShieldCheck,
  UserCheck,
  Eye,
  PlusCircle,
  AlertTriangle,
  Sun,
  Moon,
  MessageSquare,
} from 'lucide-react';
import { useConstructionStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type BadgeTone = 'rose' | 'soft';

export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getOverdueTasks = useConstructionStore((s) => s.getOverdueTasks);
  const getPendingApprovalTasks = useConstructionStore((s) => s.getPendingApprovalTasks);
  const getUserTasks = useConstructionStore((s) => s.getUserTasks);
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);
  const notifications = useConstructionStore((s) => s.notifications);

  const overdueCount = getOverdueTasks().length;
  const pendingCount = getPendingApprovalTasks().length;
  const myTasksCount = getUserTasks(currentUser.id).length;
  const visibleProjectsCount = getVisibleProjects().length;
  const unreadChatCount = notifications.filter(
    (n) => n.userId === currentUser.id && n.type === 'chat_message' && !n.read
  ).length;
  const theme = useConstructionStore((s) => s.theme);
  const toggleTheme = useConstructionStore((s) => s.toggleTheme);

  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />;
      case 'assignee':
        return <UserCheck className="w-3.5 h-3.5 text-sky-500" />;
      case 'leader':
        return <Eye className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const getRoleBadgeLabel = () => {
    switch (currentUser.role) {
      case 'admin':
        return 'Admin · Chủ trì kế hoạch';
      case 'assignee':
        return 'Giám sát · Người thực hiện';
      case 'leader':
        return 'Lãnh đạo · Giám sát cấp cao';
    }
  };

  const navItems: {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    show: boolean;
    badge: number | null;
    badgeTone: BadgeTone;
  }[] = [
    {
      label:
        currentUser.role === 'leader'
          ? 'Chỉ số Lãnh đạo'
          : currentUser.role === 'admin'
            ? 'Tổng quan'
            : 'Tổng quan công việc',
      href: '/',
      icon: LayoutDashboard,
      show: true,
      badge: null,
      badgeTone: 'soft',
    },
    {
      label:
        currentUser.role === 'leader'
          ? 'Dự án được giám sát'
          : currentUser.role === 'assignee'
            ? 'Dự án tham gia'
            : 'Dự án',
      href: '/projects',
      icon: Layers,
      show: true,
      badge: visibleProjectsCount > 0 ? visibleProjectsCount : null,
      badgeTone: 'soft',
    },
    {
      label: 'Việc của tôi',
      href: '/my-tasks',
      icon: CheckSquare,
      show: currentUser.role === 'assignee' || currentUser.role === 'admin',
      badge: myTasksCount > 0 ? myTasksCount : null,
      badgeTone: 'rose',
    },
    {
      label: 'Trao đổi',
      href: '/messages',
      icon: MessageSquare,
      show: true,
      badge: unreadChatCount > 0 ? unreadChatCount : null,
      badgeTone: 'rose',
    },
    {
      label: 'Giao nhiệm vụ mới',
      href: '/tasks/new',
      icon: PlusCircle,
      show: currentUser.role === 'admin',
      badge: null,
      badgeTone: 'soft',
    },
    {
      label: 'Báo cáo',
      href: '/reports',
      icon: FileText,
      show: currentUser.role === 'admin' || currentUser.role === 'leader',
      badge: null,
      badgeTone: 'soft',
    },
    {
      label: 'Thành viên',
      href: '/users',
      icon: Users,
      show: currentUser.role === 'admin',
      badge: null,
      badgeTone: 'soft',
    },
    {
      label: 'Nhật ký',
      href: '/audit-logs',
      icon: History,
      show: currentUser.role === 'admin',
      badge: null,
      badgeTone: 'soft',
    },
    {
      label: 'Cài đặt',
      href: '/settings',
      icon: Settings,
      show: true,
      badge: null,
      badgeTone: 'soft',
    },
  ];

  return (
    <aside className="w-[252px] h-screen bg-white/70 dark:bg-night-card/85 backdrop-blur-xl border-r border-line dark:border-night-line flex flex-col shrink-0 select-none px-3.5 py-[22px]">
      {/* Brand — ô logo gradient indigo -> emerald như Mẫu A */}
      <Link href="/" className="flex items-center gap-[11px] px-2 pb-5 group" onClick={onClose}>
        <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-black text-[15px] shadow-[0_8px_20px_rgba(99,102,241,0.35)] group-hover:scale-105 transition-transform shrink-0">
          P
        </div>
        <div className="min-w-0">
          <div className="text-[15.5px] font-bold tracking-tight text-ink dark:text-white leading-tight truncate">
            Quản lý Dự án
          </div>
          <p className="text-[11px] text-ink-soft dark:text-slate-400 font-medium truncate">
            Đại học Phú Xuân · PXU
          </p>
        </div>
      </Link>

      {/* Nav Links */}
      <nav className="flex flex-col gap-[3px]">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-[11px] px-3 py-[9.5px] rounded-[11px] text-[13.5px] transition-all',
                  isActive
                    ? 'bg-[linear-gradient(90deg,rgba(99,102,241,0.13),rgba(99,102,241,0.05))] text-indigo-600 dark:text-indigo-300 font-semibold shadow-[inset_0_0_0_1px_rgba(99,102,241,0.14)]'
                    : 'text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-900/[0.04] dark:hover:bg-white/5 hover:text-ink dark:hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0',
                    isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="truncate">{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={cn(
                      'ml-auto min-w-[18px] h-[18px] px-[5px] rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                      item.badgeTone === 'rose'
                        ? 'bg-rose-500 text-white'
                        : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Đáy sidebar: chuyển theme + thẻ người dùng trắng như Mẫu A */}
      <div className="mt-auto space-y-2.5">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          className="w-full px-3 py-2 rounded-[11px] flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-900/[0.04] dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-slate-400" />
            )}
            {theme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng'}
          </span>
          <span className="text-[10px] font-bold text-indigo-500">
            {theme === 'dark' ? 'Bật Sáng' : 'Bật Tối'}
          </span>
        </button>

        <div className="bg-white dark:bg-white/5 border border-line dark:border-night-line rounded-[14px] px-2.5 py-[11px] flex items-center gap-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-bold text-ink dark:text-white truncate leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-ink-soft dark:text-slate-400 flex items-center gap-1 mt-0.5">
              {getRoleIcon()}
              <span className="truncate font-medium">{getRoleBadgeLabel()}</span>
            </div>
            {currentUser.role === 'admin' && (pendingCount > 0 || overdueCount > 0) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold">
                {pendingCount > 0 && (
                  <span className="text-indigo-500 flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    {pendingCount} chờ duyệt
                  </span>
                )}
                {overdueCount > 0 && (
                  <span className="text-rose-500 flex items-center gap-1 whitespace-nowrap">
                    <AlertTriangle className="w-3 h-3" />
                    {overdueCount} trễ hạn
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 pb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Dữ liệu demo · Lưu trên trình duyệt
        </div>
      </div>
    </aside>
  );
}
