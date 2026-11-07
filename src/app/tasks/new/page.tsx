'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useConstructionStore } from '@/lib/store';
import { TaskPriority } from '@/lib/types';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconBtn } from '@/components/ui/RowMenu';
import { EmptyState } from '@/components/ui/cards';

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
        <div className="card max-w-md mx-auto mt-10">
          <EmptyState
            title="Không có quyền truy cập"
            description="Chỉ Chủ trì Kế hoạch (Admin) mới có quyền khởi tạo và phân rã mục tiêu mới."
          />
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
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 2000),
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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-2">
          <div className="pt-1">
            <IconBtn label="Quay lại" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </IconBtn>
          </div>
          <div className="flex-1 min-w-0">
            <PageHeader
              eyebrow="Giao việc"
              title="Giao nhiệm vụ & Mục tiêu mới"
              description="Phân công đầu việc, thiết lập yêu cầu chất lượng và thời hạn hoàn thành"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-7 space-y-7">
          {/* Mục 1: Dự án & nội dung */}
          <section className="space-y-5">
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-navy-900 dark:text-white border-b border-line dark:border-night-line pb-2">
              Dự án &amp; Nội dung
            </h2>

            <div>
              <label className="lbl">Kế hoạch / Dự án *</label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="input"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="lbl">Tiêu đề mục tiêu / Nhiệm vụ *</label>
              <input
                required
                type="text"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Hoàn tất tích hợp API thanh toán, Thu thập minh chứng kiểm định..."
                className="input font-semibold"
              />
            </div>

            <div>
              <label className="lbl">Yêu cầu thực hiện &amp; Kết quả đầu ra (Deliverables)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nêu rõ tiêu chuẩn chất lượng áp dụng, tài liệu minh chứng cần nộp hoặc đường dẫn sản phẩm thử nghiệm..."
                className="input leading-relaxed"
              />
            </div>
          </section>

          {/* Mục 2: Phân công & ưu tiên */}
          <section className="space-y-5">
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-navy-900 dark:text-white border-b border-line dark:border-night-line pb-2">
              Phân công &amp; Ưu tiên
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="lbl">Cộng sự phụ trách thực hiện *</label>
                <select
                  required
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="input"
                >
                  {assignees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="lbl">Mức độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="input"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khẩn cấp (Cần ưu tiên xử lý)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Mục 3: Thời hạn */}
          <section className="space-y-5">
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-navy-900 dark:text-white border-b border-line dark:border-night-line pb-2">
              Thời hạn
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="lbl">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input font-mono"
                />
              </div>

              <div>
                <label className="lbl">Hạn chót hoàn thành *</label>
                <input
                  required
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input font-mono font-bold"
                />
              </div>
            </div>
          </section>

          <div className="pt-4 border-t border-line dark:border-night-line flex items-center justify-end gap-2">
            <button type="button" onClick={() => router.back()} className="btn-quiet">
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              Giao việc &amp; Gửi thông báo
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
