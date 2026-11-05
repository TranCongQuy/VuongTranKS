'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RowMenuItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

/**
 * RowMenu — menu "..." dùng chung cho MỌI hành động theo dòng/thẻ.
 * Đây là cơ chế chính để diệt "ngộ độc nút": thay vì 2-4 nút trên mỗi thẻ/dòng,
 * chỉ còn 1 nút icon mở menu này.
 */
export function RowMenu({
  items,
  align = 'right',
  label = 'Thao tác',
  dark = false,
}: {
  items: RowMenuItem[];
  align?: 'left' | 'right';
  label?: string;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer',
          dark
            ? 'bg-black/45 text-white backdrop-blur-sm hover:bg-black/65'
            : 'text-ink-soft dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
        )}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-40 top-11 min-w-48 card p-1.5 animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-left transition-colors cursor-pointer',
                item.danger
                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                  : 'text-ink dark:text-slate-200 hover:bg-indigo-50/70 dark:hover:bg-slate-800'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** IconBtn — nút icon điều hướng dùng chung (đóng, quay lại, mở menu...). */
export function IconBtn({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center text-ink-soft dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer shrink-0',
        className
      )}
    >
      {children}
    </button>
  );
}
