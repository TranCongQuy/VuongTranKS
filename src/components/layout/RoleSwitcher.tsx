'use client';

import React, { useState } from 'react';
import { useConstructionStore } from '@/lib/store';
import { ShieldCheck, UserCheck, Eye, ChevronUp, Check, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useConstructionStore((s) => s.currentUser);
  const users = useConstructionStore((s) => s.users);
  const setCurrentUser = useConstructionStore((s) => s.setCurrentUser);
  const resetDemoData = useConstructionStore((s) => s.resetDemoData);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: ShieldCheck,
          label: 'Chủ trì Kế hoạch (Admin)',
          badgeColor: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
        };
      case 'assignee':
        return {
          icon: UserCheck,
          label: 'Cộng sự phụ trách',
          badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        };
      case 'leader':
        return {
          icon: Eye,
          label: 'Lãnh đạo (Đánh giá & Chỉ đạo)',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
      default:
        return {
          icon: UserCheck,
          label: 'Người dùng',
          badgeColor: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        };
    }
  };

  const handleSelectUser = (user: typeof users[0]) => {
    if (!user.isActive) {
      toast.error(`Tài khoản ${user.name} đang bị khóa. Vui lòng kích hoạt trong Quản trị.`);
      return;
    }
    setCurrentUser(user);
    toast.success(`Đã chuyển sang vai trò: ${user.name} (${user.title})`, {
      description: `Quyền hạn và giao diện đã được cập nhật tương ứng.`,
    });
    setIsOpen(false);
  };

  const currentBadge = getRoleBadge(currentUser.role);
  const CurrentIcon = currentBadge.icon;

  return (
    <div className="fixed bottom-5 right-5 z-50 role-switcher-floating no-print">
      {isOpen && (
        <div
          role="dialog"
          aria-label="Bảng chuyển đổi vai trò demo"
          className="mb-3 w-84 sm:w-96 rounded-2xl bg-slate-900/95 text-white p-4 shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-semibold text-xs tracking-wider uppercase text-amber-400">
                Chuyển đổi vai trò Demo
              </span>
            </div>
            <button
              onClick={() => {
                resetDemoData();
                toast.success('Đã nạp lại dữ liệu demo chuẩn!');
                setIsOpen(false);
              }}
              title="Đặt lại toàn bộ dữ liệu mẫu"
              aria-label="Đặt lại dữ liệu demo"
              className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Đặt lại demo
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Chọn tài khoản để kiểm tra phân quyền & giao diện tương ứng theo kịch bản:
          </p>

          <div className="space-y-2">
            {users.map((user) => {
              const isSelected = currentUser.id === user.id;
              const badge = getRoleBadge(user.role);
              const Icon = badge.icon;

              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={!user.isActive}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                      : user.isActive
                      ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      : 'bg-slate-800/20 border-slate-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-extrabold'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {user.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-100">{user.name}</span>
                        {!user.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                            Đã khóa
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Icon className="w-3 h-3 text-slate-400" />
                        <span>{user.title}</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Phím tắt:</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              Ctrl + K để tìm kiếm
            </kbd>
          </div>
        </div>
      )}

      {/* Floating Toggle Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Mở bảng chuyển đổi vai trò"
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white shadow-xl border border-amber-500/50 hover:border-amber-400 backdrop-blur-md transition-all group hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <CurrentIcon className="w-4 h-4 text-amber-400 group-hover:rotate-6 transition-transform" />
        <div className="text-left text-xs">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Đang xem với vai trò
          </div>
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <span>{currentUser.name}</span>
            <span className="text-[10px] font-normal text-slate-400">({currentBadge.label})</span>
          </div>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}
