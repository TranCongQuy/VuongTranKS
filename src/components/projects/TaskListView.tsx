'use client';

import React, { useState } from 'react';
import { Task, TASK_STATUS_CONFIG } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import {
  AlertTriangle,
  Search,
  ArrowUpDown,
  ShieldCheck,
  Edit3,
  Trash2,
} from 'lucide-react';
import { formatDateVN, getRelativeDueLabel } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskListViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenApproval: (task: Task) => void;
  onOpenUpdate: (task: Task) => void;
  isReadOnly?: boolean;
}

export function TaskListView({
  tasks,
  onSelectTask,
  onOpenApproval,
  onOpenUpdate,
}: TaskListViewProps) {
  const currentUser = useConstructionStore((s) => s.currentUser);
  const users = useConstructionStore((s) => s.users);
  const deleteTask = useConstructionStore((s) => s.deleteTask);

  const [sortField, setSortField] = useState<'dueDate' | 'progress' | 'priority'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortField === 'dueDate') {
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    }
    if (sortField === 'progress') {
      return sortOrder === 'asc' ? a.progress - b.progress : b.progress - a.progress;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Search Bar within tab */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hạng mục..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <span className="text-xs text-slate-400">Hiển thị {sortedTasks.length} nhiệm vụ</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Tên hạng mục thi công</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('progress')}
                >
                  <div className="flex items-center gap-1">
                    <span>Tiến độ</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('dueDate')}
                >
                  <div className="flex items-center gap-1">
                    <span>Hạn chót</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedTasks.map((t) => {
                const assignee = users.find((u) => u.id === t.assigneeId);
                const isApproved = t.status === 'approved';
                const dueInfo = getRelativeDueLabel(t.dueDate, isApproved);

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {t.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 line-clamp-1">
                          {t.description}
                        </span>
                        {t.incidents && t.incidents.length > 0 && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-1 border border-rose-500/20">
                            <AlertTriangle className="w-2.5 h-2.5" /> {t.incidents.length} phát sinh
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TASK_STATUS_CONFIG[t.status].badgeClass}`}
                      >
                        {TASK_STATUS_CONFIG[t.status].label}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold w-9">{t.progress}%</span>
                        <div className="w-16 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {dueInfo.isOverdue ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 font-bold text-[10px] flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          {dueInfo.label}
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300 font-mono">
                          {formatDateVN(t.dueDate)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-500 font-bold text-[10px] flex items-center justify-center">
                          {assignee?.avatar || 'CB'}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">
                          {assignee?.name || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {currentUser.role === 'admin' && t.status === 'submitted' && (
                          <button
                            onClick={() => onOpenApproval(t)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-500 flex items-center gap-1 shadow-xs"
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
                              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 flex items-center gap-1 shadow-xs"
                            >
                              <Edit3 className="w-3 h-3" />
                              Báo cáo
                            </button>
                          )}

                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`Xóa nhiệm vụ "${t.title}"?`)) {
                                deleteTask(t.id);
                                toast.success('Đã xóa nhiệm vụ');
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500"
                            title="Xóa nhiệm vụ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

