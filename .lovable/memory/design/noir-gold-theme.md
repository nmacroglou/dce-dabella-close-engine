---
name: Midnight & Teal theme
description: Dark-first Midnight & Teal palette with spring-green won/savings accent and Urbanist + Epilogue fonts.
type: design
---
**Palette (locked):**
- Background: #0a0f14 (HSL 210 33% 5%)
- Surface/card: #121820 (HSL 210 22% 10%)
- Primary (teal): #2dd4bf (HSL 168 76% 50%) — branding, CTAs, in-progress states
- Soft teal glow: #5eead4 (HSL 168 70% 64%)
- Accent / Success (spring green): HSL 145 60% 48% — won deals, savings, "after" series, positive deltas
- Accent glow: HSL 150 70% 60%
- Warning: amber HSL 38 92% 58% (exports, partial offset)
- Destructive: red HSL 0 72% 56% (lost deals, "do nothing" bill line)
- Foreground: cool cream HSL 170 30% 92%
- Hairline: dark slate HSL 210 20% 16%

**Tone semantics:**
- **Teal** = brand identity, primary CTAs, active nav, in-progress/follow-up stages, KPI emphasis.
- **Spring green (accent/success)** = won deal stage badges, "savings/after" chart series, positive deltas, completed steps.
- **Amber (warning)** = exports, partial states.
- **Red (destructive)** = lost stage, "do nothing" baseline.

Teal and spring green together form the project's contrast spine. Energy Lens charts rely on this: green self-used bars vs amber export bars vs red baseline line.

**Typography (locked):**
- Headings: Urbanist (700/800)
- Body: Epilogue (400/500)
- Numeric/display: Urbanist with tabular-nums

**Rules:**
- Dark mode is the default and primary surface.
- Teal is signal for brand/in-progress; spring green is signal for *won/positive outcomes*. Do not swap.
- Both `--success` and `--accent` resolve to the same spring green to keep all chart/badge tokens coherent.
- No gradients on chrome. Hairline rules + frame-corner accents are the structural moves.
