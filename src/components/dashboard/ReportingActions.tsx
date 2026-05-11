import { memo } from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { weeklySummaryText, toCsv, type SummaryInput, type Bucket } from "@/lib/dashboardSeries";

function ReportingActionsBase({ summary, buckets, rangeLabel }: {
  summary: SummaryInput;
  buckets: Bucket[];
  rangeLabel: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(weeklySummaryText(summary));
      toast.success("Weekly summary copied to clipboard");
    } catch {
      toast.error("Couldn't copy — clipboard blocked");
    }
  };
  const download = () => {
    const rows = buckets.map((b) => ({
      date: b.shortDate,
      revenue: Math.round(b.revenue),
      deals_run: b.dealsRun,
      won: b.won,
      lost: b.lost,
      leads: b.leads,
      dollars_per_hour: Math.round(b.dollarsPerHour),
    }));
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dabella-${rangeLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={copy}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent/10 transition-colors">
        <Copy className="h-3.5 w-3.5" /> Copy summary
      </button>
      <button onClick={download}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent/10 transition-colors">
        <Download className="h-3.5 w-3.5" /> Export CSV
      </button>
    </div>
  );
}

export const ReportingActions = memo(ReportingActionsBase);
