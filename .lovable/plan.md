## Goal

Refactor the entire DaBella Close Engine in 3 sequential phases — one per turn — so nothing breaks between steps. After each phase you'll see the preview, sign off, and we move to the next.

## Phase 1 — Code structure cleanup (no visual change)

Largest files today are doing too much. We split them, extract shared logic, and tighten types. Zero pixel changes — pure plumbing.

Targets:
- `src/pages/Dashboard.tsx` (753 lines) → split into:
  - `dashboard/HeroKpis.tsx`
  - `dashboard/EarningsLeadFlowChart.tsx` (already a sub-component, move out)
  - `dashboard/RepEconomics.tsx`
  - `dashboard/TrendSeries.ts` (the `trendSeries` useMemo as a pure helper + unit-testable)
- `src/components/engine/commission/CommissionSheet.tsx` (514) → split header, totals, line-items, promo block.
- `src/lib/exportPdf.ts` (780) → split per-section renderers (`pdf/cover.ts`, `pdf/options.ts`, `pdf/commission.ts`).
- `src/pages/Pipeline.tsx` (350) → extract `pipeline/StageColumn.tsx`, `pipeline/DealRow.tsx`.
- `src/components/followups/FollowUpComposer.tsx` (359) → extract AI-email block + attachments block.
- Consolidate duplicate money/percent formatters into `src/lib/format.ts`.
- Remove dead imports, tighten `any` types in hooks.

## Phase 2 — Performance & scalability

- Wrap heavy lists (`Pipeline`, `Deals`, `CommissionSheet`) in `React.memo` + stable callbacks.
- Move `trendSeries`-style derivations into `useMemo` with proper deps; audit `useEffect` dep arrays for the bug class that caused the recent `monthRevenue` crash.
- Lazy-load tab routes with `React.lazy` + `Suspense` so the Dashboard doesn't ship the whole Close Engine bundle.
- Add a tiny query cache layer for `useDeals` / `useDashboardStats` (stale-while-revalidate) so tab switches feel instant.
- Virtualize the deals list if >50 rows.
- Add a single `ErrorBoundary` around each top-level route so one bad calc never blanks the whole app again.

## Phase 3 — Visual upscale (premium feel)

Keeping the dark theme + Inter/Plus Jakarta + #2563EB primary you already locked in.

- Tighten the design tokens in `index.css`: add elevation scale (`--shadow-1..4`), a 2-stop primary gradient, and a "glass" surface token used by Hero KPIs and the chart card.
- Typography rhythm pass: consistent heading sizes (`text-2xl/tight` H1, `text-lg/snug` section), tabular-nums on every dollar value.
- Motion: framer-motion stagger on KPI cards on mount, subtle hover lift on option cards, animated number count-up on Hero KPIs.
- Chart polish: rounded bar tops, soft glow on the line, hovered tooltip with date + both metrics.
- Commission Sheet: zebra rows, sticky totals row, color-coded promo chips.
- Dashboard hero: bigger primary metric, secondary metrics demoted, a single accent color per KPI instead of every card competing.
- iPad-first spacing audit (your reps use iPads): increase tap targets to 44px min, bump section padding at `md:` breakpoint.

## How we'll execute

Reply "go" and I do **Phase 1** only. When you're happy with the preview, say "phase 2" and so on. If at any point you want to skip or reorder, just say so.

## Technical notes

- No DB or RLS changes in any phase — pure frontend.
- No new dependencies in Phase 1 or 3. Phase 2 may add `@tanstack/react-virtual` only if the deals list is long enough to justify it; I'll check first.
- All edits stay inside `src/` and design tokens stay in `index.css` / `tailwind.config.ts` per the project rules.
