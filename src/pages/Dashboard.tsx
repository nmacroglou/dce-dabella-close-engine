import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import { Loader2, TrendingUp, TrendingDown, Target, DollarSign, Award, Flame, Clock, AlertCircle, Trophy, BarChart3 } from "lucide-react";
import { fmt } from "@/lib/format";
import { STAGE_LABELS, type DealStage } from "@/types/deal";
import { OBJECTIONS } from "@/data/objections";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function StatCard({ icon: Icon, label, value, sub, accent = "text-primary" }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card-elevated p-5 group hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className={`h-8 w-8 rounded-lg bg-muted/60 grid place-items-center ${accent} group-hover:scale-110 transition-transform`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-display font-extrabold text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const optTotal = stats.optionMix.A + stats.optionMix.B + stats.optionMix.C;
  const greeting = (user?.user_metadata?.full_name || user?.email || "").split(" ")[0] || "rep";

  // Funnel — show non-zero ordered
  const funnelOrder: DealStage[] = ["inspecting", "presented", "follow_up", "won", "lost"];
  const maxFunnel = Math.max(...stats.funnel.map((f) => f.count), 1);

  // Objection rows
  const objectionRows = Object.entries(stats.objectionCounts)
    .sort((a, b) => b[1].total - a[1].total);
  const maxObj = Math.max(...objectionRows.map(([, v]) => v.total), 1);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
          <div className="absolute inset-0 -z-0 opacity-60 gradient-surface" />
          <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full opacity-20 blur-3xl gradient-brand" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-1">Daily HUD</p>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
              Hey {greeting} — here's your <span className="gradient-text">edge</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Live performance, patterns, and the moves that'll close more deals this month.
            </p>
          </div>
        </div>

        {/* Row 1: Month at a glance */}
        <section>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            This Month at a Glance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Target} label="Deals run" value={String(stats.monthDealsRun)} />
            <StatCard icon={Trophy} label="Closed won" value={String(stats.monthClosed)} accent="text-success" />
            <StatCard icon={TrendingDown} label="Closed lost" value={String(stats.monthLost)} accent="text-destructive" />
            <StatCard icon={TrendingUp} label="Close rate" value={pct(stats.monthCloseRate)} accent="text-primary" />
            <StatCard icon={DollarSign} label="Revenue closed" value={fmt(stats.monthRevenue)} accent="text-success" />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funnel */}
          <section className="lg:col-span-2 card-elevated-lg p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-foreground">Pipeline funnel</h3>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Where every deal sits right now — and how well you're moving them through.
            </p>
            <div className="space-y-3">
              {funnelOrder.map((stage) => {
                const count = stats.funnel.find((f) => f.stage === stage)?.count ?? 0;
                const widthPct = (count / maxFunnel) * 100;
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-foreground">{STAGE_LABELS[stage]}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          stage === "won" ? "bg-success" :
                          stage === "lost" ? "bg-destructive" :
                          stage === "follow_up" ? "bg-warning" : "bg-primary"
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Inspected → Presented</p>
                <p className="text-xl font-bold text-foreground">{pct(stats.inspectedToPresented)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Presented → Won</p>
                <p className="text-xl font-bold text-success">{pct(stats.presentedToWon)}</p>
              </div>
            </div>
          </section>

          {/* Win/Loss */}
          <section className="card-elevated-lg p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Win / Loss</h3>
            <p className="text-xs text-muted-foreground mb-5">All-time outcomes & avg deal size.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm font-semibold">Won</span>
                </div>
                <span className="font-bold text-foreground">{stats.winLoss.won}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-sm font-semibold">Lost</span>
                </div>
                <span className="font-bold text-foreground">{stats.winLoss.lost}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                  <span className="text-sm font-semibold">Pending</span>
                </div>
                <span className="font-bold text-foreground">{stats.winLoss.pending}</span>
              </div>
              <div className="pt-4 border-t border-border space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg won</span>
                  <span className="font-semibold text-success">{fmt(stats.winLoss.avgWon)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg lost (Opt A)</span>
                  <span className="font-semibold text-muted-foreground">{fmt(stats.winLoss.avgLost)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Option mix */}
          <section className="card-elevated-lg p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Option mix on closes</h3>
            <p className="text-xs text-muted-foreground mb-5">
              {optTotal === 0
                ? "No closes yet — once you start winning, you'll see if you're leaving Option A on the table."
                : "Are you closing on the right tier?"}
            </p>
            {optTotal === 0 ? (
              <p className="text-sm text-muted-foreground italic">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {(["A", "B", "C"] as const).map((k) => {
                  const count = stats.optionMix[k];
                  const p = (count / optTotal) * 100;
                  const color = k === "A" ? "bg-primary" : k === "B" ? "bg-accent" : "bg-warning";
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Option {k}</span>
                        <span className="text-muted-foreground">{count} · {Math.round(p)}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Objection heatmap */}
          <section className="card-elevated-lg p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Objection heatmap</h3>
            <p className="text-xs text-muted-foreground mb-5">
              What's coming up most — and how it correlates with outcomes.
            </p>
            {objectionRows.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Tag objections from a deal's Objections tab to see patterns here.
              </p>
            ) : (
              <div className="space-y-3">
                {objectionRows.map(([type, v]) => {
                  const label = OBJECTIONS.find((o) => o.id === type)?.label ?? type;
                  const w = (v.total / maxObj) * 100;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-foreground">{label}</span>
                        <span className="text-muted-foreground">
                          {v.total} · <span className="text-success">{v.onWins}W</span> / <span className="text-destructive">{v.onLosses}L</span>
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-warning rounded-full" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Flame}
            label="7-day close rate"
            value={pct(stats.weeklyCloseRate)}
            sub={`${stats.weeklyClosed} / ${stats.weeklyRun} this week`}
            accent="text-warning"
          />
          <StatCard
            icon={Clock}
            label="Avg time to close"
            value={`${stats.avgDaysToClose.toFixed(1)}d`}
            sub="From first inspection"
            accent="text-primary"
          />
          <StatCard
            icon={Award}
            label="Leaderboard"
            value="—"
            sub="Anonymous ranks coming soon"
            accent="text-muted-foreground"
          />
          <StatCard
            icon={AlertCircle}
            label="Next best action"
            value={String(stats.followUpsOverdue + stats.presentedStale)}
            sub={`${stats.followUpsOverdue} follow-ups overdue · ${stats.presentedStale} stale presented`}
            accent={stats.followUpsOverdue + stats.presentedStale > 0 ? "text-destructive" : "text-success"}
          />
        </div>
      </main>
    </div>
  );
}
