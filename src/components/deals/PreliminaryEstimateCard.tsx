import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Camera, Loader2, Trash2, Save, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { fmt } from "@/lib/format";
import {
  ACCESSORIES,
  SHINGLE_LINES,
  computeEstimate,
  unitLabel,
  type PreliminaryEstimateInput,
} from "@/data/roofingPricing";
import { useUpdateDeal } from "@/hooks/useDeals";
import { useDealPhotos, useUploadDealPhoto, useDeleteDealPhoto } from "@/hooks/useDealPhotos";
import { toast } from "sonner";

interface Props {
  dealId: string;
  initial?: Partial<PreliminaryEstimateInput>;
}

const empty: PreliminaryEstimateInput = {
  squares: 0,
  shingleId: null,
  accessories: {},
  hasSolar: false,
  notes: "",
};

export default function PreliminaryEstimateCard({ dealId, initial }: Props) {
  const [state, setState] = useState<PreliminaryEstimateInput>({ ...empty, ...(initial ?? {}) });
  const [dirty, setDirty] = useState(false);
  const update = useUpdateDeal();
  const { data: photos = [] } = useDealPhotos(dealId);
  const upload = useUploadDealPhoto();
  const del = useDeleteDealPhoto();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setState({ ...empty, ...(initial ?? {}) });
    setDirty(false);
  }, [dealId, initial]);

  const breakdown = useMemo(() => computeEstimate(state), [state]);

  const patch = (p: Partial<PreliminaryEstimateInput>) => {
    setState((s) => ({ ...s, ...p }));
    setDirty(true);
  };

  const toggleAcc = (id: string, on: boolean) => {
    const def = ACCESSORIES.find((a) => a.id === id)?.defaultQty ?? 1;
    setState((s) => ({ ...s, accessories: { ...s.accessories, [id]: on ? def || 1 : 0 } }));
    setDirty(true);
  };

  const setAccQty = (id: string, qty: number) => {
    setState((s) => ({ ...s, accessories: { ...s.accessories, [id]: Math.max(0, qty) } }));
    setDirty(true);
  };

  const save = async () => {
    await update.mutateAsync({
      id: dealId,
      updates: { preliminary_estimate: state } as never,
    });
    setDirty(false);
    toast.success("Preliminary estimate saved");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is over 10MB`);
        continue;
      }
      await upload.mutateAsync({ dealId, file });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="card-premium p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-brand shadow-[var(--shadow-glow)] flex items-center justify-center">
            <Calculator className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-lg gradient-text">Preliminary roof estimate</h3>
            <p className="text-xs text-muted-foreground">
              Quick number for shoppers & hostile homeowners — before the full HOVER comes back.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={save} disabled={!dirty || update.isPending} className="pressable">
          {update.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
      </div>

      {/* Range output */}
      <div className="rounded-xl border border-hairline-strong bg-muted/40 p-4">
        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
          Estimated project price range
        </div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="num-display text-3xl font-extrabold gradient-text">{fmt(breakdown.low)}</span>
          <span className="text-muted-foreground text-sm">—</span>
          <span className="num-display text-3xl font-extrabold text-foreground">{fmt(breakdown.high)}</span>
          <span className="text-[11px] text-muted-foreground ml-auto">
            High = raw +{breakdown.bufferPct}% (margin{state.hasSolar ? " + solar/obstruction" : ""})
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
          <div>Shingle: <span className="text-foreground font-medium">{fmt(breakdown.shingleCost)}</span></div>
          <div>Accessories: <span className="text-foreground font-medium">{fmt(breakdown.accessoriesCost)}</span></div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider">Roof squares (SQ)</Label>
          <Input
            type="number"
            min={0}
            step="0.5"
            value={state.squares || ""}
            onChange={(e) => patch({ squares: parseFloat(e.target.value) || 0 })}
            placeholder="e.g. 30"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider">Shingle product</Label>
          <Select
            value={state.shingleId ?? ""}
            onValueChange={(v) => patch({ shingleId: v || null })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a shingle line" />
            </SelectTrigger>
            <SelectContent>
              {SHINGLE_LINES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label} — {fmt(s.pricePerSq)}/SQ
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Solar toggle */}
      <div className="flex items-center justify-between rounded-xl border border-hairline bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Zap className="h-4 w-4 text-warning" />
          <div>
            <div className="text-sm font-semibold text-foreground">Solar panels / obstructions present</div>
            <div className="text-[11px] text-muted-foreground">Adds another +10% to the high end for removal & remount.</div>
          </div>
        </div>
        <Switch checked={state.hasSolar} onCheckedChange={(v) => patch({ hasSolar: v })} />
      </div>

      {/* Accessories */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Accessories
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ACCESSORIES.map((acc) => {
            const qty = state.accessories[acc.id] ?? 0;
            const on = qty > 0;
            return (
              <div
                key={acc.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  on ? "border-primary/40 bg-primary/5" : "border-hairline bg-card"
                }`}
              >
                <Checkbox checked={on} onCheckedChange={(v) => toggleAcc(acc.id, !!v)} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{acc.label}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {fmt(acc.price)} {unitLabel(acc.unit)}
                  </div>
                </div>
                {on && acc.unit !== "flat" && (
                  <Input
                    type="number"
                    min={0}
                    value={qty}
                    onChange={(e) => setAccQty(acc.id, parseFloat(e.target.value) || 0)}
                    className="w-16 h-8 text-xs"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider">Estimate notes</Label>
        <Textarea
          value={state.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Anything that affects the number — multiple layers, steep pitch, access issues, customer mood…"
          rows={3}
        />
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider">Photos ({photos.length})</Label>
          <Button
            size="sm"
            variant="outline"
            className="pressable"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-1" />
            )}
            Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden border border-hairline bg-muted">
                {p.signedUrl ? (
                  <img src={p.signedUrl} alt={p.caption ?? "Deal photo"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">…</div>
                )}
                <button
                  onClick={() => del.mutate(p)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            No photos yet. Snap the roof, obstructions, or anything that affects the number.
          </p>
        )}
      </div>
    </div>
  );
}
