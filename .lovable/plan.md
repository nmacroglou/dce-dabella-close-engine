## Refactor Plan

### 1. Extract Data Constants
- Move objection routes, closing steps, scope items, and coaching logic out of components into `src/data/` files
- Eliminates SCOPE_ITEMS duplication (exists in both `ScopeOfWork.tsx` and `exportPdf.ts`)
- Remove duplicate `fmt` function from `exportPdf.ts` (already in `format.ts`)

### 2. Improve Type Safety
- Fix `InputField` onChange `any` type → proper union type
- Add stricter typing for objection IDs and product types

### 3. Performance Optimization
- Add `React.lazy` + `Suspense` for tab content (only load active tab)
- Wrap leaf components (`PromoRow`, `ValueRow`, `ScriptCard`, `TrustBar`) with `React.memo`
- Memoize options arrays in PresentationTab and CustomerPresentationView

### 4. Component Cleanup
- Extract the 2x2 action button grid from `PresentationTab` into its own `ActionGrid` component
- Extract the T-close + 10-year impact section into `FinancialImpact` component
- Simplify `CustomerPresentationView` export handler (already improved, just clean up unused import)

### 5. UI/UX Polish
- Add subtle hover transitions to `PromoRow` and `ValueRow`
- Improve mobile responsiveness for the tab bar (horizontal scroll on small screens)
- Add loading skeleton for lazy-loaded tabs

### 6. File Structure
```
src/
  data/
    objections.ts      — objection routes data
    closingSteps.ts    — closing stack steps
    scopeItems.ts      — scope of work items (shared by ScopeOfWork + PDF)
    coachingCards.ts   — coaching card logic
    products.ts        — product list
  components/engine/
    presentation/
      ActionGrid.tsx   — extracted from PresentationTab
      FinancialImpact.tsx — T-close + 10-year impact
```

No business logic or visual design changes — purely structural improvements.