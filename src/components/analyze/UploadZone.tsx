"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ACCEPTED_EXTENSIONS,
  formatBytes,
  validateFile,
  type DocSlot,
} from "@/lib/documents";
import type { UploadedDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  companyKey: "A" | "B";
  slot: DocSlot;
  file?: UploadedDoc;
  onAdd: (doc: UploadedDoc) => void;
  onRemove: (slotId: string) => void;
}

export function UploadZone({ companyKey, slot, file, onAdd, onRemove }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      setError(null);
      const f = files?.[0];
      if (!f) return;
      const v = validateFile(f);
      if (!v.ok) {
        setError(v.reason ?? "Invalid file.");
        return;
      }
      onAdd({
        slotId: slot.id,
        label: slot.label,
        fileName: f.name,
        sizeBytes: f.size,
        mime: f.type,
        required: slot.required,
      });
    },
    [onAdd, slot]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${slot.label} for Company ${companyKey}`}
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
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition",
          dragging
            ? "border-gold-400 bg-gold-50/60 dark:bg-gold-400/5"
            : file
              ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-400/30 dark:bg-emerald-400/5"
              : "border-navy-200 hover:border-gold-400 dark:border-white/15"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span
          className={cn(
            "flex h-8 w-8 flex-none items-center justify-center rounded-lg",
            file
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15"
              : "bg-navy-100 text-navy-500 dark:bg-white/10 dark:text-navy-200"
          )}
        >
          {file ? <CheckIcon /> : <DocIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-navy-900 dark:text-white">
            {slot.label}
            {slot.required && <span className="text-gold-500">*</span>}
          </p>
          <p className="truncate text-xs text-charcoal-400">
            {file ? `${file.fileName} · ${formatBytes(file.sizeBytes)}` : "Drag & drop or click to upload"}
          </p>
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(slot.id);
              setError(null);
            }}
            aria-label={`Remove ${slot.label}`}
            className="flex-none rounded-md p-1 text-charcoal-400 transition hover:bg-navy-100 hover:text-red-500 dark:hover:bg-white/10"
          >
            <XIcon />
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M13 3v5h5" strokeLinejoin="round" />
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
