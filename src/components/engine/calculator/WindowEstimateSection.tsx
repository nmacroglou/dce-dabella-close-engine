import { Plus, Trash2, ClipboardList, Grid3X3, FileCheck } from "lucide-react";
import type { EngineState, EngineUpdater } from "@/types/engine";
import {
  WINDOW_STYLES,
  GRID_PATTERNS,
  WINDOW_INSPECTION_ITEMS,
  WINDOW_SCOPE_ITEMS,
  createEmptyWindowItem,
  type InspectionStatus,
  type WindowLineItem,
} from "@/data/windowData";

interface Props {
  state: EngineState;
  update: EngineUpdater;
}

const STATUS_COLORS: Record<InspectionStatus, string> = {
  yes: "bg-accent text-accent-foreground",
  no: "bg-destructive text-destructive-foreground",
  na: "bg-muted text-muted-foreground",
};

export default function WindowEstimateSection({ state, update }: Props) {
  const { windowInspection, windowItems, windowScopeChecks } = state;

  // --- Inspection helpers ---
  const setInspectionStatus = (index: number, status: InspectionStatus) => {
    const next = [...windowInspection];
    next[index] = { ...next[index], status };
    update("windowInspection", next);
  };

  // --- Window line item helpers ---
  const addWindowItem = () => {
    update("windowItems", [...windowItems, createEmptyWindowItem(windowItems.length + 1)]);
  };

  const removeWindowItem = (id: string) => {
    update(
      "windowItems",
      windowItems.filter((w) => w.id !== id).map((w, i) => ({ ...w, number: i + 1 }))
    );
  };

  const updateWindowItem = (id: string, field: keyof WindowLineItem, value: string) => {
    update(
      "windowItems",
      windowItems.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  // --- United Inches helpers ---
  const parseInches = (v: string): number => {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const unitedInches = (w: WindowLineItem) => parseInches(w.width) + parseInches(w.height);
  const totalUI = windowItems.reduce((sum, w) => sum + unitedInches(w), 0);
  const totalWindows = windowItems.length;
  const avgUI = totalWindows ? Math.round(totalUI / totalWindows) : 0;

  // --- Scope helpers ---
  const toggleScope = (index: number) => {
    const next = [...windowScopeChecks];
    next[index] = !next[index];
    update("windowScopeChecks", next);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Inspection Checklist */}
      <div>
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" /> Window Inspection Checklist
        </h4>
        <p className="text-[11px] text-muted-foreground mb-4">
          "Let's go through each item from the inspection. I'll mark what we found during the walkthrough."
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {windowInspection.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50"
            >
              <span className="text-sm text-foreground font-medium">
                {i + 1}. {entry.label}
              </span>
              <div className="flex gap-1">
                {(["yes", "no", "na"] as InspectionStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setInspectionStatus(i, s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      entry.status === s
                        ? STATUS_COLORS[s]
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {s === "na" ? "N/A" : s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Window Schedule */}
      <div>
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-primary" /> Window Schedule
        </h4>
        <p className="text-[11px] text-muted-foreground mb-4">
          "Now let's document each window — room by room. This ensures every opening is measured and accounted for."
        </p>

        {windowItems.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-2 text-left w-10">#</th>
                  <th className="p-2 text-left">Level</th>
                  <th className="p-2 text-left">Room</th>
                  <th className="p-2 text-left">Style</th>
                  <th className="p-2 text-left">W</th>
                  <th className="p-2 text-left">H</th>
                  <th className="p-2 text-left">UI</th>
                  <th className="p-2 text-left">Grids</th>
                  <th className="p-2 text-left">Notes</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {windowItems.map((item) => (
                  <tr key={item.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="p-2 text-muted-foreground font-mono text-xs">{item.number}</td>
                    <td className="p-2">
                      <input
                        value={item.level}
                        onChange={(e) => updateWindowItem(item.id, "level", e.target.value)}
                        placeholder="1st"
                        className="w-14 bg-transparent border-b border-border/50 focus:border-primary outline-none text-sm px-1 py-0.5"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={item.room}
                        onChange={(e) => updateWindowItem(item.id, "room", e.target.value)}
                        placeholder="Living"
                        className="w-20 bg-transparent border-b border-border/50 focus:border-primary outline-none text-sm px-1 py-0.5"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.style}
                        onChange={(e) => updateWindowItem(item.id, "style", e.target.value)}
                        className="bg-transparent border-b border-border/50 focus:border-primary outline-none text-sm px-1 py-0.5"
                      >
                        {WINDOW_STYLES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        value={item.width}
                        onChange={(e) => updateWindowItem(item.id, "width", e.target.value)}
                        placeholder='36"'
                        className="w-14 bg-transparent border-b border-border/50 focus:border-primary outline-none text-sm px-1 py-0.5"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={item.height}
                        onChange={(e) => updateWindowItem(item.id, "height", e.target.value)}
                        placeholder='48"'
                        className="w-14 bg-transparent border-b border-border/50 focus:border-primary outline-none text-sm px-1 py-0.5"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.gridPattern}
                        onChange={(e) => updateWindowItem(item.id, "gridPattern", e.target.value)}
                        className="bg-transparent border-b border-border/50 focus:border-primary outline-none text-sm px-1 py-0.5"
                      >
                        {GRID_PATTERNS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        value={item.observations}
                        onChange={(e) => updateWindowItem(item.id, "observations", e.target.value)}
                        placeholder="Notes..."
                        className="w-24 bg-transparent border-b border-border/50 focus:border-primary outline-none text-sm px-1 py-0.5"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => removeWindowItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={addWindowItem}
          className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Add Window
        </button>
      </div>

      {/* Window Scope of Work */}
      <div>
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-accent" /> Window Scope of Work
        </h4>
        <p className="text-[11px] text-muted-foreground mb-4">
          "Here's what happens from start to finish — so you know exactly what to expect."
        </p>
        <div className="space-y-1">
          {WINDOW_SCOPE_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleScope(i)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                windowScopeChecks[i] ? "bg-accent/8" : "hover:bg-muted/50"
              }`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  windowScopeChecks[i] ? "bg-accent border-accent" : "border-border"
                }`}
              >
                {windowScopeChecks[i] && (
                  <span className="text-accent-foreground text-xs font-bold">✓</span>
                )}
              </div>
              <span
                className={`text-sm font-medium leading-snug ${
                  windowScopeChecks[i] ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
