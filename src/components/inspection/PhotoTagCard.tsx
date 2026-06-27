import { memo, useEffect, useRef, useState } from "react";
import { Sparkles, X, Trash2, Wand2 } from "lucide-react";
import type { DealPhoto } from "@/hooks/useDealPhotos";
import { useDeleteDealPhoto } from "@/hooks/useDealPhotos";
import { useAnalyzePhoto, useUpdatePhotoTags } from "@/hooks/useInspection";
import type { InspectionReportType } from "@/data/inspectionTemplates";
import { prettyTag, SEVERITY_LABEL } from "@/data/inspectionTemplates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  stuccoFinish?: string | null;
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
  const dbCaption = photo.caption ?? "";

  // Local caption state so typing stays snappy on the tablet and the wand can use the in-progress text.
  const [caption, setCaption] = useState(dbCaption);
  const [newTag, setNewTag] = useState("");
  // Per-photo cancel flag: when the user clicks the X mid-flight we ignore the
  // returned result instead of writing it back to the photo.
  const cancelRef = useRef(false);

  // Pull in updates from the server when not actively editing the same value.
  useEffect(() => {
    setCaption((prev) => (prev === dbCaption ? prev : dbCaption));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbCaption]);

  function commitCaption(next: string) {
    if (next === dbCaption) return;
    patch({ caption: next });
  }

  function cancelAnalyze() {
    cancelRef.current = true;
  }

  async function handleAnalyze() {
    cancelRef.current = false;
    try {
      const res = await analyze.mutateAsync({
        photo_id: photo.id,
        storage_path: photo.storage_path,
        report_type: reportType,
        user_hint: caption.trim() || undefined,
        existing_tags: tags,
      });
      if (cancelRef.current) return;
      setCaption(res.caption);
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
    } catch {
      /* toast handled in hook */
    }
  }

  async function handleCaptionOnly() {
    cancelRef.current = false;
    try {
      const res = await analyze.mutateAsync({
        photo_id: photo.id,
        storage_path: photo.storage_path,
        report_type: reportType,
        user_hint: caption.trim() || undefined,
        existing_tags: tags,
      });
      if (cancelRef.current) return;
      setCaption(res.caption);
      await update.mutateAsync({
        photo_id: photo.id,
        deal_id: photo.deal_id,
        patch: { caption: res.caption },
      });
    } catch {
      /* toast handled in hook */
    }
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

      <div className="flex items-start gap-2">
        <Textarea
          placeholder="Type what you see — the wand will refine it with the photo."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={(e) => commitCaption(e.target.value)}
          rows={3}
          className="flex-1 min-h-[72px] text-sm leading-snug resize-y"
        />
        <Button
          size="sm"
          variant={analyze.isPending ? "destructive" : "secondary"}
          className="h-10 w-10 p-0 shrink-0"
          onClick={analyze.isPending ? cancelAnalyze : handleCaptionOnly}
          title={
            analyze.isPending
              ? "Cancel — discard this AI run"
              : caption.trim() ? "Refine my note with the photo" : "AI write caption from photo"
          }
        >
          {analyze.isPending ? <X className="h-4 w-4" /> : <Wand2 className="h-4 w-4 text-primary" />}
        </Button>
      </div>


      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary">
            {prettyTag(t)}
            <button onClick={() => removeTag(t)} className="opacity-60 hover:opacity-100 p-0.5" aria-label={`Remove ${t}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onBlur={() => { if (newTag.trim()) addTag(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="+ add tag"
          className="text-xs px-2 py-1 h-8 rounded border border-dashed border-border bg-transparent w-28 outline-none focus:border-primary"
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
          variant={analyze.isPending ? "destructive" : "outline"}
          className="flex-1 h-8 text-xs"
          onClick={analyze.isPending ? cancelAnalyze : handleAnalyze}
        >
          {analyze.isPending
            ? <><X className="h-3 w-3 mr-1.5" />Cancel</>
            : <><Sparkles className="h-3 w-3 mr-1.5" />{tags.length === 0 ? "Auto-tag" : "Re-analyze"}</>}
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
