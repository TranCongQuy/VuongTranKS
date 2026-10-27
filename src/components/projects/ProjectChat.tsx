'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useConstructionStore } from '@/lib/store';
import { Send, ShieldCheck, HardHat, Eye, Bot } from 'lucide-react';
import { formatDateTimeVN } from '@/lib/utils';

interface ProjectChatProps {
  projectId: string;
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

    // Simulate typing indicator from other members
    if (currentUser.role === 'admin') {
      setTimeout(() => setIsTyping(true), 800);
      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: ShieldCheck,
          label: 'Chỉ huy trưởng',
          color: 'text-amber-500 bg-amber-500/10',
        };
      case 'assignee':
        return {
          icon: HardHat,
          label: 'Kỹ sư hiện trường',
          color: 'text-blue-500 bg-blue-500/10',
        };
      case 'leader':
        return {
          icon: Eye,
          label: 'Lãnh đạo',
          color: 'text-emerald-500 bg-emerald-500/10',
        };
      default:
        return {
          icon: Bot,
          label: 'Thành viên',
          color: 'text-slate-500 bg-slate-500/10',
        };
    }
  };

  return (
    <div className="flex flex-col h-[580px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
            💬
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              Kênh trao đổi nội bộ công trình
            </h3>
            <p className="text-[11px] text-slate-400">
              Trao đổi giữa Ban Chỉ huy, Kỹ sư hiện trường và Ban Giám sát Lãnh đạo
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Kênh bảo mật
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {projectMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400">
            <p>Chưa có tin nhắn nào trong kênh dự án này.</p>
            <p className="mt-1">Hãy gửi tin nhắn đầu tiên để phối hợp kỹ thuật hiện trường.</p>
          </div>
        ) : (
          projectMessages.map((msg) => {
            const sender = users.find((u) => u.id === msg.senderId);
            const isMe = msg.senderId === currentUser.id;
            const roleBadge = getRoleBadge(sender?.role || 'user');
            const RoleIcon = roleBadge.icon;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-extrabold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {sender?.avatar || 'CB'}
                </div>

                {/* Bubble Container */}
                <div className={`max-w-[80%] sm:max-w-md ${isMe ? 'text-right' : ''}`}>
                  <div
                    className={`flex items-center gap-2 mb-1 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {isMe ? 'Bạn' : sender?.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold flex items-center gap-1 ${roleBadge.color}`}
                    >
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleBadge.label}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed inline-block text-left shadow-xs ${
                      isMe
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    {formatDateTimeVN(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator simulation */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px]">Thầy Nguyễn Văn Tuấn Kiệt đang nhập ý kiến...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Nhập ý kiến trao đổi (${currentUser.name} - ${currentUser.title})...`}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

