"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/Section";

export function Inspiration() {
  return (
    <section
      id="inspiration"
      className="relative border-y border-navy-100 bg-navy-50/40 py-24 dark:border-white/10 dark:bg-navy-900/30"
    >
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Eyebrow>Inspired by Bernard Goldstein</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-navy-900 dark:text-white sm:text-4xl">
            Stronger outcomes begin with the right connections.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-500 dark:text-navy-200">
            GoldBridge is inspired by the legacy of Bernard Goldstein, a pioneering technology
            entrepreneur and one of the early leaders in technology mergers and acquisitions.
            Throughout his career, Bernie helped companies navigate periods of rapid technological
            change by identifying strategic acquisition opportunities, connecting businesses with
            complementary strengths, and negotiating partnerships that created long-term value. His
            work at companies such as Broadview Associates helped shape the emerging field of tech
            M&amp;A, earning him a reputation as a trusted strategist who sought fair outcomes for
            all parties involved. GoldBridge builds on that legacy by helping users evaluate the
            financial compatibility of two companies before a potential merger, using data-driven
            analysis to assess whether a partnership has the potential to create lasting value. By
            making merger evaluation more accessible, GoldBridge reflects the strategic, analytical
            approach that defined Bernard Goldstein&rsquo;s career.
          </p>
          <a
            href="https://civichall.org/bernard-goldstein"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold-600 transition hover:text-gold-500 dark:text-gold-300"
          >
            Learn more about Bernard Goldstein
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
