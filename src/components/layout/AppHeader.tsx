'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  Check,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FolderGit2,
  LogOut,
  Settings,
  ChevronDown,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { IconBtn } from '@/components/ui/RowMenu';
import { Avatar } from '@/components/ui/cards';
import { useConstructionStore } from '@/lib/store';
import { formatDateTimeVN } from '@/lib/utils';
import type { User } from '@/lib/types';

const getRoleLabel = (user: User) => {
  switch (user.role) {
    case 'admin':
      return 'Admin (Chủ trì)';
    case 'assignee':
      return 'Giám sát / Người thực hiện';
    case 'leader':
      return 'Lãnh đạo (Chỉ xem được cấp quyền)';
    default:
      return user.role;
  }
};

export function AppHeader({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentUser = useConstructionStore((s) => s.currentUser);
  const users = useConstructionStore((s) => s.users);
  const setCurrentUser = useConstructionStore((s) => s.setCurrentUser);
  const logout = useConstructionStore((s) => s.logout);
  const theme = useConstructionStore((s) => s.theme);
  const toggleTheme = useConstructionStore((s) => s.toggleTheme);
  const notifications = useConstructionStore((s) => s.notifications);
  const markNotificationAsRead = useConstructionStore((s) => s.markNotificationAsRead);
  const markAllNotificationsAsRead = useConstructionStore((s) => s.markAllNotificationsAsRead);

  const otherUsers = users.filter((u) => u.id !== currentUser.id);

  const handleSwitchRole = (user: User) => {
    setCurrentUser(user);
    setShowUserMenu(false);
    toast.success(`Đã chuyển sang vai trò: ${user.name}`, {
      description: getRoleLabel(user),
    });
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    router.push('/login');
  };

  // Filter notifications for current user
  const userNotifications = notifications.filter((n) => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-cmd-palette'));
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'task_submitted':
        return <Building2 className="w-4 h-4 text-sky-600 shrink-0" />;
      case 'task_approved':
        return <CheckCircle2 className="w-4 h-4 text-pine-600 shrink-0" />;
      case 'task_returned':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'task_assigned':
        return <FolderGit2 className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'project_directive':
        return <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-ink-soft shrink-0" />;
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white/55 dark:bg-night/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <span className="lg:hidden">
          <IconBtn label="Mở thanh điều hướng" onClick={onOpenMobileMenu}>
            <Menu className="w-5 h-5" />
          </IconBtn>
        </span>

        {/* Quick Search Bar (triggers cmdk) */}
        <button
          onClick={handleOpenSearch}
          aria-label="Tìm kiếm nhanh hệ thống (Ctrl + K)"
          className="flex items-center gap-2.5 pl-4 pr-2 py-2.5 rounded-xl bg-white dark:bg-night-card hover:border-indigo-300 dark:hover:border-indigo-500/40 text-ink-soft dark:text-slate-400 text-xs font-medium transition-colors border border-line dark:border-night-line shadow-[0_2px_8px_rgba(15,23,42,0.03)] cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Tìm kiếm dự án, task, hồ sơ...</span>
          <span className="sm:hidden">Tìm nhanh...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-slate-100 dark:bg-night-line text-ink-soft dark:text-slate-300">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Toggle */}
        <IconBtn
          label={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-amber-400" />
          ) : (
            <Moon className="w-4.5 h-4.5" />
          )}
        </IconBtn>

        {/* Notifications Dropdown */}
        <div className="relative">
          <IconBtn
            label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}`}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </IconBtn>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div
                role="region"
                aria-label="Ngăn kéo thông báo"
                className="card absolute right-0 mt-2 w-80 sm:w-96 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="p-3.5 border-b border-line dark:border-night-line flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-ink dark:text-slate-100">
                      Thông báo công trình
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 text-[10px] font-bold">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="btn-quiet !text-indigo-600 dark:!text-indigo-300"
                    >
                      <Check className="w-3 h-3" />
                      Đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-84 overflow-y-auto divide-y divide-line/70 dark:divide-night-line/70">
                  {userNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-ink-soft">
                      Chưa có thông báo nào.
                    </div>
                  ) : (
                    userNotifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.link) {
                            router.push(n.link);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-3 hover:bg-indigo-50/50 dark:hover:bg-white/5 ${
                          !n.read ? 'bg-indigo-50/70 dark:bg-indigo-500/10' : ''
                        }`}
                      >
                        {getNotifIcon(n.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`font-semibold text-ink dark:text-slate-200 truncate ${
                                !n.read ? 'text-indigo-600 dark:text-indigo-300' : ''
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="text-[10px] text-ink-soft shrink-0 font-mono">
                              {formatDateTimeVN(n.createdAt).split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-ink-soft dark:text-slate-400 text-[11px] mt-1 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-line dark:border-night-line text-center">
                  <span className="text-[10px] text-ink-soft">
                    Nhấp vào thông báo để chuyển tới nhiệm vụ liên quan
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile + Dropdown menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            aria-label="Mở menu người dùng"
            aria-expanded={showUserMenu}
            className="flex items-center gap-2 pl-3 ml-1 border-l border-line dark:border-night-line hover:opacity-85 transition-opacity cursor-pointer"
          >
            <Avatar text={currentUser.avatar} size="sm" tone="navy" />
            <span className="hidden xl:block text-left">
              <span className="block text-xs font-semibold text-ink dark:text-slate-200 leading-tight">
                {currentUser.name}
              </span>
              <span className="block text-[10px] text-ink-soft">{currentUser.department}</span>
            </span>
            <ChevronDown
              className={`hidden xl:block w-3.5 h-3.5 text-ink-soft transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div
                role="menu"
                aria-label="Menu người dùng"
                className="card absolute right-0 mt-2 w-72 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Thông tin user */}
                <div className="p-3.5 border-b border-line dark:border-night-line flex items-center gap-3">
                  <Avatar text={currentUser.avatar} size="md" tone="navy" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink dark:text-slate-100 truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-ink-soft dark:text-slate-400 truncate">
                      {getRoleLabel(currentUser)}
                    </div>
                    {currentUser.department && (
                      <div className="text-[11px] text-ink-soft truncate">{currentUser.department}</div>
                    )}
                  </div>
                </div>

                <div className="p-1.5">
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-ink dark:text-slate-200 hover:bg-indigo-50/70 dark:hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-ink-soft" />
                    Cài đặt
                  </Link>
                </div>

                {/* Chuyển vai trò (Demo) */}
                <div className="px-3.5 pt-2 pb-1 border-t border-line dark:border-night-line">
                  <div className="eyebrow flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3 h-3" />
                    Chuyển vai trò (Demo)
                  </div>
                </div>
                <div className="p-1.5 pt-0 max-h-56 overflow-y-auto">
                  {otherUsers.length === 0 ? (
                    <div className="px-2.5 py-2 text-[11px] text-ink-soft">Không có tài khoản khác.</div>
                  ) : (
                    otherUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSwitchRole(u)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-indigo-50/70 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Avatar text={u.avatar} size="sm" tone="navy" />
                        <span className="min-w-0 flex-1 block">
                          <span className="block text-xs font-medium text-ink dark:text-slate-100 truncate">{u.name}</span>
                          <span className="block text-[10px] text-ink-soft truncate">{getRoleLabel(u)}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>

                <div className="p-1.5 border-t border-line dark:border-night-line">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
