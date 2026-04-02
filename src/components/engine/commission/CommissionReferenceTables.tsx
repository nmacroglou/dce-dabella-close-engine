import { memo } from "react";
import { Award, TrendingUp } from "lucide-react";
import { fmt } from "@/lib/format";
import { MINI_JOB_TIERS, MINI_JOB_FLOOR, MONTHLY_BONUS_TIERS, FRONT_END_PCT, BACK_END_PCT } from "@/data/commissionData";

export default memo(function CommissionReferenceTables() {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Mini Job Tiers */}
        <div className="card-elevated-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Mini Job Tiers
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase px-1">
              <span>Contract Price</span><span>Commission</span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex justify-between px-3 py-1.5 text-xs bg-muted/30 border-b border-border/50">
                <span className="text-muted-foreground">Under $15,000</span>
                <span className="font-bold text-foreground">{fmt(MINI_JOB_FLOOR)}</span>
              </div>
              {MINI_JOB_TIERS.map((t) => (
                <div key={t.min} className="flex justify-between px-3 py-1.5 text-xs border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{fmt(t.min)} – {fmt(t.max)}</span>
                  <span className="font-bold text-foreground">{fmt(t.commission)}</span>
                </div>
              ))}
              <div className="flex justify-between px-3 py-1.5 text-xs bg-muted/30">
                <span className="text-muted-foreground">$55,000+ (per $5k)</span>
                <span className="font-bold text-foreground">+$250</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Bonus Tiers */}
        <div className="card-elevated-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Monthly Bonus Tiers
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase px-1">
              <span>Monthly NIS</span><span>Bonus %</span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              {MONTHLY_BONUS_TIERS.map((t) => (
                <div key={t.min} className="flex justify-between px-3 py-1.5 text-xs border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">
                    {fmt(t.min)} – {t.max === Infinity ? "+" : fmt(t.max)}
                  </span>
                  <span className="font-bold text-foreground">{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1">
            <p className="text-xs font-semibold text-primary">Review Requirement</p>
            <p className="text-[11px] text-muted-foreground">
              2 online customer reviews (one per assigned site) required in the bonus month for eligibility.
            </p>
          </div>
        </div>
      </div>

      {/* Key Rules */}
      <div className="card-elevated-lg p-4 space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Commission Rules</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: "Front-End Advance", desc: `${FRONT_END_PCT}% issued when paperwork is complete, project is buildable, and $500+ deposit collected.` },
            { title: "Back-End Payout", desc: `Remaining ${BACK_END_PCT}% paid on first payroll after project completion.` },
            { title: "Paperwork Deadline", desc: "Work Order must be received by 10AM next business day or commission becomes back-end only." },
            { title: "Self-Gen Eligibility", desc: "8% bonus only if sold at ≥75% of Project Price. Must be a rep-generated lead." },
            { title: "Performance Minimum", desc: "$180,000 NIS/quarter ($60,000/month or $2,300 DPL). Failure may result in discipline." },
            { title: "Chargebacks", desc: "Cancelled/defaulted sales that don't become NIS can result in commission recapture." },
          ].map((rule) => (
            <div key={rule.title} className="rounded-xl border border-border p-3 space-y-1">
              <p className="text-xs font-bold text-foreground">{rule.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
