'use client';

import React, { useState } from 'react';
import { Task, TASK_STATUS_CONFIG } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { formatDateVN } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface TaskApprovalModalProps {
  task: Task | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TaskApprovalModal({ task, onClose, onSuccess }: TaskApprovalModalProps) {
  const [mode, setMode] = useState<'review' | 'return'>('review');
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approveTask = useConstructionStore((s) => s.approveTask);
  const returnTask = useConstructionStore((s) => s.returnTask);
  const users = useConstructionStore((s) => s.users);
  const projects = useConstructionStore((s) => s.projects);
  const attachments = useConstructionStore((s) => s.attachments);
  const taskUpdates = useConstructionStore((s) => s.taskUpdates);

  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const taskAttachments = attachments.filter((a) => a.taskId === task.id);
  const updates = taskUpdates.filter((u) => u.taskId === task.id);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#6366F1'],
      });
    } catch {
      // ignore
    }
  };

  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      approveTask(task.id);
      triggerCelebration();
      toast.success('Đã duyệt nghiệm thu nhiệm vụ thành công!', {
        description: `Nhiệm vụ "${task.title}" đã được nghiệm thu và khóa cập nhật.`,
      });
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    }, 400);
  };

  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      toast.error('Vui lòng nhập lý do trả lại để kỹ sư biết cần sửa gì.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      returnTask(task.id, returnReason);
      toast.warning('Đã trả lại nhiệm vụ kèm lý do', {
        description: `Đã gửi thông báo cho ${assignee?.name || 'kỹ sư'}.`,
      });
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kiểm tra & Nghiệm thu nhiệm vụ"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {mode === 'review' ? 'Kiểm tra & Nghiệm thu nhiệm vụ' : 'Trả lại yêu cầu làm lại'}
              </h3>
              <p className="text-xs text-slate-400">
                {project?.code} • {project?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bảng duyệt"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Task Title & Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${TASK_STATUS_CONFIG[task.status].badgeClass}`}
              >
                {TASK_STATUS_CONFIG[task.status].label} ({task.progress}%)
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Hạn chót: {formatDateVN(task.dueDate)}
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{task.title}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Assignee Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">
                {assignee?.avatar || 'CB'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {assignee?.name}
                </div>
                <div className="text-[11px] text-slate-400">{assignee?.title}</div>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {assignee?.phone}
            </span>
          </div>

          {/* Latest report note from Thầy Kiệt */}
          {updates.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                Ghi chú nghiệm thu gần nhất
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                &ldquo;{updates[0].note}&rdquo;
              </p>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                Báo cáo lúc: {formatDateVN(updates[0].createdAt)}
              </div>
            </div>
          )}

          {/* Evidence Gallery */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Minh chứng & Sản phẩm đính kèm ({taskAttachments.length})
            </span>
            {taskAttachments.length === 0 ? (
              <div className="p-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400">
                Chưa có hình ảnh/tài liệu/video minh chứng nào được đính kèm.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {taskAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent text-white">
                      <p className="text-xs font-medium truncate">{att.name}</p>
                      {att.caption && (
                        <p className="text-[10px] text-slate-300 line-clamp-1">{att.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Return Mode Textarea */}
          {mode === 'return' && (
            <form onSubmit={handleReturn} className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-rose-500 uppercase tracking-wider">
                Lý do trả lại & Yêu cầu chỉnh sửa (Bắt buộc)
              </label>
              <textarea
                required
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Ví dụ: Thiếu tài liệu đối soát API thanh toán, âm thanh video chưa rõ ràng, cần bổ sung minh chứng tiêu chuẩn..."
                className="w-full p-3 rounded-xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          {mode === 'review' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('return')}
                className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                Yêu cầu làm lại
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Duyệt nghiệm thu (100%)
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode('review')}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                ← Quay lại kiểm tra
              </button>
              <button
                type="button"
                disabled={isSubmitting || !returnReason.trim()}
                onClick={handleReturn}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                Xác nhận trả lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

