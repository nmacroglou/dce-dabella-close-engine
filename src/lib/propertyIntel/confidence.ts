import type { Confidence, ConfidenceLabel } from "./types";

export function labelFor(score: number): ConfidenceLabel {
  if (score >= 90) return "Very High";
  if (score >= 75) return "High";
  if (score >= 55) return "Moderate";
  if (score >= 35) return "Low";
  return "Very Low";
}

export function confidence(score: number, reasons: string[] = [], conflicts: string[] = []): Confidence {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return { score: clamped, label: labelFor(clamped), reasons, conflicts };
}

export function badgeClass(label: ConfidenceLabel): string {
  switch (label) {
    case "Very High": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "High":      return "bg-primary/15 text-primary border-primary/30";
    case "Moderate":  return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "Low":       return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "Very Low":  return "bg-red-500/15 text-red-400 border-red-500/30";
  }
}
