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
} from 'lucide-react';
import { useConstructionStore } from '@/lib/store';
import { formatDateTimeVN } from '@/lib/utils';

export function AppHeader({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const currentUser = useConstructionStore((s) => s.currentUser);
  const theme = useConstructionStore((s) => s.theme);
  const toggleTheme = useConstructionStore((s) => s.toggleTheme);
  const notifications = useConstructionStore((s) => s.notifications);
  const markNotificationAsRead = useConstructionStore((s) => s.markNotificationAsRead);
  const markAllNotificationsAsRead = useConstructionStore((s) => s.markAllNotificationsAsRead);

  // Filter notifications for current user
  const userNotifications = notifications.filter((n) => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-cmd-palette'));
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'task_submitted':
        return <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'task_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'task_returned':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'task_assigned':
        return <FolderGit2 className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'project_directive':
        return <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Mở thanh điều hướng"
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Search Bar (triggers cmdk) */}
        <button
          onClick={handleOpenSearch}
          aria-label="Tìm kiếm nhanh hệ thống (Ctrl + K)"
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs transition-colors border border-transparent dark:border-slate-700/50"
        >
          <Search className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Tìm kiếm dự án, task, hồ sơ...</span>
          <span className="sm:hidden">Tìm nhanh...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          aria-label="Đổi giao diện sáng tối"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}`}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div
                role="region"
                aria-label="Ngăn kéo thông báo"
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      Thông báo công trình
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {userNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
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
                        className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          !n.read ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                        }`}
                      >
                        {getNotifIcon(n.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`font-semibold text-slate-800 dark:text-slate-200 truncate ${
                                !n.read ? 'text-amber-700 dark:text-amber-400' : ''
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {formatDateTimeVN(n.createdAt).split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400">
                    Nhấp vào thông báo để chuyển tới nhiệm vụ liên quan
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile avatar */}
        <Link
          href="/settings"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-85 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-700 text-amber-400 font-bold flex items-center justify-center text-xs shadow-xs">
            {currentUser.avatar}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400">{currentUser.department}</div>
          </div>
        </Link>
      </div>
    </header>
  );
}

