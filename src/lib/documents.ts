// ============================================================
// Document requirements + file validation
// ============================================================

export interface DocSlot {
  id: string;
  label: string;
  required: boolean;
}

/** Required documents for each company (mirrored for A and B). */
export const REQUIRED_DOCS: DocSlot[] = [
  { id: "financial-statements", label: "Financial statements", required: true },
  { id: "balance-sheet", label: "Balance sheet", required: true },
  { id: "income-statement", label: "Income statement", required: true },
  { id: "cash-flow", label: "Cash flow statement", required: true },
  { id: "revenue-history", label: "Revenue history", required: true },
  { id: "ebitda", label: "EBITDA", required: true },
  { id: "customer-list", label: "Customer list", required: true },
  { id: "market-share", label: "Market share", required: true },
  { id: "org-chart", label: "Organizational chart", required: true },
  { id: "employee-info", label: "Employee information", required: true },
  { id: "ownership-info", label: "Ownership information", required: true },
  { id: "industry-reports", label: "Industry reports", required: true },
];

/** Optional supporting documents (shared pool). */
export const OPTIONAL_DOCS: DocSlot[] = [
  { id: "annual-reports", label: "Annual reports", required: false },
  { id: "sec-filings", label: "SEC filings", required: false },
  { id: "investor-presentations", label: "Investor presentations", required: false },
  { id: "comparable-transactions", label: "Comparable transactions", required: false },
  { id: "market-research", label: "Market research", required: false },
  { id: "due-diligence", label: "Due diligence documents", required: false },
  { id: "legal-summaries", label: "Legal summaries", required: false },
];

export const ACCEPTED_EXTENSIONS = [
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "pptx",
  "txt",
] as const;

export const ACCEPTED_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
};

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file

export function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export interface FileValidation {
  ok: boolean;
  reason?: string;
}

export function validateFile(file: File): FileValidation {
  const ext = extensionOf(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number])) {
    return {
      ok: false,
      reason: `Unsupported file type ".${ext || "?"}". Accepted: ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, reason: "File appears to be empty." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: "File exceeds the 25 MB limit." };
  }
  return { ok: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
