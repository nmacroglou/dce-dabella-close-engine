
# Dashboard 2.0 — Operator's Command Center

Goal: Turn the Dashboard from a snapshot into a true operating cockpit a DaBella rep (and their leader) can use to run the day, spot trends week-over-week, and report up/down with confidence.

## What's changing (visible)

1. **Hero band → "State of the Week"**
   - Keeps the greeting, but adds a compact **WoW chip strip**: Revenue, Close rate, Deals run, $/hour — each with a delta vs last week (▲/▼ %, color-coded).
   - SLA ring gains a 7-day trendline underneath.

2. **New: "Trends — Week over Week" card** (replaces the bare 14-day chart with a richer module)
   - Toggle: **7d / 4w / 12w** range; metric switch: **Revenue / Close rate / Deals run / Leads / $/hour**.
   - Dual-series chart: current period (solid) vs prior period (dashed) for instant WoW comparison.
   - Sparkline tiles below for the other 4 metrics so leaders see all KPIs trending at once.

3. **New: "Activity Timeline" (last 14 days)**
   - Vertical, day-grouped timeline of meaningful events: stage changes (from `deal_stage_history`), wins/losses, follow-up completions/overdues, objections logged.
   - Filter chips (All / Wins / Losses / Follow-ups / Objections) and search by homeowner.
   - Each row links to the deal. Powers internal standups and external rep reviews.

4. **Conversion ribbon**
   - Inspect → Present → Won funnel with **stage conversion %** between each step and **avg days in stage** (the second number leaders ask for first).

5. **Objection trends mini-heatmap**
   - 8-week heatmap (rows = top objections, columns = weeks) showing frequency intensity. Click a cell → filtered timeline.

6. **Reporting actions**
   - Header buttons: **Copy weekly summary** (rich text to clipboard for Slack/email) and **Export CSV** (daily metrics for the selected range). No backend; client-side.

## Technical plan

- **New pure helpers** in `src/lib/dashboardSeries.ts`:
  - `bucketByDay(deals, days)`, `bucketByWeek(deals, weeks)` returning `{ revenue, dealsRun, won, lost, leads, dollarsPerHour }` per bucket.
  - `wowDelta(current, prior)` → `{ pct, dir }`.
  - `weeklySummaryText(stats, wow)` → string for clipboard.
  - `toCsv(rows)` → string.
- **New hook** `useActivityTimeline()` — joins `deal_stage_history` (already in DB), `deal_objections`, `follow_ups` (completed/overdue) into a unified, sorted `TimelineEvent[]`. Uses existing tables only; no migrations.
- **New components** under `src/components/dashboard/`:
  - `WowChipStrip.tsx` — 4 mini-deltas for the hero.
  - `TrendsCard.tsx` — range/metric controls + dual-series SVG chart (current vs prior period overlay) + 4 sparkline tiles. Reuses the SVG idiom from `EarningsLeadFlowChart`.
  - `ActivityTimeline.tsx` — day-grouped list with filter chips and search.
  - `ConversionRibbon.tsx` — funnel + conversion% + avg-days-in-stage.
  - `ObjectionHeatmap.tsx` — 8-week × top-N grid.
  - `ReportingActions.tsx` — copy summary + CSV export buttons.
- **Dashboard.tsx** rewires sections in this order: Hero (with WoW chips) → Trends card → Conversion ribbon → Rep Economics (kept) → Activity Timeline → Objection heatmap → existing follow-up hot list. Removes the standalone `EarningsLeadFlowChart` placement (its essence is absorbed into TrendsCard).
- **Design system**: all colors via existing semantic tokens (`primary`, `success`, `warning`, `destructive`, `muted`); reuses `card-elevated-lg`, `gradient-*`, and shared chart gradients. No new fonts.
- **Performance**: All series computed in `useMemo`; timeline virtualized only if event count > 200 (otherwise plain render). No new dependencies.

## Out of scope (for this turn)
- No DB migrations, no auth/role changes, no edge functions.
- Per-rep leaderboards (would require a roles table); can follow in a later turn.
- Mobile-app-grade gestures; we'll keep responsive but not add swipe.

## Acceptance
- Dashboard shows WoW deltas on the hero, a working range/metric switcher, a populated 14-day activity timeline, and the Copy Summary button puts a readable weekly recap on the clipboard.
- No console errors; all existing data flows (deals, follow-ups, objections, stage history) continue to work.
