// ============================================================
// Server-side PDF generation for the compatibility report.
//
// Mirrors the ma-compatibility-scoring skill's Step 4 default output format
// (PDF, with an embedded sub-score radar chart) so the report produced here
// looks and reads the same as a manually-run skill invocation would.
// ============================================================

import PDFDocument from "pdfkit";
import type { KeyMetrics, SubScores } from "./scoringTypes";

const SUB_SCORE_LABELS: Record<keyof SubScores, string> = {
  revenue_complementarity: "Revenue complementarity",
  growth_alignment: "Growth alignment",
  margin_compatibility: "Margin compatibility",
  leverage_liquidity_fit: "Leverage/liquidity fit",
  size_ratio: "Size ratio",
  customer_overlap: "Customer overlap",
  revenue_per_employee_gap: "Revenue-per-employee gap",
  valuation_feasibility: "Valuation feasibility",
};

const SUB_SCORE_WEIGHTS_DISPLAY: Record<keyof SubScores, string> = {
  revenue_complementarity: "20%",
  growth_alignment: "15%",
  margin_compatibility: "15%",
  leverage_liquidity_fit: "15%",
  size_ratio: "10%",
  customer_overlap: "15%",
  revenue_per_employee_gap: "5%",
  valuation_feasibility: "5%",
};

const NAVY = "#0F1E3C";
const GOLD = "#B8862B";
const GOLD_FILL = "#E4B95A";
const GREY = "#6B7280";
const LIGHT_GRID = "#D8DCE3";

export interface ReportPdfInput {
  companyAName: string;
  companyBName: string;
  composite: number;
  subScores: SubScores;
  keyMetrics: KeyMetrics;
  missingDataFlags: string[];
  riskFlags: string[];
  rationale: string;
  generatedAt: string;
}

function fmtPct(v: number | null, digits = 1): string {
  return v == null ? "n/a" : `${(v * 100).toFixed(digits)}%`;
}
function fmtX(v: number | null, digits = 2): string {
  return v == null ? "n/a" : `${v.toFixed(digits)}x`;
}
function fmtNum(v: number | null, digits = 1): string {
  return v == null ? "n/a" : v.toFixed(digits);
}

function drawRadarChart(
  doc: PDFKit.PDFDocument,
  centerX: number,
  centerY: number,
  radius: number,
  labels: string[],
  values: number[]
) {
  const n = labels.length;
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pointAt = (i: number, r: number) => {
    const a = angleFor(i);
    return [centerX + r * Math.cos(a), centerY + r * Math.sin(a)];
  };

  // Grid rings at 20/40/60/80/100
  doc.strokeColor(LIGHT_GRID).lineWidth(0.75);
  for (const frac of [0.2, 0.4, 0.6, 0.8, 1.0]) {
    doc.moveTo(...(pointAt(0, radius * frac) as [number, number]));
    for (let i = 1; i <= n; i++) {
      doc.lineTo(...(pointAt(i % n, radius * frac) as [number, number]));
    }
    doc.stroke();
  }

  // Axis spokes + labels
  doc.strokeColor(LIGHT_GRID).lineWidth(0.75);
  labels.forEach((label, i) => {
    const [x, y] = pointAt(i, radius);
    doc.moveTo(centerX, centerY).lineTo(x, y).stroke();
    const [lx, ly] = pointAt(i, radius + 14);
    doc
      .fontSize(7)
      .fillColor(GREY)
      .text(label, lx - 32, ly - 4, { width: 64, align: "center" });
  });

  // Data polygon
  const dataPoints = values.map((v, i) => pointAt(i, (Math.max(0, Math.min(100, v)) / 100) * radius));
  doc.moveTo(...(dataPoints[0] as [number, number]));
  for (let i = 1; i <= n; i++) {
    doc.lineTo(...(dataPoints[i % n] as [number, number]));
  }
  doc.fillOpacity(0.28).fillColor(GOLD_FILL).fill();
  doc.fillOpacity(1);
  doc.moveTo(...(dataPoints[0] as [number, number]));
  for (let i = 1; i <= n; i++) {
    doc.lineTo(...(dataPoints[i % n] as [number, number]));
  }
  doc.strokeColor(GOLD).lineWidth(1.5).stroke();

  // Vertex dots
  dataPoints.forEach(([x, y]) => {
    doc.circle(x, y, 2).fillColor(GOLD).fill();
  });
}

function sectionHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.6);
  doc.fontSize(13).fillColor(NAVY).font("Helvetica-Bold").text(text);
  doc.moveDown(0.2);
  doc.font("Helvetica");
}

function bulletList(doc: PDFKit.PDFDocument, items: string[], emptyText: string) {
  doc.fontSize(9.5).fillColor("#222222");
  if (!items.length) {
    doc.fillColor(GREY).text(emptyText);
    doc.fillColor("#222222");
    return;
  }
  items.forEach((item) => {
    doc.text(`•  ${item}`, { indent: 0, width: 480 });
    doc.moveDown(0.15);
  });
}

export async function generateReportPdf(input: ReportPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margins: { top: 48, bottom: 48, left: 48, right: 48 } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const subKeys = Object.keys(input.subScores) as (keyof SubScores)[];

  // ---- Header ----
  doc.fontSize(18).fillColor(NAVY).font("Helvetica-Bold").text("M&A Compatibility Screen");
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor(GREY)
    .text(`${input.companyAName}  ×  ${input.companyBName}`);
  doc.fontSize(8).fillColor(GREY).text(`Generated ${new Date(input.generatedAt).toLocaleString()} · GoldBridge AI`);

  // ---- Composite score ----
  doc.moveDown(1);
  doc.fontSize(30).fillColor(GOLD).font("Helvetica-Bold").text(`${input.composite.toFixed(1)} / 100`, {
    align: "center",
  });
  doc.fontSize(9).fillColor(GREY).font("Helvetica").text("Composite compatibility score", { align: "center" });

  // ---- Radar chart ----
  doc.moveDown(1);
  const chartTop = doc.y;
  drawRadarChart(
    doc,
    doc.page.width / 2,
    chartTop + 110,
    95,
    subKeys.map((k) => SUB_SCORE_LABELS[k]),
    subKeys.map((k) => input.subScores[k])
  );
  doc.y = chartTop + 230;

  // ---- Sub-score table ----
  sectionHeading(doc, "Sub-scores");
  const colX = [48, 300, 380, 470];
  doc.fontSize(9).font("Helvetica-Bold").fillColor(NAVY);
  const headerY = doc.y;
  doc.text("Dimension", colX[0], headerY);
  doc.text("Score", colX[1], headerY);
  doc.text("Weight", colX[2], headerY);
  doc.moveDown(0.5);
  doc.font("Helvetica").fillColor("#222222");
  subKeys.forEach((k) => {
    const y = doc.y;
    doc.text(SUB_SCORE_LABELS[k], colX[0], y, { width: 240 });
    doc.text(input.subScores[k].toFixed(1), colX[1], y);
    doc.text(SUB_SCORE_WEIGHTS_DISPLAY[k], colX[2], y);
    doc.moveDown(0.35);
  });

  // ---- Key figures ----
  sectionHeading(doc, "Key figures");
  const m = input.keyMetrics;
  const keyLines = [
    m.correlationR != null ? `Quarterly revenue correlation: r = ${m.correlationR.toFixed(2)}` : null,
    m.cagrA != null && m.cagrB != null
      ? `Revenue CAGR: ${fmtPct(m.cagrA)} (${input.companyAName}) vs. ${fmtPct(m.cagrB)} (${input.companyBName}) — gap ${fmtNum(m.cagrGapPp)}pp`
      : null,
    m.grossMarginA != null && m.grossMarginB != null
      ? `Gross margin: ${fmtPct(m.grossMarginA)} vs. ${fmtPct(m.grossMarginB)}`
      : null,
    m.ebitdaMarginA != null && m.ebitdaMarginB != null
      ? `EBITDA margin: ${fmtPct(m.ebitdaMarginA)} vs. ${fmtPct(m.ebitdaMarginB)}`
      : null,
    m.netDebtEbitdaA != null && m.netDebtEbitdaB != null
      ? `Net Debt/EBITDA: ${fmtX(m.netDebtEbitdaA)} vs. ${fmtX(m.netDebtEbitdaB)}`
      : null,
    m.currentRatioA != null && m.currentRatioB != null
      ? `Current ratio: ${fmtX(m.currentRatioA)} vs. ${fmtX(m.currentRatioB)}`
      : null,
    m.interestCoverageA != null || m.interestCoverageB != null
      ? `Interest coverage (EBIT/interest): ${fmtX(m.interestCoverageA)} vs. ${fmtX(m.interestCoverageB)}`
      : null,
    m.revSizeRatio != null ? `Revenue size ratio: ${fmtX(m.revSizeRatio)}` : null,
    m.hcSizeRatio != null ? `Headcount size ratio: ${fmtX(m.hcSizeRatio)}` : null,
    m.hhiA != null && m.hhiB != null ? `Customer HHI: ${fmtNum(m.hhiA, 0)} vs. ${fmtNum(m.hhiB, 0)}` : null,
    m.revPerEmployeeA != null && m.revPerEmployeeB != null
      ? `Revenue/employee: $${Math.round(m.revPerEmployeeA).toLocaleString()} vs. $${Math.round(m.revPerEmployeeB).toLocaleString()}`
      : null,
    m.evA != null && m.evB != null ? `Enterprise value: $${m.evA.toFixed(0)}M vs. $${m.evB.toFixed(0)}M` : null,
    m.evRevA != null && m.evRevB != null ? `EV/Revenue: ${fmtX(m.evRevA)} vs. ${fmtX(m.evRevB)}` : null,
    m.evEbitdaA != null || m.evEbitdaB != null
      ? `EV/EBITDA: ${fmtX(m.evEbitdaA)} vs. ${fmtX(m.evEbitdaB)}`
      : null,
  ].filter((l): l is string => Boolean(l));
  bulletList(doc, keyLines, "Not enough disclosed data to compute key figures.");

  // ---- Risk flags ----
  sectionHeading(doc, "Risk flags (not part of the composite score)");
  bulletList(doc, input.riskFlags, "No qualitative risk flags were identified in the provided documents.");

  // ---- Missing data flags ----
  sectionHeading(doc, "Missing-data flags");
  bulletList(doc, input.missingDataFlags, "No missing-data flags — all checklist items were found.");

  // ---- Rationale ----
  sectionHeading(doc, "Rationale");
  doc.fontSize(9.5).fillColor("#222222").text(input.rationale, { width: 500, align: "left" });

  // ---- Footer disclaimer ----
  doc.moveDown(1);
  doc
    .fontSize(7.5)
    .fillColor(GREY)
    .text(
      "This score excludes culture fit, technology/systems integration, legal/regulatory risk, and key-person " +
        "dependency beyond what's qualitatively flagged above. It is a screening signal generated by the " +
        "ma-compatibility-scoring methodology from the documents provided — not a merge/no-merge recommendation, " +
        "and not a substitute for full due diligence.",
      { width: 500 }
    );

  doc.end();
  return done;
}
