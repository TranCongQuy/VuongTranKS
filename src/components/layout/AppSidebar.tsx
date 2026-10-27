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
  Target,
  Sun,
  Moon,
} from 'lucide-react';
import { useConstructionStore } from '@/lib/store';

export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getOverdueTasks = useConstructionStore((s) => s.getOverdueTasks);
  const getPendingApprovalTasks = useConstructionStore((s) => s.getPendingApprovalTasks);
  const getUserTasks = useConstructionStore((s) => s.getUserTasks);

  const overdueCount = getOverdueTasks().length;
  const pendingCount = getPendingApprovalTasks().length;
  const myTasksCount = getUserTasks(currentUser.id).length;
  const theme = useConstructionStore((s) => s.theme);
  const toggleTheme = useConstructionStore((s) => s.toggleTheme);

  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'assignee':
        return <UserCheck className="w-4 h-4 text-blue-400" />;
      case 'leader':
        return <Eye className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getRoleBadgeLabel = () => {
    switch (currentUser.role) {
      case 'admin':
        return 'Chủ trì Kế hoạch';
      case 'assignee':
        return 'Cộng sự thực hiện';
      case 'leader':
        return 'Lãnh đạo (Đánh giá)';
    }
  };

  const navItems = [
    {
      label:
        currentUser.role === 'leader'
          ? 'Chỉ số Lãnh đạo'
          : currentUser.role === 'admin'
          ? 'Tổng quan điều hành'
          : 'Tổng quan công việc',
      href: '/',
      icon: LayoutDashboard,
      show: true,
      badge: null,
    },
    {
      label:
        currentUser.role === 'leader'
          ? 'Dự án được giám sát'
          : currentUser.role === 'assignee'
          ? 'Dự án tham gia'
          : 'Dự án & Kế hoạch',
      href: '/projects',
      icon: Layers,
      show: true,
      badge: null,
    },
    {
      label: 'Việc của tôi',
      href: '/my-tasks',
      icon: CheckSquare,
      show: currentUser.role === 'assignee',
      badge: myTasksCount > 0 ? myTasksCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      label: 'Giao nhiệm vụ mới',
      href: '/tasks/new',
      icon: PlusCircle,
      show: currentUser.role === 'admin',
      badge: null,
    },
    {
      label: 'Báo cáo & Xuất PDF',
      href: '/reports',
      icon: FileText,
      show: currentUser.role === 'admin' || currentUser.role === 'leader',
      badge: null,
    },
    {
      label: 'Quản lý thành viên',
      href: '/users',
      icon: Users,
      show: currentUser.role === 'admin',
      badge: null,
    },
    {
      label: 'Nhật ký hoạt động',
      href: '/audit-logs',
      icon: History,
      show: currentUser.role === 'admin',
      badge: null,
    },
    {
      label: 'Cài đặt hệ thống',
      href: '/settings',
      icon: Settings,
      show: true,
      badge: null,
    },
  ];

  return (
    <aside className="w-68 h-screen bg-[#0B132B] text-slate-200 border-r border-[#1C2541] flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-[#1C2541] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Target className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>TASKMASTER</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Quản trị Mục tiêu & Giao việc</p>
            </div>
          </Link>
        </div>

        {/* Current Role Card */}
        <div className="p-3 mx-3 my-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center justify-center text-xs">
              {currentUser.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                {getRoleIcon()}
                <span className="truncate">{getRoleBadgeLabel()}</span>
              </div>
            </div>
          </div>
          {currentUser.role === 'admin' && (pendingCount > 0 || overdueCount > 0) && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              {pendingCount > 0 && (
                <span className="text-indigo-300 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  {pendingCount} chờ duyệt
                </span>
              )}
              {overdueCount > 0 && (
                <span className="text-rose-400 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueCount} trễ hạn
                </span>
              )}
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-1">
            Menu chức năng
          </div>
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Footer info & Theme toggle */}
      <div className="p-4 border-t border-[#1C2541] text-[11px] text-slate-400 space-y-2.5">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          className="w-full py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-slate-300 text-xs transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{theme === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng'}</span>
          </span>
          <span className="text-[10px] text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            {theme === 'dark' ? 'Bật Sáng' : 'Bật Tối'}
          </span>
        </button>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Đồng bộ thời gian thực
          </span>
          <span className="font-mono text-slate-400">v3.0.0</span>
        </div>
        <div className="text-[10px] text-slate-400">Đại học Phú Xuân • Quản trị Mục tiêu</div>
      </div>
    </aside>
  );
}
