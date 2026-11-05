'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, CheckSquare, MessageSquare, Settings, FileText } from 'lucide-react';
import { useConstructionStore } from '@/lib/store';

export function BottomNav() {
  const pathname = usePathname();
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getUserTasks = useConstructionStore((s) => s.getUserTasks);
  const notifications = useConstructionStore((s) => s.notifications);
  const myTasksCount = getUserTasks(currentUser.id).length;
  const unreadChatCount = notifications.filter(
    (n) => n.userId === currentUser.id && n.type === 'chat_message' && !n.read
  ).length;

  const showMyTasks = currentUser.role === 'assignee' || currentUser.role === 'admin';
  // Tối đa 5 mục: Trang chủ, Dự án, Việc của tôi (assignee/admin) hoặc Trao đổi (leader), Báo cáo, Cài đặt
  const middleItem = showMyTasks
    ? { href: '/my-tasks', label: 'Việc của tôi', icon: CheckSquare, badge: myTasksCount, isActive: pathname === '/my-tasks' }
    : { href: '/messages', label: 'Trao đổi', icon: MessageSquare, badge: unreadChatCount, isActive: pathname === '/messages' || pathname.startsWith('/messages/') };

  const items = [
    { href: '/', label: 'Trang chủ', icon: LayoutDashboard, badge: 0, isActive: pathname === '/' },
    { href: '/projects', label: 'Dự án', icon: Building2, badge: 0, isActive: pathname.startsWith('/projects') },
    middleItem,
    { href: '/reports', label: 'Báo cáo', icon: FileText, badge: 0, isActive: pathname === '/reports' },
    { href: '/settings', label: 'Cài đặt', icon: Settings, badge: 0, isActive: pathname === '/settings' },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-navy-900/97 backdrop-blur-md border-t border-navy-800 flex items-center justify-around px-2 z-40 no-print"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
              item.isActive
                ? 'text-gold-400 font-bold'
                : 'text-navy-100/55 hover:text-navy-100'
            }`}
          >
            {item.isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gold-500" />
            )}
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{item.label}</span>
            {item.badge > 0 && (
              <span className="absolute top-1 right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-gold-500 text-navy-950 font-bold text-[9px] flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
