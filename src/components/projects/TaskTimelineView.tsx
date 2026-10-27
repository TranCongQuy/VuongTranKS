'use client';

import React from 'react';
import { Task, TASK_STATUS_CONFIG } from '@/lib/types';
import { formatDateVN } from '@/lib/utils';

interface TaskTimelineViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function TaskTimelineView({ tasks, onSelectTask }: TaskTimelineViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Chưa có nhiệm vụ nào để hiển thị sơ đồ tiến độ.
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
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="font-semibold">MỐC THỜI GIAN KHỞI CÔNG: {formatDateVN(new Date(minTime))}</span>
          <span className="font-semibold">DỰ KIẾN HOÀN THÀNH: {formatDateVN(new Date(maxTime))}</span>
        </div>

        <div className="space-y-4">
          {tasks.map((t) => {
            const startTime = new Date(t.startDate || '2026-10-01').getTime();
            const dueTime = new Date(t.dueDate).getTime();

            const leftPercent = Math.max(0, Math.min(100, ((startTime - minTime) / totalDuration) * 100));
            const widthPercent = Math.max(15, Math.min(100 - leftPercent, ((dueTime - startTime) / totalDuration) * 100));

            return (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500">
                      {t.title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${TASK_STATUS_CONFIG[t.status].badgeClass}`}
                    >
                      {TASK_STATUS_CONFIG[t.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    <span>{formatDateVN(t.startDate)} → {formatDateVN(t.dueDate)}</span>
                    <span className="font-bold text-slate-900 dark:text-white">({t.progress}%)</span>
                  </div>
                </div>

                {/* Timeline Track */}
                <div className="relative h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-lg flex items-center px-2 text-[10px] font-bold text-white transition-all shadow-xs"
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
      </div>
    </div>
  );
}

