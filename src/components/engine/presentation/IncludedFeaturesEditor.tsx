import { useState } from "react";
import { Plus, X, RotateCcw, ListChecks } from "lucide-react";
import { DEFAULT_FEATURE_TEXTS } from "./constants";

interface Props {
  value: string[] | undefined;
  onChange: (next: string[]) => void;
}

export default function IncludedFeaturesEditor({ value, onChange }: Props) {
  const features = value && value.length > 0 ? value : DEFAULT_FEATURE_TEXTS;
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
  const reset = () => onChange([...DEFAULT_FEATURE_TEXTS]);

  return (
    <div className="card-elevated-lg p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" /> What's included
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Customize the bullets shown on every option card for this customer.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
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
      </div>

      <div className="flex items-center gap-2 mt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add a custom inclusion (e.g. Lifetime gutter guard)"
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
