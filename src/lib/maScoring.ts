// ============================================================
// Deterministic M&A compatibility scoring math.
//
// This is a direct TypeScript port of the ma-compatibility-scoring Claude
// skill's Section 2a explicit scoring bands. The skill's own guidance is to
// never let an LLM eyeball this arithmetic — so none of it runs through
// Claude. Claude (see anthropicExtract.ts) only reads documents and extracts
// RawCompanyData; everything from here down is plain, reproducible code.
// ============================================================

import type { KeyMetrics, RawCompanyData, ScoringResult, SubScores } from "./scoringTypes";
import { SUB_SCORE_WEIGHTS } from "./scoringTypes";

/** Piecewise-linear interpolation with a fixed decay slope beyond the last breakpoint. */
function piecewise(x: number, breaks: [number, number][], tailSlopePerUnit: number): number {
  for (let i = 0; i < breaks.length - 1; i++) {
    const [x0, y0] = breaks[i];
    const [x1, y1] = breaks[i + 1];
    if (x >= x0 && x <= x1) {
      const frac = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return y0 + frac * (y1 - y0);
    }
  }
  if (x > breaks[breaks.length - 1][0]) {
    const [xLast, yLast] = breaks[breaks.length - 1];
    return clamp(yLast + tailSlopePerUnit * (x - xLast));
  }
  return breaks[0][1];
}

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

function mean(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** CAGR = (end/start)^(1/years) - 1. Returns null if inputs are invalid. */
function cagr(start: number, end: number, years: number): number | null {
  if (!(start > 0) || !(end > 0) || years <= 0) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

function pearson(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 3) return null;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    const xa = a[i] - ma;
    const xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  if (da === 0 || db === 0) return null;
  return num / Math.sqrt(da * db);
}

/** Most recent (latest year) figure from a year → value record. */
function latest(record: Record<string, number>): { year: string; value: number } | null {
  const years = Object.keys(record).filter((y) => Number.isFinite(record[y]));
  if (!years.length) return null;
  years.sort();
  const year = years[years.length - 1];
  return { year, value: record[year] };
}

function earliest(record: Record<string, number>): { year: string; value: number } | null {
  const years = Object.keys(record).filter((y) => Number.isFinite(record[y]));
  if (!years.length) return null;
  years.sort();
  const year = years[0];
  return { year, value: record[year] };
}

function ebitdaOf(c: RawCompanyData): number | null {
  if (c.ebitda != null) return c.ebitda;
  if (c.operatingIncome != null && c.da != null) return c.operatingIncome + c.da;
  return null;
}

/** HHI (0-10,000 scale) assuming revenue outside the disclosed top-N customers is
 *  spread evenly across the remaining customer count. This is an explicit
 *  ASSUMPTION whenever true per-customer revenue isn't disclosed — flagged by the
 *  caller, not silently treated as fact. */
function hhi(topCustomerRevenue: number[], totalRevenue: number, customerCount: number): number | null {
  if (!totalRevenue || !customerCount || !topCustomerRevenue.length) return null;
  const shares = topCustomerRevenue.map((r) => r / totalRevenue);
  const topSum = topCustomerRevenue.reduce((a, b) => a + b, 0);
  const remainderRev = Math.max(totalRevenue - topSum, 0);
  const remainderCustomers = Math.max(customerCount - topCustomerRevenue.length, 1);
  const remainderShareEach = remainderRev / totalRevenue / remainderCustomers;
  const h = shares.reduce((acc, s) => acc + s * s, 0) + remainderCustomers * remainderShareEach ** 2;
  return h * 10000;
}

export function computeScoring(a: RawCompanyData, b: RawCompanyData): ScoringResult {
  const missingDataFlags: string[] = [];
  const autoRiskFlags: string[] = [];

  // ---- Revenue complementarity ----
  const r = pearson(a.quarterlyRevenue, b.quarterlyRevenue);
  if (r == null) {
    missingDataFlags.push(
      "Revenue complementarity: quarterly revenue series for the two companies are missing, too short, or not aligned to the same periods — sub-score defaulted to a neutral 50."
    );
  }
  const revenue_complementarity = r == null ? 50 : (1 - r) / 2 * 100;

  // ---- Growth alignment ----
  const aFirst = earliest(a.annualRevenue);
  const aLast = latest(a.annualRevenue);
  const bFirst = earliest(b.annualRevenue);
  const bLast = latest(b.annualRevenue);
  let cagrA: number | null = null;
  let cagrB: number | null = null;
  let growth_alignment = 50;
  if (aFirst && aLast && bFirst && bLast && aLast.year !== aFirst.year && bLast.year !== bFirst.year) {
    cagrA = cagr(aFirst.value, aLast.value, Number(aLast.year) - Number(aFirst.year));
    cagrB = cagr(bFirst.value, bLast.value, Number(bLast.year) - Number(bFirst.year));
    if (cagrA != null && cagrB != null) {
      const gapPp = Math.abs(cagrA - cagrB) * 100;
      growth_alignment = piecewise(gapPp, [[0, 100], [5, 90], [15, 60], [30, 25]], -1);
    }
  } else {
    missingDataFlags.push(
      "Growth alignment: annual revenue history (3-5 years) is incomplete for one or both companies — sub-score defaulted to a neutral 50."
    );
  }

  // ---- Margin compatibility (gross margin gap dominant, per skill spec) ----
  const revA = aLast?.value ?? null;
  const revB = bLast?.value ?? null;
  let margin_compatibility = 50;
  let grossMarginA: number | null = null;
  let grossMarginB: number | null = null;
  if (revA && revB && a.cogs != null && b.cogs != null) {
    grossMarginA = (revA - a.cogs) / revA;
    grossMarginB = (revB - b.cogs) / revB;
    const gapPp = Math.abs(grossMarginA - grossMarginB) * 100;
    margin_compatibility = piecewise(gapPp, [[0, 100], [10, 90], [30, 60], [60, 20]], -1);
  } else {
    missingDataFlags.push(
      "Margin compatibility: COGS not available for one or both companies — sub-score defaulted to a neutral 50."
    );
  }

  const ebitdaA = ebitdaOf(a);
  const ebitdaB = ebitdaOf(b);
  const ebitdaMarginA = revA && ebitdaA != null ? ebitdaA / revA : null;
  const ebitdaMarginB = revB && ebitdaB != null ? ebitdaB / revB : null;

  // ---- Leverage / liquidity fit ----
  let leverage_liquidity_fit = 50;
  let netDebtEbitdaA: number | null = null;
  let netDebtEbitdaB: number | null = null;
  let currentRatioA: number | null = null;
  let currentRatioB: number | null = null;
  if (a.totalDebt != null && a.cash != null && ebitdaA && b.totalDebt != null && b.cash != null && ebitdaB) {
    netDebtEbitdaA = (a.totalDebt - a.cash) / ebitdaA;
    netDebtEbitdaB = (b.totalDebt - b.cash) / ebitdaB;
    const gap = Math.abs(netDebtEbitdaA - netDebtEbitdaB);
    let score = piecewise(gap, [[0, 100], [1, 90], [3, 60], [5, 30]], -6);
    if (a.currentAssets != null && a.currentLiabilities && b.currentAssets != null && b.currentLiabilities) {
      currentRatioA = a.currentAssets / a.currentLiabilities;
      currentRatioB = b.currentAssets / b.currentLiabilities;
      const crGap = Math.abs(currentRatioA - currentRatioB);
      const mod = crGap < 0.5 ? 5 : crGap <= 1.5 ? 0 : -10;
      score = clamp(score + mod);
    }
    leverage_liquidity_fit = score;
    if (netDebtEbitdaA > 5 || netDebtEbitdaB > 5) {
      autoRiskFlags.push(
        `Extreme leverage: ${netDebtEbitdaA > 5 ? a.name : b.name} is levered beyond 5x EBITDA (Net Debt/EBITDA = ${(netDebtEbitdaA > 5 ? netDebtEbitdaA : netDebtEbitdaB).toFixed(2)}x).`
      );
    }
  } else {
    missingDataFlags.push(
      "Leverage/liquidity fit: debt, cash, or EBITDA inputs missing for one or both companies — sub-score defaulted to a neutral 50."
    );
  }

  // ---- Size ratio ----
  let size_ratio = 50;
  let revSizeRatio: number | null = null;
  let hcSizeRatio: number | null = null;
  if (revA && revB) {
    revSizeRatio = Math.max(revA, revB) / Math.min(revA, revB);
  }
  const aHcLatest = latest(a.headcount);
  const bHcLatest = latest(b.headcount);
  if (aHcLatest && bHcLatest) {
    hcSizeRatio = Math.max(aHcLatest.value, bHcLatest.value) / Math.min(aHcLatest.value, bHcLatest.value);
  }
  const sizeScores: number[] = [];
  if (revSizeRatio != null) sizeScores.push(piecewise(revSizeRatio, [[1, 100], [3, 90], [10, 20]], -3));
  if (hcSizeRatio != null) sizeScores.push(piecewise(hcSizeRatio, [[1, 100], [3, 90], [10, 20]], -3));
  if (sizeScores.length) {
    size_ratio = mean(sizeScores);
  } else {
    missingDataFlags.push("Size ratio: revenue or headcount missing for one or both companies — sub-score defaulted to a neutral 50.");
  }
  if ((revSizeRatio && revSizeRatio > 10) || (hcSizeRatio && hcSizeRatio > 10)) {
    autoRiskFlags.push(
      `Extreme size mismatch beyond 10:1 (revenue ${revSizeRatio?.toFixed(2) ?? "n/a"}:1, headcount ${hcSizeRatio?.toFixed(2) ?? "n/a"}:1) — surfaced regardless of composite score impact, per the skill's guardrails.`
    );
  }

  // ---- Customer overlap (HHI-based, "spread evenly" is an explicit assumption) ----
  let customer_overlap = 50;
  let hhiA: number | null = null;
  let hhiB: number | null = null;
  if (revA && a.customerCount && a.topCustomerRevenue.length && revB && b.customerCount && b.topCustomerRevenue.length) {
    hhiA = hhi(a.topCustomerRevenue, revA, a.customerCount);
    hhiB = hhi(b.topCustomerRevenue, revB, b.customerCount);
    if (hhiA != null && hhiB != null) {
      const avgHhi = (hhiA + hhiB) / 2;
      customer_overlap = piecewise(avgHhi, [[0, 100], [1500, 80], [2500, 40]], -0.01);
      missingDataFlags.push(
        "Customer overlap: revenue outside the disclosed top-customer list is ASSUMED to be spread evenly across the remaining customer count for both companies — this is a modeling assumption, not a measured fact. No cross-company customer-list overlap data was available, so cross-overlap is assumed at 0%."
      );
    }
  } else {
    missingDataFlags.push(
      "Customer overlap: customer count or top-customer revenue missing for one or both companies — sub-score defaulted to a neutral 50."
    );
  }

  // ---- Revenue-per-employee gap ----
  let revenue_per_employee_gap = 50;
  let revPerEmployeeA: number | null = null;
  let revPerEmployeeB: number | null = null;
  if (revA && aHcLatest && revB && bHcLatest) {
    revPerEmployeeA = (revA * 1_000_000) / aHcLatest.value;
    revPerEmployeeB = (revB * 1_000_000) / bHcLatest.value;
    const ratio = Math.max(revPerEmployeeA, revPerEmployeeB) / Math.min(revPerEmployeeA, revPerEmployeeB);
    revenue_per_employee_gap = piecewise(ratio, [[1, 100], [1.5, 90], [3, 60], [6, 30]], -5);
  } else {
    missingDataFlags.push("Revenue-per-employee gap: revenue or headcount missing — sub-score defaulted to a neutral 50.");
  }

  // ---- Valuation feasibility (cross-company EV/Revenue gap, per skill spec) ----
  let valuation_feasibility = 50;
  let evA: number | null = null;
  let evB: number | null = null;
  let evRevA: number | null = null;
  let evRevB: number | null = null;
  let evEbitdaA: number | null = null;
  let evEbitdaB: number | null = null;
  if (a.marketCapOrValuation != null && b.marketCapOrValuation != null && revA && revB) {
    evA =
      a.isPublic && a.totalDebt != null && a.cash != null
        ? a.marketCapOrValuation + a.totalDebt - a.cash
        : a.marketCapOrValuation;
    evB =
      b.isPublic && b.totalDebt != null && b.cash != null
        ? b.marketCapOrValuation + b.totalDebt - b.cash
        : b.marketCapOrValuation;
    evRevA = evA / revA;
    evRevB = evB / revB;
    if (ebitdaA) evEbitdaA = evA / ebitdaA;
    if (ebitdaB) evEbitdaB = evB / ebitdaB;
    const ratio = Math.max(evRevA, evRevB) / Math.min(evRevA, evRevB);
    valuation_feasibility = piecewise(ratio, [[1, 100], [1.5, 90], [3, 60], [8, 20]], -1);
    if (!a.isPublic) {
      missingDataFlags.push(
        `Valuation feasibility: ${a.name} is private — its disclosed valuation was used directly as EV; confirm whether it's an equity or enterprise value figure.`
      );
    }
    if (!b.isPublic) {
      missingDataFlags.push(
        `Valuation feasibility: ${b.name} is private — its disclosed valuation was used directly as EV; confirm whether it's an equity or enterprise value figure.`
      );
    }
  } else {
    missingDataFlags.push(
      "Valuation feasibility: market cap/valuation missing for one or both companies — sub-score defaulted to a neutral 50."
    );
  }

  const subScores: SubScores = {
    revenue_complementarity,
    growth_alignment,
    margin_compatibility,
    leverage_liquidity_fit,
    size_ratio,
    customer_overlap,
    revenue_per_employee_gap,
    valuation_feasibility,
  };

  const composite = (Object.keys(subScores) as (keyof SubScores)[]).reduce(
    (sum, k) => sum + subScores[k] * SUB_SCORE_WEIGHTS[k],
    0
  );

  const interestCoverageA = a.operatingIncome != null && a.interestExpense ? a.operatingIncome / a.interestExpense : null;
  const interestCoverageB = b.operatingIncome != null && b.interestExpense ? b.operatingIncome / b.interestExpense : null;

  const keyMetrics: KeyMetrics = {
    correlationR: r,
    cagrA,
    cagrB,
    cagrGapPp: cagrA != null && cagrB != null ? Math.abs(cagrA - cagrB) * 100 : null,
    grossMarginA,
    grossMarginB,
    ebitdaMarginA,
    ebitdaMarginB,
    netDebtEbitdaA,
    netDebtEbitdaB,
    currentRatioA,
    currentRatioB,
    interestCoverageA,
    interestCoverageB,
    revSizeRatio,
    hcSizeRatio,
    hhiA,
    hhiB,
    revPerEmployeeA,
    revPerEmployeeB,
    evA,
    evB,
    evRevA,
    evRevB,
    evEbitdaA,
    evEbitdaB,
  };

  // Accounting comparability auto-flag
  if (a.accountingStandard !== b.accountingStandard) {
    autoRiskFlags.push(
      `Accounting comparability: ${a.name} reports under ${a.accountingStandard}, ${b.name} under ${b.accountingStandard} — margin/multiple comparisons above are not fully apples-to-apples.`
    );
  }
  if (a.ebitdaAdjusted || b.ebitdaAdjusted) {
    autoRiskFlags.push(
      `Accounting comparability: ${a.ebitdaAdjusted ? a.name : b.name} reports an "adjusted"/company-defined EBITDA rather than a standard one — normalize before comparing EBITDA-based figures.`
    );
  }

  return { subScores, composite, keyMetrics, missingDataFlags, autoRiskFlags };
}
