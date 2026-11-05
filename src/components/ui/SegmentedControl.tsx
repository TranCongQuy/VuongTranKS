'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

/**
 * SegmentedControl — thay cho mọi "hàng nút lọc" rời rạc.
 * variant="pill": cụm nút dính trong 1 khung (bộ lọc).
 * variant="tabs": thanh tab gạch chân vàng (dùng cho tab trang chi tiết).
 * Toàn app chỉ có 1 thẻ <button> lặp trong component này.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'pill',
  size = 'md',
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  variant?: 'pill' | 'tabs';
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (variant === 'tabs') {
    return (
      <div className={cn('flex items-center gap-1 overflow-x-auto border-b border-line dark:border-night-line', className)}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer',
                active
                  ? 'text-navy-900 dark:text-white'
                  : 'text-ink-soft dark:text-slate-400 hover:text-navy-900 dark:hover:text-slate-200'
              )}
            >
              {opt.icon}
              {opt.label}
              {typeof opt.count === 'number' && (
                <span
                  className={cn(
                    'text-[10.5px] font-bold px-1.5 py-0.5 rounded-full',
                    active ? 'bg-gold-100 text-gold-600 dark:bg-gold-500/20 dark:text-gold-400' : 'bg-slate-200/70 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'
                  )}
                >
                  {opt.count}
                </span>
              )}
              {active && <span className="absolute left-3 right-3 -bottom-px h-[3px] rounded-full bg-gold-500" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-[14px] bg-cream-deep/70 dark:bg-night-line/60 border border-line dark:border-night-line overflow-x-auto max-w-full',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-[13px]',
              active
                ? 'bg-navy-900 text-white shadow-md shadow-navy-900/20 dark:bg-gold-500 dark:text-navy-950'
                : 'text-ink-soft dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            )}
          >
            {opt.icon}
            {opt.label}
            {typeof opt.count === 'number' && (
              <span
                className={cn(
                  'text-[10.5px] font-bold px-1.5 py-0.5 rounded-full',
                  active ? 'bg-white/20 text-inherit' : 'bg-slate-200/80 text-slate-500 dark:bg-slate-700/70 dark:text-slate-400'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
