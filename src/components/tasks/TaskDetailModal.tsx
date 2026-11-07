'use client';

import React, { useState } from 'react';
import {
  Task,
  TaskStatus,
  TASK_STATUS_CONFIG,
  INCIDENT_SEVERITY_CONFIG,
  INCIDENT_STATUS_CONFIG,
} from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Edit3,
  FileText,
  CheckSquare,
  Film,
  Image as ImageIcon,
  Printer,
} from 'lucide-react';
import { formatDateVN, formatDateTimeVN, getRelativeDueLabel } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/cards';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { IconBtn } from '@/components/ui/RowMenu';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onOpenApproval?: (task: Task) => void;
  onOpenUpdate?: (task: Task) => void;
}

const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  todo: 'slate',
  in_progress: 'gold',
  submitted: 'violet',
  approved: 'pine',
  returned: 'rose',
};

const severityTone = (severity: string): BadgeTone =>
  severity === 'critical' || severity === 'high' ? 'rose' : severity === 'medium' ? 'gold' : 'slate';

const incidentStatusTone = (status: string): BadgeTone =>
  status === 'resolved' ? 'pine' : status === 'resolving' ? 'gold' : 'rose';

export function TaskDetailModal({
  task,
  onClose,
  onOpenApproval,
  onOpenUpdate,
}: TaskDetailModalProps) {
  const users = useConstructionStore((s) => s.users);
  const projects = useConstructionStore((s) => s.projects);
  const taskUpdates = useConstructionStore((s) => s.taskUpdates);
  const attachments = useConstructionStore((s) => s.attachments);
  const currentUser = useConstructionStore((s) => s.currentUser);
  const toggleSubtask = useConstructionStore((s) => s.toggleSubtask);
  const updateIncidentStatus = useConstructionStore((s) => s.updateIncidentStatus);

  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const updates = taskUpdates.filter((u) => u.taskId === task.id);
  const taskAttachments = attachments.filter((a) => a.taskId === task.id);
  const isApproved = task.status === 'approved';
  const dueInfo = getRelativeDueLabel(task.dueDate, isApproved);

  // Primary action theo trạng thái hiện tại (tối đa 1 nút primary ở footer)
  const primaryAction =
    currentUser.role === 'admin' && task.status === 'submitted'
      ? {
          label: 'Kiểm tra & Nghiệm thu',
          icon: <ShieldCheck className="w-4 h-4" />,
          onClick: () => {
            onClose();
            onOpenApproval?.(task);
          },
        }
      : currentUser.role === 'assignee' && task.assigneeId === currentUser.id && task.status !== 'approved'
        ? {
            label: 'Báo cáo tiến độ mới',
            icon: <Edit3 className="w-4 h-4" />,
            onClick: () => {
              onClose();
              onOpenUpdate?.(task);
            },
          }
        : null;

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn-ghost">
        Đóng
      </button>
      {/* Chỉ task ĐÃ NGHIỆM THU mới có biên bản nghiệm thu để in */}
      {isApproved && (
        <a
          href={`/reports/minutes/${task.id}`}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
        >
          <Printer className="w-4 h-4" />
          In biên bản nghiệm thu
        </a>
      )}
      {primaryAction && (
        <button type="button" onClick={primaryAction.onClick} className="btn-primary">
          {primaryAction.icon}
          {primaryAction.label}
        </button>
      )}
    </>
  );

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={task.title}
        subtitle={`${project?.code} • ${project?.name}`}
        footer={footer}
        size="lg"
      >
        <div className="space-y-6 text-[13px]">
          <div>
            <StatusBadge tone={STATUS_TONE[task.status]} dot>
              {TASK_STATUS_CONFIG[task.status].label}
            </StatusBadge>
          </div>

          {/* Status info bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-night-line/40 border border-line dark:border-night-line">
            <div>
              <span className="lbl">Tiến độ</span>
              <div className="font-tabular font-black text-lg text-pine-700 dark:text-pine-500">
                {task.progress}%
              </div>
              <ProgressBar value={task.progress} tone="pine" h="h-1.5" className="mt-1.5" />
            </div>
            <div>
              <span className="lbl">Hạn chót</span>
              <div className="font-bold text-ink dark:text-slate-200">
                {formatDateVN(task.dueDate)}
              </div>
            </div>
            <div>
              <span className="lbl">Tình trạng</span>
              <div>
                {dueInfo.isOverdue ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">{dueInfo.label}</span>
                ) : (
                  <span className="text-ink-soft dark:text-slate-300">{dueInfo.label}</span>
                )}
              </div>
            </div>
            <div>
              <span className="lbl">Người làm</span>
              <div className="font-bold text-ink dark:text-slate-200 truncate">
                {assignee?.name}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="lbl">Mục tiêu &amp; Yêu cầu thực hiện</h4>
            <p className="text-ink-soft dark:text-slate-300 leading-relaxed bg-[#F8FAFC] dark:bg-night-line/30 p-4 rounded-2xl border border-line dark:border-night-line">
              {task.description}
            </p>
          </div>

          {/* Subtasks Checklist */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="lbl flex items-center gap-1.5 mb-0">
                  <CheckSquare className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                  Danh mục mục tiêu con (Subtasks)
                </h4>
                <span className="text-[11px] font-tabular font-semibold text-ink-soft dark:text-slate-400">
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} hoàn thành
                </span>
              </div>
              <div className="rounded-2xl bg-[#F8FAFC] dark:bg-night-line/30 p-2 border border-line dark:border-night-line divide-y divide-line/70 dark:divide-night-line/70">
                {task.subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl hover:bg-parchment dark:hover:bg-night-card transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      disabled={task.status === 'approved' || currentUser.role === 'leader'}
                      onChange={() => toggleSubtask(task.id, st.id)}
                      className="rounded border-slate-300 accent-pine-600 w-4 h-4"
                    />
                    <span
                      className={`text-[13px] ${
                        st.completed
                          ? 'line-through text-ink-soft/70 dark:text-slate-500'
                          : 'text-ink dark:text-slate-200 font-medium'
                      }`}
                    >
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Incidents Section */}
          {task.incidents && task.incidents.length > 0 && (
            <div className="space-y-3">
              <h4 className="lbl text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Mục phát sinh &amp; Trở ngại hiện trường ({task.incidents.length})
              </h4>

              <div className="space-y-2.5">
                {task.incidents.map((inc) => {
                  const severityConfig = INCIDENT_SEVERITY_CONFIG[inc.severity];
                  const statusConfig = INCIDENT_STATUS_CONFIG[inc.status];

                  return (
                    <div
                      key={inc.id}
                      className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="font-bold text-ink dark:text-white text-[13px]">
                          {inc.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge tone={severityTone(inc.severity)}>{severityConfig.label}</StatusBadge>
                          <StatusBadge tone={incidentStatusTone(inc.status)}>{statusConfig.label}</StatusBadge>
                        </div>
                      </div>

                      <p className="text-ink-soft dark:text-slate-300 leading-relaxed text-xs">
                        {inc.description}
                      </p>

                      {inc.solution && (
                        <div className="p-3 rounded-xl bg-parchment dark:bg-night-card border border-line dark:border-night-line text-xs text-pine-700 dark:text-pine-500">
                          <strong className="block text-ink dark:text-slate-300 mb-0.5 font-semibold">
                            Phương án xử lý:
                          </strong>
                          {inc.solution}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[10px] text-ink-soft dark:text-slate-400 gap-2">
                        <span>Báo bởi: {inc.reportedBy} ({formatDateTimeVN(inc.reportedAt)})</span>

                        {currentUser.role !== 'leader' && inc.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateIncidentStatus(task.id, inc.id, 'resolved', 'Đã xử lý khắc phục hoàn tất.');
                              toast.success('Đã cập nhật mục phát sinh thành: Đã xử lý xong');
                            }}
                            className="btn-quiet text-pine-700 dark:text-pine-500 font-bold shrink-0"
                          >
                            Đánh dấu đã giải quyết
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Return Reason Warning */}
          {task.status === 'returned' && task.returnReason && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4" />
                Lý do hoàn trả yêu cầu hoàn thiện:
              </span>
              <p className="text-rose-800 dark:text-rose-200 italic">{task.returnReason}</p>
            </div>
          )}

          {/* Attachments & Videos */}
          {taskAttachments.length > 0 && (
            <div>
              <h4 className="lbl flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                Hình ảnh &amp; Video minh chứng hiện trường ({taskAttachments.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {taskAttachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => setSelectedMedia(att.url)}
                    className="group relative rounded-[20px] overflow-hidden border border-line dark:border-night-line bg-navy-950 cursor-pointer hover:shadow-md transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {att.type === 'video' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-bold font-tabular flex items-center gap-1 border border-amber-400/30">
                          <Film className="w-3 h-3" />
                          {att.duration ? `${Math.floor(att.duration / 60)}:${(att.duration % 60).toString().padStart(2, '0')}` : 'Video'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-sky-400 text-[10px] font-bold font-tabular flex items-center gap-1 border border-white/20">
                          <ImageIcon className="w-3 h-3" /> Ảnh
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent text-white">
                      <p className="text-xs font-semibold truncate">{att.name}</p>
                      {att.caption && (
                        <p className="text-[10px] text-slate-300 line-clamp-1">{att.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update History Log */}
          <div>
            <h4 className="lbl">
              Lịch sử báo cáo &amp; Minh chứng kết quả ({updates.length})
            </h4>

            {updates.length === 0 ? (
              <p className="text-ink-soft dark:text-slate-400 italic">Chưa có nhật ký báo cáo nào được ghi lại.</p>
            ) : (
              <div className="space-y-2.5">
                {updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="p-4 rounded-2xl bg-parchment dark:bg-night-card border border-line dark:border-night-line"
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="font-bold text-ink dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                        Cập nhật đạt {upd.progress}%
                      </span>
                      <span className="font-tabular text-[10px] text-ink-soft dark:text-slate-400">
                        {formatDateTimeVN(upd.createdAt)}
                      </span>
                    </div>
                    <p className="text-ink-soft dark:text-slate-300 leading-relaxed">{upd.note}</p>
                    {(upd.weather || upd.manpower || upd.logDate) && (
                      <p className="text-[11px] text-ink-soft dark:text-slate-400 mt-1">
                        {upd.logDate ? `Ngày thi công: ${upd.logDate} · ` : ''}{upd.weather ? `Thời tiết: ${upd.weather} · ` : ''}{upd.manpower ? `Nhân lực: ${upd.manpower}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Lightbox Preview — logic giữ nguyên, nút đóng = IconBtn */}
      {selectedMedia && (
        <div
          onClick={() => setSelectedMedia(null)}
          className="fixed inset-0 z-[80] bg-navy-950/85 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-2xl w-full bg-navy-950 rounded-[20px] overflow-hidden p-2">
            <div className="absolute top-4 right-4 z-10 [&_button]:bg-black/60 [&_button]:text-white [&_button]:hover:bg-black/80 [&_button]:hover:text-white [&_button]:rounded-full">
              <IconBtn label="Đóng xem ảnh" onClick={() => setSelectedMedia(null)}>
                <X className="w-5 h-5" />
              </IconBtn>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedMedia}
              alt="Minh chứng"
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
