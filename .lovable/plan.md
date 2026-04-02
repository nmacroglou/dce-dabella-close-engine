## Windows Estimate Feature

### 1. Data Model (`src/types/engine.ts`)
Add window-specific fields to `EngineState`:
- `windowInspection`: array of 14 inspection items with yes/no/na status
- `windowItems`: array of window line items (number, level, room, style, dimensions, grids, obs, etc.)
- `windowScopeChecks`: object tracking scope of work checkboxes (reasons, company, frame, warranty, glass, plus the process steps)

### 2. Window Data Constants (`src/data/windowData.ts`)
- Window styles list (CO/Casement, Picture, Awning, Twin-Casement, Triple-Casement, Bay, Bow, Garden, Sliding Patio Door, Double Hung, 2-Lite Slider, 3-Lite End Vent, Welded Dead Lite, Hopper)
- Inspection checklist items (14 items from the form)
- Grid patterns (Colonial, Perimeter, Prairie)
- Window scope of work steps

### 3. Calculator Section (`src/components/engine/calculator/WindowEstimateSection.tsx`)
- Only visible when `state.product === "Windows"`
- **Inspection Checklist** — 14-item yes/no checklist
- **Window Schedule** — table to add/edit window line items (number, level, room, style, color, dimensions, grids, observations)
- **Scope of Work** — checkbox items for window-specific scope

### 4. Presentation Integration
- **New stage** in `CustomerPresentationView`: "Window Inspection" page showing the inspection results and window schedule
- **Merged into existing**: Window scope items replace roofing scope items when product is Windows

### 5. PDF Export
- Add a "Window Inspection" page to the PDF with inspection results table and window schedule
- Update scope page to use window-specific scope items when applicable

### Files to create/modify:
- `src/types/engine.ts` — add window fields
- `src/data/windowData.ts` — new constants
- `src/components/engine/calculator/WindowEstimateSection.tsx` — new component
- `src/components/engine/CalculatorTab.tsx` — import & render window section
- `src/hooks/useCloseEngine.ts` — add default state
- `src/components/engine/CustomerPresentationView.tsx` — add window stage
- `src/data/scopeItems.ts` — add window scope items
- `src/lib/exportPdf.ts` — add window inspection PDF page
