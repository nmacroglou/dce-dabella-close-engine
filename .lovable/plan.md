## Goal

Make the app faster to load, verify every dashboard number is correct, tighten the design system, and clean up the data layer — without breaking existing behavior. Done in safe phases so you can stop at any point.

## Phase 1 — Performance (load speed)

What you'll feel: faster first paint, snappier route changes on iPad.

- Audit current bundle: run a build and identify the biggest chunks.
- Already lazy-loaded routes ✓. Add lazy-loading for **heavy in-route components** that aren't visible on first paint:
  - `CashflowForecast`, `PaymentCalendar` (Ledger)
  - `CommissionSheet`, `CommissionGridEditor` (Engine)
  - `SharePdfDialog` + entire `src/lib/pdf/*` stack (only load when user opens Share)
  - `recharts` charts (Dashboard) — defer below-the-fold tiles
- Add `React.memo` + stable `useCallback`/`useMemo` to hot rows: `OptionCard`, `OptionPricingRow`, `PaydayRow`, `Checklist` items.
- Replace any `.map` chains computing the same thing per render with `useMemo`.
- React Query: bump `staleTime` on slow-changing queries (commission grid, profile) to 5 min; keep deals at 30s.
- Image/asset audit: confirm no oversized PNGs shipped from `/public` or `src/assets`.
- Add route prefetch on link hover for Deals → Pipeline → Ledger.

## Phase 2 — Dashboard metric audit (vanity numbers)

What you'll feel: confidence every KPI matches reality.

- Open `src/hooks/useDashboardStats.ts`, `src/components/dashboard/kpi-tiles.tsx`, `ConversionRibbon`, `EarningsLeadFlowChart`, `TrendsCard`, `WowChipStrip`, `ObjectionHeatmap`.
- For each metric, document: **formula → SQL source → expected vs. shown**.
- Cross-check against the database with `read_query` (sum of `closed_amount`, count by stage, commission_payments totals, objection counts).
- Fix any off-by-one, wrong denominator, timezone, or stale-data issues (common culprits: conversion rate using all deals vs. closed-period deals, earnings double-counting front+back, "this month" using UTC instead of local).
- Add a small `(?)` tooltip on each KPI explaining the formula, so future-you can verify at a glance.

## Phase 3 — Design system polish

What you'll feel: more consistent spacing, no rogue colors.

- Scan codebase for hardcoded color classes (`text-white`, `bg-black`, `text-gray-*`, hex literals in JSX) and replace with semantic tokens (`text-foreground`, `bg-card`, `text-muted-foreground`).
- Normalize border radius and shadow usage to tokens.
- Verify all headings use Plus Jakarta, body uses Inter (per project memory).
- Quick pass on touch targets — ensure iPad tap targets ≥ 44px.

## Phase 4 — Data layer cleanup

What you'll feel: fewer flicker/loading states, better error messages.

- Standardize query/mutation patterns across hooks (`useDeals`, `useCommissionLedger`, `useFollowUps`, `useDealObjections`, `useStageHistory`).
- Add consistent loading skeletons + empty states.
- Ensure all mutations show toast on success/error (some are missing).
- Tighten TypeScript: remove `as unknown as` casts where avoidable.

## What I will NOT touch this round

- Database schema changes
- Auth flow
- Engine pricing math
- PDF generation logic (just lazy-loading it)

## Suggested execution order

Start with **Phase 1 + Phase 2** in this turn (the two you flagged as painful: slow load + vanity-metric verification). Phase 3 and 4 in follow-up turns.

Sound good? Reply **"go"** to start with Phase 1 & 2, or tell me to reorder/skip anything.