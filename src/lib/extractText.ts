// ============================================================
// Server-side text extraction for uploaded company documents.
//
// Mirrors Section 2a of the ma-compatibility-scoring skill: use the matching
// format library per file type rather than hand-parsing bytes. Output is
// plain text handed to Claude for structured extraction (see
// anthropicExtract.ts) — this file does no interpretation of the content,
// only format decoding.
// ============================================================

import { extensionOf } from "./documents";

const MAX_CHARS_PER_FILE = 60_000; // keep prompts bounded; long filings get truncated with a note

function truncate(text: string, fileName: string): string {
  const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length <= MAX_CHARS_PER_FILE) return cleaned;
  return (
    cleaned.slice(0, MAX_CHARS_PER_FILE) +
    `\n\n[...truncated — "${fileName}" exceeded ${MAX_CHARS_PER_FILE.toLocaleString()} characters, remainder not sent...]`
  );
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-parse's default export is CJS; dynamic import keeps this out of the
  // client bundle since extractText.ts is only ever called from route handlers.
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text ?? "";
}

async function extractDocx(buffer: Buffer): Promise<string> {
  // mammoth is a CJS package; depending on the bundler's interop, the dynamic
  // import may land the methods on the namespace directly or under `.default`.
  // Handle both so a bundler-specific quirk doesn't crash extraction.
  const mod = (await import("mammoth")) as unknown as Record<string, unknown>;
  const mammoth = (typeof mod.extractRawText === "function" ? mod : mod.default) as {
    extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
  };
  const { value } = await mammoth.extractRawText({ buffer });
  return value ?? "";
}

async function extractSpreadsheet(buffer: Buffer): Promise<string> {
  const mod = (await import("xlsx")) as unknown as Record<string, unknown>;
  const XLSX = (typeof mod.read === "function" ? mod : mod.default) as typeof import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) parts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
  }
  return parts.join("\n\n");
}

async function extractCsv(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

async function extractTxt(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

/** Best-effort .pptx text extraction: pptx is a zip of slide XML files;
 *  pull the text runs (<a:t>...</a:t>) out of each slideN.xml in order. */
async function extractPptx(buffer: Buffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      return na - nb;
    });

  const slides: string[] = [];
  for (const [i, name] of slideFiles.entries()) {
    const xml = await zip.files[name].async("string");
    const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
    if (texts.length) slides.push(`--- Slide ${i + 1} ---\n${texts.join(" ")}`);
  }
  return slides.join("\n\n");
}

export interface ExtractedDoc {
  fileName: string;
  ok: boolean;
  text: string;
  error?: string;
}

export async function extractDocText(fileName: string, buffer: Buffer): Promise<ExtractedDoc> {
  const ext = extensionOf(fileName);
  try {
    let text = "";
    switch (ext) {
      case "pdf":
        text = await extractPdf(buffer);
        break;
      case "docx":
        text = await extractDocx(buffer);
        break;
      case "xlsx":
        text = await extractSpreadsheet(buffer);
        break;
      case "csv":
        text = await extractCsv(buffer);
        break;
      case "pptx":
        text = await extractPptx(buffer);
        break;
      case "txt":
        text = await extractTxt(buffer);
        break;
      default:
        return { fileName, ok: false, text: "", error: `Unsupported extension ".${ext}".` };
    }
    if (!text.trim()) {
      return {
        fileName,
        ok: false,
        text: "",
        error: "No extractable text found (file may be a scanned image without OCR, or empty).",
      };
    }
    return { fileName, ok: true, text: truncate(text, fileName) };
  } catch (err) {
    return {
      fileName,
      ok: false,
      text: "",
      error: err instanceof Error ? err.message : "Unknown extraction error.",
    };
  }
}

/** Extract every document for a company and concatenate into one labeled block. */
export async function extractCompanyDocs(
  files: { fileName: string; buffer: Buffer }[]
): Promise<{ combinedText: string; failures: ExtractedDoc[] }> {
  const results = await Promise.all(files.map((f) => extractDocText(f.fileName, f.buffer)));
  const ok = results.filter((r) => r.ok);
  const failures = results.filter((r) => !r.ok);
  const combinedText = ok.map((r) => `===== FILE: ${r.fileName} =====\n${r.text}`).join("\n\n");
  return { combinedText, failures };
}
