export interface ClosingStep {
  id: string;
  label: string;
  script: string;
}

export const CLOSING_STEPS: ClosingStep[] = [
  { id: "option", label: "Option close", script: `"Out of these 3 options, which one would you eliminate?"` },
  { id: "efficiency", label: "Efficiency close", script: `"The homeowners who move forward when everything makes sense are the ones we can reward with our efficiency pricing."` },
  { id: "standby", label: "Standby close", script: `"We may have limited room in a standby program if you can be flexible on install timing. Would it be okay if I check?"` },
  { id: "tclose", label: "T-close", script: `"Most people at this point aren't deciding if they're doing the project — they're deciding whether the money feels right."` },
  { id: "roi", label: "ROI close", script: `"Roofing has a cost-to-value relationship just like Kelley Blue Book does for cars. What percentage do you think this puts back into your home?"` },
  { id: "energy", label: "Energy close", script: `"If your average bill is around this amount, here's what 10 years of waste costs versus what this system saves."` },
  { id: "final", label: "Final assumptive close", script: `"Based on everything we've gone through, would you like to handle the initial deposit with a check or card?"` },
];
