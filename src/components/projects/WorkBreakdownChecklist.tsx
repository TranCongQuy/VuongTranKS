'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, CheckSquare, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <div className="space-y-4">
      {/* Red Alerts Banner if any */}
      {redAlerts && redAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/40 shadow-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>Cảnh báo rủi ro & Việc cần xử lý gấp tại hiện trường:</span>
          </div>
          <div className="space-y-1.5 pl-6">
            {redAlerts.map((alert, idx) => (
              <p
                key={idx}
                className="text-xs font-semibold text-rose-900 dark:text-rose-200 list-item list-disc"
              >
                {alert}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Work Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Column 1: ĐÃ TRIỂN KHAI / HOÀN THÀNH */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    [Đã triển khai / Hoàn thành]
                  </h3>
                  <p className="text-[10px] text-slate-400">Khối lượng công việc đã hoàn tất nghiệm thu</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                {completedTasks.length} việc
              </span>
            </div>

            {completedTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Chưa có hạng mục nào được ghi nhận hoàn thành.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {completedTasks.map((task, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs flex items-start gap-2.5 group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="flex-1 text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {task}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleUncheckTask(task)}
                        title="Đánh dấu chưa hoàn thành"
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-rose-500 transition-opacity underline cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Tiến độ thực tế {projectName}</span>
            <span className="font-bold text-emerald-600">
              {Math.round(
                (completedTasks.length / (completedTasks.length + pendingTasks.length || 1)) * 100
              )}
              % khối lượng
            </span>
          </div>
        </div>

        {/* Column 2: CẦN TRIỂN KHAI TIẾP THEO / VIỆC CÒN LẠI */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    [Cần triển khai / Việc còn lại]
                  </h3>
                  <p className="text-[10px] text-slate-400">Các phần việc tồn đọng đang thực hiện hoặc chờ xử lý</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
                {pendingTasks.length} tồn đọng
              </span>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 font-semibold border border-dashed border-emerald-300 dark:border-emerald-800/80 rounded-2xl bg-emerald-50/30">
                🎉 Tuyệt vời! Toàn bộ các đầu mục công việc đã được hoàn thành.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {pendingTasks.map((task, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs flex items-start gap-2.5 hover:border-amber-400 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleCheckTask(task)}
                      disabled={!canEdit}
                      title={canEdit ? 'Bấm để đánh dấu hoàn thành' : undefined}
                      className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        canEdit
                          ? 'border-amber-400 bg-white dark:bg-slate-800 hover:bg-emerald-500 hover:border-emerald-500 text-transparent hover:text-white cursor-pointer'
                          : 'border-slate-300'
                      }`}
                    >
                      <CheckSquare className="w-3 h-3" />
                    </button>
                    <span className="flex-1 text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {task}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleCheckTask(task)}
                        className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline shrink-0 cursor-pointer"
                      >
                        Xong
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Thầy Kiệt tick checkbox khi hoàn thành tại hiện trường
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {pendingTasks.length} mục tiêu
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

