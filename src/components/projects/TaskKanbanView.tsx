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

interface TaskKanbanViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenApproval: (task: Task) => void;
  onOpenUpdate: (task: Task) => void;
  isReadOnly?: boolean;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'Mới giao', color: '#64748B' },
  { id: 'in_progress', title: 'Đang làm', color: '#F59E0B' },
  { id: 'submitted', title: 'Chờ duyệt (100%)', color: '#6366F1' },
  { id: 'approved', title: 'Đã nghiệm thu', color: '#10B981' },
  { id: 'returned', title: 'Cần làm lại', color: '#EF4444' },
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
            className="flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {col.title}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  Kéo thả nhiệm vụ vào đây
                </div>
              ) : (
                columnTasks.map((t) => {
                  const assignee = users.find((u) => u.id === t.assigneeId);
                  const isApproved = t.status === 'approved';
                  const dueInfo = getRelativeDueLabel(t.dueDate, isApproved);

                  return (
                    <div
                      key={t.id}
                      draggable={!isReadOnly && !isApproved}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onClick={() => onSelectTask(t)}
                      className={`p-3.5 rounded-xl bg-white dark:bg-slate-800 border transition-all cursor-pointer shadow-xs hover:shadow-md group relative ${
                        t.status === 'approved'
                          ? 'border-emerald-300 dark:border-emerald-800/60'
                          : dueInfo.isOverdue
                          ? 'border-rose-400 dark:border-rose-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {/* Priority and overdue flags */}
                      <div className="flex items-center justify-between mb-2">
                        {dueInfo.isOverdue ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {dueInfo.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {formatDateVN(t.dueDate)}
                          </span>
                        )}

                        <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {t.progress}%
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug">
                        {t.title}
                      </h4>

                      {/* Progress bar */}
                      <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${t.progress}%`,
                            backgroundColor: col.color,
                          }}
                        />
                      </div>

                      {/* Subtasks checklist counter */}
                      {t.subtasks && t.subtasks.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <CheckSquare className="w-3 h-3 text-slate-400" />
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
                        <div className="mt-2 p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 text-[10px] text-rose-600 dark:text-rose-400 line-clamp-2 italic">
                          Lý do: {t.returnReason}
                        </div>
                      )}

                      {/* Card Footer: Assignee & Quick Actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-500 font-bold text-[9px] flex items-center justify-center">
                            {assignee?.avatar || 'CB'}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                            {assignee?.name.split(' ').pop()}
                          </span>
                        </div>

                        {/* Interactive action pills */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {currentUser.role === 'admin' && t.status === 'submitted' && (
                            <button
                              onClick={() => onOpenApproval(t)}
                              title="Kiểm tra & Nghiệm thu"
                              className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-500 transition-colors flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Duyệt
                            </button>
                          )}

                          {currentUser.role === 'assignee' &&
                            t.assigneeId === currentUser.id &&
                            t.status !== 'approved' && (
                              <button
                                onClick={() => onOpenUpdate(t)}
                                title="Cập nhật tiến độ & Tải ảnh"
                                className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold hover:bg-amber-400 transition-colors flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                Báo cáo
                              </button>
                            )}
                        </div>
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

