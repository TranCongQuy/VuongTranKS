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
} from 'lucide-react';
import { formatDateVN } from '@/lib/utils';

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

  return (
    <div className="space-y-6">
      {/* Gallery Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeType === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Tất cả ({projectAttachments.length})
          </button>
          <button
            onClick={() => setActiveType('image')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeType === 'image'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Hình ảnh ({projectAttachments.filter((a) => a.type === 'image').length})
          </button>
          <button
            onClick={() => setActiveType('video')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeType === 'video'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Video clip ({projectAttachments.filter((a) => a.type === 'video').length})
          </button>
        </div>

        {/* Task filter dropdown */}
        <select
          value={selectedTaskFilter}
          onChange={(e) => setSelectedTaskFilter(e.target.value)}
          aria-label="Lọc minh chứng theo hạng mục"
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-amber-500"
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
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có hình ảnh/video nào trong thư mục này
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Kỹ sư hiện trường sẽ đăng tải minh chứng khi cập nhật tiến độ thi công.
          </p>
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
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
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
                    <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/20">
                      {item.type === 'video' ? (
                        <>
                          <Video className="w-3 h-3 text-amber-400" />
                          <span>CLIP {item.duration || 7}s</span>
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
                      <div className="w-11 h-11 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
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
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </div>
                  {task && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 truncate mt-0.5 font-medium">
                      {task.title}
                    </div>
                  )}
                  {item.caption && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                      {item.caption}
                    </p>
                  )}
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    {formatDateVN(item.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {currentAttachment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem chi tiết ảnh minh chứng"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-150 lightbox-modal select-none"
        >
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>{currentAttachment.name}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-amber-400">
                  {lightboxIndex! + 1} / {filteredAttachments.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentAttachment.caption}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.25))}
                title="Thu nhỏ"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                title="Phóng to"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxIndex(null)}
                title="Đóng (ESC)"
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Previous Button */}
          <button
            onClick={() => {
              setLightboxIndex((prev) =>
                prev !== null
                  ? (prev - 1 + filteredAttachments.length) % filteredAttachments.length
                  : null
              );
              setZoomLevel(1);
            }}
            aria-label="Minh chứng trước"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Media Viewport */}
          <div className="max-w-4xl max-h-[75vh] p-4 flex items-center justify-center overflow-hidden">
            {currentAttachment.type === 'video' ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentAttachment.url}
                  alt={currentAttachment.name}
                  style={{ transform: `scale(${zoomLevel})` }}
                  className="max-h-[60vh] object-contain transition-transform"
                />
                {/* Video controls simulation */}
                <div className="w-full bg-slate-900/90 border-t border-slate-800 p-3 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                      className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
                    >
                      {isPlayingVideo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-amber-400">
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
                className="max-h-[75vh] max-w-full object-contain transition-transform duration-200 rounded-xl shadow-2xl"
              />
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={() => {
              setLightboxIndex((prev) =>
                prev !== null ? (prev + 1) % filteredAttachments.length : null
              );
              setZoomLevel(1);
            }}
            aria-label="Minh chứng tiếp theo"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

