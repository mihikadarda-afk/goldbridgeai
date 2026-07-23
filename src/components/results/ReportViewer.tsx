"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/documents";
import { cn } from "@/lib/utils";

const MAX_PDF_BYTES = 40 * 1024 * 1024; // 40 MB

interface LoadedReport {
  url: string;
  name: string;
  size: number;
}

export function ReportViewer({ companyA, companyB }: { companyA?: string; companyB?: string }) {
  const [report, setReport] = useState<LoadedReport | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoLoadAttempted = useRef(false);

  // Revoke the object URL when it changes or on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      if (report?.url) URL.revokeObjectURL(report.url);
    };
  }, [report?.url]);

  // Auto-load the report the ma-compatibility-scoring pipeline generated when the
  // "Organize & Continue" button was clicked on /analyze — no manual upload needed.
  // Guarded so clicking "Replace" (which clears sessionStorage) doesn't reload it.
  useEffect(() => {
    if (autoLoadAttempted.current || report) return;
    const stored = window.sessionStorage.getItem("gb-report-pdf");
    if (!stored) return;
    autoLoadAttempted.current = true;
    setAutoLoading(true);
    fetch(stored)
      .then((r) => r.blob())
      .then((blob) => {
        setReport({ url: URL.createObjectURL(blob), name: "compatibility-report.pdf", size: blob.size });
      })
      .catch(() => {
        // Auto-load failed silently — the manual upload dropzone below still works.
      })
      .finally(() => setAutoLoading(false));
  }, [report]);

  const accept = useCallback((files: FileList | null) => {
    setError(null);
    const f = files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload the PDF report produced by ma-compatibility-scoring.");
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setError("That PDF is larger than 40 MB.");
      return;
    }
    setReport({ url: URL.createObjectURL(f), name: f.name, size: f.size });
  }, []);

  const pair =
    companyA && companyB ? `${companyA} × ${companyB}` : "Compatibility Report";

  // ---- Auto-loading state: the pipeline already ran, we're just fetching the result ----
  if (autoLoading) {
    return (
      <div className="surface flex min-h-[320px] flex-col items-center justify-center rounded-3xl p-10 text-center">
        <span className="mb-4 flex h-12 w-12 animate-spin items-center justify-center rounded-full border-2 border-gold-400 border-t-transparent" />
        <p className="font-semibold text-navy-900 dark:text-white">Loading your report…</p>
        <p className="mt-1 text-sm text-charcoal-400">
          ma-compatibility-scoring already ran when you clicked Organize &amp; Continue — pulling in the result.
        </p>
      </div>
    );
  }

  // ---- Empty state: awaiting the PDF ----
  if (!report) {
    return (
      <div className="surface overflow-hidden rounded-3xl">
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          {/* Instructions */}
          <div className="border-b border-navy-100 p-8 dark:border-white/10 md:border-b-0 md:border-r">
            <p className="text-sm font-medium text-gold-600 dark:text-gold-300">
              Executive Compatibility Report
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-navy-900 dark:text-white">
              {pair}
            </h2>
            <p className="mt-4 text-sm text-charcoal-500 dark:text-navy-300">
              No report loaded yet. If you got here without clicking &ldquo;Organize &amp; Continue&rdquo;
              on the analyze page, you can upload a report PDF directly:
            </p>
            <ol className="mt-4 space-y-3">
              {[
                "Start (or finish) an analysis on the Analyze page — it runs ma-compatibility-scoring automatically.",
                "Or, if you already have a compatibility report PDF, drop it in here.",
                "Either way it opens below to view, download, and share.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3 text-sm text-charcoal-600 dark:text-navy-200">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-gold-300 dark:bg-white/10">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>

          {/* Dropzone */}
          <div className="p-8">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload PDF report"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                accept(e.dataTransfer.files);
              }}
              className={cn(
                "flex h-full min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition",
                dragging
                  ? "border-gold-400 bg-gold-50/60 dark:bg-gold-400/5"
                  : "border-navy-200 hover:border-gold-400 dark:border-white/15"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => accept(e.target.files)}
              />
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-metallic text-navy-950 shadow-gold">
                <PdfIcon />
              </span>
              <p className="font-semibold text-navy-900 dark:text-white">
                Drop the PDF report here
              </p>
              <p className="mt-1 text-sm text-charcoal-400">or click to browse · PDF up to 40 MB</p>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-sm text-red-500"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ---- Loaded state: show the PDF ----
  return (
    <div className="space-y-4">
      <div className="no-print surface flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gold-metallic text-navy-950">
            <PdfIcon />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-900 dark:text-white">{report.name}</p>
            <p className="text-xs text-charcoal-400">
              {pair} · {formatBytes(report.size)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={report.url} download={report.name} className="inline-flex">
            <Button variant="outline" size="sm">
              <DownloadIcon /> Download
            </Button>
          </a>
          <a href={report.url} target="_blank" rel="noopener noreferrer" className="inline-flex">
            <Button variant="outline" size="sm">
              Open in new tab
            </Button>
          </a>
          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              window.sessionStorage.removeItem("gb-report-pdf");
              setReport(null);
            }}
          >
            Replace
          </Button>
        </div>
      </div>

      <div className="surface overflow-hidden rounded-2xl">
        <object
          data={report.url}
          type="application/pdf"
          className="h-[80vh] w-full"
          aria-label="Compatibility report PDF"
        >
          <div className="p-10 text-center">
            <p className="text-charcoal-500 dark:text-navy-300">
              Your browser can&rsquo;t display PDFs inline.
            </p>
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-semibold text-gold-600 underline dark:text-gold-300"
            >
              Open the report in a new tab →
            </a>
          </div>
        </object>
      </div>
    </div>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3h8l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinejoin="round" />
      <path d="M9 13h1.5a1.5 1.5 0 010 3H9v-3zM9 16v2M14.5 13H13v5M13 15.5h1.3M17 13h1.8M17 13v5M17 15.5h1.4" strokeLinecap="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
    </svg>
  );
}
