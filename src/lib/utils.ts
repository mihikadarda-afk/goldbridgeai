export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

/** Deterministic pseudo-random in [0,1) from a string seed (stable mock data). */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function riskColor(level: string): string {
  switch (level) {
    case "Low":
      return "text-emerald-600 dark:text-emerald-400";
    case "Moderate":
      return "text-gold-500 dark:text-gold-300";
    case "Elevated":
      return "text-orange-600 dark:text-orange-400";
    case "High":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-charcoal-500";
  }
}

export function scoreColor(score: number): string {
  if (score >= 75) return "#059669"; // emerald
  if (score >= 55) return "#c08d29"; // gold
  if (score >= 40) return "#ea580c"; // orange
  return "#dc2626"; // red
}
