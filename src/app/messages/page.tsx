'use client';

import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, User } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ProjectChat } from '@/components/projects/ProjectChat';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar, EmptyState } from '@/components/ui/cards';
import { IconBtn } from '@/components/ui/RowMenu';
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
    const otherUser = ch.kind === 'dm' ? users.find((u) => u.id === ch.otherUserId) : undefined;

    return (
      <button
        key={ch.id}
        type="button"
        onClick={() => handleSelectChannel(ch)}
        className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-500/15 shadow-xs ring-1 ring-indigo-100 dark:ring-indigo-500/20'
            : 'hover:bg-slate-50 dark:hover:bg-white/5'
        }`}
      >
        {ch.kind === 'dm' ? (
          <Avatar text={otherUser?.avatar || ch.otherUserName.slice(0, 2)} size="md" tone="navy" />
        ) : (
          <span className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </span>
        )}
        <span className="min-w-0 flex-1 block">
          <span className="flex items-center justify-between gap-2">
            <span className="font-bold text-[13px] text-ink dark:text-slate-100 truncate">
              {ch.title}
            </span>
            {last && (
              <span className="text-[10px] text-ink-soft font-mono shrink-0">
                {formatDateTimeVN(last.createdAt)}
              </span>
            )}
          </span>
          <span className="block text-[11px] text-ink-soft truncate">{ch.subtitle}</span>
          <span className="block text-[11px] text-ink-soft dark:text-slate-400 truncate mt-0.5">
            {last ? last.content : 'Chưa có tin nhắn nào'}
          </span>
        </span>
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
      <div>
        <PageHeader
          eyebrow="Trao đổi"
          title="Trao đổi"
          description="Trò chuyện trực tiếp với Admin và trao đổi theo từng dự án bạn được xem"
        />

        {/* App chat 2 cột trong 1 card lớn */}
        <div className="card overflow-hidden flex items-stretch">
          {/* Danh sách kênh — mobile: ẩn khi đã mở 1 kênh */}
          <div
            className={`w-full md:w-80 shrink-0 md:border-r border-line dark:border-night-line p-3 space-y-5 overflow-y-auto ${
              selectedChannel ? 'hidden md:block' : 'block'
            }`}
          >
            <div className="space-y-1.5">
              <h3 className="eyebrow flex items-center gap-1.5 px-1.5 pt-1">
                <User className="w-3.5 h-3.5" />
                {currentUser.role === 'admin' ? 'Trò chuyện trực tiếp' : 'Trò chuyện trực tiếp với Admin'}
              </h3>
              {dmChannels.length === 0 ? (
                <p className="text-xs text-ink-soft px-1.5">Không có người dùng nào để trò chuyện.</p>
              ) : (
                dmChannels.map(renderChannelItem)
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="eyebrow flex items-center gap-1.5 px-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Trao đổi theo dự án ({projectChannels.length})
              </h3>
              {projectChannels.length === 0 ? (
                <p className="text-xs text-ink-soft px-1.5">Bạn chưa được cấp quyền xem dự án nào.</p>
              ) : (
                projectChannels.map(renderChannelItem)
              )}
            </div>
          </div>

          {/* Khung chat chính — mobile: chỉ hiện khi đã chọn kênh */}
          <div className={`flex-1 min-w-0 flex flex-col ${selectedChannel ? 'flex' : 'hidden md:flex'}`}>
            {selectedChannel ? (
              <>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-line dark:border-night-line shrink-0">
                  <span className="md:hidden">
                    <IconBtn label="Quay lại danh sách kênh" onClick={() => setSelectedChannelId(null)}>
                      <ArrowLeft className="w-4 h-4" />
                    </IconBtn>
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm text-ink dark:text-white truncate">
                      {selectedChannel.title}
                    </h2>
                    <p className="text-[11px] text-ink-soft truncate">{selectedChannel.subtitle}</p>
                  </div>
                </div>
                {/* ProjectChat lọc tin theo projectId — kênh DM dùng id 'direct-<idA>-<idB>' làm projectId */}
                <div className="[&>div]:!rounded-none [&>div]:!border-0 [&>div]:!shadow-none">
                  <ProjectChat projectId={selectedChannel.id} />
                </div>
              </>
            ) : (
              <div className="flex-1 min-h-[580px] flex items-center justify-center">
                <EmptyState
                  icon={<MessageSquare className="w-6 h-6" />}
                  title="Chưa chọn cuộc trò chuyện"
                  description="Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu trao đổi."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
