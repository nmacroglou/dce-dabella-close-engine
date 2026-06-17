
## Goal
Let a rep upload a few photos for a deal, have AI tag + caption each one, then generate a branded inspection PDF and share it with the homeowner — all from the iPad, no Python, no server roundtrip beyond the AI vision call.

## User flow
1. From the **Deal page** (card) or the **Close Engine → Inspection tab**, rep picks a report type: Roof / Windows / Bath / Solar.
2. Rep uploads photos (drag/drop or iPad camera). Files land in the existing `deal-photos` bucket under `<deal_id>/inspection/<uuid>.jpg`.
3. Each photo is sent to Lovable AI Gateway (`google/gemini-2.5-flash`, vision) via a new edge function `inspect-photo`. The function returns:
   - `tags: string[]` (e.g. broken tile, exposed underlayment, flashing gap)
   - `severity: "low" | "moderate" | "high"`
   - `caption: string` (one line)
4. Rep reviews a grid: each photo shows AI tags as editable chips, severity dropdown, caption textbox, and an Include-in-report toggle.
5. Rep edits the section narratives (Executive Summary, Inspection Scope, Measurements, Professional Opinion, Recommended Scope, Next Steps, Limitations) — pre-filled with a template chosen by report type, then persisted per-deal so re-opens are instant.
6. Rep hits **Generate** → jsPDF builds the branded PDF (same theme as the proposal: DaBella cover, footer, section headers) → opens the existing `SharePdfDialog` for download / email / SMS / signed link.

## Data model
New table `deal_inspections`:
- `deal_id` (FK), `report_type` (`roof|windows|bath|solar`)
- `sections jsonb` (the narrative blocks)
- `created_at`, `updated_at`
- RLS: rep owns via deal_id → deals.rep_id

Extend `deal_photos`:
- `inspection_tags text[]`
- `severity text` check in (`low`, `moderate`, `high`)
- `caption text`
- `include_in_report boolean default true`
- `inspection_report_type text` (so the same bucket can hold proposal + multiple inspection types per deal)

## Edge function: `inspect-photo`
- Input: `{ photo_url: string, report_type: "roof"|"windows"|"bath"|"solar" }`
- Calls Lovable AI Gateway with the photo (`image_url` content block) and a system prompt scoped to the report type's known defect taxonomy.
- Returns structured JSON `{ tags, severity, caption }`.
- Includes 429/402 error surfacing per gateway guidance.

## Frontend pieces
- `src/components/inspection/InspectionPanel.tsx` — the main UI (type picker, photo grid, narrative editor, generate button).
- `src/components/inspection/PhotoTagCard.tsx` — single photo with tags/severity/caption/include toggle.
- `src/components/engine/InspectionTab.tsx` — wraps `InspectionPanel` inside the engine tabs.
- `src/components/deals/InspectionCard.tsx` — entry-point card on the deal page that opens the panel in a sheet.
- `src/hooks/useInspection.ts` — load/save `deal_inspections`, invoke `inspect-photo`, mutate photos.
- `src/data/inspectionTemplates.ts` — narrative defaults + defect taxonomy per `report_type`.

## PDF pipeline (jsPDF, reuses existing theme)
New module `src/lib/pdf/inspection/`:
- `build.ts` — orchestrator, mirrors `pdf/build.ts` shape so we can share fonts/footer/cover helpers.
- `pages/cover.ts` — customer name + address + report type title (reuses `drawCover` helpers).
- `pages/summary.ts` — executive summary + scope + measurements.
- `pages/findings.ts` — for each included photo: image + tags chips + severity badge + caption + linked finding paragraph.
- `pages/opinion.ts` — professional opinion + recommended scope + next steps + limitations.
- No pricing block (per your answer).
- Same footer + branding as the proposal PDF.

Hooks back into `SharePdfDialog` (or a thin variant) so download/email/SMS/signed-link works identically.

## Technical notes
- AI model: `google/gemini-2.5-flash` (vision, fast, low cost). Structured output via tool calling so the JSON shape is enforced.
- Photo uploads stay in the existing private `deal-photos` bucket; for the AI call the edge function generates a short-lived signed URL.
- Templates per report type live in code (no DB seed) so they're easy to edit.
- Re-opening an inspection just rehydrates `deal_inspections.sections` + the deal's tagged photos — no AI re-run unless rep clicks "Re-analyze".
- PDF generation stays 100% client-side; the only network call is the per-photo AI tag.

## What I will NOT do in v1
- No pricing table in the PDF.
- No background job for bulk re-tagging.
- No editing of the defect taxonomy from the UI (code-only for now).
- No PDF page-size/orientation options (matches proposal A4 portrait).

Approve and I'll build it end-to-end: migration → edge function → hooks → UI → PDF pipeline → entry points.
