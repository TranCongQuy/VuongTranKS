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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { TaskUpdateModal } from '@/components/tasks/TaskUpdateModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { useConstructionStore } from '@/lib/store';
import { Task, TASK_STATUS_CONFIG } from '@/lib/types';
import { formatDateVN, getRelativeDueLabel } from '@/lib/utils';

export default function MyTasksPage() {
  const currentUser = useConstructionStore((s) => s.currentUser);
  const getUserTasks = useConstructionStore((s) => s.getUserTasks);
  const projects = useConstructionStore((s) => s.projects);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updateModalTask, setUpdateModalTask] = useState<Task | null>(null);
  const [activeGroup, setActiveGroup] = useState<'all' | 'overdue' | 'near_due' | 'in_progress' | 'submitted' | 'approved'>('all');

  if (currentUser.role === 'leader') {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mb-4">
            <Eye className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Chế độ Giám sát Cấp cao của Lãnh đạo
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Tài khoản Lãnh đạo ({currentUser.name}) không trực tiếp thực hiện nhiệm vụ thi công mà giữ vai trò giám sát các chỉ số tiến độ, kinh phí và cho ý kiến chỉ đạo.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              Về Bảng Chỉ số Điều hành Lãnh đạo
            </Link>
          </div>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Sổ tay kỹ sư hiện trường
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Việc của tôi ({myTasks.length})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Danh mục các hạng mục được Ban chỉ huy giao cho {currentUser.name}
            </p>
          </div>
        </div>

        {/* 5 Group Status Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => setActiveGroup('overdue')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeGroup === 'overdue'
                ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Trễ hạn</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black font-tabular text-rose-600">
              {overdueList.length}
            </div>
          </button>

          <button
            onClick={() => setActiveGroup('near_due')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeGroup === 'near_due'
                ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Sắp đến hạn</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-tabular text-amber-500">
              {nearDueList.length}
            </div>
          </button>

          <button
            onClick={() => setActiveGroup('in_progress')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeGroup === 'in_progress'
                ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Đang làm</span>
              <Edit3 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black font-tabular text-blue-500">
              {inProgressList.length}
            </div>
          </button>

          <button
            onClick={() => setActiveGroup('submitted')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeGroup === 'submitted'
                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Chờ duyệt</span>
              <CheckSquare className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black font-tabular text-indigo-500">
              {submittedList.length}
            </div>
          </button>

          <button
            onClick={() => setActiveGroup('approved')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeGroup === 'approved'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Đã duyệt</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black font-tabular text-emerald-500">
              {approvedList.length}
            </div>
          </button>
        </div>

        {/* View all filter pill */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveGroup('all')}
            className={`text-xs font-semibold px-3 py-1 rounded-lg ${
              activeGroup === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả nhiệm vụ ({myTasks.length})
          </button>
          <span className="text-xs text-slate-400">
            Hiển thị {displayTasks.length} nhiệm vụ
          </span>
        </div>

        {/* Task cards list */}
        {displayTasks.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
            <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không có nhiệm vụ nào trong nhóm này
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tuyệt vời! Tiến độ các hạng mục đang được quản lý tốt.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              const isApproved = t.status === 'approved';
              const dueInfo = getRelativeDueLabel(t.dueDate, isApproved);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isApproved
                      ? 'border-emerald-300 dark:border-emerald-800/60'
                      : dueInfo.isOverdue
                      ? 'border-rose-400 dark:border-rose-800'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {project?.code || 'DỰ ÁN'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TASK_STATUS_CONFIG[t.status].badgeClass}`}
                      >
                        {TASK_STATUS_CONFIG[t.status].label}
                      </span>
                      {dueInfo.isOverdue && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {dueInfo.label}
                        </span>
                      )}
                      {!dueInfo.isOverdue && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          Hạn: {formatDateVN(t.dueDate)} ({dueInfo.label})
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {t.description}
                    </p>

                    {/* Incidents badge */}
                    {t.incidents && t.incidents.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
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

                  <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="text-right">
                      <div className="font-mono font-bold text-base text-slate-800 dark:text-slate-200">
                        {t.progress}%
                      </div>
                      <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Report button */}
                    {!isApproved && (
                      <button
                        onClick={() => setUpdateModalTask(t)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Báo cáo</span>
                      </button>
                    )}

                    {isApproved && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã duyệt
                      </span>
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

