"use client";

import type { CompanyMetadata } from "@/lib/types";

interface Props {
  companyKey: "A" | "B";
  value: CompanyMetadata;
  errors: Partial<Record<keyof CompanyMetadata, string>>;
  onChange: (value: CompanyMetadata) => void;
}

export function MetadataForm({ companyKey, value, errors, onChange }: Props) {
  const set = <K extends keyof CompanyMetadata>(key: K, v: CompanyMetadata[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Company name" required error={errors.name}>
        <input
          className="field-input"
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={`Company ${companyKey}`}
        />
      </Field>
      <Field label="Industry" required error={errors.industry}>
        <input
          className="field-input"
          value={value.industry}
          onChange={(e) => set("industry", e.target.value)}
          placeholder="e.g. Enterprise Software"
        />
      </Field>
      <Field label="Revenue" error={errors.revenue}>
        <input
          className="field-input"
          value={value.revenue}
          onChange={(e) => set("revenue", e.target.value)}
          placeholder="e.g. $120M"
        />
      </Field>
      <Field label="EBITDA" error={errors.ebitda}>
        <input
          className="field-input"
          value={value.ebitda}
          onChange={(e) => set("ebitda", e.target.value)}
          placeholder="e.g. $28M"
        />
      </Field>
      <Field label="Employees" error={errors.employees}>
        <input
          className="field-input"
          value={value.employees}
          onChange={(e) => set("employees", e.target.value)}
          placeholder="e.g. 640"
        />
      </Field>
      <Field label="Market share" error={errors.marketShare}>
        <input
          className="field-input"
          value={value.marketShare}
          onChange={(e) => set("marketShare", e.target.value)}
          placeholder="e.g. 12%"
        />
      </Field>
      <Field label="Enterprise value" error={errors.enterpriseValue}>
        <input
          className="field-input"
          value={value.enterpriseValue}
          onChange={(e) => set("enterpriseValue", e.target.value)}
          placeholder="e.g. $310M"
        />
      </Field>
      <Field label="Last reporting date" error={errors.lastReportingDate}>
        <input
          type="date"
          className="field-input"
          value={value.lastReportingDate}
          onChange={(e) => set("lastReportingDate", e.target.value)}
        />
      </Field>
      <Field label="Accounting standard" required error={errors.accountingStandard}>
        <select
          className="field-input"
          value={value.accountingStandard}
          onChange={(e) => set("accountingStandard", e.target.value as CompanyMetadata["accountingStandard"])}
        >
          <option value="">Select…</option>
          <option value="GAAP">GAAP</option>
          <option value="IFRS">IFRS</option>
          <option value="Other">Other</option>
        </select>
      </Field>
      <Field label="EBITDA type" required error={errors.ebitdaType}>
        <select
          className="field-input"
          value={value.ebitdaType}
          onChange={(e) => set("ebitdaType", e.target.value as CompanyMetadata["ebitdaType"])}
        >
          <option value="">Select…</option>
          <option value="Standard">Standard</option>
          <option value="Adjusted">Adjusted</option>
          <option value="Company Defined">Company Defined</option>
        </select>
      </Field>
      <Field label="Founder-led" required error={errors.founderLed}>
        <select
          className="field-input"
          value={value.founderLed}
          onChange={(e) => set("founderLed", e.target.value as CompanyMetadata["founderLed"])}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </Field>
      <Field label="Ownership structure" error={errors.ownershipStructure}>
        <input
          className="field-input"
          value={value.ownershipStructure}
          onChange={(e) => set("ownershipStructure", e.target.value)}
          placeholder="e.g. PE-backed, founder + institutional"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required && <span className="ml-0.5 text-gold-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
