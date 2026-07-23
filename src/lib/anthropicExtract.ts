// ============================================================
// Claude call: read the uploaded documents, extract structured facts.
//
// This is the ONLY step in the pipeline that calls Claude, and it is
// deliberately scoped to extraction, not arithmetic — per the
// ma-compatibility-scoring skill's own instruction not to let an LLM eyeball
// multi-step math. All scoring happens afterward in maScoring.ts, in plain
// TypeScript, using the exact bands from the skill's Section 2a.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { RawCompanyData } from "./scoringTypes";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

const rawCompanySchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Company name, inferred from the documents." },
    industry: { type: "string" },
    quarterlyRevenue: {
      type: "array",
      items: { type: "number" },
      description:
        "Quarterly revenue in $M, oldest to newest, same length/periods as the other company if possible. Empty array if not found.",
    },
    annualRevenue: {
      type: "object",
      description: "Year (e.g. \"2021\") to annual revenue in $M. At least 3-5 years if available.",
      additionalProperties: { type: "number" },
    },
    cogs: { type: ["number", "null"], description: "Cost of goods sold, most recent full year, $M." },
    operatingIncome: { type: ["number", "null"] },
    da: { type: ["number", "null"], description: "Depreciation & amortization, $M." },
    ebitda: { type: ["number", "null"], description: "EBITDA if directly disclosed, $M." },
    ebitdaAdjusted: {
      type: ["boolean", "null"],
      description: "True if the company reports an 'adjusted' or company-defined EBITDA (e.g. excludes stock comp).",
    },
    totalDebt: { type: ["number", "null"] },
    cash: { type: ["number", "null"] },
    currentAssets: { type: ["number", "null"] },
    currentLiabilities: { type: ["number", "null"] },
    interestExpense: { type: ["number", "null"] },
    headcount: {
      type: "object",
      description: "Year to headcount, ideally a 3-year trend.",
      additionalProperties: { type: "number" },
    },
    customerCount: { type: ["number", "null"] },
    topCustomerRevenue: {
      type: "array",
      items: { type: "number" },
      description: "Revenue of the top 5-10 customers, descending, $M.",
    },
    isPublic: { type: ["boolean", "null"] },
    marketCapOrValuation: {
      type: ["number", "null"],
      description: "Market cap if public; last-known valuation or disclosed EV if private, $M.",
    },
    valuationIsEnterpriseValue: {
      type: ["boolean", "null"],
      description: "True if marketCapOrValuation is already an enterprise value rather than equity value.",
    },
    recurringRevenuePct: { type: ["number", "null"], description: "0-1 scale." },
    nrr: { type: ["number", "null"], description: "Net revenue retention, e.g. 1.18 for 118%." },
    churnPct: { type: ["number", "null"], description: "0-1 scale." },
    renewalRatePct: { type: ["number", "null"], description: "0-1 scale, non-subscription analog to NRR." },
    marketSharePct: { type: ["number", "null"], description: "0-1 scale." },
    accountingStandard: { type: "string", enum: ["GAAP", "IFRS", "Other", "Unknown"] },
    filingDate: { type: ["string", "null"], description: "Most recent filing/data date, ISO format if possible." },
    changeOfControlNote: {
      type: ["string", "null"],
      description: "Any mention of change-of-control termination clauses in customer or other contracts.",
    },
    keyPersonNote: {
      type: ["string", "null"],
      description: "Founder-led status, concentrated ownership, equity vesting/acceleration clauses.",
    },
    leadershipRiskNote: {
      type: ["string", "null"],
      description: "Recent leadership departures or continuity concerns.",
    },
    precedentTransactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          evRevenue: { type: ["number", "null"] },
          evEbitda: { type: ["number", "null"] },
        },
        required: ["label", "evRevenue", "evEbitda"],
      },
      description: "Comparable M&A transactions mentioned in the documents, if any.",
    },
    missingFields: {
      type: "array",
      items: { type: "string" },
      description:
        "Names of Section-2-checklist items that could not be found anywhere in this company's documents.",
    },
  },
  required: [
    "name",
    "industry",
    "quarterlyRevenue",
    "annualRevenue",
    "cogs",
    "operatingIncome",
    "da",
    "ebitda",
    "ebitdaAdjusted",
    "totalDebt",
    "cash",
    "currentAssets",
    "currentLiabilities",
    "interestExpense",
    "headcount",
    "customerCount",
    "topCustomerRevenue",
    "isPublic",
    "marketCapOrValuation",
    "valuationIsEnterpriseValue",
    "recurringRevenuePct",
    "nrr",
    "churnPct",
    "renewalRatePct",
    "marketSharePct",
    "accountingStandard",
    "filingDate",
    "changeOfControlNote",
    "keyPersonNote",
    "leadershipRiskNote",
    "precedentTransactions",
    "missingFields",
  ],
} as const;

const SYSTEM_PROMPT = `You are the extraction stage of the ma-compatibility-scoring pipeline (an M&A screening tool).

Your ONLY job is to read the provided document text for two companies and populate a structured JSON record per company, following this checklist:
quarterly revenue (2-3+ years, same periods for both companies where possible), annual revenue (3-5 years), COGS,
operating income, D&A, total debt, cash, current assets/liabilities, interest expense, headcount (current + 3-year
trend), customer count + top 5-10 customer revenue, market cap or last-known valuation, recurring vs one-time revenue
split, NRR/churn (subscription businesses) or renewal rate (non-subscription), market share, accounting standard,
whether EBITDA is "adjusted"/company-defined, and filing/data date.

Also extract qualitative notes wherever the text mentions them: change-of-control termination clauses in customer
contracts, founder-led status or concentrated ownership, recent leadership departures, and any comparable M&A
transactions cited.

Hard rules:
- Extract only what the documents actually say. If a figure or fact is not present anywhere in the provided text,
  set it to null (or an empty array/object) and add the checklist item's name to missingFields for that company.
- NEVER estimate, infer, or fabricate a number that isn't stated in the source text. A confident-sounding guess is
  worse than an honest null here — every downstream score is computed from these fields in plain code, not by you,
  so an invented number silently corrupts the math.
- Do not compute ratios, margins, CAGR, or any derived metric yourself — only extract the raw figures as reported.
- If the same fact appears in multiple places with different values, prefer the audited/financial-statement figure
  over a deck or press-release figure, and don't average them.

Call the extract_ma_data tool exactly once with both companies populated.`;

export interface ExtractionResult {
  companyA: RawCompanyData;
  companyB: RawCompanyData;
}

export async function extractCompanyData(
  companyATextBlock: string,
  companyBTextBlock: string,
  apiKey: string
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "extract_ma_data",
        description: "Report the extracted Section-2 raw data checklist for both companies.",
        input_schema: {
          type: "object",
          properties: {
            companyA: rawCompanySchema,
            companyB: rawCompanySchema,
          },
          required: ["companyA", "companyB"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "extract_ma_data" },
    messages: [
      {
        role: "user",
        content: [
          "===== COMPANY A DOCUMENTS =====",
          companyATextBlock || "(no extractable text — files may be scanned images or empty)",
          "",
          "===== COMPANY B DOCUMENTS =====",
          companyBTextBlock || "(no extractable text — files may be scanned images or empty)",
        ].join("\n"),
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use" && block.name === "extract_ma_data"
  );
  if (!toolUse) {
    throw new Error("Claude did not return structured extraction output.");
  }

  const input = toolUse.input as { companyA: RawCompanyData; companyB: RawCompanyData };
  return { companyA: input.companyA, companyB: input.companyB };
}
