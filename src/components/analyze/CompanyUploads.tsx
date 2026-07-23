"use client";

import { OPTIONAL_DOCS, REQUIRED_DOCS } from "@/lib/documents";
import type { UploadedDoc } from "@/lib/types";
import { UploadZone } from "./UploadZone";

interface Props {
  companyKey: "A" | "B";
  docs: UploadedDoc[];
  onChange: (docs: UploadedDoc[]) => void;
}

export function CompanyUploads({ companyKey, docs, onChange }: Props) {
  const byId = new Map(docs.map((d) => [d.slotId, d]));

  const add = (doc: UploadedDoc) => {
    const next = docs.filter((d) => d.slotId !== doc.slotId);
    onChange([...next, doc]);
  };
  const remove = (slotId: string) => onChange(docs.filter((d) => d.slotId !== slotId));

  const requiredCount = REQUIRED_DOCS.length;
  const requiredDone = REQUIRED_DOCS.filter((s) => byId.has(s.id)).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-charcoal-400">
          Required documents
        </h4>
        <span
          className={
            requiredDone === requiredCount
              ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              : "text-xs font-medium text-charcoal-400"
          }
        >
          {requiredDone}/{requiredCount} uploaded
        </span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {REQUIRED_DOCS.map((slot) => (
          <UploadZone
            key={slot.id}
            companyKey={companyKey}
            slot={slot}
            file={byId.get(slot.id)}
            onAdd={add}
            onRemove={remove}
          />
        ))}
      </div>

      <h4 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wider text-charcoal-400">
        Optional supporting documents
      </h4>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {OPTIONAL_DOCS.map((slot) => (
          <UploadZone
            key={slot.id}
            companyKey={companyKey}
            slot={slot}
            file={byId.get(slot.id)}
            onAdd={add}
            onRemove={remove}
          />
        ))}
      </div>
    </div>
  );
}
