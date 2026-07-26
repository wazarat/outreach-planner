"use client";

export default function TrendChart({
  points,
}: {
  points: { label: string; value: number }[];
}) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-500">No offers yet — the trend appears here.</p>;
  }

  const width = 600;
  const height = 160;
  const padding = { top: 12, right: 12, bottom: 22, left: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...points.map((p) => p.value), 1);

  const x = (i: number) =>
    padding.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => padding.top + innerH - (v / max) * innerH;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * t}
            y2={padding.top + innerH * t}
            stroke="#1e2434"
            strokeWidth={1}
          />
          <text
            x={padding.left - 6}
            y={padding.top + innerH * t + 4}
            textAnchor="end"
            fontSize={10}
            fill="#64748b"
          >
            {Math.round(max * (1 - t) * 10) / 10}
          </text>
        </g>
      ))}
      {points.length > 1 ? (
        <path d={path} fill="none" stroke="#34d399" strokeWidth={2} strokeLinejoin="round" />
      ) : null}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r={3.5} fill="#34d399" />
          <title>{`${p.label}: ${p.value}`}</title>
        </g>
      ))}
      {points.length <= 12
        ? points.map((p, i) => (
            <text
              key={`label-${i}`}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#64748b"
            >
              {p.label.slice(0, 10)}
            </text>
          ))
        : null}
    </svg>
  );
}
