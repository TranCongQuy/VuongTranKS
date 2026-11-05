'use client';

import React from 'react';
import { Task, TaskStatus, TASK_STATUS_CONFIG } from '@/lib/types';
import { formatDateVN } from '@/lib/utils';
import { SectionCard, EmptyState } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';

interface TaskTimelineViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  todo: 'slate',
  in_progress: 'gold',
  submitted: 'violet',
  approved: 'pine',
  returned: 'rose',
};

export function TaskTimelineView({ tasks, onSelectTask }: TaskTimelineViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="card">
        <EmptyState
          title="Chưa có nhiệm vụ nào"
          description="Chưa có nhiệm vụ nào để hiển thị sơ đồ tiến độ."
        />
      </div>
    );
  }

  // Calculate earliest start and latest due date
  const timestamps = tasks.flatMap((t) => [
    new Date(t.startDate || '2026-10-01').getTime(),
    new Date(t.dueDate).getTime(),
  ]);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const totalDuration = Math.max(1, maxTime - minTime);

  return (
    <SectionCard
      title="Sơ đồ tiến độ"
      subtitle={`Khởi công ${formatDateVN(new Date(minTime))} · Dự kiến hoàn thành ${formatDateVN(new Date(maxTime))}`}
      pad={false}
    >
      <div className="divide-y divide-line dark:divide-night-line px-2 py-1">
        {tasks.map((t) => {
          const startTime = new Date(t.startDate || '2026-10-01').getTime();
          const dueTime = new Date(t.dueDate).getTime();

          const leftPercent = Math.max(0, Math.min(100, ((startTime - minTime) / totalDuration) * 100));
          const widthPercent = Math.max(15, Math.min(100 - leftPercent, ((dueTime - startTime) / totalDuration) * 100));

          return (
            <div
              key={t.id}
              onClick={() => onSelectTask(t)}
              className="group cursor-pointer hover:bg-cream/70 dark:hover:bg-night-line/30 px-3 py-3 rounded-2xl transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-ink dark:text-slate-200 group-hover:text-pine-700 dark:group-hover:text-pine-500 truncate">
                    {t.title}
                  </span>
                  <StatusBadge tone={STATUS_TONE[t.status]}>
                    {TASK_STATUS_CONFIG[t.status].label}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-2 font-tabular text-[11px] text-ink-soft dark:text-slate-400">
                  <span>{formatDateVN(t.startDate)} → {formatDateVN(t.dueDate)}</span>
                  <span className="font-bold text-ink dark:text-white">({t.progress}%)</span>
                </div>
              </div>

              {/* Timeline Track */}
              <div className="relative h-6 bg-cream-deep/70 dark:bg-night-line/60 rounded-lg overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 rounded-lg flex items-center px-2 text-[10px] font-bold text-white transition-all"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: TASK_STATUS_CONFIG[t.status].color,
                  }}
                >
                  <span className="truncate">{t.progress}% hoàn thành</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
