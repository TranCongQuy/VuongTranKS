'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useConstructionStore } from '@/lib/store';
import { TaskPriority } from '@/lib/types';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get('projectId') || '';

  const currentUser = useConstructionStore((s) => s.currentUser);
  const projects = useConstructionStore((s) => s.projects);
  const users = useConstructionStore((s) => s.users);
  const addTask = useConstructionStore((s) => s.addTask);

  const activeProjects = projects.filter((p) => !p.isDeleted);
  const assignees = users.filter((u) => u.role === 'assignee' && u.isActive);

  const [projectId, setProjectId] = useState(
    defaultProjectId || (activeProjects[0]?.id ?? '')
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(assignees[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [startDate, setStartDate] = useState('2026-10-23');
  const [dueDate, setDueDate] = useState('2026-11-05');

  if (currentUser.role !== 'admin') {
    return (
      <AppShell>
        <div className="py-20 text-center max-w-md mx-auto">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Không có quyền truy cập
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chỉ Chủ trì Kế hoạch (Admin) mới có quyền khởi tạo và phân rã mục tiêu mới.
          </p>
        </div>
      </AppShell>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !assigneeId) {
      toast.error('Vui lòng điền đầy đủ tiêu đề, chọn kế hoạch dự án và người thực hiện.');
      return;
    }

    const newTaskId = addTask({
      projectId,
      title,
      description,
      assigneeId,
      status: 'todo',
      progress: 0,
      priority,
      startDate,
      dueDate,
    });

    const assignee = users.find((u) => u.id === assigneeId);
    toast.success('Đã giao nhiệm vụ thành công!', {
      description: `Đã gửi thông báo giao việc đến ${assignee?.name || 'cộng sự'}.`,
    });

    router.push(`/projects/${projectId}?tab=tasks&taskId=${newTaskId}`);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Giao nhiệm vụ & Mục tiêu mới
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân công đầu việc, thiết lập yêu cầu chất lượng và thời hạn hoàn thành
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
        >
          {/* Select Project */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Kế hoạch / Dự án *
            </label>
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Tiêu đề mục tiêu / Nhiệm vụ *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Hoàn tất tích hợp API thanh toán, Thu thập minh chứng kiểm định..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Yêu cầu thực hiện & Kết quả đầu ra (Deliverables)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nêu rõ tiêu chuẩn chất lượng áp dụng, tài liệu minh chứng cần nộp hoặc đường dẫn sản phẩm thử nghiệm..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Assignee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Cộng sự phụ trách thực hiện *
              </label>
              <select
                required
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                {assignees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp (Cần ưu tiên xử lý)</option>
              </select>
            </div>
          </div>

          {/* Start and Due Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Hạn chót hoàn thành *
              </label>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Giao việc & Gửi thông báo
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
