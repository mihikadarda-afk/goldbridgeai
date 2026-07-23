import { NextResponse } from "next/server";
import { extractCompanyDocs } from "@/lib/extractText";
import { extractCompanyData } from "@/lib/anthropicExtract";
import { computeScoring } from "@/lib/maScoring";
import { buildRationale, buildRiskFlags } from "@/lib/reportNarrative";
import { generateReportPdf } from "@/lib/reportPdf";

export const runtime = "nodejs";
export const maxDuration = 120; // doc extraction + Claude call + PDF generation can take a while

/**
 * POST /api/score
 *
 * Runs the ma-compatibility-scoring pipeline in-process, end to end:
 *
 *   uploaded files -> extract text (extractText.ts)
 *                  -> Claude extracts structured Section-2 raw data (anthropicExtract.ts)
 *                  -> deterministic scoring bands (maScoring.ts) - NOT computed by Claude
 *                  -> PDF report with embedded radar chart (reportPdf.ts)
 *
 * Expects multipart/form-data with repeated "companyAFiles" and "companyBFiles"
 * file fields. Returns the generated PDF directly (Content-Type: application/pdf).
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const filesA = form.getAll("companyAFiles").filter((v): v is File => v instanceof File);
  const filesB = form.getAll("companyBFiles").filter((v): v is File => v instanceof File);

  if (!filesA.length || !filesB.length) {
    return NextResponse.json(
      { error: "At least one file is required for both Company A and Company B." },
      { status: 422 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured on the server. Add it to your environment variables and redeploy to enable automatic scoring.",
      },
      { status: 501 }
    );
  }

  try {
    const [buffersA, buffersB] = await Promise.all([
      Promise.all(filesA.map(async (f) => ({ fileName: f.name, buffer: Buffer.from(await f.arrayBuffer()) }))),
      Promise.all(filesB.map(async (f) => ({ fileName: f.name, buffer: Buffer.from(await f.arrayBuffer()) }))),
    ]);

    const [extractedA, extractedB] = await Promise.all([
      extractCompanyDocs(buffersA),
      extractCompanyDocs(buffersB),
    ]);

    if (!extractedA.combinedText && !extractedB.combinedText) {
      return NextResponse.json(
        {
          error:
            "Couldn't extract text from any uploaded file. They may be scanned images that need OCR, password-protected, or corrupted.",
          detail: [...extractedA.failures, ...extractedB.failures]
            .map((f) => `${f.fileName}: ${f.error}`)
            .join("; "),
        },
        { status: 422 }
      );
    }

    const { companyA, companyB } = await extractCompanyData(
      extractedA.combinedText,
      extractedB.combinedText,
      apiKey
    );

    if (extractedA.failures.length) {
      companyA.missingFields.push(...extractedA.failures.map((f) => `Could not read ${f.fileName}: ${f.error}`));
    }
    if (extractedB.failures.length) {
      companyB.missingFields.push(...extractedB.failures.map((f) => `Could not read ${f.fileName}: ${f.error}`));
    }

    const scoring = computeScoring(companyA, companyB);
    const riskFlags = buildRiskFlags(companyA, companyB, scoring);
    const rationale = buildRationale(companyA, companyB, scoring);

    const missingDataFlags = [
      ...scoring.missingDataFlags,
      ...companyA.missingFields.map((f) => `${companyA.name || "Company A"}: ${f}`),
      ...companyB.missingFields.map((f) => `${companyB.name || "Company B"}: ${f}`),
    ];

    const pdf = await generateReportPdf({
      companyAName: companyA.name || "Company A",
      companyBName: companyB.name || "Company B",
      composite: scoring.composite,
      subScores: scoring.subScores,
      keyMetrics: scoring.keyMetrics,
      missingDataFlags,
      riskFlags,
      rationale,
      generatedAt: new Date().toISOString(),
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="compatibility-report.pdf"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: "Scoring pipeline failed.", detail: message }, { status: 500 });
  }
}
