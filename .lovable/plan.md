## Goal

On the Live Sheet (Commission tab → Live Sheet), add a short helper line under every input that explains what the number is and gives a concrete example, so it's obvious what to type in each box.

## What the user will see

Under each field label, a small muted line of text like:

- **Date of Sale** — _"The day the contract was signed. e.g. 04/22/2026"_
- **Customer Name** — _"Auto-filled from the deal's homeowner. Read-only."_
- **Job #** — _"Hover/CRM job number from the signed contract. e.g. 184502"_
- **Rep Last, First Initial** — _"Your name as it appears on payroll. e.g. Macroglou, N"_
- **Company Paid Finance Fees** — _"Dealer fee DaBella absorbs for the finance plan. e.g. $4,200 on a 9.99% 15-yr"_
- **Project Price** — _"The 100% (Option A / 'good') price — the benchmark used for % of Project. e.g. $42,000"_
- **Promotion or Special Approved By** — _"Any extra % or override and who approved it. e.g. 'Extra 1% POI Bonus — approved by RSM Smith'"_
- **$ for $** — _"Dollar-for-dollar add-on (referrals, demo $, etc.). e.g. $250"_
- **Bonus / Self-Gen Fee** — _"Self-generated lead bonus or spiff. e.g. $500 for self-gen"_
- **Rep 1 % / Rep 2 %** — _"How the commission splits between reps. Must total 100. e.g. 50 / 50"_
- **Contract Roof / Siding / Gutters** — _"What the customer is paying for this line on the signed contract. e.g. $28,500"_
- **Project Roof / Siding / Gutters** — _"The 100% project price for this line (matches the Option A price). e.g. $32,000"_

The helper text is a small, muted second line under each label — same style we already use in `InputField.tsx` (the `description` prop). It does not change layout or any calculations.

## Files to change

1. **`src/components/engine/commission/CommissionSheet.tsx`**
   - Extend the local `Field` component to accept an optional `hint?: string` prop and render it as a small `text-[10px] text-muted-foreground` line under the label.
   - Pass a `hint` to every `<Field>` in the sheet (identity row, Project Total panel, rep split, and the Contract/Project line items). For the line-item rows, since they currently render `<Field label="">`, add a single hint line under the row header ("Contract = signed price for this line. Project = 100% Option A price.") instead of repeating it on every cell.
   - Add a one-line legend at the top of the Project Total panel: _"Tip: Project Price is your 100% benchmark. Contract Total ÷ Project Price = % of Project, which picks your commission tier."_

2. No changes to `commission.ts`, the grid editor, hooks, or the database — this is purely UI helper text.

## Out of scope

- No changes to calculations, persistence, or the grid.
- No tooltips/popovers — the hints render inline so they're visible on iPad without tapping.
