'use client';

import React from 'react';
import { AlertTriangle, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { SectionCard, ProgressBar } from '@/components/ui/cards';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

interface WorkBreakdownChecklistProps {
  projectId: string;
  projectName: string;
  completedTasks: string[];
  pendingTasks: string[];
  redAlerts?: string[];
  onToggleTask?: (taskTitle: string, isCompleted: boolean) => void;
  canEdit?: boolean;
}

export function WorkBreakdownChecklist({
  projectName,
  completedTasks = [],
  pendingTasks = [],
  redAlerts = [],
  onToggleTask,
  canEdit = true,
}: WorkBreakdownChecklistProps) {
  const handleCheckTask = (taskTitle: string) => {
    if (!canEdit) {
      toast.info('Chỉ Chủ trì hoặc Kỹ sư hiện trường có quyền cập nhật tiến độ công việc.');
      return;
    }
    if (onToggleTask) {
      onToggleTask(taskTitle, true);
      toast.success(`Đã hoàn thành: "${taskTitle}"`, {
        description: 'Đã chuyển sang danh mục công việc hoàn thành.',
      });
    }
  };

  const handleUncheckTask = (taskTitle: string) => {
    if (!canEdit) return;
    if (onToggleTask) {
      onToggleTask(taskTitle, false);
      toast.info(`Đã chuyển lại sang việc cần triển khai: "${taskTitle}"`);
    }
  };

  const total = completedTasks.length + pendingTasks.length;
  const percent = Math.round((completedTasks.length / (total || 1)) * 100);

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="card px-5 py-4">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <span className="text-[13px] font-bold text-ink dark:text-white">
            Tiến độ thực tế {projectName}
          </span>
          <span className="text-[13px] font-extrabold font-tabular text-pine-700 dark:text-pine-500">
            {percent}% khối lượng
          </span>
        </div>
        <ProgressBar value={percent} tone="pine" />
        <p className="text-[11px] text-ink-soft dark:text-slate-400 mt-2">
          {completedTasks.length} đã hoàn thành · {pendingTasks.length} còn lại
        </p>
      </div>

      {/* Red Alerts Banner if any */}
      {redAlerts && redAlerts.length > 0 && (
        <div className="p-4 rounded-[20px] bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cảnh báo rủi ro &amp; việc cần xử lý gấp tại hiện trường:</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc">
            {redAlerts.map((alert, idx) => (
              <li
                key={idx}
                className="text-xs font-semibold text-rose-900 dark:text-rose-200"
              >
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2-Column Work Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
        {/* Column 1: ĐÃ TRIỂN KHAI / HOÀN THÀNH */}
        <SectionCard
          title="Đã triển khai / Hoàn thành"
          subtitle="Khối lượng công việc đã hoàn tất nghiệm thu"
          action={<StatusBadge tone="pine">{completedTasks.length} việc</StatusBadge>}
        >
          {completedTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-soft dark:text-slate-400 border border-dashed border-line dark:border-night-line rounded-2xl">
              Chưa có hạng mục nào được ghi nhận hoàn thành.
            </div>
          ) : (
            <ul className="divide-y divide-line dark:divide-night-line">
              {completedTasks.map((task, idx) => (
                <li key={idx} className="py-3 flex items-start gap-3 group">
                  <span className="w-5 h-5 rounded-full bg-pine-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="flex-1 text-[13px] text-ink-soft dark:text-slate-400 font-medium leading-relaxed line-through decoration-slate-400/60">
                    {task}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleUncheckTask(task)}
                      title="Đánh dấu chưa hoàn thành"
                      className="btn-quiet opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      Bỏ chọn
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Column 2: CẦN TRIỂN KHAI TIẾP THEO / VIỆC CÒN LẠI */}
        <SectionCard
          title="Cần triển khai / Việc còn lại"
          subtitle="Các phần việc tồn đọng đang thực hiện hoặc chờ xử lý"
          action={<StatusBadge tone="gold">{pendingTasks.length} tồn đọng</StatusBadge>}
        >
          {pendingTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-pine-700 dark:text-pine-500 font-semibold border border-dashed border-pine-500/40 rounded-2xl bg-pine-100/40 dark:bg-pine-600/10">
              Tuyệt vời! Toàn bộ các đầu mục công việc đã được hoàn thành.
            </div>
          ) : (
            <ul className="divide-y divide-line dark:divide-night-line">
              {pendingTasks.map((task, idx) => (
                <li key={idx} className="py-3 flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleCheckTask(task)}
                    disabled={!canEdit}
                    title={canEdit ? 'Bấm để đánh dấu hoàn thành' : undefined}
                    aria-label={`Đánh dấu hoàn thành: ${task}`}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors',
                      canEdit
                        ? 'border-pine-600/50 bg-white dark:bg-night-card hover:bg-pine-600 text-transparent hover:text-white cursor-pointer'
                        : 'border-slate-300 dark:border-slate-600 text-transparent cursor-not-allowed'
                    )}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <span className="flex-1 text-[13px] text-ink dark:text-slate-200 font-medium leading-relaxed">
                    {task}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 pt-3 border-t border-line dark:border-night-line flex items-center justify-between text-[11px] text-ink-soft dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
              Tick vào vòng tròn khi hoàn thành tại hiện trường
            </span>
            <span className="font-tabular font-bold">{pendingTasks.length} mục tiêu</span>
          </div>

        </SectionCard>
      </div>
    </div>
  );
}
