'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useConstructionStore } from '@/lib/store';
import { Send, ShieldCheck, HardHat, Eye, Bot, MessagesSquare } from 'lucide-react';
import { formatDateTimeVN, cn } from '@/lib/utils';
import { Avatar, EmptyState } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';

interface ProjectChatProps {
  projectId: string;
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = useConstructionStore((s) => s.currentUser);
  const users = useConstructionStore((s) => s.users);
  const messages = useConstructionStore((s) => s.messages);
  const sendMessage = useConstructionStore((s) => s.sendMessage);

  const projectMessages = messages.filter((m) => m.projectId === projectId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');
    sendMessage(projectId, text);
  };

  const getRoleBadge = (role: string): { icon: typeof ShieldCheck; label: string; tone: BadgeTone } => {
    switch (role) {
      case 'admin':
        return { icon: ShieldCheck, label: 'Chỉ huy trưởng', tone: 'gold' };
      case 'assignee':
        return { icon: HardHat, label: 'Kỹ sư hiện trường', tone: 'sky' };
      case 'leader':
        return { icon: Eye, label: 'Lãnh đạo', tone: 'pine' };
      default:
        return { icon: Bot, label: 'Thành viên', tone: 'slate' };
    }
  };

  return (
    <div className="card flex flex-col h-[580px] overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-line dark:border-night-line flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center shrink-0">
            <MessagesSquare className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-ink dark:text-white truncate">
              Kênh trao đổi nội bộ công trình
            </h3>
            <p className="text-[11px] text-ink-soft dark:text-slate-400 truncate">
              Trao đổi giữa Ban Chỉ huy, Kỹ sư hiện trường và Ban Giám sát Lãnh đạo
            </p>
          </div>
        </div>
        <StatusBadge tone="pine" dot className="shrink-0">
          Kênh bảo mật
        </StatusBadge>
      </div>

      {/* Message Stream */}
      <div className="flex-1 px-4 sm:px-5 py-4 overflow-y-auto space-y-4 bg-cream/60 dark:bg-night/40">
        {projectMessages.length === 0 ? (
          <EmptyState
            title="Chưa có tin nhắn nào trong kênh dự án này"
            description="Hãy gửi tin nhắn đầu tiên để phối hợp kỹ thuật hiện trường."
          />
        ) : (
          projectMessages.map((msg) => {
            const sender = users.find((u) => u.id === msg.senderId);
            const isMe = msg.senderId === currentUser.id;
            const roleBadge = getRoleBadge(sender?.role || 'user');
            const RoleIcon = roleBadge.icon;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <Avatar text={sender?.avatar || 'CB'} size="sm" tone={isMe ? 'gold' : 'navy'} />

                <div className={`max-w-[80%] sm:max-w-md ${isMe ? 'text-right' : ''}`}>
                  <div
                    className={`flex items-center gap-2 mb-1.5 flex-wrap ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="font-semibold text-xs text-ink dark:text-slate-200">
                      {isMe ? 'Bạn' : sender?.name}
                    </span>
                    <StatusBadge tone={roleBadge.tone}>
                      <RoleIcon className="w-3 h-3" />
                      {roleBadge.label}
                    </StatusBadge>
                  </div>

                  <div
                    className={cn(
                      'px-3.5 py-3 rounded-2xl text-[13px] leading-relaxed inline-block text-left',
                      isMe
                        ? 'bg-pine-600 text-white font-medium rounded-tr-md shadow-sm shadow-pine-600/20'
                        : 'bg-cream-deep dark:bg-night-card text-ink dark:text-slate-200 rounded-tl-md border border-line dark:border-night-line'
                    )}
                  >
                    {msg.content}
                  </div>

                  <div className="text-[10px] text-ink-soft dark:text-slate-500 mt-1 font-tabular">
                    {formatDateTimeVN(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form — sticky bottom */}
      <form
        onSubmit={handleSend}
        className="px-3.5 py-3 border-t border-line dark:border-night-line flex items-center gap-2 shrink-0 bg-parchment dark:bg-night-card"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Nhập ý kiến trao đổi (${currentUser.name} - ${currentUser.title})...`}
          className="input flex-1 rounded-full px-4"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label="Gửi tin nhắn"
          className="w-10 h-10 rounded-full bg-pine-600 hover:bg-pine-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-pine-600/25 shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
