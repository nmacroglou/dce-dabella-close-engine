# Refactor & Upscale Plan

Two coordinated workstreams: **(A) PDF export module** and **(B) Whole‑app design system**. Each section has a code‑quality pass, a polish pass, and a performance pass. Behavior stays identical for the user — same pages, same numbers, same routes.

---

## A. PDF export module (`src/lib/exportPdf.ts`, 1,025 lines → ~7 small files)

### Current pain
- One 1,025‑line file mixing brand tokens, low‑level jsPDF helpers, page renderers, font loading, debug overlay, and the public API.
- Magic numbers (margins, line heights, column splits) repeated across every page renderer.
- Colors typed as `readonly [number, number, number]` tuples — no semantic naming when used inside a renderer.
- Font loading runs on every export; no cache between exports in a session.
- Debug overlay (just added) lives next to the builder and inflates the file further.

### Target structure
```text
src/lib/pdf/
  index.ts              ← re-exports buildCustomerPdf, exportCustomerPdf
  build.ts              ← orchestrator (was buildCustomerPdf)
  theme.ts              ← brand palette + typography tokens (single source of truth)
  primitives.ts         ← rect, rounded, shadow, vGradient, hairline, eyebrow, trackedText
  fonts.ts              ← registerPdfFonts + module-level cache
  assets.ts             ← loadImageDataUrl + cache
  debug.ts              ← installDebugRecorder + drawDebugOverlay
  pages/
    cover.ts
    selectedOption.ts
    tClose.ts
    financialImpact.ts
    windowInspection.ts
    scope.ts
    welcome.ts
    footer.ts           ← shared interior-page footer
```

### Code‑quality changes
- Extract magic numbers into `theme.ts` as a `LAYOUT` object: `PAGE_W`, `PAGE_H`, `MARGIN`, `GUTTER`, `BODY_LH`, etc.
- Replace ad‑hoc tuple colors with a `Palette` object: `palette.forest`, `palette.lime`, `palette.brass`, `palette.posSoft`, etc. Each page renderer imports from `theme.ts` only.
- Introduce a small `PdfCtx` object passed to every page renderer (`{ pdf, palette, layout, logo }`) so renderers don't all import six modules.
- Add a `Section` helper (`section(ctx, { x, y, w, title, eyebrow })`) to standardize headers used across pages.
- Tighten types: replace `any` casts in the debug recorder with proper jsPDF types.
- Keep the public API unchanged: `buildCustomerPdf(state, computed, options, selectedOption?, opts?)`.

### Visual polish
- Single shared interior footer (currently re‑drawn in a loop) becomes `pages/footer.ts` and is called per page in the orchestrator.
- Standardize section spacing rhythm via `LAYOUT.section.gap` so all pages breathe the same.
- Align column widths in Selected Option, T‑Close, and Financial Impact to the same 2‑col grid (currently each uses slightly different math).

### Performance
- Cache the registered font VFS payload at module scope so the second export in a session skips `fetch` + base64 work.
- Cache the logo data URL the same way.
- Build pages without the debug recorder unless `opts.debug` is set (already true; keep it that way after refactor).

### Risk control
- One‑file‑at‑a‑time extraction; after each move, render a sample PDF and diff‑check it visually with the existing debug overlay (collisions = 0).
- No business‑logic changes in `engineHelpers` or `useCloseEngine`.

---

## B. Whole‑app design system

### Current pain
- `index.css` defines tokens for both light and dark, but components still use ad‑hoc utility combos (`bg-card border border-border rounded-2xl`) repeatedly instead of the existing `card-elevated` / `metric-card` / `glass` utilities.
- Two display fonts are declared (`Plus Jakarta Sans`, `Inter`) but several screens override with `font-display` / `font-extrabold` inline in inconsistent sizes.
- Custom hex colors leak into a few presentation components instead of going through tokens.
- Animations are defined in `tailwind.config.ts` but components also use raw `transition-all` strings.

### Tokens & typography
- Add a small **type scale** in `tailwind.config.ts`: `text-display-xl`, `text-display-lg`, `text-eyebrow`, `text-metric` — wired to fontSize + lineHeight + letterSpacing pairs. Replace ad‑hoc `text-3xl font-extrabold tracking-tight` clusters.
- Add semantic surface tokens to `index.css`: `--surface-1`, `--surface-2`, `--surface-raised` mapped to the existing card/muted hierarchy. Components stop hand‑rolling `bg-card/70 backdrop-blur-xl`.
- Promote `--radius-pill`, `--radius-card`, `--radius-chip` so corner radii stop drifting.
- Audit dark mode contrast on the Customer Presentation header and Financial Impact tiles; tune `--muted-foreground` if any field reads gray‑on‑gray.

### Reusable primitives (no behavior change)
Create `src/components/ui/primitives/`:
- `Eyebrow.tsx` — uppercase, tracked label used across presentation pages.
- `StatTile.tsx` already exists in pipeline; generalize and re‑use in dashboard + presentation.
- `SectionHeader.tsx` already exists; expand to take `eyebrow`, `title`, `kicker` and adopt across CalculatorTab, PlaybookTab, CoachModeTab.
- `MetricRow` for the repeated label/value rows in Calculator and Commission.

### Refactors per area
- `CustomerPresentationView.tsx` (252 lines) → split into `PresentationHeader`, `PresentationStageNav`, `PresentationFooterNav`. Body stays in the parent.
- `CalculatorTab.tsx` (280 lines) → extract `PriceInputsRow`, `OptionPriceTrio`, `FinanceTermsRow`.
- `CommissionTab.tsx` and `commission/*` → consolidate the two grid editors' shared row/cell rendering.
- `engineHelpers.ts` + `useCloseEngine.ts` → move pure math (discount application, ROI, monthly conversion) to `src/lib/engine/math.ts` so both PDF and UI import the same functions.

### Performance
- Lazy‑load the heavy customer presentation: `const CustomerPresentationView = React.lazy(...)` in `PresentationTab.tsx` so it isn't in the initial dashboard bundle.
- Lazy‑load `exportPdf` (`pdf/index.ts`) only when the Share dialog opens (already only imported there — confirm and keep).
- Add `vite` manualChunks for `jspdf` so it stays out of the main chunk.
- Wrap chart/table rows that re‑render on every state change with `React.memo` where props are stable (Commission grid cells, FinancialImpact rows).

### Risk control
- Token rename uses codemod‑style search‑and‑replace per file, never global. Spot‑check the dashboard, deals page, and presentation flow after each batch.
- No changes to data shapes, Supabase calls, or routes.

---

## Sequencing (suggested order across multiple turns)

1. **Turn 1 — PDF refactor (structure only):** create `src/lib/pdf/` files, move helpers and pages with no logic changes, keep `src/lib/exportPdf.ts` as a thin re‑export shim. Verify with debug overlay.
2. **Turn 2 — PDF polish + caching:** unify section/footer, font + logo caching, layout grid normalization.
3. **Turn 3 — Design tokens:** type scale, surface tokens, radius tokens; migrate `CustomerPresentationView` + `CalculatorTab` to the new tokens as the proof‑of‑pattern.
4. **Turn 4 — Primitives + remaining tabs:** roll the new primitives across Commission, Playbook, Coach, Objections, Closing Stack.
5. **Turn 5 — Performance:** lazy routes, manualChunks, memoization sweep.

Each turn is independently shippable and visually identical (or strictly tighter) to the previous version.

---

## Out of scope (explicit)
- No Supabase schema changes.
- No new features, no auth changes, no routing changes.
- No copy or pricing logic edits.
- No swap of jsPDF for another library (would invalidate the just‑tuned typography work).

---

## Technical notes (for engineers)
- `installDebugRecorder` will be moved verbatim into `pdf/debug.ts`; the `any` casts get replaced with `jsPDF["text"]` parameter types.
- Module‑scope caches: `let _fontsRegistered = false; let _logoDataUrl: string | null = null;` guarded by a `WeakMap<jsPDF, true>` so multiple `pdf` instances per session still register fonts on each new doc but skip the network fetch.
- Vite `build.rollupOptions.output.manualChunks`: `{ jspdf: ['jspdf'], radix: [/@radix-ui/], charts: ['recharts'] }`.
- Type scale entries follow `[fontSize, { lineHeight, letterSpacing, fontWeight }]` tuple form supported by Tailwind.

Approve and I'll start with **Turn 1 (PDF structural refactor)** unless you want a different starting point.