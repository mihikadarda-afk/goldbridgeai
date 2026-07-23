// ============================================================
// Types for the real ma-compatibility-scoring pipeline
// (Section 2 raw-data checklist + Section 4/2a scoring output,
// ported from the ma-compatibility-scoring Claude skill.)
// ============================================================

/** One company's raw inputs, mirroring the skill's Section 2 checklist.
 *  Every field is nullable — missing data is flagged, never invented. */
export interface RawCompanyData {
  name: string;
  industry: string;

  /** Same-length, same-period quarterly revenue for both companies, oldest → newest. */
  quarterlyRevenue: number[];
  /** Year (as string, e.g. "2021") → annual revenue, in $M. */
  annualRevenue: Record<string, number>;

  cogs: number | null;
  operatingIncome: number | null;
  da: number | null; // depreciation & amortization
  ebitda: number | null; // use directly if disclosed, else operatingIncome + da
  ebitdaAdjusted: boolean | null; // true if company reports "adjusted"/company-defined EBITDA

  totalDebt: number | null;
  cash: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  interestExpense: number | null;

  /** Year → headcount. */
  headcount: Record<string, number>;

  customerCount: number | null;
  /** Revenue of the top 5-10 customers, descending, in $M. */
  topCustomerRevenue: number[];

  isPublic: boolean | null;
  /** Market cap if public; last-known valuation or disclosed EV if private. */
  marketCapOrValuation: number | null;
  /** True if marketCapOrValuation is already an enterprise value figure (common for
   *  privately disclosed deals) rather than an equity market cap. */
  valuationIsEnterpriseValue: boolean | null;

  recurringRevenuePct: number | null;
  nrr: number | null; // net revenue retention, e.g. 1.18 for 118%
  churnPct: number | null;
  renewalRatePct: number | null; // non-subscription analog to NRR/churn

  marketSharePct: number | null;
  accountingStandard: "GAAP" | "IFRS" | "Other" | "Unknown";
  filingDate: string | null;

  // ---- Qualitative, Section 7 inputs (extracted from document text) ----
  changeOfControlNote: string | null;
  keyPersonNote: string | null;
  leadershipRiskNote: string | null;
  precedentTransactions: { label: string; evRevenue: number | null; evEbitda: number | null }[];

  /** Section 2 checklist item names/descriptions this company's documents didn't cover. */
  missingFields: string[];
}

export interface SubScores {
  revenue_complementarity: number;
  growth_alignment: number;
  margin_compatibility: number;
  leverage_liquidity_fit: number;
  size_ratio: number;
  customer_overlap: number;
  revenue_per_employee_gap: number;
  valuation_feasibility: number;
}

export const SUB_SCORE_WEIGHTS: SubScores = {
  revenue_complementarity: 0.2,
  growth_alignment: 0.15,
  margin_compatibility: 0.15,
  leverage_liquidity_fit: 0.15,
  size_ratio: 0.1,
  customer_overlap: 0.15,
  revenue_per_employee_gap: 0.05,
  valuation_feasibility: 0.05,
};

export interface KeyMetrics {
  correlationR: number | null;
  cagrA: number | null;
  cagrB: number | null;
  cagrGapPp: number | null;
  grossMarginA: number | null;
  grossMarginB: number | null;
  ebitdaMarginA: number | null;
  ebitdaMarginB: number | null;
  netDebtEbitdaA: number | null;
  netDebtEbitdaB: number | null;
  currentRatioA: number | null;
  currentRatioB: number | null;
  interestCoverageA: number | null; // EBIT / interest expense
  interestCoverageB: number | null;
  revSizeRatio: number | null;
  hcSizeRatio: number | null;
  hhiA: number | null;
  hhiB: number | null;
  revPerEmployeeA: number | null;
  revPerEmployeeB: number | null;
  evA: number | null;
  evB: number | null;
  evRevA: number | null;
  evRevB: number | null;
  evEbitdaA: number | null;
  evEbitdaB: number | null;
}

export interface ScoringResult {
  subScores: SubScores;
  composite: number;
  keyMetrics: KeyMetrics;
  missingDataFlags: string[];
  autoRiskFlags: string[]; // deterministic flags (size ratio, leverage extremes, etc.)
}
