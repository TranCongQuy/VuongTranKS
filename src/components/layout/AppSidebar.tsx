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
  MessageSquare,
} from 'lucide-react';
import { useConstructionStore } from '@/lib/store';

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
        return <ShieldCheck className="w-4 h-4 text-gold-400" />;
      case 'assignee':
        return <UserCheck className="w-4 h-4 text-sky-300" />;
      case 'leader':
        return <Eye className="w-4 h-4 text-pine-500" />;
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
      badge: null as number | null,
    },
    {
      label:
        currentUser.role === 'leader'
          ? 'Dự án được giám sát'
          : currentUser.role === 'assignee'
            ? 'Dự án tham gia'
            : `${visibleProjectsCount} Dự án PXU`,
      href: '/projects',
      icon: Layers,
      show: true,
      badge: null as number | null,
    },
    {
      label: 'Việc của tôi',
      href: '/my-tasks',
      icon: CheckSquare,
      show: currentUser.role === 'assignee' || currentUser.role === 'admin',
      badge: myTasksCount > 0 ? myTasksCount : null,
    },
    {
      label: 'Trao đổi',
      href: '/messages',
      icon: MessageSquare,
      show: true,
      badge: unreadChatCount > 0 ? unreadChatCount : null,
    },
    {
      label: 'Giao nhiệm vụ mới',
      href: '/tasks/new',
      icon: PlusCircle,
      show: currentUser.role === 'admin',
      badge: null as number | null,
    },
    {
      label: 'Báo cáo & Xuất PDF',
      href: '/reports',
      icon: FileText,
      show: currentUser.role === 'admin' || currentUser.role === 'leader',
      badge: null as number | null,
    },
    {
      label: 'Quản lý thành viên',
      href: '/users',
      icon: Users,
      show: currentUser.role === 'admin',
      badge: null as number | null,
    },
    {
      label: 'Nhật ký hoạt động',
      href: '/audit-logs',
      icon: History,
      show: currentUser.role === 'admin',
      badge: null as number | null,
    },
    {
      label: 'Cài đặt hệ thống',
      href: '/settings',
      icon: Settings,
      show: true,
      badge: null as number | null,
    },
  ];

  return (
    <aside className="w-68 h-screen bg-navy-900 text-slate-200 border-r border-navy-950 flex flex-col justify-between shrink-0 select-none relative overflow-hidden">
      {/* Gold hairline + glow accents */}
      <div className="absolute inset-x-0 top-0 h-1 safety-stripe-accent opacity-90" />
      <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
      <div>
        {/* Brand Header */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-11 h-11 rounded-2xl bg-gold-500 flex items-center justify-center text-navy-950 shadow-lg shadow-gold-500/25 group-hover:scale-105 transition-transform">
              <Target className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="text-[15px] font-extrabold tracking-tight text-white leading-tight">
                Quản lý Dự án <span className="text-gold-400">PXU</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Giao việc & Giám sát Công trình</p>
            </div>
          </Link>
        </div>

        {/* Current Role Card */}
        <div className="mx-3 mb-2 p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500 text-navy-950 font-extrabold flex items-center justify-center text-xs shadow-md shadow-gold-500/20">
              {currentUser.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                {getRoleIcon()}
                <span className="truncate font-medium">{getRoleBadgeLabel()}</span>
              </div>
            </div>
          </div>
          {currentUser.role === 'admin' && (pendingCount > 0 || overdueCount > 0) && (
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-4 text-[11px]">
              {pendingCount > 0 && (
                <span className="text-violet-300 flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  {pendingCount} chờ duyệt
                </span>
              )}
              {overdueCount > 0 && (
                <span className="text-rose-300 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueCount} trễ hạn
                </span>
              )}
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-0.5 relative">
          <div className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase px-3 pt-3 pb-1.5">
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
                  className={`relative flex items-center justify-between pl-4 pr-3 py-2.5 rounded-xl text-[13px] transition-all ${
                    isActive
                      ? 'bg-white/[0.09] text-white font-bold'
                      : 'text-slate-300/85 font-medium hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-6 rounded-full bg-gold-500" />
                  )}
                  <span className="flex items-center gap-3">
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-gold-400 stroke-[2.4]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500 text-navy-950">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Footer info & Theme toggle */}
      <div className="p-4 border-t border-white/10 text-[11px] text-slate-400 space-y-3 relative">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          className="w-full py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 flex items-center justify-between text-slate-200 text-xs transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 font-semibold">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-gold-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
            <span>{theme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng'}</span>
          </span>
          <span className="text-[10px] text-gold-400 font-bold">{theme === 'dark' ? 'Bật Sáng' : 'Bật Tối'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pine-500" />
          Dữ liệu demo • Lưu trên trình duyệt
        </div>
        <div className="text-[10px] text-slate-500">Đại học Phú Xuân • Hệ thống quản trị dự án</div>
      </div>
    </aside>
  );
}
