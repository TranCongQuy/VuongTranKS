'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, TASK_STATUS_CONFIG } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import {
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Edit3,
  CheckSquare,
} from 'lucide-react';
import { formatDateVN, getRelativeDueLabel } from '@/lib/utils';
import { toast } from 'sonner';
import { Avatar, ProgressBar } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { RowMenu } from '@/components/ui/RowMenu';

interface TaskKanbanViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenApproval: (task: Task) => void;
  onOpenUpdate: (task: Task) => void;
  isReadOnly?: boolean;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; tone: BadgeTone; barTone: 'pine' | 'gold' | 'rose' | 'navy' }[] = [
  { id: 'todo', title: 'Mới giao', color: '#64748B', tone: 'slate', barTone: 'navy' },
  { id: 'in_progress', title: 'Đang làm', color: '#6366F1', tone: 'indigo', barTone: 'navy' },
  { id: 'submitted', title: 'Chờ duyệt (100%)', color: '#6366F1', tone: 'violet', barTone: 'navy' },
  { id: 'approved', title: 'Đã nghiệm thu', color: '#10B981', tone: 'pine', barTone: 'pine' },
  { id: 'returned', title: 'Cần làm lại', color: '#EF4444', tone: 'rose', barTone: 'rose' },
];

export function TaskKanbanView({
  tasks,
  onSelectTask,
  onOpenApproval,
  onOpenUpdate,
  isReadOnly = false,
}: TaskKanbanViewProps) {
  const currentUser = useConstructionStore((s) => s.currentUser);
  const moveTaskStatus = useConstructionStore((s) => s.moveTaskStatus);
  const users = useConstructionStore((s) => s.users);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (isReadOnly) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === 'approved') {
      toast.error('Nhiệm vụ đã nghiệm thu không thể thay đổi trạng thái.');
      setDraggedTaskId(null);
      return;
    }

    if ((targetStatus === 'approved' || targetStatus === 'returned') && currentUser.role !== 'admin') {
      toast.error('Chỉ Quản trị viên (Chỉ huy trưởng) mới có quyền duyệt hoặc trả lại nhiệm vụ.');
      setDraggedTaskId(null);
      return;
    }

    const success = moveTaskStatus(taskId, targetStatus);
    if (success) {
      toast.success(`Đã chuyển trạng thái sang "${TASK_STATUS_CONFIG[targetStatus].label}"`);
    } else {
      toast.error('Chuyển trạng thái không hợp lệ.');
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col rounded-[20px] bg-slate-100/70 dark:bg-night/50 border border-line dark:border-night-line p-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-2">
              <StatusBadge tone={col.tone} dot>
                {col.title}
              </StatusBadge>
              <span className="text-[11px] font-tabular font-bold text-ink-soft dark:text-slate-400">
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-[11px] text-ink-soft dark:text-slate-500 border border-dashed border-line dark:border-night-line rounded-2xl bg-parchment/60 dark:bg-night-card/40 px-3 text-center">
                  Kéo thả nhiệm vụ vào đây
                </div>
              ) : (
                columnTasks.map((t) => {
                  const assignee = users.find((u) => u.id === t.assigneeId);
                  const isApproved = t.status === 'approved';
                  const dueInfo = getRelativeDueLabel(t.dueDate, isApproved);

                  const menuItems = [
                    ...(currentUser.role === 'admin' && t.status === 'submitted'
                      ? [
                          {
                            label: 'Kiểm tra & Duyệt',
                            icon: <ShieldCheck className="w-4 h-4" />,
                            onClick: () => onOpenApproval(t),
                          },
                        ]
                      : []),
                    ...(currentUser.role === 'assignee' &&
                    t.assigneeId === currentUser.id &&
                    t.status !== 'approved'
                      ? [
                          {
                            label: 'Báo cáo tiến độ',
                            icon: <Edit3 className="w-4 h-4" />,
                            onClick: () => onOpenUpdate(t),
                          },
                        ]
                      : []),
                  ];

                  return (
                    <div
                      key={t.id}
                      draggable={!isReadOnly && !isApproved}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onClick={() => onSelectTask(t)}
                      className={`card p-3.5 transition-all cursor-pointer hover:shadow-md group relative ${
                        dueInfo.isOverdue && !isApproved ? 'border-rose-300 dark:border-rose-500/40' : ''
                      }`}
                    >
                      {/* Meta row */}
                      <div className="flex items-center justify-between mb-2">
                        {dueInfo.isOverdue ? (
                          <StatusBadge tone="rose">
                            <AlertTriangle className="w-3 h-3" />
                            {dueInfo.label}
                          </StatusBadge>
                        ) : (
                          <span className="text-[10px] text-ink-soft dark:text-slate-400 flex items-center gap-1 font-tabular">
                            <Calendar className="w-3 h-3" />
                            {formatDateVN(t.dueDate)}
                          </span>
                        )}
                        <span className="font-tabular text-[11px] font-extrabold text-ink dark:text-slate-200">
                          {t.progress}%
                        </span>
                      </div>

                      <h4 className="font-bold text-[13px] text-ink dark:text-white group-hover:text-pine-700 dark:group-hover:text-pine-500 transition-colors line-clamp-2 leading-snug">
                        {t.title}
                      </h4>

                      <ProgressBar value={t.progress} tone={col.barTone} h="h-1.5" className="mt-2.5" />

                      {/* Subtasks checklist counter */}
                      {t.subtasks && t.subtasks.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-soft dark:text-slate-400 font-medium">
                          <CheckSquare className="w-3 h-3" />
                          <span>
                            {t.subtasks.filter((st) => st.completed).length}/{t.subtasks.length} mục việc
                          </span>
                        </div>
                      )}

                      {/* Incident alert badge if any */}
                      {t.incidents && t.incidents.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">
                            {t.incidents.length} phát sinh ({t.incidents.filter((i) => i.status !== 'resolved').length} cần xử lý)
                          </span>
                        </div>
                      )}

                      {/* Return reason snippet if any */}
                      {t.status === 'returned' && t.returnReason && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-[10px] text-rose-600 dark:text-rose-400 line-clamp-2 italic">
                          Lý do: {t.returnReason}
                        </div>
                      )}

                      {/* Card Footer: Assignee & RowMenu */}
                      <div className="mt-3 pt-2.5 border-t border-line dark:border-night-line flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar text={assignee?.avatar || 'CB'} size="sm" />
                          <span className="text-[10px] text-ink-soft dark:text-slate-400 truncate max-w-[90px]">
                            {assignee?.name.split(' ').pop()}
                          </span>
                        </div>
                        {menuItems.length > 0 && <RowMenu items={menuItems} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
