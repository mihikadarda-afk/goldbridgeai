// ============================================================
// Shared domain types for GoldBridge AI
// ============================================================

export type AccountingStandard = "GAAP" | "IFRS" | "Other";
export type EbitdaType = "Standard" | "Adjusted" | "Company Defined";
export type YesNo = "Yes" | "No";

/** Structured metadata collected for a single company. */
export interface CompanyMetadata {
  name: string;
  industry: string;
  revenue: string; // kept as string in the form; parsed server-side
  ebitda: string;
  employees: string;
  marketShare: string;
  enterpriseValue: string;
  accountingStandard: AccountingStandard | "";
  ebitdaType: EbitdaType | "";
  lastReportingDate: string;
  founderLed: YesNo | "";
  ownershipStructure: string;
}

/** A single uploaded file's metadata (content is uploaded separately). */
export interface UploadedDoc {
  slotId: string;
  label: string;
  fileName: string;
  sizeBytes: number;
  mime: string;
  required: boolean;
}

export interface CompanySubmission {
  metadata: CompanyMetadata;
  documents: UploadedDoc[];
}

export interface AnalysisRequest {
  companyA: CompanySubmission;
  companyB: CompanySubmission;
  submittedAt: string;
}

// ----------------------- Results -----------------------

export type RiskLevel = "Low" | "Moderate" | "Elevated" | "High";
export type Recommendation = "Proceed" | "Proceed with Conditions" | "Hold" | "Do Not Proceed";

export interface FitScore {
  key: "strategic" | "financial" | "operational" | "cultural";
  label: string;
  score: number; // 0-100
  summary: string;
}

export interface MetricConfidence {
  metric: string;
  companyA: string;
  companyB: string;
  freshnessDays: number;
  confidence: number; // 0-100
}

export interface PrecedentTransaction {
  target: string;
  acquirer: string;
  year: number;
  evRevenue: number | null;
  evEbitda: number | null;
}

export interface RiskDetail {
  title: string;
  level: RiskLevel;
  note: string;
  bullets: string[];
}

export interface CompatibilityResult {
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  recommendation: Recommendation;
  executiveSummary: string;
  fits: FitScore[];
  risks: {
    revenueCorrelation: RiskDetail & { correlation: number };
    marketConcentration: RiskDetail & { combinedShare: number; antitrustFlag: boolean };
    customerConcentration: RiskDetail & { hhi: number; overlapPct: number };
    dataRecency: RiskDetail & { metrics: MetricConfidence[] };
    accountingComparability: RiskDetail & {
      standardA: string;
      standardB: string;
      ebitdaTypeA: string;
      ebitdaTypeB: string;
    };
    keyPerson: RiskDetail;
    precedents: RiskDetail & { transactions: PrecedentTransaction[] };
  };
  generatedAt: string;
  source: "agent" | "mock";
}
