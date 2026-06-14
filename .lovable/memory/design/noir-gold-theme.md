---
name: Stripe Slate theme
description: Dark-first Stripe Slate palette with electric-blue primary, emerald success accent, and Urbanist + Epilogue fonts.
type: design
---
**Palette (locked):**
- Background: #0A1628 (HSL 213 61% 10%)
- Surface/card: #13243B (HSL 213 51% 15%)
- Primary (electric blue): #3B82F6 (HSL 217 91% 60%) — branding, CTAs, in-progress states
- Soft blue glow: #60A5FA (HSL 213 94% 68%)
- Accent / Success (emerald green): HSL 150 65% 45% — won deals, savings, "after" series, positive deltas
- Accent glow: HSL 150 70% 55%
- Warning: amber HSL 38 92% 58% (exports, partial offset)
- Destructive: red HSL 0 72% 56% (lost deals, "do nothing" bill line)
- Foreground: cool white HSL 213 30% 93%
- Hairline: dark slate HSL 213 30% 20%

**Tone semantics:**
- **Electric blue** = brand identity, primary CTAs, active nav, in-progress/follow-up stages, KPI emphasis.
- **Emerald green (accent/success)** = won deal stage badges, "savings/after" chart series, positive deltas, completed steps.
- **Amber (warning)** = exports, partial states.
- **Red (destructive)** = lost stage, "do nothing" baseline.

Electric blue and emerald green together form the project's contrast spine. Energy Lens charts rely on this: green self-used bars vs amber export bars vs red baseline line.

**Typography (locked):**
- Headings: Urbanist (700/800)
- Body: Epilogue (400/500)
- Numeric/display: Urbanist with tabular-nums

**Rules:**
- Dark mode is the default and primary surface.
- Electric blue is signal for brand/in-progress; emerald green is signal for *won/positive outcomes*. Do not swap.
- Both `--success` and `--accent` resolve to the same emerald green to keep all chart/badge tokens coherent.
- No gradients on chrome. Hairline rules + frame-corner accents are the structural moves.
