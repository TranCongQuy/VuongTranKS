'use client';

import React, { useState, useRef } from 'react';
import { Task, Attachment, IncidentSeverity } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import {
  X,
  Camera,
  UploadCloud,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Film,
  Image as ImageIcon,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskUpdateModalProps {
  task: Task | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TaskUpdateModal({ task, onClose, onSuccess }: TaskUpdateModalProps) {
  const updateTaskProgress = useConstructionStore((s) => s.updateTaskProgress);
  const addIncident = useConstructionStore((s) => s.addIncident);
  const currentUser = useConstructionStore((s) => s.currentUser);

  const [progress, setProgress] = useState(task ? task.progress : 50);
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Incident state
  const [hasIncident, setHasIncident] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentType, setIncidentType] = useState<'weather' | 'material' | 'technical' | 'site' | 'other'>('weather');
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>('high');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSolution, setIncidentSolution] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!task) return null;

  const isLocked = task.status === 'approved';

  const handleMilestoneClick = (val: number) => {
    setProgress(val);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const newAttachmentsList: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 1. Kiểm tra định dạng: Chỉ nhận ảnh và video
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        const error = `Tệp "${file.name}" không hợp lệ. Hệ thống chỉ chấp nhận hình ảnh hoặc video clip minh chứng kết quả.`;
        setErrorMessage(error);
        toast.error(error);
        return;
      }

      // 2. Kiểm tra dung lượng tối đa 300MB
      const maxSizeBytes = 300 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const error = `Tệp "${file.name}" dung lượng ${(file.size / (1024 * 1024)).toFixed(1)}MB vượt quá giới hạn cho phép (Tối đa 300MB).`;
        setErrorMessage(error);
        toast.error(error);
        return;
      }

      // 3. Kiểm tra thời lượng video tối đa 10 phút (600s)
      let duration: number | undefined;
      if (file.type.startsWith('video/')) {
        try {
          const videoDuration = await new Promise<number>((resolve, reject) => {
            const videoElem = document.createElement('video');
            videoElem.preload = 'metadata';
            videoElem.onloadedmetadata = () => {
              window.URL.revokeObjectURL(videoElem.src);
              resolve(videoElem.duration);
            };
            videoElem.onerror = () => reject('Không thể đọc thông tin video');
            videoElem.src = URL.createObjectURL(file);
          });

          if (videoDuration > 600.5) {
            const error = `Video "${file.name}" dài ${Math.round(videoDuration / 60)} phút. Quy định video hiện trường tối đa 10 phút để đảm bảo truyền tải ổn định.`;
            setErrorMessage(error);
            toast.error(error);
            return;
          }
          duration = Math.round(videoDuration);
        } catch {
          // If browser cannot compute metadata locally, allow file with safe duration
          duration = 180;
        }
      }

      // Create object URL or preview
      const previewUrl = URL.createObjectURL(file);
      const newAtt: Attachment = {
        id: `att-upload-${Date.now()}-${i}`,
        taskId: task.id,
        projectId: task.projectId,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
        size: file.size,
        duration,
        url: previewUrl,
        uploadedBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      newAttachmentsList.push(newAtt);
    }

    // Fake upload progress simulation
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          setAttachments((curr) => [...curr, ...newAttachmentsList]);
          setTimeout(() => setUploadProgress(null), 400);
          return 100;
        }
        return prev + 25;
      });
    }, 120);

    // reset input
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error('Vui lòng nhập ghi chú hiện trường.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      updateTaskProgress(task.id, {
        note,
        progress,
        attachments,
      });

      // If there's an incident reported
      if (hasIncident && incidentTitle.trim()) {
        addIncident(task.id, {
          title: incidentTitle.trim(),
          type: incidentType,
          severity: incidentSeverity,
          description: incidentDescription.trim() || 'Phát sinh trở ngại ghi nhận tại hiện trường.',
          solution: incidentSolution.trim() || undefined,
          status: 'open',
          reportedBy: currentUser.name,
        });
        toast.warning('Đã ghi nhận mục phát sinh hiện trường mới!', {
          description: `Thông báo đã gửi tới Thầy Vương và Lãnh đạo giám sát.`,
        });
      }

      if (progress === 100) {
        toast.success('Đã gửi báo cáo hoàn thành 100%!', {
          description: 'Nhiệm vụ đã chuyển sang trạng thái "Chờ duyệt" và thông báo tới Chủ trì dự án.',
        });
      } else {
        toast.success(`Đã cập nhật tiến độ nhiệm vụ lên ${progress}%!`);
      }

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    }, 350);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cập nhật tiến độ & Minh chứng hiện trường"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Báo cáo tiến độ & Minh chứng</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
              {task.title}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng biểu mẫu cập nhật"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Locked state warning */}
          {isLocked && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <strong className="block font-bold">Nhiệm vụ này đã được nghiệm thu</strong>
                Hạng mục đã đạt 100% nghiệm thu kỹ thuật và được khóa chỉnh sửa.
              </div>
            </div>
          )}

          {/* Returned notice if any */}
          {task.status === 'returned' && task.returnReason && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                Yêu cầu chỉnh sửa từ Chỉ huy trưởng:
              </div>
              <p className="italic bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                &ldquo;{task.returnReason}&rdquo;
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isLocked && (
            <form onSubmit={handleSubmit} id="update-form" className="space-y-5">
              {/* Progress Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Mức độ hoàn thành thực tế:
                  </label>
                  <span className="font-tabular text-xl font-black text-amber-500">
                    {progress}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                {/* Quick milestone pills */}
                <div className="flex items-center justify-between pt-1">
                  {[25, 50, 75, 100].map((milestone) => (
                    <button
                      key={milestone}
                      type="button"
                      onClick={() => handleMilestoneClick(milestone)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                        progress === milestone
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {milestone}% {milestone === 100 ? '⭐ Nghiệm thu' : ''}
                    </button>
                  ))}
                </div>

                {progress === 100 && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    ⚡ Báo 100% sẽ tự động chuyển nhiệm vụ sang trạng thái <strong>Chờ duyệt</strong> và gửi thông báo cho Thầy Vương.
                  </p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Ghi chú nhật ký hiện trường *
                </label>
                <textarea
                  required
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Mô tả cụ thể khối lượng đã làm hôm nay, chủng loại vật tư, kết quả đo đạc..."
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Mục phát sinh / Sự cố hiện trường (Incident Reporting) */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasIncident}
                      onChange={(e) => setHasIncident(e.target.checked)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Ghi nhận mục phát sinh / Trở ngại thi công (thời tiết, chậm tiến độ,...)
                    </span>
                  </label>
                  {hasIncident && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      Báo cáo phát sinh
                    </span>
                  )}
                </div>

                {hasIncident && (
                  <div className="space-y-3 pt-2 border-t border-amber-500/20 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tiêu đề mục phát sinh *
                      </label>
                      <input
                        type="text"
                        required={hasIncident}
                        value={incidentTitle}
                        onChange={(e) => setIncidentTitle(e.target.value)}
                        placeholder="Ví dụ: Mưa lớn ngập góc sân; Chậm giao ống D200; Địa chất yếu..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Phân loại trở ngại
                        </label>
                        <select
                          value={incidentType}
                          onChange={(e) =>
                            setIncidentType(
                              e.target.value as 'weather' | 'material' | 'technical' | 'site' | 'other'
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="weather">Thời tiết / Mưa bão</option>
                          <option value="material">Chậm vật tư / Thiết bị</option>
                          <option value="technical">Kỹ thuật / Địa chất</option>
                          <option value="site">Mặt bằng / Hiện trường</option>
                          <option value="other">Phát sinh khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Mức độ ảnh hưởng
                        </label>
                        <select
                          value={incidentSeverity}
                          onChange={(e) => setIncidentSeverity(e.target.value as IncidentSeverity)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="low">Nhẹ (Theo dõi thêm)</option>
                          <option value="medium">Trung bình</option>
                          <option value="high">Nghiêm trọng (Chậm tiến độ)</option>
                          <option value="critical">Rất khẩn cấp (Ngừng thi công)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mô tả chi tiết nguyên nhân
                      </label>
                      <textarea
                        rows={2}
                        value={incidentDescription}
                        onChange={(e) => setIncidentDescription(e.target.value)}
                        placeholder="Mô tả cụ thể trở ngại hiện trường (ví dụ: mưa dầm 3 ngày liên tiếp khiến hố ga bị đọng nước)..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Phương án khắc phục đề xuất
                      </label>
                      <textarea
                        rows={2}
                        value={incidentSolution}
                        onChange={(e) => setIncidentSolution(e.target.value)}
                        placeholder="Ví dụ: Đã bố trí máy bơm rút nước, đề xuất bổ sung thêm đá dăm 1x2 để đầm nén lại..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments Upload Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Đính kèm ảnh / video minh chứng (Tối đa 50MB, video ≤ 10s)
                </label>

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleFilesSelected}
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 bg-slate-50 dark:bg-slate-800/40 text-center transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Chọn ảnh / video
                    </span>
                    <span className="text-[10px] text-slate-400">Từ máy tính / thư viện</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-amber-400/80 bg-amber-500/10 hover:bg-amber-500/15 text-center transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    <Camera className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      Chụp / Quay trực tiếp
                    </span>
                    <span className="text-[10px] text-amber-600/80">Camera công trường</span>
                  </button>
                </div>

                {/* Simulated upload progress */}
                {uploadProgress !== null && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Đang xử lý tệp tin...
                      </span>
                      <span className="font-mono font-bold text-amber-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Preview Selected Attachments */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Minh chứng chuẩn bị gửi ({attachments.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {att.type === 'video' ? (
                              <Film className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                {att.name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {att.size > 1024 * 1024
                                  ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
                                  : `${(att.size / 1024).toFixed(0)} KB`}{' '}
                                {att.duration
                                  ? `• ${Math.floor(att.duration / 60)}:${(att.duration % 60)
                                      .toString()
                                      .padStart(2, '0')}`
                                  : ''}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
          >
            Đóng
          </button>
          {!isLocked && (
            <button
              type="submit"
              form="update-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Gửi báo cáo tiến độ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

