import React from 'react';

/**
 * PageHeader dùng chung toàn app.
 * Kỷ luật nút: khu vực action CHỈ chứa tối đa 1 nút primary (.btn-primary/.btn-gold)
 * do trang truyền vào; mọi hành động phụ phải nằm trong RowMenu.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="text-[26px] sm:text-[30px] leading-tight font-extrabold text-ink dark:text-white truncate">
          {title}
        </h1>
        {description && (
          <p className="text-[13.5px] text-ink-soft dark:text-slate-400 mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
