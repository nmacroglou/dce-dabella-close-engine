---
name: Noir & Gold theme
description: Dark-first Noir & Gold palette with Urbanist + Epilogue fonts. The locked design tokens for Close Engine.
type: design
---
**Palette (locked):**
- Background: #0d0d0d (HSL 0 0% 5%)
- Surface/card: #1a1a1a (HSL 0 0% 10%)
- Primary/accent gold: #c9a84c (HSL 44 56% 54%)
- Soft gold glow: #f0d78c (HSL 41 76% 75%)
- Foreground: warm cream (HSL 41 76% 92%)
- Hairline: dark warm (HSL 44 25% 16%)

**Typography (locked):**
- Headings: Urbanist (700/800)
- Body: Epilogue (400/500)
- Numeric/display: Urbanist with tabular-nums

**Rules:**
- Dark mode is the default and primary surface — light mode is a fallback only.
- Gold is signal, not decoration: use on actives, KPIs, CTAs. Sparingly.
- No gradients on chrome. Hairline rules and frame-corner accents are the structural moves.
- Both `--primary` and `--accent` resolve to the same gold so existing components stay coherent.
