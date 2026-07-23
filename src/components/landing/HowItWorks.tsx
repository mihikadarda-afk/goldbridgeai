"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/Section";

const steps = [
  {
    n: "01",
    title: "Upload company documents",
    body: "Securely add financials, customer data, and org details for both companies via drag-and-drop.",
    icon: UploadIcon,
  },
  {
    n: "02",
    title: "GoldBridge validates & organizes",
    body: "Files are checked for type and completeness, then structured into a clean, analysis-ready package.",
    icon: OrganizeIcon,
  },
  {
    n: "03",
    title: "The scoring agent analyzes fit",
    body: "The ma-compatibility-scoring Claude agent evaluates strategic, financial, operational, and cultural compatibility.",
    icon: AnalyzeIcon,
  },
  {
    n: "04",
    title: "Receive an executive report",
    body: "Get a polished, board-ready dashboard with scores, risk sections, and a downloadable PDF.",
    icon: ReportIcon,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="How It Works"
        title="From documents to decision in four steps."
        lead="A guided, secure workflow that turns raw company data into an executive compatibility verdict."
      />
      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            className="surface group relative flex flex-col rounded-2xl p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-300 transition group-hover:scale-105 dark:bg-navy-800">
                <s.icon />
              </span>
              <span className="font-display text-2xl font-semibold text-navy-100 dark:text-white/10">
                {s.n}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-navy-900 dark:text-white">
              {s.title}
            </h3>
            <p className="mt-2 text-sm text-charcoal-500 dark:text-navy-300">{s.body}</p>
            {i < steps.length - 1 && (
              <span className="absolute -right-3 top-11 hidden text-gold-400 lg:block">→</span>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
    </svg>
  );
}
function OrganizeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="7" height="7" rx="1.5" />
      <rect x="14" y="4" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="6" rx="1.5" />
      <rect x="14" y="14" width="7" height="6" rx="1.5" />
    </svg>
  );
}
function AnalyzeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
      <path d="M8 11h6M11 8v6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l3 3v15a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6M9 8h3" strokeLinecap="round" />
    </svg>
  );
}
