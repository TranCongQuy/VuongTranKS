'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  Building2,
  CheckSquare,
  Users,
  FileText,
  History,
  Settings,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';
import { useConstructionStore } from '@/lib/store';
import { toast } from 'sonner';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const currentUser = useConstructionStore((s) => s.currentUser);
  const getVisibleProjects = useConstructionStore((s) => s.getVisibleProjects);
  const tasks = useConstructionStore((s) => s.tasks);
  const toggleTheme = useConstructionStore((s) => s.toggleTheme);
  const theme = useConstructionStore((s) => s.theme);
  const resetDemoData = useConstructionStore((s) => s.resetDemoData);

  const visibleProjects = getVisibleProjects();
  const visibleTasks = tasks.filter(
    (t) =>
      !t.isDeleted &&
      visibleProjects.some((p) => p.id === t.projectId) &&
      (currentUser.role !== 'assignee' || t.assigneeId === currentUser.id)
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setOpen(true);
    window.addEventListener('open-cmd-palette', handleCustomOpen);
    document.addEventListener('keydown', down);

    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-cmd-palette', handleCustomOpen);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bảng lệnh tìm kiếm nhanh"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full">
          <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-amber-500 mr-3 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Gõ để tìm kiếm dự án, nhiệm vụ, hoặc chuyển trang..."
              className="w-full py-4 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm font-medium"
            />
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
              ESC để đóng
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2 space-y-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-400">
              Không tìm thấy kết quả phù hợp.
            </Command.Empty>

            {/* Điều hướng trang */}
            <Command.Group heading={<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">Trang chức năng</span>}>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Trang tổng quan chỉ đạo & mục tiêu</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push('/projects'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Danh mục Kế hoạch & Dự án ({visibleProjects.length})</span>
              </Command.Item>

              {currentUser.role === 'assignee' && (
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/my-tasks'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                  <span>Việc của tôi (Thầy Nguyễn Văn Tuấn Kiệt)</span>
                </Command.Item>
              )}

              {/* Báo cáo & Xuất PDF dành cho Admin và Lãnh đạo */}
              {(currentUser.role === 'admin' || currentUser.role === 'leader') && (
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/reports'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Báo cáo tiến độ & Xuất PDF</span>
                </Command.Item>
              )}

              {currentUser.role === 'admin' && (
                <>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/users'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Quản lý người dùng & phân quyền</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/audit-logs'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <History className="w-4 h-4 text-slate-400" />
                    <span>Nhật ký hoạt động hệ thống</span>
                  </Command.Item>
                </>
              )}

              <Command.Item
                onSelect={() => runCommand(() => router.push('/settings'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Cài đặt hệ thống & Giao diện</span>
              </Command.Item>
            </Command.Group>

            {/* Danh sách dự án được quyền xem */}
            {visibleProjects.length > 0 && (
              <Command.Group heading={<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">Kế hoạch & Dự án</span>}>
                {visibleProjects.map((p) => (
                  <Command.Item
                    key={p.id}
                    onSelect={() => runCommand(() => router.push(`/projects/${p.id}`))}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {p.code}
                      </span>
                      <span className="font-medium truncate max-w-md">{p.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{p.location.split('-')[0]}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Nhiệm vụ gần đây */}
            {visibleTasks.length > 0 && (
              <Command.Group heading={<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">Nhiệm vụ thi công</span>}>
                {visibleTasks.slice(0, 5).map((t) => (
                  <Command.Item
                    key={t.id}
                    onSelect={() =>
                      runCommand(() => router.push(`/projects/${t.projectId}?tab=tasks&taskId=${t.id}`))
                    }
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 shrink-0">{t.progress}%</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Hành động nhanh */}
            <Command.Group heading={<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">Thao tác nhanh</span>}>
              <Command.Item
                onSelect={() => runCommand(() => toggleTheme())}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 transition-colors"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Chuyển sang giao diện Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Chuyển sang giao diện Tối</span>
                  </>
                )}
              </Command.Item>

              <Command.Item
                onSelect={() =>
                  runCommand(() => {
                    resetDemoData();
                    toast.success('Đã đặt lại dữ liệu demo!');
                  })
                }
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Đặt lại toàn bộ dữ liệu demo</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

