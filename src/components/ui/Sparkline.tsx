import React from 'react';

/**
 * Sparkline — đường xu hướng SVG nhỏ (52x18 như bản mẫu Aurora).
 * Dữ liệu PHẢI là chuỗi số thật do nơi gọi tính từ store; component chỉ
 * chuẩn hoá min/max rồi vẽ polyline + chấm ở điểm cuối.
 */
export function Sparkline({
  data,
  color = '#6366F1',
  width = 52,
  height = 18,
  strokeWidth = 2,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  if (!data || data.length === 0) return <span style={{ width, height }} className="inline-block" />;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const points = data
    .map((v, i) => {
      const x = data.length === 1 ? width / 2 : pad + (i / (data.length - 1)) * (width - pad * 2);
      const y =
        range === 0
          ? height / 2
          : pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const last = points.split(' ').pop()?.split(',').map(Number) || [0, 0];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0 overflow-visible" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} />
    </svg>
  );
}
