import { useCallback, useMemo, useRef, useState } from "react";
import { Camera, Download, Loader2, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDealPhotos, useUploadDealPhoto } from "@/hooks/useDealPhotos";
import {
  useAnalyzePhoto, useInspection, useSaveInspection, useUpdatePhotoTags,
} from "@/hooks/useInspection";
import {
  REPORT_TYPE_LABELS, TEMPLATES, type InspectionReportType,
  type InspectionSections,
} from "@/data/inspectionTemplates";
import PhotoTagCard from "./PhotoTagCard";
import { useDeals } from "@/hooks/useDeals";
import { buildInspectionPdf } from "@/lib/pdf/inspection";
import { toast } from "sonner";

interface Props {
  dealId: string;
}

const REPORT_OPTIONS: InspectionReportType[] = ["roof", "windows", "bath", "solar"];

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
  const [reportType, setReportType] = useState<InspectionReportType>("roof");

  const { data: deals = [] } = useDeals();
  const deal = useMemo(() => deals.find((d) => d.id === dealId), [deals, dealId]);

  const { data: inspection } = useInspection(dealId, reportType);
  const { data: photos = [] } = useDealPhotos(dealId);
  const upload = useUploadDealPhoto();
  const save = useSaveInspection();
  const analyze = useAnalyzePhoto();
  const updatePhoto = useUpdatePhotoTags();

  const fileRef = useRef<HTMLInputElement>(null);

  // Local override for sections so the textarea stays responsive while typing.
  const [draft, setDraft] = useState<InspectionSections | null>(null);
  const sections = draft ?? inspection?.sections ?? TEMPLATES[reportType];

  const filteredPhotos = useMemo(
    () => photos.filter((p) => {
      const rt = (p as { inspection_report_type?: string | null }).inspection_report_type;
      return !rt || rt === reportType;
    }),
    [photos, reportType],
  );

  const setField = useCallback((key: keyof InspectionSections, v: string) => {
    setDraft((prev) => ({ ...(prev ?? sections), [key]: v }));
  }, [sections]);

  async function handleSave() {
    await save.mutateAsync({ deal_id: dealId, report_type: reportType, sections });
    setDraft(null);
    toast.success("Inspection saved");
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const f of Array.from(files)) {
      await upload.mutateAsync({ dealId, file: f });
    }
  }

  async function handleAutoTagAll() {
    const untagged = filteredPhotos.filter(
      (p) => ((p as { inspection_tags?: string[] }).inspection_tags?.length ?? 0) === 0,
    );
    for (const p of untagged) {
      try {
        const res = await analyze.mutateAsync({
          photo_id: p.id, storage_path: p.storage_path, report_type: reportType,
        });
        await updatePhoto.mutateAsync({
          photo_id: p.id, deal_id: dealId,
          patch: {
            inspection_tags: res.tags, severity: res.severity, caption: res.caption,
            inspection_report_type: reportType,
          },
        });
      } catch (e) {
        console.error(e);
        break; // stop on first failure (rate limit etc.)
      }
    }
  }

  const [generating, setGenerating] = useState(false);
  async function handleGeneratePdf() {
    if (!deal) return;
    setGenerating(true);
    try {
      const included = filteredPhotos.filter(
        (p) => (p as { include_in_report?: boolean }).include_in_report !== false,
      );
      const customerName =
        [deal.homeowner1, deal.homeowner2].filter(Boolean).join(" & ") || "Homeowner";
      const { doc } = await buildInspectionPdf({
        customerName,
        address: deal.address ?? "",
        reportType,
        sections,
        photos: included.map((p) => {
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
        }),
      });
      const fname = `${customerName.replace(/\s+/g, "_")}_${REPORT_TYPE_LABELS[reportType].replace(/\s+/g, "_")}.pdf`;
      doc.save(fname);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("PDF generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-premium p-5 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Report Type
          </Label>
          <Select value={reportType} onValueChange={(v) => { setDraft(null); setReportType(v as InspectionReportType); }}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPORT_OPTIONS.map((rt) => (
                <SelectItem key={rt} value={rt}>{REPORT_TYPE_LABELS[rt]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
          <Camera className="h-4 w-4 mr-2" />
          {upload.isPending ? "Uploading…" : "Add photos"}
        </Button>

        <Button variant="outline" onClick={handleAutoTagAll} disabled={analyze.isPending || filteredPhotos.length === 0}>
          {analyze.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Auto-tag all
        </Button>

        <Button onClick={handleSave} disabled={save.isPending || !draft} variant="secondary">
          {save.isPending ? "Saving…" : draft ? "Save changes" : "Saved"}
        </Button>

        <Button onClick={handleGeneratePdf} disabled={generating || !deal}>
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Generate PDF
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
              <PhotoTagCard key={p.id} photo={p} reportType={reportType} />
            ))}
          </div>
        )}
      </div>

      <div className="card-premium p-5 space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h4 className="font-display font-extrabold text-lg tracking-tight">Report Narrative</h4>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Pre-filled with a {REPORT_TYPE_LABELS[reportType].toLowerCase()} template. Tweak as needed — these blocks appear in the PDF.
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
    </div>
  );
}
