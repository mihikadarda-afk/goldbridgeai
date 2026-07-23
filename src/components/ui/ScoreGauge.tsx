"use client";

import { motion } from "framer-motion";
import { scoreColor } from "@/lib/utils";

export function ScoreGauge({
  score,
  size = 208,
  label = "Overall Compatibility",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // 270° sweep gauge
  const sweep = 0.75;
  const dash = c * sweep;
  const filled = dash * (score / 100);
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-navy-100 dark:stroke-white/10"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          initial={{ strokeDasharray: `0 ${c}` }}
          whileInView={{ strokeDasharray: `${filled} ${c}` }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-5xl font-semibold"
          style={{ color }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
          out of 100
        </span>
        <span className="mt-1 max-w-[8rem] text-center text-xs text-charcoal-500 dark:text-navy-300">
          {label}
        </span>
      </div>
    </div>
  );
}
