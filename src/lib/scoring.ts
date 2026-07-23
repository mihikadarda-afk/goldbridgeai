import type {
  AnalysisRequest,
  CompatibilityResult,
  Recommendation,
  RiskLevel,
} from "./types";
import { clamp, seededRandom } from "./utils";

function levelFromScore(score: number): RiskLevel {
  if (score >= 75) return "Low";
  if (score >= 58) return "Moderate";
  if (score >= 42) return "Elevated";
  return "High";
}

function recommendationFromScore(score: number): Recommendation {
  if (score >= 78) return "Proceed";
  if (score >= 60) return "Proceed with Conditions";
  if (score >= 45) return "Hold";
  return "Do Not Proceed";
}

/**
 * Deterministic, realistic mock of the `ma-compatibility-scoring` agent's
 * output. Used as a fallback so the product is fully demonstrable without a
 * live agent connection. The shape matches {@link CompatibilityResult} exactly,
 * so swapping in the real agent response requires no UI changes.
 */
export function generateMockResult(req: AnalysisRequest): CompatibilityResult {
  const a = req.companyA.metadata;
  const b = req.companyB.metadata;
  const seed = `${a.name || "A"}::${b.name || "B"}::${req.submittedAt}`;
  const rnd = seededRandom(seed);

  const strategic = clamp(Math.round(55 + rnd() * 40));
  const financial = clamp(Math.round(48 + rnd() * 45));
  const operational = clamp(Math.round(50 + rnd() * 42));
  const cultural = clamp(Math.round(45 + rnd() * 45));
  const overall = clamp(
    Math.round(strategic * 0.3 + financial * 0.3 + operational * 0.22 + cultural * 0.18)
  );

  const correlation = Number((0.35 + rnd() * 0.6).toFixed(2));
  const combinedShare = Number((8 + rnd() * 34).toFixed(1));
  const antitrustFlag = combinedShare > 25;
  const hhi = Math.round(900 + rnd() * 2600);
  const overlapPct = Number((5 + rnd() * 30).toFixed(1));

  const nameA = a.name || "Company A";
  const nameB = b.name || "Company B";
  const standardA = a.accountingStandard || "GAAP";
  const standardB = b.accountingStandard || "IFRS";
  const ebitdaTypeA = a.ebitdaType || "Adjusted";
  const ebitdaTypeB = b.ebitdaType || "Standard";
  const accountingAligned = standardA === standardB && ebitdaTypeA === ebitdaTypeB;

  const founderRisk = a.founderLed === "Yes" || b.founderLed === "Yes";

  return {
    overallScore: overall,
    riskLevel: levelFromScore(overall),
    recommendation: recommendationFromScore(overall),
    executiveSummary: `Based on the submitted data, ${nameA} and ${nameB} present a ${levelFromScore(
      overall
    ).toLowerCase()}-risk compatibility profile with an overall score of ${overall}/100. Strategic alignment is the strongest dimension, while ${
      cultural < financial ? "cultural integration" : "financial harmonization"
    } warrants the closest diligence. This assessment reflects the documents and metrics provided and should be paired with confirmatory due diligence before any binding commitment.`,
    fits: [
      {
        key: "strategic",
        label: "Strategic Fit",
        score: strategic,
        summary: `Complementary positioning across ${a.industry || "the target sector"} and ${
          b.industry || "adjacent markets"
        }, with credible cross-sell and expansion pathways.`,
      },
      {
        key: "financial",
        label: "Financial Fit",
        score: financial,
        summary: `Revenue and EBITDA profiles are broadly combinable; margin structures should be normalized for a like-for-like view.`,
      },
      {
        key: "operational",
        label: "Operational Fit",
        score: operational,
        summary: `Overlapping functions offer synergy potential, balanced against integration complexity across systems and processes.`,
      },
      {
        key: "cultural",
        label: "Cultural Fit",
        score: cultural,
        summary: `Organizational styles are ${
          cultural > 65 ? "well aligned" : "partially divergent"
        }; leadership and retention planning will be pivotal.`,
      },
    ],
    risks: {
      revenueCorrelation: {
        title: "Historical Revenue Correlation",
        level: levelFromScore(clamp(100 - Math.abs(correlation - 0.5) * 120)),
        correlation,
        note: "Compatibility extends well beyond revenue trends — correlation is one signal among many and does not, on its own, indicate strategic fit.",
        bullets: [
          `Trailing revenue series correlation of ${correlation.toFixed(2)} between ${nameA} and ${nameB}.`,
          correlation > 0.7
            ? "Highly correlated revenues may amplify shared cyclical exposure."
            : "Divergent revenue cycles may provide diversification benefits.",
          "Pair with margin, retention, and pipeline analysis for a complete view.",
        ],
      },
      marketConcentration: {
        title: "Market-Level Concentration",
        level: antitrustFlag ? "Elevated" : "Low",
        combinedShare,
        antitrustFlag,
        note: "Antitrust flag only — this is a screening indicator, not a legal determination. Consult qualified counsel for any regulatory assessment.",
        bullets: [
          `Estimated combined market share of ${combinedShare.toFixed(1)}%.`,
          antitrustFlag
            ? "Combined share exceeds the 25% screening threshold; regulatory review is advisable."
            : "Combined share is below the screening threshold for concentration concerns.",
          "Market definition materially affects this estimate and should be validated.",
        ],
      },
      customerConcentration: {
        title: "Customer Concentration",
        level: hhi > 2500 || overlapPct > 20 ? "Elevated" : hhi > 1500 ? "Moderate" : "Low",
        hhi,
        overlapPct,
        note: "Herfindahl–Hirschman Index (HHI) across the combined customer base, with major-customer overlap between the two companies.",
        bullets: [
          `Combined customer HHI of ${hhi} (${
            hhi > 2500 ? "highly concentrated" : hhi > 1500 ? "moderately concentrated" : "unconcentrated"
          }).`,
          `Approximately ${overlapPct.toFixed(1)}% overlap among top customers.`,
          "High overlap can reduce cross-sell upside and concentrate churn risk.",
        ],
      },
      dataRecency: {
        title: "Data Recency & Confidence",
        level: "Moderate",
        note: "Freshness and confidence are reported per metric. Stale or low-confidence inputs should be refreshed before final decisioning.",
        bullets: [
          "Confidence reflects source quality, completeness, and recency of each metric.",
          "Metrics older than 180 days are highlighted for refresh.",
        ],
        metrics: [
          {
            metric: "Revenue",
            companyA: a.revenue || "—",
            companyB: b.revenue || "—",
            freshnessDays: Math.round(20 + rnd() * 200),
            confidence: Math.round(70 + rnd() * 28),
          },
          {
            metric: "EBITDA",
            companyA: a.ebitda || "—",
            companyB: b.ebitda || "—",
            freshnessDays: Math.round(20 + rnd() * 220),
            confidence: Math.round(62 + rnd() * 30),
          },
          {
            metric: "Market share",
            companyA: a.marketShare || "—",
            companyB: b.marketShare || "—",
            freshnessDays: Math.round(60 + rnd() * 260),
            confidence: Math.round(48 + rnd() * 34),
          },
          {
            metric: "Employees",
            companyA: a.employees || "—",
            companyB: b.employees || "—",
            freshnessDays: Math.round(10 + rnd() * 120),
            confidence: Math.round(78 + rnd() * 20),
          },
        ],
      },
      accountingComparability: {
        title: "Accounting Comparability",
        level: accountingAligned ? "Low" : "Moderate",
        standardA,
        standardB,
        ebitdaTypeA,
        ebitdaTypeB,
        note: "Differences between GAAP and IFRS, and between standard and adjusted EBITDA, can distort like-for-like comparison and must be normalized.",
        bullets: [
          `${nameA} reports under ${standardA} with ${ebitdaTypeA} EBITDA; ${nameB} reports under ${standardB} with ${ebitdaTypeB} EBITDA.`,
          accountingAligned
            ? "Reporting bases are aligned, simplifying comparison."
            : "Reporting bases differ — normalize revenue recognition, leases, and EBITDA add-backs before comparison.",
          "Request a bridge from reported to normalized figures for both companies.",
        ],
      },
      keyPerson: {
        title: "Key-Person & Ownership Risks",
        level: founderRisk ? "Elevated" : "Moderate",
        note: "Founder dependence, approval requirements, equity acceleration, and talent retention can each materially affect deal execution and post-close value.",
        bullets: [
          founderRisk
            ? "At least one company is founder-led — succession and retention terms are critical."
            : "Neither company is founder-led, reducing single-point key-person exposure.",
          `${nameA} ownership: ${a.ownershipStructure || "not specified"}. ${nameB} ownership: ${
            b.ownershipStructure || "not specified"
          }.`,
          "Review change-of-control clauses, equity acceleration triggers, and retention packages.",
          "Confirm required shareholder / board approvals early in the process.",
        ],
      },
      precedents: {
        title: "Precedent M&A Transactions",
        level: "Low",
        note: "Comparable transactions provide EV/Revenue and EV/EBITDA benchmarks. Multiples are shown where available; gaps indicate undisclosed terms.",
        bullets: [
          "Benchmarks are indicative and sensitive to deal timing and market conditions.",
          "Use alongside a discounted cash flow view for triangulation.",
        ],
        transactions: [
          {
            target: `${a.industry || "Sector"} Holdings`,
            acquirer: "Meridian Capital",
            year: 2023,
            evRevenue: Number((1.4 + rnd() * 3).toFixed(1)),
            evEbitda: Number((7 + rnd() * 8).toFixed(1)),
          },
          {
            target: `${b.industry || "Adjacent"} Group`,
            acquirer: "Northbridge Partners",
            year: 2022,
            evRevenue: Number((1.1 + rnd() * 2.6).toFixed(1)),
            evEbitda: Number((6 + rnd() * 7).toFixed(1)),
          },
          {
            target: "Vertex Industries",
            acquirer: "Arclight Equity",
            year: 2024,
            evRevenue: Number((1.8 + rnd() * 3.4).toFixed(1)),
            evEbitda: rnd() > 0.4 ? Number((8 + rnd() * 9).toFixed(1)) : null,
          },
        ],
      },
    },
    generatedAt: new Date().toISOString(),
    source: "mock",
  };
}
