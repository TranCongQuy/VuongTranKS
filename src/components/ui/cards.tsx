import React from 'react';
import { cn } from '@/lib/utils';

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  pad = true,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-bold text-ink dark:text-white truncate">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={pad ? 'px-5 pb-5' : ''}>{children}</div>
    </section>
  );
}

const TONE_RING: Record<string, string> = {
  pine: 'bg-pine-100 text-pine-700 dark:bg-pine-600/15 dark:text-pine-500',
  gold: 'bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-400',
  navy: 'bg-navy-100 text-navy-800 dark:bg-navy-700/30 dark:text-navy-100',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'pine',
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  tone?: keyof typeof TONE_RING;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft dark:text-slate-400">
          {label}
        </div>
        {icon && (
          <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', TONE_RING[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div className="text-[28px] leading-none font-extrabold font-tabular text-ink dark:text-white mt-2">
        {value}
      </div>
      {sub && <div className="text-xs text-ink-soft dark:text-slate-400 mt-2">{sub}</div>}
    </>
  );
  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        className="card p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all"
      >
        {inner}
      </div>
    );
  }
  return <div className="card p-5">{inner}</div>;
}

export function ProgressBar({
  value,
  tone = 'pine',
  className,
  h = 'h-2',
}: {
  value: number;
  tone?: 'pine' | 'gold' | 'rose' | 'navy';
  className?: string;
  h?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value || 0)));
  const bar =
    tone === 'gold'
      ? 'bg-gold-500'
      : tone === 'rose'
        ? 'bg-rose-500'
        : tone === 'navy'
          ? 'bg-navy-800 dark:bg-navy-100'
          : 'bg-pine-500';
  return (
    <div className={cn('w-full rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden', h, className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700', bar)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Avatar({
  text,
  size = 'md',
  tone = 'navy',
}: {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'navy' | 'gold' | 'pine';
}) {
  const s = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-xs';
  const t =
    tone === 'gold'
      ? 'bg-gold-500 text-navy-950'
      : tone === 'pine'
        ? 'bg-pine-600 text-white'
        : 'bg-navy-900 text-gold-400 dark:bg-navy-800';
  return (
    <span className={cn('rounded-full flex items-center justify-center font-bold shrink-0 select-none', s, t)}>
      {text}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-cream-deep dark:bg-night-line flex items-center justify-center text-ink-soft dark:text-slate-400 mb-3">
          {icon}
        </div>
      )}
      <div className="text-sm font-bold text-ink dark:text-white">{title}</div>
      {description && (
        <p className="text-[13px] text-ink-soft dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
