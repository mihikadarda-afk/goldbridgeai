"use client";

import { Reveal } from "@/components/ui/Section";
import { BarMeter } from "@/components/ui/BarMeter";
import type { CompatibilityResult, RiskDetail } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

export function RiskSections({ result }: { result: CompatibilityResult }) {
  const r = result.risks;
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
        Risk &amp; Diligence Analysis
      </h2>

      {/* Revenue correlation */}
      <RiskCard detail={r.revenueCorrelation}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs text-charcoal-400">
              <span>Revenue correlation</span>
              <span>{r.revenueCorrelation.correlation.toFixed(2)}</span>
            </div>
            <BarMeter value={r.revenueCorrelation.correlation * 100} color="#324878" />
          </div>
        </div>
      </RiskCard>

      {/* Market concentration */}
      <RiskCard detail={r.marketConcentration}>
        <div className="flex flex-wrap items-center gap-6">
          <Stat label="Combined market share" value={`${r.marketConcentration.combinedShare.toFixed(1)}%`} />
          <div>
            <p className="text-xs text-charcoal-400">Antitrust screen</p>
            <p
              className={
                r.marketConcentration.antitrustFlag
                  ? "font-semibold text-orange-600 dark:text-orange-400"
                  : "font-semibold text-emerald-600 dark:text-emerald-400"
              }
            >
              {r.marketConcentration.antitrustFlag ? "Flagged for review" : "Clear"}
            </p>
          </div>
        </div>
      </RiskCard>

      {/* Customer concentration */}
      <RiskCard detail={r.customerConcentration}>
        <div className="flex flex-wrap items-center gap-8">
          <Stat label="Combined HHI" value={String(r.customerConcentration.hhi)} />
          <Stat label="Top-customer overlap" value={`${r.customerConcentration.overlapPct.toFixed(1)}%`} />
        </div>
      </RiskCard>

      {/* Data recency & confidence */}
      <RiskCard detail={r.dataRecency}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal-400">
                <th className="pb-2 font-medium">Metric</th>
                <th className="pb-2 font-medium">Company A</th>
                <th className="pb-2 font-medium">Company B</th>
                <th className="pb-2 font-medium">Freshness</th>
                <th className="pb-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {r.dataRecency.metrics.map((m) => (
                <tr key={m.metric} className="border-t border-navy-50 dark:border-white/5">
                  <td className="py-2.5 font-medium text-navy-800 dark:text-navy-100">{m.metric}</td>
                  <td className="py-2.5 text-charcoal-500 dark:text-navy-300">{m.companyA}</td>
                  <td className="py-2.5 text-charcoal-500 dark:text-navy-300">{m.companyB}</td>
                  <td className="py-2.5">
                    <span
                      className={
                        m.freshnessDays > 180
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-charcoal-500 dark:text-navy-300"
                      }
                    >
                      {m.freshnessDays}d {m.freshnessDays > 180 && "· stale"}
                    </span>
                  </td>
                  <td className="w-32 py-2.5">
                    <div className="flex items-center gap-2">
                      <BarMeter value={m.confidence} height={6} />
                      <span className="w-8 text-xs text-charcoal-400">{m.confidence}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RiskCard>

      {/* Accounting comparability */}
      <RiskCard detail={r.accountingComparability}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-navy-100 p-4 dark:border-white/10">
            <p className="text-xs text-charcoal-400">Company A</p>
            <p className="mt-1 font-medium text-navy-800 dark:text-navy-100">
              {r.accountingComparability.standardA} · {r.accountingComparability.ebitdaTypeA} EBITDA
            </p>
          </div>
          <div className="rounded-xl border border-navy-100 p-4 dark:border-white/10">
            <p className="text-xs text-charcoal-400">Company B</p>
            <p className="mt-1 font-medium text-navy-800 dark:text-navy-100">
              {r.accountingComparability.standardB} · {r.accountingComparability.ebitdaTypeB} EBITDA
            </p>
          </div>
        </div>
      </RiskCard>

      {/* Key-person & ownership */}
      <RiskCard detail={r.keyPerson} />

      {/* Precedent transactions */}
      <RiskCard detail={r.precedents}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal-400">
                <th className="pb-2 font-medium">Target</th>
                <th className="pb-2 font-medium">Acquirer</th>
                <th className="pb-2 font-medium">Year</th>
                <th className="pb-2 font-medium">EV / Revenue</th>
                <th className="pb-2 font-medium">EV / EBITDA</th>
              </tr>
            </thead>
            <tbody>
              {r.precedents.transactions.map((t, i) => (
                <tr key={i} className="border-t border-navy-50 dark:border-white/5">
                  <td className="py-2.5 font-medium text-navy-800 dark:text-navy-100">{t.target}</td>
                  <td className="py-2.5 text-charcoal-500 dark:text-navy-300">{t.acquirer}</td>
                  <td className="py-2.5 text-charcoal-500 dark:text-navy-300">{t.year}</td>
                  <td className="py-2.5 text-charcoal-500 dark:text-navy-300">
                    {t.evRevenue !== null ? `${t.evRevenue.toFixed(1)}×` : "—"}
                  </td>
                  <td className="py-2.5 text-charcoal-500 dark:text-navy-300">
                    {t.evEbitda !== null ? `${t.evEbitda.toFixed(1)}×` : "n/d"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RiskCard>
    </div>
  );
}

function RiskCard({ detail, children }: { detail: RiskDetail; children?: React.ReactNode }) {
  return (
    <Reveal>
      <section className="surface rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white">{detail.title}</h3>
          <RiskBadge level={detail.level} />
        </div>
        {children && <div className="mt-5">{children}</div>}
        <ul className="mt-5 space-y-2">
          {detail.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-charcoal-600 dark:text-navy-200">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-gold-400" />
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-lg bg-navy-50/70 px-3.5 py-2.5 text-xs text-charcoal-500 dark:bg-white/5 dark:text-navy-300">
          <span className="font-semibold text-charcoal-600 dark:text-navy-200">Note: </span>
          {detail.note}
        </p>
      </section>
    </Reveal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-charcoal-400">{label}</p>
      <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">{value}</p>
    </div>
  );
}
