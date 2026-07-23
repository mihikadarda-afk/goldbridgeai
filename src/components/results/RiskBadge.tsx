import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<RiskLevel, string> = {
  Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  Moderate: "bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300",
  Elevated: "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300",
  High: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        styles[level],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level} Risk
    </span>
  );
}
