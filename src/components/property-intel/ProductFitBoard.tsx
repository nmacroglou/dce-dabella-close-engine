import { useMemo } from "react";
import { Layers } from "lucide-react";
import { buildProductFit, type ProductFit } from "@/lib/propertyIntel/productFit";
import type { PropertyIntelReport } from "@/lib/propertyIntel/types";
import { formatCurrency } from "@/lib/format";

const BAND_CLASS: Record<ProductFit["band"], string> = {
  lead: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  strong: "bg-primary/15 text-primary border-primary/30",
  possible: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  hold: "bg-muted text-muted-foreground border-border",
};

const BAND_LABEL: Record<ProductFit["band"], string> = {
  lead: "Lead with this",
  strong: "Strong fit",
  possible: "Possible",
  hold: "Not now",
};

const BAR_CLASS: Record<ProductFit["band"], string> = {
  lead: "bg-emerald-500",
  strong: "bg-primary",
  possible: "bg-amber-500",
  hold: "bg-muted-foreground/40",
};

export default function ProductFitBoard({ report }: { report: PropertyIntelReport }) {
  const board = useMemo(() => buildProductFit(report), [report]);

  return (
    <div className="card-elevated p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-display font-bold uppercase tracking-[0.14em]">Product fit board</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">{board.basis}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 my-4">
        <Stat label="Lead product" value={board.lead.label} sub={`Need ${board.lead.score}/100`} />
        <Stat
          label={`Bundle (${board.bundle.items.length})`}
          value={`${formatCurrency(board.bundle.low)} – ${formatCurrency(board.bundle.high)}`}
          sub={`${formatCurrency(board.bundle.monthly_low)}–${formatCurrency(board.bundle.monthly_high)}/mo · ${board.bundle.items.join(" + ")}`}
        />
        <Stat
          label="Whole-home opportunity"
          value={`${formatCurrency(board.total_home_opportunity.low)} – ${formatCurrency(board.total_home_opportunity.high)}`}
          sub="All lines if every system were replaced"
        />
      </div>

      <div className="space-y-2">
        {board.items.map((i) => (
          <div key={i.key} className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">{i.label}</span>
                  <span className={`rounded-full border px-2 py-[1px] text-[10px] font-bold uppercase tracking-wider ${BAND_CLASS[i.band]}`}>
                    {BAND_LABEL[i.band]}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{i.blurb}</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-bold tabular-nums">
                  {formatCurrency(i.low)} – {formatCurrency(i.high)}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {formatCurrency(i.monthly_low)}–{formatCurrency(i.monthly_high)}/mo · 120 mo
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-muted/40 overflow-hidden">
                <div className={`h-full rounded-full ${BAR_CLASS[i.band]}`} style={{ width: `${i.score}%` }} />
              </div>
              <span className="text-[11px] font-bold tabular-nums w-16 text-right">
                {i.score}/100
              </span>
              <span className="text-[11px] text-muted-foreground w-28 text-right">
                {i.age === null
                  ? "Age unknown"
                  : i.remaining !== null && i.remaining <= 0
                    ? `${Math.abs(i.remaining)} yr past life`
                    : `${i.remaining} yrs left`}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-foreground/75">{i.drivers.join(" · ")}</p>
            <p className="text-[11px] text-muted-foreground italic">Verify: {i.verify}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-[15px] font-display font-bold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
