'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import {
  Image as ImageIcon,
  Video,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  Maximize2,
  FileText,
} from 'lucide-react';
import { formatDateVN } from '@/lib/utils';
import { EmptyState } from '@/components/ui/cards';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { IconBtn } from '@/components/ui/RowMenu';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ProjectGalleryProps {
  projectId: string;
  tasks: Task[];
}

export function ProjectGallery({ projectId, tasks }: ProjectGalleryProps) {
  const attachments = useConstructionStore((s) => s.attachments);

  const [activeType, setActiveType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);

  const projectAttachments = attachments.filter((a) => a.projectId === projectId);

  const filteredAttachments = projectAttachments.filter((a) => {
    const matchesType = activeType === 'all' || a.type === activeType;
    const matchesTask = selectedTaskFilter === 'all' || a.taskId === selectedTaskFilter;
    return matchesType && matchesTask;
  });

  // Lightbox keyboard controls
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % filteredAttachments.length : null
        );
        setZoomLevel(1);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null
            ? (prev - 1 + filteredAttachments.length) % filteredAttachments.length
            : null
        );
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredAttachments.length]);

  const currentAttachment =
    lightboxIndex !== null ? filteredAttachments[lightboxIndex] : null;

  const goPrev = () => {
    setLightboxIndex((prev) =>
      prev !== null
        ? (prev - 1 + filteredAttachments.length) % filteredAttachments.length
        : null
    );
    setZoomLevel(1);
  };

  const goNext = () => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % filteredAttachments.length : null
    );
    setZoomLevel(1);
  };

  return (
    <div className="space-y-5">
      {/* Gallery Filter Toolbar */}
      <div className="card px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl<'all' | 'image' | 'video'>
          value={activeType}
          onChange={(v) => setActiveType(v)}
          size="sm"
          options={[
            { value: 'all', label: 'Tất cả', count: projectAttachments.length },
            {
              value: 'image',
              label: 'Hình ảnh',
              count: projectAttachments.filter((a) => a.type === 'image').length,
              icon: <ImageIcon className="w-3.5 h-3.5" />,
            },
            {
              value: 'video',
              label: 'Video clip',
              count: projectAttachments.filter((a) => a.type === 'video').length,
              icon: <Video className="w-3.5 h-3.5" />,
            },
          ]}
        />

        {/* Task filter dropdown */}
        <select
          value={selectedTaskFilter}
          onChange={(e) => setSelectedTaskFilter(e.target.value)}
          aria-label="Lọc minh chứng theo hạng mục"
          className="input sm:w-64 py-2 text-xs font-medium"
        >
          <option value="all">Lọc theo tất cả nhiệm vụ</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Evidence */}
      {filteredAttachments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ImageIcon className="w-6 h-6" />}
            title="Chưa có hình ảnh/video nào trong thư mục này"
            description="Kỹ sư hiện trường sẽ đăng tải minh chứng khi cập nhật tiến độ thi công."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredAttachments.map((item, index) => {
            const task = tasks.find((t) => t.id === item.taskId);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setLightboxIndex(index);
                  setZoomLevel(1);
                }}
                className="group relative rounded-[20px] overflow-hidden bg-navy-950 border border-line dark:border-night-line shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image / Video preview */}
                <div className="relative h-48 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                  {/* Top Type Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/20">
                      {item.type === 'video' ? (
                        <>
                          <Video className="w-3 h-3 text-gold-400" />
                          <span>CLIP {item.duration || 7}s</span>
                        </>
                      ) : item.type === 'document' ? (
                        <>
                          <FileText className="w-3 h-3 text-rose-400" />
                          <span>TÀI LIỆU PDF</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3 text-sky-400" />
                          <span>HÌNH ẢNH</span>
                        </>
                      )}
                    </span>
                  </div>

                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 rounded-lg bg-black/70 text-white backdrop-blur-md">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-3.5 bg-parchment dark:bg-night-card grow">
                  <div className="font-bold text-xs text-ink dark:text-white truncate">
                    {item.name}
                  </div>
                  {task && (
                    <div className="text-[11px] text-gold-600 dark:text-gold-400 truncate mt-0.5 font-semibold">
                      {task.title}
                    </div>
                  )}
                  {item.caption && (
                    <p className="text-[11px] text-ink-soft dark:text-slate-400 line-clamp-1 mt-1">
                      {item.caption}
                    </p>
                  )}
                  <div className="text-[10px] text-ink-soft dark:text-slate-500 mt-1.5 font-tabular">
                    {formatDateVN(item.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal — logic giữ nguyên, khung mới với IconBtn */}
      {currentAttachment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem chi tiết ảnh minh chứng"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 backdrop-blur-md animate-in fade-in duration-150 lightbox-modal select-none"
        >
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="min-w-0">
              <div className="font-bold text-sm text-white flex items-center gap-2 flex-wrap">
                <span className="truncate">{currentAttachment.name}</span>
                <StatusBadge tone="gold">
                  {lightboxIndex! + 1} / {filteredAttachments.length}
                </StatusBadge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{currentAttachment.caption}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 [&_button]:text-white [&_button]:hover:bg-white/15 [&_button]:hover:text-white">
              <IconBtn label="Thu nhỏ" onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.25))}>
                <ZoomOut className="w-4 h-4" />
              </IconBtn>
              <IconBtn label="Phóng to" onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}>
                <ZoomIn className="w-4 h-4" />
              </IconBtn>
              <IconBtn label="Đóng (ESC)" onClick={() => setLightboxIndex(null)}>
                <X className="w-5 h-5" />
              </IconBtn>
            </div>
          </div>

          {/* Previous */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 [&_button]:w-11 [&_button]:h-11 [&_button]:rounded-full [&_button]:bg-white/10 [&_button]:text-white [&_button]:hover:bg-white/25 [&_button]:hover:text-white">
            <IconBtn label="Minh chứng trước" onClick={goPrev}>
              <ChevronLeft className="w-6 h-6" />
            </IconBtn>
          </div>

          {/* Media Viewport */}
          <div className="max-w-4xl max-h-[75vh] p-4 flex items-center justify-center overflow-hidden">
            {currentAttachment.type === 'document' ? (
              <div className="rounded-[20px] border border-night-line bg-navy-950 shadow-2xl p-8 text-center text-slate-200">
                <FileText className="w-10 h-10 mx-auto text-rose-400" />
                <p className="font-bold mt-3">{currentAttachment.name}</p>
                <p className="text-xs text-slate-400 mt-1">Tài liệu PDF (biên bản / CO-CQ) — tải xuống để xem nội dung.</p>
                <a href={currentAttachment.url} download={currentAttachment.name} className="btn-primary inline-flex mt-4">Tải tài liệu PDF</a>
              </div>
            ) : currentAttachment.type === 'video' ? (
              <div className="relative rounded-[20px] overflow-hidden border border-night-line bg-navy-950 shadow-2xl flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentAttachment.url}
                  alt={currentAttachment.name}
                  style={{ transform: `scale(${zoomLevel})` }}
                  className="max-h-[60vh] object-contain transition-transform"
                />
                {/* Video controls simulation */}
                <div className="w-full bg-night-card border-t border-night-line p-3 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <IconBtn
                      label={isPlayingVideo ? 'Tạm dừng' : 'Phát'}
                      onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                      className="bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white rounded-lg"
                    >
                      {isPlayingVideo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </IconBtn>
                    <span className="font-tabular text-gold-400">
                      00:0{isPlayingVideo ? 4 : 0} / 00:0{currentAttachment.duration || 7}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Video chuẩn kiểm định hiện trường (≤ 10 giây)
                  </span>
                </div>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAttachment.url}
                alt={currentAttachment.name}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-h-[75vh] max-w-full object-contain transition-transform duration-200 rounded-[20px] shadow-2xl"
              />
            )}
          </div>

          {/* Next */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 [&_button]:w-11 [&_button]:h-11 [&_button]:rounded-full [&_button]:bg-white/10 [&_button]:text-white [&_button]:hover:bg-white/25 [&_button]:hover:text-white">
            <IconBtn label="Minh chứng tiếp theo" onClick={goNext}>
              <ChevronRight className="w-6 h-6" />
            </IconBtn>
          </div>
        </div>
      )}
    </div>
  );
}
