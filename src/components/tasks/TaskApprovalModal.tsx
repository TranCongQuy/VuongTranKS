'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, TASK_STATUS_CONFIG } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
} from 'lucide-react';
import { formatDateVN } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { RowMenu } from '@/components/ui/RowMenu';

interface TaskApprovalModalProps {
  task: Task | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  todo: 'slate',
  in_progress: 'gold',
  submitted: 'violet',
  approved: 'pine',
  returned: 'rose',
};

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
        colors: ['#0e7c5b', '#c9a227', '#0b2239', '#129a73'],
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

  const footer =
    mode === 'review' ? (
      <>
        <button type="button" onClick={onClose} className="btn-ghost">
          Đóng
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleApprove}
          className="btn-primary"
        >
          <CheckCircle2 className="w-4 h-4" />
          Duyệt nghiệm thu (100%)
        </button>
      </>
    ) : (
      <>
        <button type="button" onClick={() => setMode('review')} className="btn-ghost">
          ← Quay lại kiểm tra
        </button>
        <button
          type="button"
          disabled={isSubmitting || !returnReason.trim()}
          onClick={handleReturn}
          className="btn-primary"
        >
          <AlertTriangle className="w-4 h-4" />
          Xác nhận trả lại
        </button>
      </>
    );

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'review' ? 'Kiểm tra & Nghiệm thu nhiệm vụ' : 'Trả lại yêu cầu làm lại'}
      subtitle={`${project?.code} • ${project?.name}`}
      footer={footer}
      size="lg"
    >
      <div className="space-y-5">
        {/* Secondary action — gom vào RowMenu ở đầu thân modal */}
        {mode === 'review' && (
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow">Hồ sơ nghiệm thu</span>
            <RowMenu
              label="Thao tác khác"
              items={[
                {
                  label: 'Yêu cầu làm lại',
                  icon: <AlertTriangle className="w-4 h-4" />,
                  danger: true,
                  onClick: () => setMode('return'),
                },
              ]}
            />
          </div>
        )}

        {/* Task Title & Status */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge tone={STATUS_TONE[task.status]}>
              {TASK_STATUS_CONFIG[task.status].label} ({task.progress}%)
            </StatusBadge>
            <span className="text-xs text-ink-soft dark:text-slate-400 flex items-center gap-1 font-tabular">
              <Calendar className="w-3.5 h-3.5" />
              Hạn chót: {formatDateVN(task.dueDate)}
            </span>
          </div>
          <h4 className="text-lg font-bold text-ink dark:text-white">{task.title}</h4>
          <p className="text-[13px] text-ink-soft dark:text-slate-300 mt-1 leading-relaxed">
            {task.description}
          </p>
        </div>

        {/* Assignee Card */}
        <div className="p-3.5 rounded-2xl bg-cream dark:bg-night-line/40 border border-line dark:border-night-line flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar text={assignee?.avatar || 'CB'} tone="gold" />
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink dark:text-slate-200 truncate">
                {assignee?.name}
              </div>
              <div className="text-[11px] text-ink-soft dark:text-slate-400 truncate">{assignee?.title}</div>
            </div>
          </div>
          <span className="text-xs font-medium text-ink-soft dark:text-slate-400 font-tabular shrink-0">
            {assignee?.phone}
          </span>
        </div>

        {/* Latest report note */}
        {updates.length > 0 && (
          <div className="p-4 rounded-2xl bg-navy-100/50 dark:bg-navy-800/30 border border-navy-100 dark:border-navy-700/50">
            <span className="lbl flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Ghi chú nghiệm thu gần nhất
            </span>
            <p className="text-[13px] text-ink dark:text-slate-300 leading-relaxed italic">
              &ldquo;{updates[0].note}&rdquo;
            </p>
            <div className="text-[10px] text-ink-soft dark:text-slate-400 mt-2 font-tabular">
              Báo cáo lúc: {formatDateVN(updates[0].createdAt)}
            </div>
          </div>
        )}

        {/* Evidence Gallery */}
        <div>
          <span className="lbl">
            Minh chứng &amp; Sản phẩm đính kèm ({taskAttachments.length})
          </span>
          {taskAttachments.length === 0 ? (
            <div className="p-4 text-center rounded-2xl border border-dashed border-line dark:border-night-line text-xs text-ink-soft dark:text-slate-400">
              Chưa có hình ảnh/tài liệu/video minh chứng nào được đính kèm.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {taskAttachments.map((att) => (
                <div
                  key={att.id}
                  className="group relative rounded-2xl overflow-hidden border border-line dark:border-night-line bg-navy-950"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent text-white">
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
          <form onSubmit={handleReturn} className="space-y-2 pt-1">
            <label className="lbl text-rose-600 dark:text-rose-400">
              Lý do trả lại &amp; Yêu cầu chỉnh sửa (Bắt buộc)
            </label>
            <textarea
              required
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Ví dụ: Thiếu tài liệu đối soát API thanh toán, âm thanh video chưa rõ ràng, cần bổ sung minh chứng tiêu chuẩn..."
              className="input text-[13px]"
            />
          </form>
        )}
      </div>
    </Modal>
  );
}
