// ============================================================
// Combines the deterministic scoring output with the qualitative notes
// Claude extracted from the documents into the risk-flag list and rationale
// paragraph the skill's Step 4 output calls for. No math happens here —
// this only assembles text from numbers/notes computed elsewhere.
// ============================================================

import type { RawCompanyData, ScoringResult, SubScores } from "./scoringTypes";

const SUB_SCORE_LABELS: Record<keyof SubScores, string> = {
  revenue_complementarity: "revenue complementarity",
  growth_alignment: "growth alignment",
  margin_compatibility: "margin compatibility",
  leverage_liquidity_fit: "leverage/liquidity fit",
  size_ratio: "size ratio",
  customer_overlap: "customer overlap",
  revenue_per_employee_gap: "revenue-per-employee gap",
  valuation_feasibility: "valuation feasibility",
};

export function buildRiskFlags(a: RawCompanyData, b: RawCompanyData, scoring: ScoringResult): string[] {
  const flags: string[] = [...scoring.autoRiskFlags];

  if (a.changeOfControlNote) flags.push(`${a.name}: ${a.changeOfControlNote}`);
  if (b.changeOfControlNote) flags.push(`${b.name}: ${b.changeOfControlNote}`);
  if (a.keyPersonNote) flags.push(`${a.name}: ${a.keyPersonNote}`);
  if (b.keyPersonNote) flags.push(`${b.name}: ${b.keyPersonNote}`);
  if (a.leadershipRiskNote) flags.push(`${a.name}: ${a.leadershipRiskNote}`);
  if (b.leadershipRiskNote) flags.push(`${b.name}: ${b.leadershipRiskNote}`);

  if (a.marketSharePct != null && b.marketSharePct != null) {
    const combined = a.marketSharePct + b.marketSharePct;
    if (combined > 0.25) {
      flags.push(
        `Market concentration: combined estimated share of ${(combined * 100).toFixed(1)}% may warrant antitrust review (screening flag only, not a legal determination).`
      );
    } else {
      flags.push(
        `Market concentration: combined estimated share of ${(combined * 100).toFixed(1)}% is below the screening threshold — no antitrust flag.`
      );
    }
  }

  if (a.recurringRevenuePct != null || b.recurringRevenuePct != null) {
    const partA = `${a.name}: ${a.recurringRevenuePct != null ? `${(a.recurringRevenuePct * 100).toFixed(0)}% recurring` : "recurring % not disclosed"}${a.nrr != null ? `, NRR ${(a.nrr * 100).toFixed(0)}%` : a.renewalRatePct != null ? `, renewal rate ${(a.renewalRatePct * 100).toFixed(0)}%` : ""}`;
    const partB = `${b.name}: ${b.recurringRevenuePct != null ? `${(b.recurringRevenuePct * 100).toFixed(0)}% recurring` : "recurring % not disclosed"}${b.nrr != null ? `, NRR ${(b.nrr * 100).toFixed(0)}%` : b.renewalRatePct != null ? `, renewal rate ${(b.renewalRatePct * 100).toFixed(0)}%` : ""}`;
    flags.push(`Revenue quality: ${partA}. ${partB}.`);
  }

  if (a.precedentTransactions.length || b.precedentTransactions.length) {
    const all = [...a.precedentTransactions, ...b.precedentTransactions];
    flags.push(
      `Precedent transactions on file: ${all
        .map((t) => `${t.label} (${t.evRevenue != null ? `${t.evRevenue.toFixed(1)}x EV/Rev` : "EV/Rev n/a"}${t.evEbitda != null ? `, ${t.evEbitda.toFixed(1)}x EV/EBITDA` : ""})`)
        .join("; ")} — use as a sanity check on the valuation-feasibility sub-score.`
    );
  }

  return flags;
}

export function buildRationale(a: RawCompanyData, b: RawCompanyData, scoring: ScoringResult): string {
  const entries = Object.entries(scoring.subScores) as [keyof SubScores, number][];
  const sorted = [...entries].sort((x, y) => y[1] - x[1]);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const m = scoring.keyMetrics;

  const bits: string[] = [];
  bits.push(
    `Composite compatibility score: ${scoring.composite.toFixed(1)}/100, based on the documents provided for ${a.name} and ${b.name}.`
  );

  if (m.cagrA != null && m.cagrB != null) {
    bits.push(
      `Revenue growth is the clearest divergence to note first: ${a.name} grew at a ${(m.cagrA * 100).toFixed(1)}% CAGR versus ${b.name}'s ${(m.cagrB * 100).toFixed(1)}%.`
    );
  }
  if (m.grossMarginA != null && m.grossMarginB != null) {
    bits.push(
      `Gross margins sit at ${(m.grossMarginA * 100).toFixed(1)}% and ${(m.grossMarginB * 100).toFixed(1)}% respectively, which drives most of the margin-compatibility sub-score.`
    );
  }
  if (m.correlationR != null) {
    bits.push(
      `Quarterly revenue correlation is r = ${m.correlationR.toFixed(2)} — the methodology rewards offsetting cycles over co-movement, so a positive correlation caps rather than lifts the revenue-complementarity sub-score.`
    );
  }

  bits.push(
    `${SUB_SCORE_LABELS[strongest[0]]} is the strongest dimension (${strongest[1].toFixed(1)}/100), while ${SUB_SCORE_LABELS[weakest[0]]} is the weakest (${weakest[1].toFixed(1)}/100) and is worth the closest follow-up diligence.`
  );

  if (scoring.missingDataFlags.length) {
    bits.push(
      `${scoring.missingDataFlags.length} checklist item${scoring.missingDataFlags.length === 1 ? "" : "s"} could not be found in the uploaded documents — see the missing-data flags below for what to request next.`
    );
  }

  return bits.join(" ");
}
