import { useState } from "react";
import type { EngineTabProps } from "@/types/engine";
import { SELLING_STEPS } from "@/data/sellingSteps";
import { PAYMENT_FACTORS, PAYMENT_TERMS } from "@/data/paymentFactors";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronRight, ChevronDown, ExternalLink, BookOpen, DollarSign } from "lucide-react";

export default function PlaybookTab({ state, update }: EngineTabProps) {
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Record<number, Set<number>>>({});
  const [expandedScripts, setExpandedScripts] = useState<Set<number>>(new Set());
  const [expandedRefs, setExpandedRefs] = useState<Set<string>>(new Set());
  const [showPaymentFactors, setShowPaymentFactors] = useState(false);

  const activeStep = SELLING_STEPS.find((s) => s.id === activeStepId)!;
  const progress = (completedSteps.size / SELLING_STEPS.length) * 100;

  const toggleCheck = (stepId: number, itemIdx: number) => {
    setCheckedItems((prev) => {
      const stepSet = new Set(prev[stepId] || []);
      if (stepSet.has(itemIdx)) stepSet.delete(itemIdx);
      else stepSet.add(itemIdx);
      return { ...prev, [stepId]: stepSet };
    });
  };

  const markComplete = (stepId: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const toggleScript = (idx: number) => {
    setExpandedScripts((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleRef = (key: string) => {
    setExpandedRefs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const goToTab = (tab: string) => {
    update("activeTab", tab);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Progress header */}
      <div className="card-elevated-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground">10-Step Selling System</h3>
          <span className="text-sm font-semibold text-primary">
            {completedSteps.size}/{SELLING_STEPS.length} completed
          </span>
        </div>
        <Progress value={progress} className="h-2.5 rounded-full" />

        {/* Step pills */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1">
          {SELLING_STEPS.map((step) => {
            const isActive = step.id === activeStepId;
            const isComplete = completedSteps.has(step.id);
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isComplete
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {isComplete ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="w-4 text-center">{step.id}</span>
                )}
                <span className="hidden sm:inline">{step.title.split(" / ")[0].split(" — ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active step detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-5">
          {/* Step header */}
          <div className="card-elevated-lg p-6">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <activeStep.icon className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-foreground">
                    Step {activeStep.id}: {activeStep.title}
                  </h3>
                  {completedSteps.has(activeStepId) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      <Check className="h-3 w-3" /> Done
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activeStep.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Script */}
          <div className="card-elevated-lg p-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Suggested Script
            </h4>
            <div className="script-block text-base leading-relaxed whitespace-pre-line">{activeStep.script}</div>
          </div>

          {/* Detailed scripts (expandable) */}
          {activeStep.detailedScripts && activeStep.detailedScripts.map((ds, idx) => (
            <div key={idx} className="card-elevated-lg overflow-hidden">
              <button
                onClick={() => toggleScript(idx)}
                className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-[10px] font-semibold text-warning uppercase">
                    Scenario
                  </span>
                  <span className="text-sm font-semibold text-foreground">{ds.label}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedScripts.has(idx) ? "rotate-180" : ""}`} />
              </button>
              {expandedScripts.has(idx) && (
                <div className="px-5 pb-5 animate-fade-in">
                  <div className="script-block text-sm leading-relaxed whitespace-pre-line">{ds.text}</div>
                </div>
              )}
            </div>
          ))}

          {/* Checklist */}
          <div className="card-elevated-lg p-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Checklist
            </h4>
            <div className="space-y-2">
              {activeStep.checklist.map((item, idx) => {
                const checked = checkedItems[activeStepId]?.has(idx) || false;
                return (
                  <button
                    key={idx}
                    onClick={() => toggleCheck(activeStepId, idx)}
                    className={`w-full text-left flex items-center gap-3 rounded-xl px-4 py-3 transition-all touch-target ${
                      checked
                        ? "bg-accent/10 text-foreground"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        checked
                          ? "bg-accent border-accent text-white"
                          : "border-border"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className={`text-sm font-medium ${checked ? "line-through opacity-60" : ""}`}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference sections */}
          {activeStep.references && activeStep.references.map((ref, rIdx) => {
            const refKey = `${activeStepId}-${rIdx}`;
            const isOpen = expandedRefs.has(refKey);
            return (
              <div key={rIdx} className="card-elevated-lg overflow-hidden">
                <button
                  onClick={() => toggleRef(refKey)}
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">{ref.title}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 animate-fade-in">
                    {ref.content.map((p, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{p}</p>
                    ))}
                    {ref.subSections?.map((sub, sIdx) => (
                      <div key={sIdx} className="space-y-1.5">
                        <h5 className="text-sm font-bold text-foreground">{sub.heading}</h5>
                        <ul className="space-y-1 ml-1">
                          {sub.items.map((item, iIdx) => (
                            <li key={iIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tips */}
          <div className="card-elevated-lg p-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Pro Tips
            </h4>
            <div className="space-y-3">
              {activeStep.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Factors quick-ref */}
          <div className="card-elevated-lg overflow-hidden">
            <button
              onClick={() => setShowPaymentFactors(!showPaymentFactors)}
              className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Payment Factors Table</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPaymentFactors ? "rotate-180" : ""}`} />
            </button>
            {showPaymentFactors && (
              <div className="px-3 pb-4 animate-fade-in overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-1.5 font-semibold text-muted-foreground">Rate</th>
                      {PAYMENT_TERMS.map((t) => (
                        <th key={t} className="text-center py-2 px-1 font-semibold text-muted-foreground">{t}mo</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PAYMENT_FACTORS.map((row) => (
                      <tr key={row.rate} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-1.5 font-semibold text-foreground">{row.rate}</td>
                        {PAYMENT_TERMS.map((t) => (
                          <td key={t} className="text-center py-1.5 px-1 text-muted-foreground font-mono">
                            {row.factors[t] != null ? row.factors[t]!.toFixed(5) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deep link */}
          {activeStep.linkTab && (
            <button
              onClick={() => goToTab(activeStep.linkTab!)}
              className="w-full card-elevated-lg p-5 flex items-center gap-3 text-left hover:border-primary/50 transition-all group"
            >
              <ExternalLink className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Open{" "}
                  {activeStep.linkTab === "calculator"
                    ? "Calculator"
                    : activeStep.linkTab === "presentation"
                    ? "Presentation"
                    : activeStep.linkTab === "closing"
                    ? "Closing Stack"
                    : activeStep.linkTab}
                </p>
                <p className="text-xs text-muted-foreground">Jump to the relevant tool</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          )}

          {/* Mark complete */}
          <button
            onClick={() => markComplete(activeStepId)}
            className={`w-full rounded-2xl px-5 py-4 text-sm font-bold transition-all ${
              completedSteps.has(activeStepId)
                ? "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/20"
                : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
            }`}
          >
            {completedSteps.has(activeStepId) ? "✓ Completed — Tap to Undo" : "Mark Step Complete"}
          </button>

          {/* Next step */}
          {activeStepId < 10 && (
            <button
              onClick={() => setActiveStepId(activeStepId + 1)}
              className="w-full rounded-2xl border border-border px-5 py-4 text-sm font-semibold text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
            >
              Next: Step {activeStepId + 1} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
