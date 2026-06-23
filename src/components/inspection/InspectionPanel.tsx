import { useCallback, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Sparkles, FileText, Wand2, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDealPhotos, useUploadDealPhoto } from "@/hooks/useDealPhotos";
import {
  useAnalyzePhoto, useGenerateNarrative, useInspection, useSaveInspection, useUpdatePhotoTags,
} from "@/hooks/useInspection";
import {
  REPORT_TYPE_LABELS, REPORT_TYPE_SHORT, TEMPLATES,
  type InspectionReportType, type InspectionSections,
} from "@/data/inspectionTemplates";
import PhotoTagCard from "./PhotoTagCard";
import { useDeals } from "@/hooks/useDeals";
import ShareInspectionPdfDialog from "./ShareInspectionPdfDialog";
import { toast } from "sonner";


interface Props {
  dealId: string;
}

const REPORT_OPTIONS: InspectionReportType[] = ["roof", "windows", "bath", "siding", "stucco", "paint"];

const SECTION_FIELDS: { key: keyof InspectionSections; label: string }[] = [
  { key: "executive_summary", label: "Executive Summary" },
  { key: "inspection_scope", label: "Inspection Scope" },
  { key: "measurements", label: "Measurements" },
  { key: "professional_opinion", label: "Professional Opinion" },
  { key: "recommended_scope", label: "Recommended Scope" },
  { key: "next_steps", label: "Next Steps" },
  { key: "limitations", label: "Limitations" },
];

export default function InspectionPanel({ dealId }: Props) {
  // Multi-select: rep can pick one or more trades for a single combined report.
  const [reportTypes, setReportTypes] = useState<InspectionReportType[]>(["roof"]);
  const primaryType = reportTypes[0] ?? "roof";

  // Local override for sections so the textarea stays responsive while typing.
  const [draft, setDraft] = useState<InspectionSections | null>(null);

  const toggleReportType = useCallback((rt: InspectionReportType) => {
    setDraft(null);
    setReportTypes((prev) => {
      if (prev.includes(rt)) {
        // Always keep at least one selected.
        const next = prev.filter((t) => t !== rt);
        return next.length ? next : prev;
      }
      return [...prev, rt];
    });
  }, []);

  const { data: deals = [] } = useDeals();
  const deal = useMemo(() => deals.find((d) => d.id === dealId), [deals, dealId]);

  // Sections persist per-primary type. Switching trades re-loads from the primary.
  const { data: inspection } = useInspection(dealId, primaryType);
  const { data: photos = [] } = useDealPhotos(dealId);
  const upload = useUploadDealPhoto();
  const save = useSaveInspection();
  const analyze = useAnalyzePhoto();
  const updatePhoto = useUpdatePhotoTags();
  const generateNarrative = useGenerateNarrative();

  const fileRef = useRef<HTMLInputElement>(null);

  const [tweakOpen, setTweakOpen] = useState(false);
  const [tweakText, setTweakText] = useState("");

  const sections = draft ?? inspection?.sections ?? TEMPLATES[primaryType];

  // Photos are agnostic to report type — every photo on the deal is available
  // regardless of which trades are currently selected.
  const filteredPhotos = photos;

  const setField = useCallback((key: keyof InspectionSections, v: string) => {
    setDraft((prev) => ({ ...(prev ?? sections), [key]: v }));
  }, [sections]);

  async function handleSave() {
    // Save the same narrative under every selected trade so re-opening any one of
    // them rehydrates the combined report.
    for (const rt of reportTypes) {
      await save.mutateAsync({ deal_id: dealId, report_type: rt, sections });
    }
    setDraft(null);
    toast.success(reportTypes.length > 1 ? `Saved across ${reportTypes.length} trades` : "Inspection saved");
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const f of Array.from(files)) {
      await upload.mutateAsync({ dealId, file: f });
    }
  }

  const [tagProgress, setTagProgress] = useState<{ done: number; total: number } | null>(null);
  async function handleAutoTagAll() {
    if (filteredPhotos.length === 0) return;
    const total = filteredPhotos.length;
    setTagProgress({ done: 0, total });
    const toastId = toast.loading(`Auto-tagging 0 / ${total}…`);
    let done = 0;
    let failures = 0;
    for (const p of filteredPhotos) {
      try {
        const res = await analyze.mutateAsync({
          photo_id: p.id, storage_path: p.storage_path, report_type: primaryType,
        });
        await updatePhoto.mutateAsync({
          photo_id: p.id, deal_id: dealId,
          patch: {
            inspection_tags: res.tags, severity: res.severity, caption: res.caption,
            inspection_report_type: primaryType,
          },
        });
      } catch (e) {
        console.error("auto-tag failed", p.id, e);
        failures++;
        if (failures >= 3) {
          toast.error("Stopped after 3 failures (likely rate limit). Try again shortly.", { id: toastId });
          setTagProgress(null);
          return;
        }
      }
      done++;
      setTagProgress({ done, total });
      toast.loading(`Auto-tagging ${done} / ${total}…`, { id: toastId });
    }
    setTagProgress(null);
    toast.success(
      failures === 0 ? `Tagged ${done} photos` : `Tagged ${done - failures} of ${total} (${failures} failed)`,
      { id: toastId },
    );
  }


  async function handleGenerateNarrative(tweak?: string) {
    const findings = filteredPhotos.map((p) => {
      const ext = p as unknown as {
        inspection_tags?: string[];
        severity?: "low" | "moderate" | "high" | null;
      };
      return {
        caption: p.caption ?? null,
        tags: ext.inspection_tags ?? [],
        severity: ext.severity ?? null,
      };
    });
    const tagged = findings.filter((f) => (f.caption && f.caption.length > 0) || (f.tags && f.tags.length > 0));
    if (tagged.length === 0 && !tweak?.trim()) {
      toast.error("Tag some photos first (or use Tweak to provide context)");
      return;
    }
    const toastId = toast.loading("Drafting narrative from photos…");
    try {
      const res = await generateNarrative.mutateAsync({
        report_types: reportTypes,
        photos: tagged,
        tweak,
      });
      setDraft(res.sections);
      toast.success("Narrative drafted — review and Save", { id: toastId });
    } catch {
      toast.dismiss(toastId);
    }
  }

  const [shareOpen, setShareOpen] = useState(false);

  const sharePhotos = useMemo(() => {
    const included = filteredPhotos.filter(
      (p) => (p as { include_in_report?: boolean }).include_in_report !== false,
    );
    return included.map((p) => {
      const ext = p as unknown as {
        inspection_tags?: string[];
        severity?: "low" | "moderate" | "high" | null;
      };
      return {
        signedUrl: p.signedUrl,
        tags: ext.inspection_tags ?? [],
        severity: ext.severity ?? null,
        caption: p.caption,
      };
    });
  }, [filteredPhotos]);

  const customerName = useMemo(
    () => [deal?.homeowner1, deal?.homeowner2].filter(Boolean).join(" & ") || "Homeowner",
    [deal?.homeowner1, deal?.homeowner2],
  );

  return (
    <div className="space-y-6">
      <div className="card-premium p-5 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[260px]">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Report Type{reportTypes.length > 1 ? "s" : ""} <span className="text-muted-foreground/70 font-normal normal-case tracking-normal">— select all that apply</span>
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {REPORT_OPTIONS.map((rt) => {
              const active = reportTypes.includes(rt);
              return (
                <button
                  type="button"
                  key={rt}
                  onClick={() => toggleReportType(rt)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground/80 border-border hover:border-primary/40 hover:bg-muted"
                  }`}
                  aria-pressed={active}
                >
                  {active && <Check className="h-3 w-3" />}
                  {REPORT_TYPE_SHORT[rt]}
                </button>
              );
            })}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
          <Camera className="h-4 w-4 mr-2" />
          {upload.isPending ? "Uploading…" : "Add photos"}
        </Button>

        <Button variant="outline" onClick={handleAutoTagAll} disabled={!!tagProgress || filteredPhotos.length === 0}>
          {tagProgress ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {tagProgress ? `Tagging ${tagProgress.done}/${tagProgress.total}` : `Auto-tag all (${filteredPhotos.length})`}
        </Button>


        <Button onClick={handleSave} disabled={save.isPending || !draft} variant="secondary">
          {save.isPending ? "Saving…" : draft ? "Save changes" : "Saved"}
        </Button>

        <Button onClick={() => setShareOpen(true)} disabled={!deal}>
          <Share2 className="h-4 w-4 mr-2" />
          Generate &amp; Share PDF
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display font-extrabold text-lg tracking-tight">
            Photos <span className="text-muted-foreground font-normal text-sm">({filteredPhotos.length})</span>
          </h4>
        </div>
        {filteredPhotos.length === 0 ? (
          <div className="card-premium p-8 text-center text-sm text-muted-foreground">
            No photos yet. Tap <span className="font-semibold text-foreground">Add photos</span> to take or upload images from the iPad camera.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhotos.map((p) => (
              <PhotoTagCard key={p.id} photo={p} reportType={primaryType} />
            ))}
          </div>
        )}
      </div>

      <div className="card-premium p-5 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h4 className="font-display font-extrabold text-lg tracking-tight">Report Narrative</h4>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateNarrative()}
              disabled={generateNarrative.isPending}
            >
              {generateNarrative.isPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Sparkles className="h-4 w-4 mr-2" />}
              Draft from photos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTweakOpen(true)}
              disabled={generateNarrative.isPending}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Tweak
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Drafted in the voice of {reportTypes.length > 1 ? "the combined " + reportTypes.map((t) => REPORT_TYPE_SHORT[t]).join(" + ") + " inspectors" : "a " + REPORT_TYPE_LABELS[primaryType].toLowerCase() + " inspector"}. Use <span className="font-semibold text-foreground">Draft from photos</span> to synthesize the narrative from the tagged photos above, or <span className="font-semibold text-foreground">Tweak</span> to steer it (material, age, prior repairs, etc.).
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SECTION_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
              <Textarea
                rows={key === "executive_summary" || key === "professional_opinion" ? 6 : 4}
                value={sections[key]}
                onChange={(e) => setField(key, e.target.value)}
                className="text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <Dialog open={tweakOpen} onOpenChange={setTweakOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tweak the narrative</DialogTitle>
            <DialogDescription>
              Give the AI extra context to bake into the report — material, age, prior repairs, homeowner concerns. It will re-draft all sections using the tagged photos plus this context.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            placeholder={
              reportTypes.includes("roof")
                ? "e.g. 3-tab asphalt shingle, ~22 years old, prior patch over the south valley, homeowner reports staining in the master bedroom ceiling."
                : "e.g. material, age, prior repairs, homeowner concerns…"
            }
            value={tweakText}
            onChange={(e) => setTweakText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTweakOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                setTweakOpen(false);
                await handleGenerateNarrative(tweakText);
              }}
              disabled={generateNarrative.isPending}
            >
              {generateNarrative.isPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Wand2 className="h-4 w-4 mr-2" />}
              Re-draft with context
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareInspectionPdfDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        customerName={customerName}
        address={deal?.address ?? ""}
        reportType={reportType}
        sections={sections}
        photos={sharePhotos}
      />
    </div>
  );
}
