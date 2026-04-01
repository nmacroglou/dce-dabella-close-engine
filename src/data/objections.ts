import { DollarSign, Clock, Users, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Objection {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface ObjectionRoute {
  title: string;
  script: string;
  steps: string[];
}

export const OBJECTIONS: Objection[] = [
  { id: "price", label: "Too Expensive", icon: DollarSign },
  { id: "timing", label: "Need to Think", icon: Clock },
  { id: "trust", label: "Talk to Spouse / Trust Gap", icon: Users },
  { id: "value", label: "Not Sure Value", icon: HelpCircle },
];

export const OBJECTION_ROUTES: Record<string, ObjectionRoute> = {
  price: {
    title: "Price objection route",
    script: '"Other than the investment, is there anything else that would stop you from using DaBella if we can make the numbers work?"',
    steps: [
      "Isolate the objection before defending the number.",
      "Move to Efficiency Close if they are close to a decision.",
      "Use T-close if they keep collapsing everything into price.",
    ],
  },
  value: {
    title: "Value objection route",
    script: '"Let\'s step back and look at what this does for the home long term, not just what it costs today."',
    steps: [
      "Rebuild value using warranty, installation quality, and system protection.",
      "Move into ROI close.",
      "Stack energy savings if this is an energy roof.",
    ],
  },
  timing: {
    title: "Timing objection route",
    script: '"Before I leave, do you mind if I ask how far out you think you are before making a decision?"',
    steps: [
      "Find out how far out they think they are from making a decision.",
      "If they are within 1–12 months, run Efficiency Close.",
      "If needed, pivot into deferral or standby positioning.",
    ],
  },
  trust: {
    title: "Trust objection route",
    script: '"Would it help if I quickly replayed exactly what we found, what we\'re doing, and how it\'s protected?"',
    steps: [
      "Slow down and replay inspection results.",
      "Reinforce GAF / workmanship / installers / warranty.",
      "Ask for the real objection once trust is rebuilt.",
    ],
  },
};
