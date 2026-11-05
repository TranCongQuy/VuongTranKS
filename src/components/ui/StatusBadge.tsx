import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'pine' | 'gold' | 'rose' | 'sky' | 'violet' | 'slate' | 'navy';

const TONES: Record<BadgeTone, string> = {
  pine: 'bg-pine-100 text-pine-700 dark:bg-pine-600/15 dark:text-pine-500',
  gold: 'bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-400',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  slate: 'bg-slate-200/70 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  navy: 'bg-navy-100 text-navy-800 dark:bg-navy-700/40 dark:text-navy-100',
};

export function StatusBadge({
  tone = 'slate',
  children,
  dot = false,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap',
        TONES[tone],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
