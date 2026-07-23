"use client";

import { motion } from "framer-motion";
import { scoreColor } from "@/lib/utils";

/** Horizontal animated meter used for fit scores and confidence bars. */
export function BarMeter({
  value,
  max = 100,
  color,
  height = 8,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-navy-100 dark:bg-white/10"
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color ?? scoreColor(pct) }}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
