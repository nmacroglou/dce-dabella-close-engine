## Property Intelligence Module

Adds a new **Property Intelligence** module to DCE. Reps enter minimal address info and get a compliant pre-door briefing with confidence-scored ownership, property characteristics, and product opportunity. Fully integrated with existing nav, theme, Supabase auth, RLS, and the Close Engine handoff.

---

### 1. Navigation & entry point

- New route: `/property-intelligence` (also aliased `/pi`).
- Add a **Property Intel** item to `AppHeader` main nav (with Search icon), between Pipeline and Deals.
- Mobile bottom-safe CTA on the deal detail page: **"Run Property Intel"** that pre-fills the deal address.

### 2. Screens (mobile-first, dark theme, reuse existing tokens)

**A. Property Search screen** (`src/pages/PropertyIntel.tsx`)
- Address input (autocomplete via Google Maps Places — already connected)
- Buttons: Use Current Location · Drop Map Pin · Scan/Paste Parcel · Upload Photo
- Recent Searches list (from `properties` table, scoped to user)
- Primary CTA: **Analyze Property**

**B. Result view** (`src/components/property-intel/PropertyIntelReport.tsx`)
Stacked mobile cards, tabbed on desktop:
1. **Property Match** — address, parcel, type, coords, sources, match %.
2. **Owner & Buyer Intelligence** — recorded owner, tax mailing, ownership type, most-recent-recorded-sale, "Likely current homeowner" with expandable **Why this confidence?** panel.
3. **Property Info** — year built, sqft, lot, stories, bed/bath, values, roof material/age (estimated flag), exterior, solar, permits, exposure.
4. **Product Opportunity** — primary + secondary product, opportunity score, recommendation confidence, reasons, missing info, suggested inspection focus.
5. **Pre-Door Brief** — 20-second card, name-suppressed opener when name confidence < 75%.
6. **Rep Actions bar** — Confirm/Correct name · Mark Renter/Vacant/Owner-Occupied · Add to Route · Start Door Convo · Create Appointment · Start Inspection · Add Notes · Upload Photos · Mark Do Not Knock · Launch Close Engine.

### 3. Confidence framework

Shared util `src/lib/propertyIntel/confidence.ts`:
- Percentage + label (Very High / High / Moderate / Low / Very Low).
- Separate scorers for property match, owner, buyer, occupancy, roof age, opportunity, overall.
- Each returns `{ score, label, reasons[], conflicts[] }` used by the "Why this confidence?" panel.
- Opportunity score kept strictly separate from confidence score.

### 4. Provider adapters (mock-first, swap-in real APIs later)

`src/lib/propertyIntel/providers/`
- `assessor.ts`, `recorder.ts`, `parcelGis.ts`, `licensed.ts` (ATTOM/Regrid/CoreLogic/DataTree stubs), `permits.ts`, `weather.ts` (NOAA stub), `imagery.ts`.
- Each exports a typed interface + a `mock` implementation returning **clearly labeled demo data** for Phoenix addresses (fictional owners like "Maria & David Sanchez").
- Real calls will live behind an edge function so keys never hit the browser.

### 5. Edge function

`supabase/functions/property-intel/index.ts`
- Verifies JWT, validates input with Zod, calls provider adapters server-side, merges results, computes confidences, writes to `properties` + related tables, returns full report.
- Uses only the demo adapters for now; leaves TODO markers with required secret names (`ATTOM_API_KEY`, `REGRID_API_KEY`, `CORELOGIC_API_KEY`, `DATATREE_API_KEY`).

### 6. Data model (Supabase migration)

New tables, all with RLS + GRANTs:

- `properties`
- `property_ownership_records`
- `property_sale_records`
- `property_identity_assessments`
- `property_intelligence`
- `opportunity_scores`
- `property_confirmations` (rep-overridden values, never overwrites source records)
- `suppressions` (Do-Not-Knock enforcement)
- `pi_audit_logs` (renamed to avoid clashing with existing audit patterns)

RLS: reps see rows they created or that belong to their org; admins see all (reuse `has_role`). `suppressions` are enforced at query time — properties with an active DNK suppression cannot be added to routes.

Compliance guardrails encoded in schema:
- No columns for credit, income, DTI, protected-class attributes.
- All estimated fields carry an `is_estimated boolean`.

### 7. Integration with existing DCE

- **Deals**: "Add to Route" creates a `deals` row (stage=`inspecting`) linked to the property; opens the existing deal editor.
- **Inspection**: "Start Inspection" navigates to the deal's Inspection tab with property context prefilled.
- **Close Engine**: "Launch Close Engine" opens `/` with `activeDealId` set.
- **Do Not Knock**: blocks the "Add to Route" and "Start Door Conversation" buttons and surfaces a red banner.

### 8. Compliance copy library

`src/lib/propertyIntel/copy.ts` — canonical strings for "Recorded owner", "Likely owner occupied", "Ownership not confirmed", low-confidence opener fallback, etc. Feeds `useT` translations so the module supports EN/ES like the rest of the app.

### 9. Demo workflow

Ships with seeded Phoenix fictional addresses (`85003`, `85018`, `85032`) rendered by the mock providers so the exact acceptance-criteria demo runs end-to-end without live credentials. Every demo card carries a **"Demo data"** badge.

### 10. Out of scope for this initial build

- Live ATTOM/Regrid/CoreLogic/DataTree calls (stubs + secret placeholders only)
- Rate limiting (documented as follow-up per platform guidance)
- Route optimization algorithms (button hands off to existing Pipeline map)

---

### Files created / modified (technical)

**New**
- `src/pages/PropertyIntel.tsx`
- `src/components/property-intel/PropertySearch.tsx`
- `src/components/property-intel/PropertyIntelReport.tsx`
- `src/components/property-intel/OwnerBuyerCard.tsx`
- `src/components/property-intel/ConfidenceBadge.tsx`
- `src/components/property-intel/WhyConfidencePanel.tsx`
- `src/components/property-intel/PropertyInfoCard.tsx`
- `src/components/property-intel/OpportunityCard.tsx`
- `src/components/property-intel/PreDoorBrief.tsx`
- `src/components/property-intel/RepActionsBar.tsx`
- `src/lib/propertyIntel/confidence.ts`
- `src/lib/propertyIntel/copy.ts`
- `src/lib/propertyIntel/providers/*.ts`
- `src/hooks/usePropertyIntel.ts`
- `supabase/functions/property-intel/index.ts`
- Supabase migration for the 9 tables + RLS + GRANTs + triggers

**Modified**
- `src/App.tsx` — add route
- `src/components/AppHeader.tsx` — add nav entry
- `src/pages/Index.tsx` / deal detail — add "Run Property Intel" CTA

Please confirm and I'll build it.
