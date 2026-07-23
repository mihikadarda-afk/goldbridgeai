"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { CompanyFileDrop } from "@/components/analyze/CompanyFileDrop";
import { useAutosave } from "@/lib/storage";
import type { CompanyMetadata, CompanySubmission } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyMeta: CompanyMetadata = {
  name: "",
  industry: "",
  revenue: "",
  ebitda: "",
  employees: "",
  marketShare: "",
  enterpriseValue: "",
  accountingStandard: "",
  ebitdaType: "",
  lastReportingDate: "",
  founderLed: "",
  ownershipStructure: "",
};

const emptySubmission: CompanySubmission = { metadata: { ...emptyMeta }, documents: [] };

interface Draft {
  companyA: CompanySubmission;
  companyB: CompanySubmission;
}

const steps = ["Company A", "Company B", "Review & Submit"];

export default function AnalyzePage() {
  const router = useRouter();
  const { value: draft, setValue: setDraft, savedAt } = useAutosave<Draft>("gb-draft", {
    companyA: structuredCloneSafe(emptySubmission),
    companyB: structuredCloneSafe(emptySubmission),
  });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Actual File blobs, kept separate from the autosaved draft (which only stores
  // file metadata — Files can't round-trip through localStorage/JSON).
  const [filesA, setFilesA] = useState<File[]>([]);
  const [filesB, setFilesB] = useState<File[]>([]);

  const setCompany = (key: "companyA" | "companyB", sub: CompanySubmission) =>
    setDraft((d) => ({ ...d, [key]: sub }));

  const hasFilesA = draft.companyA.documents.length > 0;
  const hasFilesB = draft.companyB.documents.length > 0;

  const stepValid = (i: number): boolean => {
    if (i === 0) return hasFilesA;
    if (i === 1) return hasFilesB;
    return hasFilesA && hasFilesB;
  };

  const next = () => {
    if (!stepValid(step)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setShowErrors(false);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    if (!stepValid(2)) {
      setShowErrors(true);
      return;
    }
    if (!filesA.length || !filesB.length) {
      setServerError(
        "Files were organized but the actual file contents were lost (e.g. after a page reload) — please re-add them on the Company A / Company B steps and try again."
      );
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      // Organize the submission and run the ma-compatibility-scoring pipeline
      // directly — no manual step needed. See src/app/api/score/route.ts.
      const formData = new FormData();
      filesA.forEach((f) => formData.append("companyAFiles", f));
      filesB.forEach((f) => formData.append("companyBFiles", f));

      const res = await fetch("/api/score", { method: "POST", body: formData });

      if (!res.ok) {
        let message = `The scoring pipeline failed (status ${res.status}).`;
        try {
          const errBody = (await res.json()) as { error?: string; detail?: string };
          if (errBody.error) message = errBody.detail ? `${errBody.error} ${errBody.detail}` : errBody.error;
        } catch {
          /* non-JSON error body, keep default message */
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      window.sessionStorage.setItem("gb-report-pdf", dataUrl);

      const summary = {
        companyA: draft.companyA.metadata.name || "Company A",
        companyB: draft.companyB.metadata.name || "Company B",
        submittedAt: new Date().toISOString(),
      };
      window.localStorage.setItem("gb-submission", JSON.stringify(summary));
      router.push("/results");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-navy-900 dark:text-white">
            New Compatibility Analysis
          </h1>
          <p className="mt-2 text-charcoal-500 dark:text-navy-300">
            Upload the documents for both companies. Your progress saves automatically.
          </p>
        </div>

        <Stepper current={step} onJump={(i) => i < step && setStep(i)} />

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <CompanyStep
                  companyKey="A"
                  submission={draft.companyA}
                  showEmptyError={showErrors && !hasFilesA}
                  onChange={(s) => setCompany("companyA", s)}
                  onFilesChange={setFilesA}
                />
              )}
              {step === 1 && (
                <CompanyStep
                  companyKey="B"
                  submission={draft.companyB}
                  showEmptyError={showErrors && !hasFilesB}
                  onChange={(s) => setCompany("companyB", s)}
                  onFilesChange={setFilesB}
                />
              )}
              {step === 2 && <Review draft={draft} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {serverError && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {serverError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-navy-100 pt-6 dark:border-white/10">
          <span className="text-xs text-charcoal-400">
            {savedAt ? `Draft saved · ${new Date(savedAt).toLocaleTimeString()}` : "Draft autosaves as you go"}
          </span>
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={back} disabled={submitting}>
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button variant="gold" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button variant="gold" onClick={submit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner /> Analyzing documents…
                  </>
                ) : (
                  "Organize & Continue to Report"
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function CompanyStep({
  companyKey,
  submission,
  showEmptyError,
  onChange,
  onFilesChange,
}: {
  companyKey: "A" | "B";
  submission: CompanySubmission;
  showEmptyError: boolean;
  onChange: (s: CompanySubmission) => void;
  onFilesChange: (files: File[]) => void;
}) {
  return (
    <div className="space-y-4">
      <CompanyFileDrop
        companyKey={companyKey}
        docs={submission.documents}
        onChange={(documents) => onChange({ ...submission, documents })}
        onFilesChange={onFilesChange}
      />
      {showEmptyError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          Add at least one file for Company {companyKey} to continue.
        </p>
      )}
    </div>
  );
}

function Review({ draft }: { draft: Draft }) {
  const rows: [string, CompanySubmission][] = [
    ["Company A", draft.companyA],
    ["Company B", draft.companyB],
  ];
  return (
    <div className="space-y-6">
      {rows.map(([label, sub]) => {
        const ok = sub.documents.length > 0;
        return (
          <section key={label} className="surface rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-navy-900 dark:text-white">
                {label}
              </h3>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  ok
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                    : "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300"
                )}
              >
                {ok ? `${sub.documents.length} file${sub.documents.length === 1 ? "" : "s"}` : "No files"}
              </span>
            </div>
            {ok ? (
              <ul className="mt-4 space-y-1.5">
                {sub.documents.map((d) => (
                  <li
                    key={d.slotId}
                    className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-navy-200"
                  >
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-gold-400" />
                    <span className="truncate">{d.fileName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-charcoal-400">
                Go back and add {label}&rsquo;s documents.
              </p>
            )}
          </section>
        );
      })}
      <p className="text-center text-xs text-charcoal-400">
        Clicking &ldquo;Organize &amp; Continue to Report&rdquo; runs the ma-compatibility-scoring
        analysis on these documents automatically — the PDF report opens on the next page in about a
        minute.
      </p>
    </div>
  );
}

function Stepper({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => onJump(i)}
              className={cn(
                "flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-semibold transition",
                state === "done" && "bg-gold-metallic text-navy-950",
                state === "active" && "bg-navy-900 text-white dark:bg-white dark:text-navy-900",
                state === "todo" && "bg-navy-100 text-charcoal-400 dark:bg-white/10"
              )}
            >
              {state === "done" ? "✓" : i + 1}
            </button>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                state === "todo" ? "text-charcoal-400" : "text-navy-800 dark:text-navy-100"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 hidden h-px flex-1 bg-navy-100 dark:bg-white/10 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read report PDF."));
    reader.readAsDataURL(blob);
  });
}
