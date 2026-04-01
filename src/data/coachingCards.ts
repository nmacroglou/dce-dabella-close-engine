import type { EngineState } from "@/hooks/useCloseEngine";

export interface CoachCard {
  title: string;
  detail: string;
  script: string;
}

export function getCoachCard(state: EngineState): CoachCard {
  if (state.priceShown)
    return {
      title: "Be silent after price",
      detail: "Do not defend the number too early. Let the homeowner react first.",
      script: '"For all of this, your project comes down to only ..."',
    };
  if (state.objectionType === "price")
    return {
      title: "Narrow and isolate",
      detail: "Confirm price is the only issue, then route into Efficiency Close or T-close.",
      script: '"Other than the investment, is there anything else stopping you from moving forward if the numbers work?"',
    };
  if (state.objectionType === "value")
    return {
      title: "Rebuild value",
      detail: "Use ROI and energy to make the long-term cost visible.",
      script: '"Let\'s look at what this does for the home and what doing nothing costs you over time."',
    };
  if (state.objectionType === "timing")
    return {
      title: "Test timing truthfully",
      detail: "If they are within 12 months, they are a live efficiency/deferral candidate.",
      script: '"Before I leave, do you mind if I ask how far out you think you are before making a decision?"',
    };
  return {
    title: "Open control",
    detail: "Build value before price and ask for the sale at every natural opening.",
    script: '"Great, give me a second to finalize the numbers and we\'ll get right to it."',
  };
}

export const COACHING_RULES = [
  "Build value before price.",
  "After the price drop, be silent.",
  "Don't defend the number too early.",
  "Isolate the real objection before pivoting.",
  "Keep narrowing, not expanding.",
  "Ask for the sale at every natural opening.",
  "Use ROI and energy only after trust is built.",
];
