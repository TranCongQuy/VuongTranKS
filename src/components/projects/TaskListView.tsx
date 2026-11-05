'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, TASK_STATUS_CONFIG } from '@/lib/types';
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
import { Avatar, ProgressBar } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { RowMenu } from '@/components/ui/RowMenu';

interface TaskListViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenApproval: (task: Task) => void;
  onOpenUpdate: (task: Task) => void;
  isReadOnly?: boolean;
}

const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  todo: 'slate',
  in_progress: 'gold',
  submitted: 'violet',
  approved: 'pine',
  returned: 'rose',
};

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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hạng mục..."
            className="input pl-9 py-2 text-xs"
          />
        </div>

        <span className="text-xs text-ink-soft dark:text-slate-400">Hiển thị {sortedTasks.length} nhiệm vụ</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Tên hạng mục thi công</th>
                <th>Trạng thái</th>
                <th className="cursor-pointer" onClick={() => toggleSort('progress')}>
                  <span className="inline-flex items-center gap-1">
                    Tiến độ
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="cursor-pointer" onClick={() => toggleSort('dueDate')}>
                  <span className="inline-flex items-center gap-1">
                    Hạn chót
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th>Người thực hiện</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((t) => {
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
                  ...(currentUser.role === 'admin'
                    ? [
                        {
                          label: 'Xoá nhiệm vụ',
                          icon: <Trash2 className="w-4 h-4" />,
                          danger: true,
                          onClick: () => {
                            if (confirm(`Xóa nhiệm vụ "${t.title}"?`)) {
                              deleteTask(t.id);
                              toast.success('Đã xóa nhiệm vụ');
                            }
                          },
                        },
                      ]
                    : []),
                ];

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="cursor-pointer"
                  >
                    <td className="max-w-xs sm:max-w-md">
                      <div className="font-bold text-ink dark:text-white line-clamp-1">
                        {t.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-ink-soft dark:text-slate-400 line-clamp-1">
                          {t.description}
                        </span>
                        {t.incidents && t.incidents.length > 0 && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-1 border border-rose-500/20">
                            <AlertTriangle className="w-2.5 h-2.5" /> {t.incidents.length} phát sinh
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="whitespace-nowrap">
                      <StatusBadge tone={STATUS_TONE[t.status]}>
                        {TASK_STATUS_CONFIG[t.status].label}
                      </StatusBadge>
                    </td>

                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-tabular font-bold w-9 text-ink dark:text-slate-200">{t.progress}%</span>
                        <ProgressBar value={t.progress} tone={t.status === 'approved' ? 'pine' : t.status === 'returned' ? 'rose' : 'gold'} h="h-1.5" className="w-16" />
                      </div>
                    </td>

                    <td className="whitespace-nowrap">
                      {dueInfo.isOverdue ? (
                        <StatusBadge tone="rose">
                          <AlertTriangle className="w-3 h-3" />
                          {dueInfo.label}
                        </StatusBadge>
                      ) : (
                        <span className="text-ink-soft dark:text-slate-300 font-tabular">
                          {formatDateVN(t.dueDate)}
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar text={assignee?.avatar || 'CB'} size="sm" />
                        <span className="text-ink dark:text-slate-200">
                          {assignee?.name || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {menuItems.length > 0 ? (
                        <RowMenu items={menuItems} />
                      ) : (
                        <span className="text-ink-soft dark:text-slate-500">—</span>
                      )}
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
