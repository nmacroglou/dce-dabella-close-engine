---
name: Noir & Gold theme
description: Dark-first Noir & Gold palette with emerald-green won/savings accent and Urbanist + Epilogue fonts.
type: design
---
**Palette (locked):**
- Background: #0d0d0d (HSL 0 0% 5%)
- Surface/card: #1a1a1a (HSL 0 0% 10%)
- Primary (gold): #c9a84c (HSL 44 56% 54%) — branding, CTAs, in-progress states
- Soft gold glow: #f0d78c (HSL 41 76% 75%)
- Accent / Success (emerald): HSL 152 64% 48% — won deals, savings, "after" series, positive deltas
- Accent glow: HSL 158 76% 60%
- Warning: amber HSL 38 92% 58% (exports, partial offset)
- Destructive: red HSL 0 72% 56% (lost deals, "do nothing" bill line)
- Foreground: warm cream HSL 41 76% 92%
- Hairline: dark warm HSL 44 25% 16%

**Tone semantics:**
- **Gold** = brand identity, primary CTAs, active nav, in-progress/follow-up stages, KPI emphasis.
- **Emerald (accent/success)** = won deal stage badges, "savings/after" chart series, positive deltas, completed steps.
- **Amber (warning)** = exports, partial states.
- **Red (destructive)** = lost stage, "do nothing" baseline.

Gold and emerald together form the project's contrast spine. Energy Lens charts rely on this: green self-used bars vs amber export bars vs red baseline line.

**Typography (locked):**
- Headings: Urbanist (700/800)
- Body: Epilogue (400/500)
- Numeric/display: Urbanist with tabular-nums

**Rules:**
- Dark mode is the default and primary surface.
- Gold is signal for brand/in-progress; emerald is signal for *won/positive outcomes*. Do not swap.
- Both `--success` and `--accent` resolve to the same emerald to keep all chart/badge tokens coherent.
- No gradients on chrome. Hairline rules + frame-corner accents are the structural moves.
