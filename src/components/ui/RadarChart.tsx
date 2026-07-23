"use client";

import { motion } from "framer-motion";

interface Axis {
  label: string;
  value: number; // 0-100
}

export function RadarChart({ data, size = 260 }: { data: Axis[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 44;
  const n = data.length;

  const pointAt = (i: number, v: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (v / 100) * radius;
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)] as const;
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const polygon = data.map((d, i) => pointAt(i, d.value).join(",")).join(" ");

  return (
    <svg width={size} height={size} role="img" aria-label="Compatibility radar chart">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={data
            .map((_, i) => pointAt(i, ring * 100).join(","))
            .join(" ")}
          fill="none"
          className="stroke-navy-100 dark:stroke-white/10"
          strokeWidth={1}
        />
      ))}
      {data.map((_, i) => {
        const [x, y] = pointAt(i, 100);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            className="stroke-navy-100 dark:stroke-white/10"
            strokeWidth={1}
          />
        );
      })}
      <motion.polygon
        points={polygon}
        fill="rgba(192,141,41,0.18)"
        stroke="#c08d29"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {data.map((d, i) => {
        const [x, y] = pointAt(i, d.value);
        const [lx, ly] = pointAt(i, 122);
        return (
          <g key={d.label}>
            <circle cx={x} cy={y} r={3.5} fill="#c08d29" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-charcoal-500 text-[11px] font-medium dark:fill-navy-200"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
