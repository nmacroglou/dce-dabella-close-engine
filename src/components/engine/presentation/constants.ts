import { Shield, Zap, Home, Star, Award, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface OptionTheme {
  gradient: string;
  badge: string;
  badgeColor: string;
  ring: string;
  accent: string;
  bgAccent: string;
  borderAccent: string;
}

export const OPTION_THEMES: Record<"A" | "B" | "C", OptionTheme> = {
  A: {
    gradient: "from-primary to-primary/80",
    badge: "Best Value",
    badgeColor: "bg-primary text-primary-foreground",
    ring: "ring-primary",
    accent: "text-primary",
    bgAccent: "bg-primary/5",
    borderAccent: "border-primary/20",
  },
  B: {
    gradient: "from-accent to-accent/80",
    badge: "Most Popular",
    badgeColor: "bg-accent text-accent-foreground",
    ring: "ring-accent",
    accent: "text-accent",
    bgAccent: "bg-accent/5",
    borderAccent: "border-accent/20",
  },
  C: {
    gradient: "from-warning to-warning/80",
    badge: "Smart Start",
    badgeColor: "bg-warning text-warning-foreground",
    ring: "ring-warning",
    accent: "text-foreground",
    bgAccent: "bg-warning/5",
    borderAccent: "border-warning/20",
  },
};

const SHARED_FEATURES: { icon: LucideIcon; text: string }[] = [
  { icon: Shield, text: "Golden Pledge® Lifetime Warranty" },
  { icon: Award, text: "Factory-Trained Certified Installers" },
  { icon: Zap, text: "SolarMAX Warranty Protection" },
  { icon: Star, text: "GAF Master Elite® Installation" },
  { icon: Home, text: "Full system replacement" },
  { icon: TrendingUp, text: "Best long-term ROI" },
];

export const FEATURES_BY_OPTION: Record<string, { icon: LucideIcon; text: string }[]> = {
  A: SHARED_FEATURES,
  B: SHARED_FEATURES,
  C: SHARED_FEATURES,
};
