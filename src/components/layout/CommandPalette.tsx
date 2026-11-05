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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/55 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl card !rounded-[20px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full">
          <div className="flex items-center px-5 border-b border-line dark:border-night-line bg-parchment dark:bg-night-card">
            <Search className="w-5 h-5 text-indigo-500 mr-3 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Gõ để tìm kiếm dự án, nhiệm vụ, hoặc chuyển trang..."
              className="w-full py-4 bg-transparent outline-none text-ink dark:text-slate-100 placeholder:text-ink-soft/70 text-[15px] font-medium"
            />
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-ink-soft bg-slate-100 dark:bg-night-line rounded-md">
              ESC để đóng
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2 space-y-2">
            <Command.Empty className="py-8 text-center text-sm text-ink-soft">
              Không tìm thấy kết quả phù hợp.
            </Command.Empty>

            {/* Điều hướng trang */}
            <Command.Group heading={<span className="eyebrow px-2">Trang chức năng</span>}>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
              >
                <Building2 className="w-4 h-4 text-ink-soft" />
                <span>Trang tổng quan chỉ đạo & mục tiêu</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push('/projects'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
              >
                <Building2 className="w-4 h-4 text-ink-soft" />
                <span>Danh mục Kế hoạch & Dự án ({visibleProjects.length})</span>
              </Command.Item>

              {currentUser.role === 'assignee' && (
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/my-tasks'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
                >
                  <CheckSquare className="w-4 h-4 text-ink-soft" />
                  <span>Việc của tôi (Thầy Nguyễn Văn Tuấn Kiệt)</span>
                </Command.Item>
              )}

              {/* Báo cáo & Xuất PDF dành cho Admin và Lãnh đạo */}
              {(currentUser.role === 'admin' || currentUser.role === 'leader') && (
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/reports'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-ink-soft" />
                  <span>Báo cáo tiến độ & Xuất PDF</span>
                </Command.Item>
              )}

              {currentUser.role === 'admin' && (
                <>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/users'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <Users className="w-4 h-4 text-ink-soft" />
                    <span>Quản lý người dùng & phân quyền</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/audit-logs'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <History className="w-4 h-4 text-ink-soft" />
                    <span>Nhật ký hoạt động hệ thống</span>
                  </Command.Item>
                </>
              )}

              <Command.Item
                onSelect={() => runCommand(() => router.push('/settings'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 text-ink-soft" />
                <span>Cài đặt hệ thống & Giao diện</span>
              </Command.Item>
            </Command.Group>

            {/* Danh sách dự án được quyền xem */}
            {visibleProjects.length > 0 && (
              <Command.Group heading={<span className="eyebrow px-2">Kế hoạch & Dự án</span>}>
                {visibleProjects.map((p) => (
                  <Command.Item
                    key={p.id}
                    onSelect={() => runCommand(() => router.push(`/projects/${p.id}`))}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200">
                        {p.code}
                      </span>
                      <span className="font-medium truncate max-w-md">{p.name}</span>
                    </div>
                    <span className="text-xs text-ink-soft shrink-0">{p.location.split('-')[0]}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Nhiệm vụ gần đây */}
            {visibleTasks.length > 0 && (
              <Command.Group heading={<span className="eyebrow px-2">Nhiệm vụ thi công</span>}>
                {visibleTasks.slice(0, 5).map((t) => (
                  <Command.Item
                    key={t.id}
                    onSelect={() =>
                      runCommand(() => router.push(`/projects/${t.projectId}?tab=tasks&taskId=${t.id}`))
                    }
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 data-[selected=true]:text-indigo-700 dark:data-[selected=true]:text-white hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                    <span className="text-xs font-mono text-ink-soft shrink-0">{t.progress}%</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Hành động nhanh */}
            <Command.Group heading={<span className="eyebrow px-2">Thao tác nhanh</span>}>
              <Command.Item
                onSelect={() => runCommand(() => toggleTheme())}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-ink dark:text-slate-200 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-500/15 hover:bg-indigo-50/60 dark:hover:bg-white/5 transition-colors"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Chuyển sang giao diện Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-500 dark:text-slate-300" />
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-rose-600 dark:text-rose-400 data-[selected=true]:bg-rose-100 dark:data-[selected=true]:bg-rose-500/15 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
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

