'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Edit3,
  Eye,
  PlusCircle,
  LayoutList,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { TaskUpdateModal } from '@/components/tasks/TaskUpdateModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { useConstructionStore } from '@/lib/store';
import { Task, TaskStatus, TASK_STATUS_CONFIG } from '@/lib/types';
import { formatDateVN, getRelativeDueLabel } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ProgressBar } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RowMenu } from '@/components/ui/RowMenu';

type TaskGroup = 'all' | 'overdue' | 'near_due' | 'in_progress' | 'submitted' | 'approved';

function statusTone(status: TaskStatus): BadgeTone {
  switch (status) {
    case 'approved':
      return 'pine';
    case 'submitted':
      return 'violet';
    case 'in_progress':
      return 'gold';
    case 'returned':
      return 'rose';
    default:
      return 'slate';
  }
}

export default function MyTasksPage() {
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getUserTasks = useConstructionStore((s) => s.getUserTasks);
  const projects = useConstructionStore((s) => s.projects);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updateModalTask, setUpdateModalTask] = useState<Task | null>(null);
  const [activeGroup, setActiveGroup] = useState<TaskGroup>('all');

  if (currentUser.role === 'leader') {
    return (
      <AppShell>
        <div className="card max-w-lg mx-auto mt-10">
          <EmptyState
            icon={<Eye className="w-7 h-7" />}
            title="Chế độ Giám sát Cấp cao của Lãnh đạo"
            description={`Tài khoản Lãnh đạo (${currentUser.name}) không trực tiếp thực hiện nhiệm vụ thi công mà giữ vai trò giám sát các chỉ số tiến độ, kinh phí và cho ý kiến chỉ đạo.`}
          >
            <Link href="/" className="btn-primary">
              Về Bảng Chỉ số Điều hành Lãnh đạo
            </Link>
          </EmptyState>
        </div>
      </AppShell>
    );
  }

  const myTasks = getUserTasks(currentUser.id);

  // Categorize tasks into the 5 groups
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueList = myTasks.filter((t) => {
    if (t.status === 'approved') return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });

  const nearDueList = myTasks.filter((t) => {
    if (t.status === 'approved') return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });

  const inProgressList = myTasks.filter((t) => t.status === 'in_progress');
  const submittedList = myTasks.filter((t) => t.status === 'submitted');
  const approvedList = myTasks.filter((t) => t.status === 'approved');

  const getFilteredList = () => {
    switch (activeGroup) {
      case 'overdue':
        return overdueList;
      case 'near_due':
        return nearDueList;
      case 'in_progress':
        return inProgressList;
      case 'submitted':
        return submittedList;
      case 'approved':
        return approvedList;
      default:
        return myTasks;
    }
  };

  const displayTasks = getFilteredList();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Sổ tay kỹ sư hiện trường"
          title={`Việc của tôi (${myTasks.length})`}
          description={`Danh mục các hạng mục được Ban chỉ huy giao cho ${currentUser.name} • Hiển thị ${displayTasks.length} nhiệm vụ`}
        >
          {currentUser.role === 'admin' && (
            <Link href="/tasks/new" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              Giao việc mới
            </Link>
          )}
        </PageHeader>

        {/* Bộ lọc nhóm việc */}
        <SegmentedControl<TaskGroup>
          value={activeGroup}
          onChange={setActiveGroup}
          variant="pill"
          size="sm"
          options={[
            { value: 'all', label: 'Tất cả', count: myTasks.length, icon: <LayoutList className="w-3.5 h-3.5" /> },
            { value: 'overdue', label: 'Trễ hạn', count: overdueList.length, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
            { value: 'near_due', label: 'Sắp đến hạn', count: nearDueList.length, icon: <Clock className="w-3.5 h-3.5" /> },
            { value: 'in_progress', label: 'Đang làm', count: inProgressList.length, icon: <Edit3 className="w-3.5 h-3.5" /> },
            { value: 'submitted', label: 'Chờ duyệt', count: submittedList.length, icon: <CheckSquare className="w-3.5 h-3.5" /> },
            { value: 'approved', label: 'Đã duyệt', count: approvedList.length, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          ]}
        />

        {/* Danh sách việc dạng hàng */}
        {displayTasks.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<CheckSquare className="w-7 h-7" />}
              title="Không có nhiệm vụ nào trong nhóm này"
              description="Tuyệt vời! Tiến độ các hạng mục đang được quản lý tốt."
            />
          </div>
        ) : (
          <div className="card divide-y divide-line dark:divide-night-line overflow-hidden">
            {displayTasks.map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              const isApproved = t.status === 'approved';
              const dueInfo = getRelativeDueLabel(t.dueDate, isApproved);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="px-4 sm:px-5 py-4 flex items-start sm:items-center gap-4 cursor-pointer transition-colors hover:bg-indigo-50/50 dark:hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200">
                        {project?.code || 'DỰ ÁN'}
                      </span>
                      <StatusBadge tone={statusTone(t.status)} dot>
                        {TASK_STATUS_CONFIG[t.status].label}
                      </StatusBadge>
                      {dueInfo.isOverdue ? (
                        <StatusBadge tone="rose">
                          <AlertTriangle className="w-3 h-3" />
                          {dueInfo.label}
                        </StatusBadge>
                      ) : (
                        <span className="text-xs text-ink-soft dark:text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          Hạn: {formatDateVN(t.dueDate)} ({dueInfo.label})
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-[15px] text-ink dark:text-white line-clamp-1">
                      {t.title}
                    </h3>
                    <p className="text-xs text-ink-soft dark:text-slate-400 line-clamp-1 mt-0.5">
                      {t.description}
                    </p>

                    {/* Incidents badge */}
                    {t.incidents && t.incidents.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-500/20 w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {t.incidents.length} trở ngại hiện trường (
                          {t.incidents.filter((i) => i.status !== 'resolved').length} đang xử lý)
                        </span>
                      </div>
                    )}

                    {/* Returned reason preview */}
                    {t.status === 'returned' && t.returnReason && (
                      <div className="mt-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                        <strong>Yêu cầu sửa lại:</strong> {t.returnReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right w-20">
                      <div className="font-mono font-bold text-[15px] text-ink dark:text-white">
                        {t.progress}%
                      </div>
                      <ProgressBar
                        value={t.progress}
                        tone={isApproved ? 'pine' : dueInfo.isOverdue ? 'rose' : 'gold'}
                        className="mt-1.5"
                      />
                    </div>
                    {isApproved ? (
                      <StatusBadge tone="pine">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã duyệt
                      </StatusBadge>
                    ) : (
                      <RowMenu
                        items={[
                          {
                            label: 'Báo cáo tiến độ',
                            icon: <Edit3 className="w-4 h-4" />,
                            onClick: () => setUpdateModalTask(t),
                          },
                          {
                            label: 'Xem chi tiết',
                            icon: <Eye className="w-4 h-4" />,
                            onClick: () => setSelectedTask(t),
                          },
                        ]}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Task Update Modal */}
        {updateModalTask && (
          <TaskUpdateModal
            task={updateModalTask}
            onClose={() => setUpdateModalTask(null)}
          />
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onOpenUpdate={(t) => setUpdateModalTask(t)}
          />
        )}
      </div>
    </AppShell>
  );
}
