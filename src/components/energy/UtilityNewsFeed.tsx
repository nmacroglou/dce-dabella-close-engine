import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, Radio, ExternalLink, AlertTriangle, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Utility = "SRP" | "APS" | "TEP";

interface Update {
  id: string;
  utility: Utility;
  title: string;
  summary: string | null;
  category: string;
  impact: "up" | "down" | "neutral";
  source_url: string;
  source_name: string | null;
  published_at: string | null;
  fetched_at: string;
}

interface Run {
  finished_at: string | null;
  status: string;
  items_added: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  rate_change: "Rate change",
  regulation: "Regulation",
  outage: "Outage",
  announcement: "Announcement",
  program: "Program",
  other: "Other",
};

function ImpactIcon({ impact }: { impact: Update["impact"] }) {
  if (impact === "up") return <ArrowUp className="h-3.5 w-3.5 text-destructive" />;
  if (impact === "down") return <ArrowDown className="h-3.5 w-3.5 text-accent" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function UtilityNewsFeed({ activeUtility }: { activeUtility: Utility }) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Utility | "ALL">(activeUtility);

  useEffect(() => { setFilter(activeUtility); }, [activeUtility]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: items }, { data: runs }] = await Promise.all([
      supabase
        .from("utility_updates")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("fetched_at", { ascending: false })
        .limit(60),
      supabase
        .from("utility_refresh_runs")
        .select("finished_at,status,items_added")
        .order("started_at", { ascending: false })
        .limit(1),
    ]);
    setUpdates((items as Update[]) ?? []);
    setLastRun((runs?.[0] as Run) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke("refresh-utility-news", { body: { source: "manual" } });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = filter === "ALL" ? updates : updates.filter((u) => u.utility === filter);

  return (
    <section className="rounded-2xl border border-hairline bg-card p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl gradient-brand grid place-items-center text-primary-foreground flex-shrink-0">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold">Live Utility Watch</h3>
            <p className="text-xs text-muted-foreground">
              SRP · APS · TEP · AZ Corporation Commission — auto-refreshed daily.
              {lastRun?.finished_at && (
                <> Last update {formatDistanceToNow(new Date(lastRun.finished_at), { addSuffix: true })}.</>
              )}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh now"}
        </Button>
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {(["ALL", "SRP", "APS", "TEP"] as const).map((u) => (
          <button
            key={u}
            onClick={() => setFilter(u)}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              filter === u
                ? "bg-primary text-primary-foreground border-primary"
                : "border-hairline text-muted-foreground hover:text-foreground"
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground py-6 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">
          No updates cached yet. Click "Refresh now" to pull live data.
        </div>
      ) : (
        <ul className="divide-y divide-hairline">
          {filtered.slice(0, 20).map((u) => (
            <li key={u.id} className="py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><ImpactIcon impact={u.impact} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{u.utility}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {CATEGORY_LABEL[u.category] ?? u.category}
                    </span>
                    {u.published_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(u.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold leading-snug">{u.title}</p>
                  {u.summary && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{u.summary}</p>}
                  <a
                    href={u.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                  >
                    {u.source_name ?? "Source"} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lastRun?.status === "error" && (
        <div className="mt-3 text-[11px] text-destructive flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3" /> Last refresh had errors. Try again or check logs.
        </div>
      )}
    </section>
  );
}
