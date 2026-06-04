import { CheckCircle2, Clock, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency as fmtCurrency } from "@/lib/format";

interface Totals {
  expected: number;
  frontExp: number;
  backExp: number;
  frontPaid: number;
  backPaid: number;
  totalPaid: number;
  outstanding: number;
  paidThisMonth: number;
  dealsCount: number;
  avgDeal: number;
}

export default function LedgerKpiTiles({ totals }: { totals: Totals }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          icon={DollarSign}
          label="Total expected"
          value={fmtCurrency(totals.expected)}
          tone="primary"
          sub={`${totals.dealsCount} deal${totals.dealsCount === 1 ? "" : "s"} · avg ${fmtCurrency(totals.avgDeal)}`}
        />
        <KpiTile
          icon={CheckCircle2}
          label="Total paid"
          value={fmtCurrency(totals.totalPaid)}
          tone="success"
          sub={`${totals.expected ? Math.round((totals.totalPaid / totals.expected) * 100) : 0}% of expected`}
        />
        <KpiTile
          icon={Clock}
          label="Outstanding"
          value={fmtCurrency(totals.outstanding)}
          tone="warning"
          sub={`front exp ${fmtCurrency(totals.frontExp)} · back exp ${fmtCurrency(totals.backExp)}`}
        />
        <KpiTile
          icon={TrendingUp}
          label="Paid this month"
          value={fmtCurrency(totals.paidThisMonth)}
          tone="muted"
          sub={`front ${fmtCurrency(totals.frontPaid)} · back ${fmtCurrency(totals.backPaid)}`}
        />
      </div>

      {totals.expected > 0 && (
        <div className="rounded-2xl border border-hairline bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold uppercase tracking-wide">Collection progress</span>
            <span className="tabular-nums">
              {fmtCurrency(totals.totalPaid)} / {fmtCurrency(totals.expected)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-700"
              style={{ width: `${Math.min(100, (totals.frontPaid / totals.expected) * 100)}%` }}
              title={`Front paid ${fmtCurrency(totals.frontPaid)}`}
            />
            <div
              className="bg-success h-full transition-all duration-700"
              style={{ width: `${Math.min(100, (totals.backPaid / totals.expected) * 100)}%` }}
              title={`Back paid ${fmtCurrency(totals.backPaid)}`}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary" /> Front-half paid</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-success" /> Back-half paid</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-muted-foreground/30" /> Outstanding</span>
          </div>
        </div>
      )}
    </>
  );
}

function KpiTile({
  icon: Icon, label, value, sub, tone,
}: {
  icon: any; label: string; value: string; sub?: string;
  tone: "primary" | "success" | "warning" | "muted";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted text-foreground",
  };
  return (
    <div className="rounded-2xl border border-hairline bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      </div>
      <div className="text-xl font-display font-extrabold tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
