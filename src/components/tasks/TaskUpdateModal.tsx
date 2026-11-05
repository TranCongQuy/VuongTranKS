'use client';

import React, { useState, useRef } from 'react';
import { Task, Attachment, IncidentSeverity } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import {
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
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Switch } from '@/components/ui/Switch';
import { IconBtn } from '@/components/ui/RowMenu';

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
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
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
    const errors: string[] = [];
    const MAX_SIZE_BYTES = 1.5 * 1024 * 1024; // Demo: giới hạn 1,5MB cho mọi tệp (ảnh & video) để data URL persist được trong localStorage

    setIsProcessingFiles(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Kiểm tra định dạng: Chỉ nhận ảnh và video
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          const error = `Tệp "${file.name}" không hợp lệ. Hệ thống chỉ chấp nhận hình ảnh hoặc video clip minh chứng kết quả.`;
          errors.push(error);
          continue;
        }

        // 2. Kiểm tra dung lượng tối đa 1,5MB/file — file lớn hơn bị bỏ qua
        if (file.size > MAX_SIZE_BYTES) {
          const error = `"${file.name}": Ảnh vượt quá 1,5MB, vui lòng nén hoặc chọn ảnh nhỏ hơn`;
          errors.push(error);
          continue;
        }

        // 3. Đọc tệp thật bằng FileReader thành Data URL (persist được qua localStorage, không vỡ sau reload như blob URL)
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Không thể đọc tệp'));
          reader.readAsDataURL(file);
        });

        // 4. Kiểm tra thời lượng video tối đa 10 phút (600s) — dùng Data URL, không dùng object URL
        let duration: number | undefined;
        if (file.type.startsWith('video/')) {
          try {
            const videoDuration = await new Promise<number>((resolve, reject) => {
              const videoElem = document.createElement('video');
              videoElem.preload = 'metadata';
              videoElem.onloadedmetadata = () => resolve(videoElem.duration);
              videoElem.onerror = () => reject('Không thể đọc thông tin video');
              videoElem.src = dataUrl;
            });

            if (videoDuration > 600.5) {
              const error = `Video "${file.name}" dài ${Math.round(videoDuration / 60)} phút. Quy định video hiện trường tối đa 10 phút để đảm bảo truyền tải ổn định.`;
              errors.push(error);
              continue;
            }
            duration = Math.round(videoDuration);
          } catch {
            duration = 180;
          }
        }

        const newAtt: Attachment = {
          id: `att-upload-${Date.now()}-${i}`,
          taskId: task.id,
          projectId: task.projectId,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          name: file.name,
          size: file.size,
          duration,
          url: dataUrl,
          uploadedBy: currentUser.id,
          createdAt: new Date().toISOString(),
        };
        newAttachmentsList.push(newAtt);
      }
    } finally {
      setIsProcessingFiles(false);
    }

    if (errors.length > 0) {
      const joined = errors.join(' ');
      setErrorMessage(joined);
      toast.error(joined);
    }
    if (newAttachmentsList.length > 0) {
      setAttachments((curr) => [...curr, ...newAttachmentsList]);
    }

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

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn-ghost">
        Đóng
      </button>
      {!isLocked && (
        <button
          type="submit"
          form="update-form"
          disabled={isSubmitting}
          className="btn-primary"
        >
          <Send className="w-4 h-4" />
          <span>Gửi báo cáo tiến độ</span>
        </button>
      )}
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Báo cáo tiến độ & Minh chứng"
      subtitle={task.title}
      footer={footer}
      size="lg"
    >
      <div className="space-y-5">
        {/* Locked state warning */}
        {isLocked && (
          <div className="p-4 rounded-2xl bg-pine-100/60 dark:bg-pine-600/10 border border-pine-500/30 text-pine-700 dark:text-pine-500 text-[13px] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <strong className="block font-bold">Nhiệm vụ này đã được nghiệm thu</strong>
              Hạng mục đã đạt 100% nghiệm thu kỹ thuật và được khóa chỉnh sửa.
            </div>
          </div>
        )}

        {/* Returned notice if any */}
        {task.status === 'returned' && task.returnReason && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-[13px] space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              Yêu cầu chỉnh sửa từ Chỉ huy trưởng:
            </div>
            <p className="italic bg-parchment/70 dark:bg-night-card/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20">
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
            <div className="p-4 rounded-2xl bg-cream dark:bg-night-line/40 border border-line dark:border-night-line space-y-3">
              <div className="flex items-center justify-between">
                <label className="lbl mb-0">
                  Mức độ hoàn thành thực tế
                </label>
                <span className="font-tabular text-xl font-black text-pine-700 dark:text-pine-500">
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
                className="w-full h-2.5 bg-cream-deep dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pine-600"
              />

              {/* Quick milestones — SegmentedControl thay hàng nút rời */}
              <SegmentedControl
                value={String(progress)}
                onChange={(v) => handleMilestoneClick(Number(v))}
                size="sm"
                options={[
                  { value: '25', label: '25%' },
                  { value: '50', label: '50%' },
                  { value: '75', label: '75%' },
                  { value: '100', label: '100% Nghiệm thu' },
                ]}
              />

              {progress === 100 && (
                <p className="text-[11px] text-navy-700 dark:text-navy-100 font-medium">
                  Báo 100% sẽ tự động chuyển nhiệm vụ sang trạng thái <strong>Chờ duyệt</strong> và gửi thông báo cho Thầy Vương.
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="lbl">
                Ghi chú nhật ký hiện trường *
              </label>
              <textarea
                required
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Mô tả cụ thể khối lượng đã làm hôm nay, chủng loại vật tư, kết quả đo đạc..."
                className="input text-[13px]"
              />
            </div>

            {/* Mục phát sinh / Sự cố hiện trường (Incident Reporting) */}
            <div className="p-4 rounded-2xl border border-gold-500/30 bg-gold-100/40 dark:bg-gold-500/5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-bold text-ink dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                  Ghi nhận mục phát sinh / Trở ngại thi công (thời tiết, chậm tiến độ,...)
                </span>
                <Switch
                  checked={hasIncident}
                  onChange={(v) => setHasIncident(v)}
                  label="Ghi nhận mục phát sinh"
                />
              </div>
              {hasIncident && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-400">
                  Báo cáo phát sinh
                </span>
              )}

              {hasIncident && (
                <div className="space-y-3 pt-3 border-t border-gold-500/20 text-[13px]">
                  <div>
                    <label className="lbl">Tiêu đề mục phát sinh *</label>
                    <input
                      type="text"
                      required={hasIncident}
                      value={incidentTitle}
                      onChange={(e) => setIncidentTitle(e.target.value)}
                      placeholder="Ví dụ: Mưa lớn ngập góc sân; Chậm giao ống D200; Địa chất yếu..."
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="lbl">Phân loại trở ngại</label>
                      <select
                        value={incidentType}
                        onChange={(e) =>
                          setIncidentType(
                            e.target.value as 'weather' | 'material' | 'technical' | 'site' | 'other'
                          )
                        }
                        className="input"
                      >
                        <option value="weather">Thời tiết / Mưa bão</option>
                        <option value="material">Chậm vật tư / Thiết bị</option>
                        <option value="technical">Kỹ thuật / Địa chất</option>
                        <option value="site">Mặt bằng / Hiện trường</option>
                        <option value="other">Phát sinh khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="lbl">Mức độ ảnh hưởng</label>
                      <select
                        value={incidentSeverity}
                        onChange={(e) => setIncidentSeverity(e.target.value as IncidentSeverity)}
                        className="input"
                      >
                        <option value="low">Nhẹ (Theo dõi thêm)</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Nghiêm trọng (Chậm tiến độ)</option>
                        <option value="critical">Rất khẩn cấp (Ngừng thi công)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="lbl">Mô tả chi tiết nguyên nhân</label>
                    <textarea
                      rows={2}
                      value={incidentDescription}
                      onChange={(e) => setIncidentDescription(e.target.value)}
                      placeholder="Mô tả cụ thể trở ngại hiện trường (ví dụ: mưa dầm 3 ngày liên tiếp khiến hố ga bị đọng nước)..."
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="lbl">Phương án khắc phục đề xuất</label>
                    <textarea
                      rows={2}
                      value={incidentSolution}
                      onChange={(e) => setIncidentSolution(e.target.value)}
                      placeholder="Ví dụ: Đã bố trí máy bơm rút nước, đề xuất bổ sung thêm đá dăm 1x2 để đầm nén lại..."
                      className="input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Attachments Upload Section */}
            <div>
              <label className="lbl">
                Đính kèm ảnh / video minh chứng (Tối đa 1,5MB/tệp — demo, video ≤ 10 phút)
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
                  className="p-4 rounded-2xl border-2 border-dashed border-line dark:border-night-line hover:border-pine-500 bg-cream dark:bg-night-line/30 text-center transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 text-pine-600" />
                  <span className="text-xs font-bold text-ink dark:text-slate-300">
                    Chọn ảnh / video
                  </span>
                  <span className="text-[10px] text-ink-soft dark:text-slate-400">Từ máy tính / thư viện</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-gold-500/60 bg-gold-100/50 dark:bg-gold-500/10 hover:bg-gold-100 text-center transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                  <span className="text-xs font-bold text-gold-600 dark:text-gold-400">
                    Chụp / Quay trực tiếp
                  </span>
                  <span className="text-[10px] text-gold-600/80 dark:text-gold-400/80">Camera công trường</span>
                </button>
              </div>

              {/* Trạng thái đọc tệp thật (FileReader) — không dùng % giả */}
              {isProcessingFiles && (
                <div className="mt-3 p-3 rounded-xl bg-cream-deep dark:bg-night-line/50 border border-line dark:border-night-line">
                  <span className="text-xs font-semibold text-ink dark:text-slate-300">
                    Đang xử lý tệp...
                  </span>
                </div>
              )}

              {/* Preview Selected Attachments */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="lbl">
                    Minh chứng chuẩn bị gửi ({attachments.length})
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="relative rounded-xl overflow-hidden border border-line dark:border-night-line p-2.5 bg-cream dark:bg-night-line/30 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {att.type === 'video' ? (
                            <Film className="w-4 h-4 text-gold-600 dark:text-gold-400 shrink-0" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-ink dark:text-slate-200 truncate">
                              {att.name}
                            </p>
                            <span className="text-[10px] text-ink-soft dark:text-slate-400 font-tabular">
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
                        <IconBtn label={`Xoá ${att.name}`} onClick={() => handleRemoveAttachment(att.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconBtn>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
