'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal shell dùng chung cho mọi modal trong app.
 * Kỷ luật footer: truyền vào tối đa 1 nút .btn-primary + 1 nút .btn-ghost.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const w = size === 'md' ? 'max-w-lg' : size === 'xl' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px] animate-in fade-in duration-150" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full card rounded-b-none sm:rounded-b-[20px] max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200',
          w
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line dark:border-night-line shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-ink dark:text-white truncate">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-soft dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            aria-label="Đóng"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-soft dark:text-slate-400 hover:bg-cream-deep dark:hover:bg-night-line hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 grow">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line dark:border-night-line shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
