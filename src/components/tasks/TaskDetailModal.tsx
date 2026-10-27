'use client';

import React, { useState } from 'react';
import {
  Task,
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
} from 'lucide-react';
import { formatDateVN, formatDateTimeVN, getRelativeDueLabel } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onOpenApproval?: (task: Task) => void;
  onOpenUpdate?: (task: Task) => void;
}

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết nhiệm vụ thi công"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${TASK_STATUS_CONFIG[task.status].badgeClass}`}
              >
                {TASK_STATUS_CONFIG[task.status].label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {project?.code} • {project?.name}
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng chi tiết nhiệm vụ"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status info bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tiến độ</span>
              <div className="font-tabular font-black text-lg text-amber-500">
                {task.progress}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Hạn chót</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {formatDateVN(task.dueDate)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tình trạng</span>
              <div className="mt-0.5">
                {dueInfo.isOverdue ? (
                  <span className="text-rose-600 font-bold">{dueInfo.label}</span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-300">{dueInfo.label}</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Người làm</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {assignee?.name}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Mục tiêu & Yêu cầu thực hiện
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              {task.description}
            </p>
          </div>

          {/* Subtasks Checklist */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                  Danh mục mục tiêu con (Subtasks)
                </h4>
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} hoàn thành
                </span>
              </div>
              <div className="space-y-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-800">
                {task.subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      disabled={task.status === 'approved' || currentUser.role === 'leader'}
                      onChange={() => toggleSubtask(task.id, st.id)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span
                      className={`text-xs ${
                        st.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-200 font-medium'
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
              <div className="flex items-center justify-between">
                <h4 className="font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Mục phát sinh & Trở ngại hiện trường ({task.incidents.length})
                </h4>
              </div>

              <div className="space-y-2.5">
                {task.incidents.map((inc) => {
                  const severityConfig = INCIDENT_SEVERITY_CONFIG[inc.severity];
                  const statusConfig = INCIDENT_STATUS_CONFIG[inc.status];

                  return (
                    <div
                      key={inc.id}
                      className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-slate-800/60 border border-amber-500/30 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {inc.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityConfig.badge}`}>
                            {severityConfig.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusConfig.badge}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        {inc.description}
                      </p>

                      {inc.solution && (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                          <strong className="block text-slate-700 dark:text-slate-300 mb-0.5 font-semibold">
                            Phương án xử lý:
                          </strong>
                          {inc.solution}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>Báo bởi: {inc.reportedBy} ({formatDateTimeVN(inc.reportedAt)})</span>

                        {currentUser.role !== 'leader' && inc.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateIncidentStatus(task.id, inc.id, 'resolved', 'Đã xử lý khắc phục hoàn tất.');
                              toast.success('Đã cập nhật mục phát sinh thành: Đã xử lý xong');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors"
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
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
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
              <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-500" />
                Hình ảnh & Video minh chứng hiện trường ({taskAttachments.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {taskAttachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => setSelectedMedia(att.url)}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 cursor-pointer shadow-xs hover:shadow-md transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {att.type === 'video' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-bold font-mono flex items-center gap-1 border border-amber-400/30">
                          <Film className="w-3 h-3" />
                          {att.duration ? `${Math.floor(att.duration / 60)}:${(att.duration % 60).toString().padStart(2, '0')}` : 'Video'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-sky-400 text-[10px] font-bold font-mono flex items-center gap-1 border border-white/20">
                          <ImageIcon className="w-3 h-3" /> Ảnh
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent text-white">
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
            <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-3">
              Lịch sử báo cáo & Minh chứng kết quả ({updates.length})
            </h4>

            {updates.length === 0 ? (
              <p className="text-slate-400 italic">Chưa có nhật ký báo cáo nào được ghi lại.</p>
            ) : (
              <div className="space-y-3">
                {updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        Cập nhật đạt {upd.progress}%
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {formatDateTimeVN(upd.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{upd.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' && task.status === 'submitted' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApproval?.(task);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <ShieldCheck className="w-4 h-4" />
                Kiểm tra & Nghiệm thu
              </button>
            )}

            {currentUser.role === 'assignee' &&
              task.assigneeId === currentUser.id &&
              task.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUpdate?.(task);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Edit3 className="w-4 h-4" />
                  Báo cáo tiến độ mới
                </button>
              )}
          </div>
        </div>
        {/* Lightbox Preview */}
        {selectedMedia && (
          <div
            onClick={() => setSelectedMedia(null)}
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2">
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedMedia}
                alt="Minh chứng"
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

