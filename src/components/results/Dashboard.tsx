"use client";

import { motion } from "framer-motion";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { RadarChart } from "@/components/ui/RadarChart";
import { BarMeter } from "@/components/ui/BarMeter";
import { Reveal } from "@/components/ui/Section";
import type { CompatibilityResult } from "@/lib/types";
import { cn, scoreColor } from "@/lib/utils";
import { RiskBadge } from "./RiskBadge";

const recStyles: Record<string, string> = {
  Proceed: "text-emerald-600 dark:text-emerald-400",
  "Proceed with Conditions": "text-gold-600 dark:text-gold-300",
  Hold: "text-orange-600 dark:text-orange-400",
  "Do Not Proceed": "text-red-600 dark:text-red-400",
};

export function Dashboard({ result }: { result: CompatibilityResult }) {
  return (
    <div className="space-y-8">
      {/* Headline scorecard */}
      <Reveal>
        <div className="surface overflow-hidden rounded-3xl">
          <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr] lg:p-8">
            <div className="flex items-center justify-center rounded-2xl bg-navy-50/60 p-6 dark:bg-white/5">
              <ScoreGauge score={result.overallScore} />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge level={result.riskLevel} />
                <span className="text-xs text-charcoal-400">
                  {result.source === "mock" ? "Demo data" : "ma-compatibility-scoring"} ·{" "}
                  {new Date(result.generatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Recommendation
              </p>
              <p
                className={cn(
                  "font-display text-3xl font-semibold",
                  recStyles[result.recommendation]
                )}
              >
                {result.recommendation}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-charcoal-600 dark:text-navy-200">
                {result.executiveSummary}
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Fits + radar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Reveal className="order-2 lg:order-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {result.fits.map((f) => (
              <div key={f.key} className="surface rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-navy-900 dark:text-white">{f.label}</h4>
                  <span
                    className="font-display text-2xl font-semibold"
                    style={{ color: scoreColor(f.score) }}
                  >
                    {f.score}
                  </span>
                </div>
                <div className="mt-3">
                  <BarMeter value={f.score} />
                </div>
                <p className="mt-3 text-sm text-charcoal-500 dark:text-navy-300">{f.summary}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <motion.div
          className="surface order-1 flex flex-col items-center justify-center rounded-2xl p-6 lg:order-2"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-charcoal-400">
            Fit Overview
          </h4>
          <RadarChart
            data={result.fits.map((f) => ({ label: f.label.replace(" Fit", ""), value: f.score }))}
          />
        </motion.div>
      </div>
    </div>
  );
}
