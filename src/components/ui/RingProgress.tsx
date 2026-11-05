'use client';

import React, { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * RingProgress — vòng % SVG theo ngôn ngữ Aurora (Mẫu A).
 * Mặc định dùng gradient indigo -> emerald giống vòng hero của bản mẫu;
 * có thể truyền `color` để vẽ vòng đơn sắc (vd: amber khi cần đôn đốc).
 * Số % ở giữa tự đếm/đuổi theo value với transition mượt; tôn trọng
 * prefers-reduced-motion (nhảy thẳng tới giá trị đích).
 */
export function RingProgress({
  value,
  size = 130,
  strokeWidth = 11,
  color,
  trackColor,
  label,
  valueClassName,
  labelClassName,
  children,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  valueClassName?: string;
  labelClassName?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const gradientId = useId();
  const clamped = Math.min(100, Math.max(0, Math.round(value || 0)));
  // Vòng chạy từ 0 -> giá trị đích ở lần hiện đầu tiên nhờ CSS transition;
  // các lần đổi giá trị sau transition tự đuổi theo. prefers-reduced-motion
  // được globals.css xử lý (rút ngắn mọi transition).
  const [on, setOn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const display = on ? clamped : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (display / 100) * circumference;
  const stroke = color || `url(#${gradientId})`;

  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor ?? 'currentColor'}
          strokeWidth={strokeWidth}
          className={trackColor ? undefined : 'text-[#EEF1F6] dark:text-slate-700/70'}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {children ?? (
          <>
            <span
              className={cn('font-black font-tabular text-ink dark:text-white leading-none', valueClassName)}
              style={{ fontSize: Math.max(11, size * 0.23) }}
            >
              {clamped}%
            </span>
            {label && (
              <span
                className={cn('text-ink-soft dark:text-slate-400 font-semibold uppercase mt-1', labelClassName)}
                style={{ fontSize: Math.max(8, size * 0.08), letterSpacing: '0.04em' }}
              >
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
