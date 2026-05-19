import { memo, useMemo } from "react";
import { Check, ClipboardList, FileText, CreditCard, Banknote, Sun, FileSignature, Camera, MessageSquare, Search, Ruler, DollarSign } from "lucide-react";
import type { EngineTabProps } from "@/types/engine";
import { hasProduct } from "@/lib/engineHelpers";

type Item = {
  id: string;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  show?: (products: string[]) => boolean;
};

const ITEMS: Item[] = [
  { id: "inspection", title: "Inspection in OCC", detail: "Capture screenshot from hover for the inspection result.", icon: Search },
  { id: "pitch_gauge", title: "Pitch Gauge Photo (Low Slope)", detail: "On inspection, capture a Pitch Gauge photo of any low-slope sections.", icon: Ruler },
  { id: "commission_sheet", title: "Commission Sheet", detail: "Fill out and submit the commission sheet for this deal.", icon: DollarSign },
  { id: "customer_checklist", title: "Customer Checklist", detail: "Complete Customer_Checklist_-_DO_THIS_BEFORE_FINANCE_APP_V1.pdf before the finance app.", icon: ClipboardList },
  { id: "cc_auth", title: "Credit Card Authorization", detail: "Have homeowner sign V1_Credit_Card_Authorization_Slip.pdf.", icon: CreditCard },
  { id: "finance_app", title: "Finance Application", detail: "Submit the finance application.", icon: Banknote },
  {
    id: "solar_addendum",
    title: "Solar Addendum",
    detail: "Remove & reinstall: $200 per panel — confirm panel count and totals.",
    icon: Sun,
    show: (p) => hasProduct(p, "Solar"),
  },
  { id: "proposal", title: "Proposal", detail: "Generate and deliver the signed proposal.", icon: FileSignature },
  { id: "poi", title: "Proof of Income (POI)", detail: "Use CamScanner to scan POI and send to AZ Finance.", icon: Camera },
  { id: "rcm", title: "RCM for WhatsApp", detail: "Send RCM (Recorded Customer Message) for WhatsApp confirmation.", icon: MessageSquare },
];

export default memo(function PostCloseTab({ state, update }: EngineTabProps) {
  const items = useMemo(
    () => ITEMS.filter((i) => (i.show ? i.show(state.products) : true)),
    [state.products],
  );

  const checks = state.postCloseChecks ?? {};
  const completed = items.filter((i) => checks[i.id]).length;
  const pct = items.length ? (completed / items.length) * 100 : 0;

  const toggle = (id: string) => {
    update("postCloseChecks", { ...checks, [id]: !checks[id] });
  };

  const resetAll = () => update("postCloseChecks", {});

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card-elevated-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/70 px-8 py-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ClipboardList className="h-6 w-6 text-primary-foreground" />
                <h2 className="text-2xl font-display font-extrabold text-primary-foreground tracking-tight">
                  Post-Close Checklist
                </h2>
              </div>
              <p className="text-primary-foreground/80 text-sm font-medium">
                Knock these out before you leave the home — every item, every time.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-extrabold text-primary-foreground tabular-nums">
                {completed}/{items.length}
              </div>
              <div className="text-[11px] font-bold text-primary-foreground/70 uppercase tracking-[0.15em]">
                Complete
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pt-5">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="p-4 space-y-2">
          {items.map((item, idx) => {
            const done = !!checks[item.id];
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`w-full flex items-start gap-4 px-4 py-4 rounded-xl text-left transition-all duration-200 ${
                  done ? "bg-accent/10" : "bg-muted/40 hover:bg-muted"
                }`}
              >
                <div
                  className={`flex-shrink-0 mt-0.5 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    done ? "bg-accent border-accent" : "border-border bg-background"
                  }`}
                >
                  {done && <Check className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={3} />}
                </div>

                <div className="flex-shrink-0 mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        done ? "text-foreground line-through opacity-70" : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      done ? "text-muted-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {item.detail}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-8 pb-8 pt-2">
          <button
            onClick={resetAll}
            disabled={completed === 0}
            className="w-full py-3 rounded-2xl bg-muted text-foreground font-bold text-sm tracking-wide hover:bg-muted/70 transition-all disabled:opacity-50"
          >
            Reset Checklist
          </button>
        </div>
      </div>

      <div className="script-block text-center text-sm">
        "Before I head out, let me make sure we've got everything buttoned up for you."
      </div>
    </div>
  );
});
