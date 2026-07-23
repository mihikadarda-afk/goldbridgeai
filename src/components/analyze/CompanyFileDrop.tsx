"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ACCEPTED_EXTENSIONS,
  REQUIRED_DOCS,
  formatBytes,
  validateFile,
} from "@/lib/documents";
import type { UploadedDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

let counter = 0;

/**
 * One labeled drop spot per company. The user drops all their files here — the
 * files are expected to contain the required information (listed alongside).
 */
export function CompanyFileDrop({
  companyKey,
  companyName,
  docs,
  onChange,
  onFilesChange,
}: {
  companyKey: "A" | "B";
  companyName?: string;
  docs: UploadedDoc[];
  onChange: (docs: UploadedDoc[]) => void;
  /** Bubbles up the actual File objects (not just metadata) for upload to /api/score.
   *  Kept separate from `docs` because File blobs can't round-trip through the
   *  localStorage-backed autosave draft. */
  onFilesChange?: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files || !files.length) return;
      setError(null);
      const accepted: UploadedDoc[] = [];
      const errors: string[] = [];
      Array.from(files).forEach((f) => {
        const v = validateFile(f);
        if (!v.ok) {
          errors.push(`${f.name} — ${v.reason}`);
          return;
        }
        const slotId = `f-${Date.now()}-${counter++}`;
        accepted.push({
          slotId,
          label: f.name,
          fileName: f.name,
          sizeBytes: f.size,
          mime: f.type,
          required: false,
        });
        fileMapRef.current.set(slotId, f);
      });
      if (errors.length) setError(errors.join(" · "));
      if (accepted.length) {
        onChange([...docs, ...accepted]);
        onFilesChange?.(Array.from(fileMapRef.current.values()));
      }
    },
    [docs, onChange, onFilesChange]
  );

  const remove = (id: string) => {
    onChange(docs.filter((d) => d.slotId !== id));
    fileMapRef.current.delete(id);
    onFilesChange?.(Array.from(fileMapRef.current.values()));
  };

  const label = `Company ${companyKey}`;

  return (
    <div className="surface rounded-2xl p-6">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-navy-900 dark:text-white">
          {label}
          {companyName ? (
            <span className="ml-2 text-base font-normal text-charcoal-400">· {companyName}</span>
          ) : null}
        </h2>
        <span className="text-xs font-medium text-charcoal-400">
          {docs.length} file{docs.length === 1 ? "" : "s"} added
        </span>
      </div>
      <p className="mb-5 text-sm text-charcoal-500 dark:text-navy-300">
        Upload {label}&rsquo;s documents here — include all the required information below. Accepted:
        PDF, DOCX, XLSX, CSV, PPTX, TXT (max 25 MB each).
      </p>

      {/* The drop spot */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload documents for ${label}`}
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
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition",
          dragging
            ? "border-gold-400 bg-gold-50/60 dark:bg-gold-400/5"
            : "border-navy-200 hover:border-gold-400 dark:border-white/15"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          onChange={(e) => addFiles(e.target.files)}
        />
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-gold-300 dark:bg-white/10">
          <UploadIcon />
        </span>
        <p className="font-semibold text-navy-900 dark:text-white">
          Drop {label}&rsquo;s files here
        </p>
        <p className="mt-1 text-sm text-charcoal-400">or click to browse · you can add several at once</p>
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

      {/* Uploaded files */}
      {docs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {docs.map((d) => (
            <li
              key={d.slotId}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 px-3.5 py-2.5 dark:border-emerald-400/25 dark:bg-emerald-400/5"
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15">
                <CheckIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-navy-900 dark:text-white">
                  {d.fileName}
                </span>
                <span className="text-xs text-charcoal-400">{formatBytes(d.sizeBytes)}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(d.slotId)}
                aria-label={`Remove ${d.fileName}`}
                className="flex-none rounded-md p-1 text-charcoal-400 transition hover:bg-navy-100 hover:text-red-500 dark:hover:bg-white/10"
              >
                <XIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Required-information checklist */}
      <div className="mt-6 rounded-xl bg-navy-50/70 p-4 dark:bg-white/5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-charcoal-500 dark:text-navy-200">
          Make sure {label}&rsquo;s files include
        </p>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {REQUIRED_DOCS.map((slot) => (
            <span
              key={slot.id}
              className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-navy-200"
            >
              <span className="h-1.5 w-1.5 flex-none rounded-full bg-gold-400" />
              {slot.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
