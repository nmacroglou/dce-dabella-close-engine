import { useState } from "react";
import { Plus, X, RotateCcw, ListChecks, Copy } from "lucide-react";
import { DEFAULT_FEATURE_TEXTS } from "./constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type OptKey = "A" | "B" | "C";

interface Props {
  /** Legacy shared list (fallback default for any option that hasn't been customized) */
  value: string[] | undefined;
  onChange: (next: string[]) => void;
  perOption: Record<OptKey, string[] | undefined>;
  onChangePerOption: (key: OptKey, next: string[]) => void;
}

export default function IncludedFeaturesEditor({ value, onChange, perOption, onChangePerOption }: Props) {
  const [tab, setTab] = useState<OptKey>("A");
  const sharedDefault = value && value.length > 0 ? value : DEFAULT_FEATURE_TEXTS;

  return (
    <div className="card-elevated-lg p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" /> What's included
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Customize the bullets shown for each option independently. Untouched options inherit the shared list.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as OptKey)}>
        <TabsList className="grid grid-cols-4 w-full mb-4">
          <TabsTrigger value="A">Option A</TabsTrigger>
          <TabsTrigger value="B">Option B</TabsTrigger>
          <TabsTrigger value="C">Option C</TabsTrigger>
          <TabsTrigger value="shared">Shared default</TabsTrigger>
        </TabsList>

        {(["A", "B", "C"] as OptKey[]).map((k) => (
          <TabsContent key={k} value={k}>
            <FeatureList
              features={perOption[k] ?? sharedDefault}
              onChange={(next) => onChangePerOption(k, next)}
              onResetToShared={() => onChangePerOption(k, [...sharedDefault])}
              onCopyFromShared={() => onChangePerOption(k, [...sharedDefault])}
              optionLabel={`Option ${k}`}
            />
          </TabsContent>
        ))}

        <TabsContent value="shared">
          <FeatureList
            features={sharedDefault}
            onChange={onChange}
            onResetToShared={() => onChange([...DEFAULT_FEATURE_TEXTS])}
            optionLabel="Shared default"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureList({
  features, onChange, onResetToShared, onCopyFromShared, optionLabel,
}: {
  features: string[];
  onChange: (next: string[]) => void;
  onResetToShared: () => void;
  onCopyFromShared?: () => void;
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
        <div className="flex items-center gap-2">
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
            <RotateCcw className="h-3.5 w-3.5" /> Reset
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
