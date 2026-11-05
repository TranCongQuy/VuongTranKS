import React from 'react';

/**
 * AuroraBackground — 3 quầng sáng gradient cố định sau nội dung,
 * đúng vị trí/màu của Mẫu A: indigo góc phải trên, emerald dưới trái,
 * amber giữa phải; blur 90px, rất nhẹ để không loè loẹt.
 * Dark mode: giảm độ đậm để nền slate tối vẫn giữ chiều sâu.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 overflow-hidden pointer-events-none z-0 no-print">
      <div
        className="absolute rounded-full dark:opacity-45"
        style={{
          width: 560,
          height: 560,
          top: -260,
          right: -120,
          background: 'rgba(99,102,241,0.20)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="absolute rounded-full dark:opacity-40"
        style={{
          width: 480,
          height: 480,
          bottom: -280,
          left: 180,
          background: 'rgba(16,185,129,0.16)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="absolute rounded-full dark:opacity-35"
        style={{
          width: 340,
          height: 340,
          top: 300,
          right: 340,
          background: 'rgba(245,158,11,0.14)',
          filter: 'blur(90px)',
        }}
      />
    </div>
  );
}
