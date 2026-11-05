'use client';

import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ProjectChat } from '@/components/projects/ProjectChat';
import { useConstructionStore } from '@/lib/store';
import { formatDateTimeVN } from '@/lib/utils';

type Channel =
  | { kind: 'dm'; id: string; title: string; subtitle: string; otherUserId: string; otherUserName: string }
  | { kind: 'project'; id: string; title: string; subtitle: string };

export default function MessagesPage() {
  const currentUser = useConstructionStore((s) => s.currentUser);
  const users = useConstructionStore((s) => s.users);
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);
  const getProjectMessages = useConstructionStore((s) => s.getProjectMessages);
  const notifications = useConstructionStore((s) => s.notifications);
  const markNotificationAsRead = useConstructionStore((s) => s.markNotificationAsRead);

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const visibleProjects = getVisibleProjects();

  // ---- Kênh DM ----
  const dmChannelId = (otherUserId: string) =>
    'direct-' + [currentUser.id, otherUserId].sort().join('-');

  const dmChannels: Channel[] = (() => {
    if (currentUser.role === 'admin') {
      // Admin: mỗi user khác là 1 kênh DM riêng
      return users
        .filter((u) => u.id !== currentUser.id)
        .map((u) => ({
          kind: 'dm' as const,
          id: dmChannelId(u.id),
          title: u.name,
          subtitle: `Trò chuyện trực tiếp • ${u.title}`,
          otherUserId: u.id,
          otherUserName: u.name,
        }));
    }
    // Người dùng thường: 1 kênh DM với Admin (user role 'admin' đầu tiên)
    const admin = users.find((u) => u.role === 'admin');
    if (!admin) return [];
    return [
      {
        kind: 'dm' as const,
        id: dmChannelId(admin.id),
        title: 'Trò chuyện trực tiếp với Admin',
        subtitle: `${admin.name} • ${admin.title}`,
        otherUserId: admin.id,
        otherUserName: admin.name,
      },
    ];
  })();

  // ---- Kênh dự án ----
  const projectChannels: Channel[] = visibleProjects.map((p) => ({
    kind: 'project' as const,
    id: p.id,
    title: p.name,
    subtitle: p.code,
  }));

  const allChannels: Channel[] = [...dmChannels, ...projectChannels];
  const selectedChannel = allChannels.find((c) => c.id === selectedChannelId) || null;

  // ---- Chưa đọc: từ notifications type 'chat_message' chưa đọc của currentUser ----
  // Dự án: notification.link = /projects/<id>?tab=chat  -> map thẳng theo link.
  // DM: notification.link = /messages (chung cho mọi DM) -> đối chiếu thêm tên người gửi
  // trong nội dung notification ("<Tên> đã gửi tin nhắn: ...") để phân biệt từng kênh DM.
  const myUnreadChatNotifs = notifications.filter(
    (n) => n.userId === currentUser.id && !n.read && n.type === 'chat_message'
  );

  const unreadCountFor = (ch: Channel): number => {
    if (ch.kind === 'project') {
      return myUnreadChatNotifs.filter((n) => n.link === `/projects/${ch.id}?tab=chat`).length;
    }
    return myUnreadChatNotifs.filter(
      (n) => n.link === '/messages' && n.message.includes(ch.otherUserName)
    ).length;
  };

  const handleSelectChannel = (ch: Channel) => {
    setSelectedChannelId(ch.id);
    // Mở kênh nào thì đánh dấu đã đọc các notification chat trỏ tới kênh đó
    if (ch.kind === 'project') {
      myUnreadChatNotifs
        .filter((n) => n.link === `/projects/${ch.id}?tab=chat`)
        .forEach((n) => markNotificationAsRead(n.id));
    } else {
      myUnreadChatNotifs
        .filter((n) => n.link === '/messages' && n.message.includes(ch.otherUserName))
        .forEach((n) => markNotificationAsRead(n.id));
    }
  };

  const renderChannelItem = (ch: Channel) => {
    const msgs = getProjectMessages(ch.id);
    const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    const unread = unreadCountFor(ch);
    const isActive = selectedChannelId === ch.id;

    return (
      <button
        key={ch.id}
        type="button"
        onClick={() => handleSelectChannel(ch)}
        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
          isActive
            ? 'bg-amber-500/10 border-amber-500/50'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          {ch.kind === 'dm' ? <ShieldCheck className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {ch.title}
            </span>
            {last && (
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {formatDateTimeVN(last.createdAt)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 truncate">{ch.subtitle}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {last ? last.content : 'Chưa có tin nhắn nào'}
          </div>
        </div>
        {unread > 0 && (
          <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    );
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Trao đổi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trò chuyện trực tiếp với Admin và trao đổi theo từng dự án bạn được xem
          </p>
        </div>

        <div className="flex gap-4 items-start">
          {/* Danh sách kênh — mobile: ẩn khi đã mở 1 kênh */}
          <div
            className={`w-full md:w-80 shrink-0 space-y-4 ${
              selectedChannel ? 'hidden md:block' : 'block'
            }`}
          >
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {currentUser.role === 'admin' ? 'Trò chuyện trực tiếp' : 'Trò chuyện trực tiếp với Admin'}
              </h3>
              {dmChannels.length === 0 ? (
                <p className="text-xs text-slate-400">Không có người dùng nào để trò chuyện.</p>
              ) : (
                dmChannels.map(renderChannelItem)
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Trao đổi theo dự án ({projectChannels.length})
              </h3>
              {projectChannels.length === 0 ? (
                <p className="text-xs text-slate-400">Bạn chưa được cấp quyền xem dự án nào.</p>
              ) : (
                projectChannels.map(renderChannelItem)
              )}
            </div>
          </div>

          {/* Khung chat chính — mobile: chỉ hiện khi đã chọn kênh */}
          <div className={`flex-1 min-w-0 ${selectedChannel ? 'block' : 'hidden md:block'}`}>
            {selectedChannel ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedChannelId(null)}
                    className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    aria-label="Quay lại danh sách kênh"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {selectedChannel.title}
                    </h2>
                    <p className="text-[11px] text-slate-400 truncate">{selectedChannel.subtitle}</p>
                  </div>
                </div>
                {/* ProjectChat lọc tin theo projectId — kênh DM dùng id 'direct-<idA>-<idB>' làm projectId */}
                <ProjectChat projectId={selectedChannel.id} />
              </div>
            ) : (
              <div className="h-[580px] rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center text-xs text-slate-400 px-6">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                <p>Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu trao đổi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
