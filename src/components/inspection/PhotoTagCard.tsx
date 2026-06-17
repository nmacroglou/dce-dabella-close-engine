import { memo, useState } from "react";
import { Sparkles, X, Loader2, Trash2, Wand2 } from "lucide-react";
import type { DealPhoto } from "@/hooks/useDealPhotos";
import { useDeleteDealPhoto } from "@/hooks/useDealPhotos";
import { useAnalyzePhoto, useUpdatePhotoTags } from "@/hooks/useInspection";
import type { InspectionReportType } from "@/data/inspectionTemplates";
import { prettyTag, SEVERITY_LABEL } from "@/data/inspectionTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  photo: DealPhoto & {
    inspection_tags?: string[];
    severity?: "low" | "moderate" | "high" | null;
    include_in_report?: boolean;
    inspection_report_type?: InspectionReportType | null;
  };
  reportType: InspectionReportType;
}

const SEV_TONE: Record<"low" | "moderate" | "high", string> = {
  low: "bg-muted text-muted-foreground border-border",
  moderate: "bg-primary/10 text-primary border-primary/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};

function PhotoTagCardImpl({ photo, reportType }: Props) {
  const analyze = useAnalyzePhoto();
  const update = useUpdatePhotoTags();
  const del = useDeleteDealPhoto();

  const tags = photo.inspection_tags ?? [];
  const severity = photo.severity ?? null;
  const include = photo.include_in_report ?? true;
  const caption = photo.caption ?? "";

  const [newTag, setNewTag] = useState("");

  async function handleAnalyze() {
    const res = await analyze.mutateAsync({
      photo_id: photo.id,
      storage_path: photo.storage_path,
      report_type: reportType,
    });
    await update.mutateAsync({
      photo_id: photo.id,
      deal_id: photo.deal_id,
      patch: {
        inspection_tags: res.tags,
        severity: res.severity,
        caption: res.caption,
        inspection_report_type: reportType,
      },
    });
  }

  async function handleCaptionOnly() {
    const res = await analyze.mutateAsync({
      photo_id: photo.id,
      storage_path: photo.storage_path,
      report_type: reportType,
    });
    await update.mutateAsync({
      photo_id: photo.id,
      deal_id: photo.deal_id,
      patch: { caption: res.caption },
    });
  }

  function patch(p: Parameters<typeof update.mutateAsync>[0]["patch"]) {
    update.mutate({ photo_id: photo.id, deal_id: photo.deal_id, patch: p });
  }

  function addTag() {
    const t = newTag.trim().toLowerCase().replace(/\s+/g, "_");
    if (!t || tags.includes(t)) return;
    patch({ inspection_tags: [...tags, t] });
    setNewTag("");
  }

  function removeTag(t: string) {
    patch({ inspection_tags: tags.filter((x) => x !== t) });
  }

  return (
    <div className="card-premium p-3 flex flex-col gap-3">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        {photo.signedUrl ? (
          <img src={photo.signedUrl} alt={caption || "Inspection photo"} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>
        )}
        {severity && (
          <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${SEV_TONE[severity]}`}>
            {SEVERITY_LABEL[severity]}
          </span>
        )}
      </div>

      <Input
        placeholder="Caption (one factual sentence)"
        value={caption}
        onChange={(e) => patch({ caption: e.target.value })}
        className="h-8 text-xs"
      />

      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            {prettyTag(t)}
            <button onClick={() => removeTag(t)} className="opacity-60 hover:opacity-100" aria-label={`Remove ${t}`}>
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="+ tag"
          className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-border bg-transparent w-16 outline-none focus:border-primary"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={severity ?? "unset"}
          onValueChange={(v) => patch({ severity: v === "unset" ? null : (v as "low" | "moderate" | "high") })}
        >
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">Severity…</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-auto">
          <Switch checked={include} onCheckedChange={(v) => patch({ include_in_report: v })} />
          Include
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-xs"
          onClick={handleAnalyze}
          disabled={analyze.isPending}
        >
          {analyze.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
          {tags.length === 0 ? "Auto-tag" : "Re-analyze"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => { if (confirm("Delete this photo?")) del.mutate(photo); }}
          aria-label="Delete photo"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

const PhotoTagCard = memo(PhotoTagCardImpl);
export default PhotoTagCard;
