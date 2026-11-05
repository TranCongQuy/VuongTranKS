'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/** Switch dùng chung cho cài đặt & phân quyền. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Bật/tắt'}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        'relative w-11 h-[26px] rounded-full transition-colors cursor-pointer shrink-0',
        checked ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] w-5 h-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-[22px]' : 'left-[3px]'
        )}
      />
    </button>
  );
}
