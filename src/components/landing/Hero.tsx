"use client";

import { motion } from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { ScoreGauge } from "@/components/ui/ScoreGauge";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft background wash */}
      <div className="pointer-events-none absolute inset-0 bg-navy-radial" aria-hidden />
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-gold-300/10 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Eyebrow>M&amp;A Compatibility Intelligence</Eyebrow>
          </motion.div>
          <motion.h1
            className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-navy-900 dark:text-white sm:text-5xl lg:text-[3.4rem]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            Find the Right Acquisition{" "}
            <span className="text-gold-metallic">Before You Make the Deal.</span>
          </motion.h1>
          <motion.p
            className="mt-6 max-w-lg text-lg text-charcoal-500 dark:text-navy-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            AI-powered compatibility analysis for mergers and acquisitions. Evaluate whether two
            companies are truly built to succeed together — strategically, financially,
            operationally, and culturally.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
          >
            <ButtonLink href="/analyze" variant="gold" size="lg">
              Start Analysis
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="outline" size="lg">
              Learn More
            </ButtonLink>
          </motion.div>
          <motion.div
            className="mt-10 flex items-center gap-6 text-sm text-charcoal-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span className="flex items-center gap-2">
              <ShieldIcon /> Bank-grade data handling
            </span>
            <span className="flex items-center gap-2">
              <SparkIcon /> Executive-ready reporting
            </span>
          </motion.div>
        </div>

        {/* Animated preview card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative"
        >
          <div className="surface glass-card relative overflow-hidden rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                  Compatibility Report
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-navy-900 dark:text-white">
                  Meridian × Northbridge
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                Proceed w/ Conditions
              </span>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <ScoreGauge score={78} size={188} label="Overall Compatibility" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Strategic", 84],
                ["Financial", 76],
                ["Operational", 71],
                ["Cultural", 68],
              ].map(([label, val], i) => (
                <motion.div
                  key={label as string}
                  className="rounded-xl border border-navy-100 bg-white/60 px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <p className="text-[11px] text-charcoal-400">{label}</p>
                  <p className="font-display text-xl font-semibold text-navy-900 dark:text-white">
                    {val}
                    <span className="text-sm text-charcoal-300">/100</span>
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="absolute -bottom-4 -left-4 rounded-xl border border-gold-300/40 bg-white px-4 py-2.5 text-sm font-medium shadow-gold dark:bg-navy-900"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="text-gold-metallic">✦ Antitrust screen clear</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" strokeLinejoin="round" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
