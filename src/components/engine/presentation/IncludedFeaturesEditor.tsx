import { useState } from "react";
import { Plus, X, RotateCcw, ListChecks, Copy, Home, AppWindow, Layers, Bath } from "lucide-react";
import { getDefaultFeatureTexts, type RoofMaterial } from "./constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type OptKey = "A" | "B" | "C";

interface Props {
  /** Legacy shared list (fallback default for any option that hasn't been customized) */
  value: string[] | undefined;
  onChange: (next: string[]) => void;
  perOption: Record<OptKey, string[] | undefined>;
  onChangePerOption: (key: OptKey, next: string[]) => void;
  products?: string[];
  roofMaterial?: RoofMaterial;
  onChangeRoofMaterial?: (next: RoofMaterial) => void;
}

export default function IncludedFeaturesEditor({
  value, onChange, perOption, onChangePerOption,
  products, roofMaterial, onChangeRoofMaterial,
}: Props) {
  const [tab, setTab] = useState<OptKey | "shared">("A");
  const computedDefaultA = getDefaultFeatureTexts(products, roofMaterial, "A");
  const computedDefaultB = getDefaultFeatureTexts(products, roofMaterial, "B");
  const computedDefaultC = getDefaultFeatureTexts(products, roofMaterial, "C");
  const sharedDefault = value && value.length > 0 ? value : computedDefaultA;

  const hasRoofing = (products ?? []).some((p) => p.toLowerCase().includes("roof"));
  const hasWindows = (products ?? []).some((p) => p.toLowerCase().includes("window"));
  const hasSiding = (products ?? []).some((p) => p.toLowerCase().includes("siding"));
  const hasBath = (products ?? []).some((p) => p.toLowerCase().includes("bath"));
  const showWindowsBadge = hasWindows && !hasRoofing;
  const showSidingBadge = hasSiding && !hasRoofing && !hasWindows;
  const showBathBadge = hasBath && !hasRoofing && !hasWindows && !hasSiding;

  return (
    <div className="card-elevated-lg p-6">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" /> What's included
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Defaults adapt to the job type{hasRoofing ? " and roof material" : showWindowsBadge ? " and window series" : showSidingBadge ? " and siding collection" : showBathBadge ? " and bath series" : ""}. Customize per option as needed.
          </p>
        </div>

        {hasRoofing && onChangeRoofMaterial && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-1">
            <Home className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Roof</span>
            {(["shingle", "tile", "tpo"] as RoofMaterial[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChangeRoofMaterial(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition-colors ${
                  (roofMaterial ?? "shingle") === m
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "tpo" ? "TPO (Flat)" : m === "shingle" ? "Asphalt" : "Tile"}
              </button>
            ))}
          </div>
        )}

        {showWindowsBadge && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-1">
            <AppWindow className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Windows</span>
            {(["A", "B", "C"] as OptKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition-colors ${
                  tab === k
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k === "A" ? "Glasswing Triple" : k === "B" ? "Glasswing Double" : "Fairfield"}
              </button>
            ))}
          </div>
        )}

        {showSidingBadge && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-1">
            <Layers className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hardie</span>
            {(["A", "B", "C"] as OptKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition-colors ${
                  tab === k
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k === "A" ? "Statement" : k === "B" ? "Dream" : "Foundation"}
              </button>
            ))}
          </div>
        )}
      </div>


      <Tabs value={tab} onValueChange={(v) => setTab(v as OptKey | "shared")}>
        <TabsList className="grid grid-cols-4 w-full mb-4">
          <TabsTrigger value="A">Option A</TabsTrigger>
          <TabsTrigger value="B">Option B</TabsTrigger>
          <TabsTrigger value="C">Option C</TabsTrigger>
          <TabsTrigger value="shared">Shared default</TabsTrigger>
        </TabsList>

        {(["A", "B", "C"] as OptKey[]).map((k) => {
          const others = (["A", "B", "C"] as OptKey[]).filter((o) => o !== k);
          const optionDefault =
            k === "A" ? computedDefaultA :
            k === "B" ? computedDefaultB :
            computedDefaultC;
          return (
            <TabsContent key={k} value={k}>
              <FeatureList
                features={perOption[k] ?? optionDefault}
                onChange={(next) => onChangePerOption(k, next)}
                onResetToShared={() => onChangePerOption(k, [...optionDefault])}
                onCopyFromShared={() => onChangePerOption(k, [...sharedDefault])}
                onCopyToOthers={() => {
                  const src = perOption[k] ?? optionDefault;
                  others.forEach((o) => onChangePerOption(o, [...src]));
                }}
                copyToOthersLabel={`Copy to ${others.join(" & ")}`}
                optionLabel={`Option ${k}`}
              />
            </TabsContent>
          );
        })}

        <TabsContent value="shared">
          <FeatureList
            features={sharedDefault}
            onChange={onChange}
            onResetToShared={() => onChange([...computedDefaultA])}
            optionLabel="Shared default"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureList({
  features, onChange, onResetToShared, onCopyFromShared, onCopyToOthers, copyToOthersLabel, optionLabel,
}: {
  features: string[];
  onChange: (next: string[]) => void;
  onResetToShared: () => void;
  onCopyFromShared?: () => void;
  onCopyToOthers?: () => void;
  copyToOthersLabel?: string;
  optionLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const update = (i: number, text: string) =>
    onChange(features.map((f, idx) => (idx === i ? text : f)));
  const remove = (i: number) =>
    onChange(features.filter((_, idx) => idx !== i));
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...features, t]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {optionLabel} · {features.length} item{features.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {onCopyToOthers && (
            <button
              type="button"
              onClick={onCopyToOthers}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary transition-colors px-2 py-1 rounded-md border border-primary/30"
            >
              <Copy className="h-3.5 w-3.5" /> {copyToOthersLabel ?? "Copy to others"}
            </button>
          )}
          {onCopyFromShared && (
            <button
              type="button"
              onClick={onCopyFromShared}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5" /> Copy shared
            </button>
          )}
          <button
            type="button"
            onClick={onResetToShared}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to default
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={f}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Remove feature"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {features.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-1">No features yet — add one below.</p>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add an inclusion (e.g. Lifetime gutter guard)"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  );
}
