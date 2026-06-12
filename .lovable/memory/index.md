# Project Memory

## Core
DaBella Close Engine — sales tool for iPad field reps. Dark mode default.
Theme: Noir & Gold. Urbanist headings, Epilogue body. Primary/accent gold #c9a84c, bg #0d0d0d, surface #1a1a1a.
All 3 option cards share same "What's Included" features (Golden Pledge, Factory-Trained, SolarMAX, Master Elite).
Dashboard "Close rate" tile = cohort-based Sit-to-Close, NOT won/(won+lost). See close-rate memory before changing.
Currency: always `formatCurrency` from `@/lib/format`. Counts: `formatCount`. Never `$${fmt(...)}` — produces `$$`.

## Memories
- [Noir & Gold theme](mem://design/noir-gold-theme) — Locked palette + Urbanist/Epilogue type system
- [Architecture](mem://design/architecture) — Shared helpers, component structure, refactoring decisions
- [Close rate KPI](mem://features/close-rate-kpi) — Sit-to-Close definition, cohort rules, confidence tiers
- [Currency & count formatting](mem://preferences/currency-formatting) — formatCurrency / formatCount / formatCurrencyShort rules
