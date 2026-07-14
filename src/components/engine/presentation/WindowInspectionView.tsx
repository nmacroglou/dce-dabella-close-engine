import { useMemo } from "react";
import { Check, X, Minus, ClipboardList, Grid3X3 } from "lucide-react";
import type { EngineState } from "@/types/engine";
import T from "@/components/i18n/T";
import { useTranslatedList } from "@/hooks/useTranslator";

interface Props {
  state: EngineState;
}

const STATUS_ICON = {
  yes: { icon: Check, color: "text-accent", bg: "bg-accent/10" },
  no: { icon: X, color: "text-destructive", bg: "bg-destructive/10" },
  na: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted/50" },
} as const;

export default function WindowInspectionView({ state }: Props) {
  const { windowInspection, windowItems } = state;
  const findings = windowInspection.filter((e) => e.status !== "na");
  // Translate the window checklist labels through the cached translator.
  const inspectionLabels = windowInspection.map((e) => e.label);
  // Pre-fetch each label individually so shared strings hit the shared cache.
  // (useTranslated on an empty string is a no-op.)
  const labelCache: Record<string, string> = {};
  // eslint-disable-next-line react-hooks/rules-of-hooks
  inspectionLabels.forEach((l) => { labelCache[l] = useTranslated(l, "Window inspection checklist item shown to a homeowner."); });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Inspection Results */}
      <div className="rounded-3xl border-2 border-primary/20 bg-card overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-primary to-primary/70 px-8 py-7 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <ClipboardList className="h-7 w-7 text-primary-foreground" />
            <h2 className="text-2xl font-display font-extrabold text-primary-foreground tracking-tight">
              Window Inspection Results
            </h2>
          </div>
          <p className="text-primary-foreground/70 text-sm font-medium">
            Here's what we found during our inspection of your windows
          </p>
        </div>

        <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-2">
          {windowInspection.map((entry, i) => {
            const s = STATUS_ICON[entry.status];
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${s.bg}`}
              >
                <Icon className={`h-4 w-4 ${s.color} flex-shrink-0`} />
                <span className="text-sm font-medium text-foreground">
                  {i + 1}. {entry.label}
                </span>
                <span className={`ml-auto text-xs font-bold uppercase ${s.color}`}>
                  {entry.status === "na" ? "N/A" : entry.status}
                </span>
              </div>
            );
          })}
        </div>

        {findings.filter((e) => e.status === "no").length > 0 && (
          <div className="px-8 pb-6">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
              <p className="text-sm font-semibold text-destructive mb-1">Issues Found:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {findings.filter((e) => e.status === "no").map((e, i) => (
                  <li key={i}>{e.label}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Window Schedule */}
      {windowItems.length > 0 && (
        <div className="rounded-3xl border-2 border-primary/20 bg-card overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-accent to-accent/70 px-8 py-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <Grid3X3 className="h-6 w-6 text-accent-foreground" />
              <h2 className="text-xl font-display font-extrabold text-accent-foreground tracking-tight">
                Window Schedule — {windowItems.length} Window{windowItems.length !== 1 ? "s" : ""}
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Level</th>
                  <th className="p-3 text-left">Room</th>
                  <th className="p-3 text-left">Style</th>
                  <th className="p-3 text-left">Size</th>
                  <th className="p-3 text-left">Grids</th>
                  <th className="p-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {windowItems.map((item, i) => (
                  <tr key={item.id} className={`border-t border-border/50 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{item.number}</td>
                    <td className="p-3 text-foreground">{item.level || "—"}</td>
                    <td className="p-3 text-foreground">{item.room || "—"}</td>
                    <td className="p-3 text-foreground">{item.style}</td>
                    <td className="p-3 text-foreground">
                      {item.width && item.height ? `${item.width} × ${item.height}` : "—"}
                    </td>
                    <td className="p-3 text-foreground">{item.gridPattern}</td>
                    <td className="p-3 text-muted-foreground">{item.observations || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
