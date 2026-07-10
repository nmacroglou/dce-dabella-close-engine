import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Sparkles, FileText, Wand2, Share2, Check, TrendingUp, X, Eraser, Thermometer, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { useLanguage } from "@/contexts/LanguageContext";


interface Props {
  dealId: string;
}

const REPORT_OPTIONS: InspectionReportType[] = ["roof", "windows", "bath", "siding", "stucco", "paint"];

const STUCCO_FINISHES = [
  "Santa Barbara", "Lace", "Light Lace", "Heavy Lace",
  "Light Dash", "Medium Dash", "Heavy Dash", "Sand",
] as const;
type StuccoFinish = typeof STUCCO_FINISHES[number];

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
  const { t, lang } = useLanguage();
  // Multi-select: rep can pick one or more trades for a single combined report.
  const [reportTypes, setReportTypes] = useState<InspectionReportType[]>(["roof"]);
  const primaryType = reportTypes[0] ?? "roof";

  // Local override for sections so the textarea stays responsive while typing.
  const [draft, setDraft] = useState<InspectionSections | null>(null);
  const [stuccoFinish, setStuccoFinish] = useState<StuccoFinish | null>(null);


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
  const [captionTweakOpen, setCaptionTweakOpen] = useState(false);
  const [captionTweakText, setCaptionTweakText] = useState("");
  const [captionTweakProgress, setCaptionTweakProgress] = useState<{ done: number; total: number } | null>(null);
  const cancelCaptionTweakRef = useRef(false);

  async function handleTweakAllCaptions(tweak: string) {
    const t = tweak.trim();
    if (!t) {
      toast.error("Enter a tweak instruction first");
      return;
    }
    const targets = filteredPhotos.filter(
      (p) => (p as { include_in_report?: boolean }).include_in_report !== false,
    );
    if (targets.length === 0) {
      toast.error("No photos to tweak");
      return;
    }
    cancelCaptionTweakRef.current = false;
    setCaptionTweakProgress({ done: 0, total: targets.length });
    const toastId = toast.loading(`Tweaking captions 0 / ${targets.length}…`);
    let done = 0;
    let failures = 0;
    for (const p of targets) {
      if (cancelCaptionTweakRef.current) {
        toast.message(`Canceled — tweaked ${done} of ${targets.length}`, { id: toastId });
        setCaptionTweakProgress(null);
        return;
      }
      const ext = p as { inspection_tags?: string[] };
      const currentCaption = (p.caption ?? "").trim();
      const hintParts = [
        `Global caption tweak — apply this instruction to the caption: ${t}`,
        currentCaption ? `Current caption to refine: ${currentCaption}` : "",
        stuccoFinish
          ? `Existing stucco finish on this home is ${stuccoFinish}. Do not mention any other finish.`
          : "",
      ].filter(Boolean);
      try {
        const res = await analyze.mutateAsync({
          photo_id: p.id,
          storage_path: p.storage_path,
          report_type: primaryType,
          user_hint: hintParts.join("\n\n"),
          existing_tags: ext.inspection_tags ?? [],
          language: lang,
        });
        if (cancelCaptionTweakRef.current) {
          toast.message(`Canceled — tweaked ${done} of ${targets.length}`, { id: toastId });
          setCaptionTweakProgress(null);
          return;
        }
        await updatePhoto.mutateAsync({
          photo_id: p.id,
          deal_id: dealId,
          patch: { caption: res.caption },
        });
      } catch (e) {
        console.error("caption tweak failed", p.id, e);
        failures++;
        if (failures >= 3) {
          toast.error("Stopped after 3 failures (likely rate limit). Try again shortly.", { id: toastId });
          setCaptionTweakProgress(null);
          return;
        }
      }
      done++;
      setCaptionTweakProgress({ done, total: targets.length });
      toast.loading(`Tweaking captions ${done} / ${targets.length}…`, { id: toastId });
    }
    setCaptionTweakProgress(null);
    toast.success(
      failures === 0
        ? `Tweaked ${done} caption${done === 1 ? "" : "s"}`
        : `Tweaked ${done - failures} of ${targets.length} (${failures} failed)`,
      { id: toastId },
    );
  }

  const sections = draft ?? inspection?.sections ?? TEMPLATES[primaryType];

  // Photos are agnostic to report type — every photo on the deal is available
  // regardless of which trades are currently selected.
  const filteredPhotos = photos;

  const setField = useCallback((key: keyof InspectionSections, v: string) => {
    setDraft((prev) => ({ ...(prev ?? sections), [key]: v }));
  }, [sections]);

  // Pick a stucco finish and sweep the sections so every other finish name is
  // replaced with the chosen one — keeps the narrative consistent end to end.
  function pickStuccoFinish(finish: StuccoFinish) {
    setStuccoFinish(finish);
    const others = STUCCO_FINISHES.filter((f) => f !== finish);
    const swap = (text: string) => {
      let out = text;
      for (const o of others) {
        const re = new RegExp(`\\b${o.replace(/\s+/g, "\\s+")}\\b`, "gi");
        out = out.replace(re, finish);
      }
      return out;
    };
    setDraft({
      executive_summary: swap(sections.executive_summary),
      inspection_scope: swap(sections.inspection_scope),
      measurements: swap(sections.measurements),
      professional_opinion: swap(sections.professional_opinion),
      recommended_scope: swap(sections.recommended_scope),
      next_steps: swap(sections.next_steps),
      limitations: swap(sections.limitations),
    });
    toast.success(`Stucco finish set to ${finish} — narrative updated`);
  }

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
  const cancelTagRef = useRef(false);
  async function handleAutoTagAll() {
    if (filteredPhotos.length === 0) return;
    const total = filteredPhotos.length;
    cancelTagRef.current = false;
    setTagProgress({ done: 0, total });
    const toastId = toast.loading(`Auto-tagging 0 / ${total}…`);
    let done = 0;
    let failures = 0;
    for (const p of filteredPhotos) {
      if (cancelTagRef.current) {
        toast.message(`Canceled — tagged ${done} of ${total}`, { id: toastId });
        setTagProgress(null);
        return;
      }
      try {
        const finishHint = reportTypes.includes("stucco") && stuccoFinish
          ? `Existing stucco finish on this home is ${stuccoFinish}. Name this finish in the caption and use a tag like finish_${stuccoFinish.toLowerCase().replace(/\s+/g, "_")}. Do not mention any other finish.`
          : undefined;
        const res = await analyze.mutateAsync({
          photo_id: p.id, storage_path: p.storage_path, report_type: primaryType,
          user_hint: finishHint,
          language: lang,
        });
        if (cancelTagRef.current) {
          toast.message(`Canceled — tagged ${done} of ${total}`, { id: toastId });
          setTagProgress(null);
          return;
        }
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
  function handleCancelAutoTag() {
    cancelTagRef.current = true;
  }


  // Amp urgency: applies a +30% severity weight across every photo.
  // Weights: low=1, moderate=2, high=3. Bumped weight = current * 1.3, rounded,
  // which deterministically pushes low→moderate, moderate→high, high stays high.
  const [ampPending, setAmpPending] = useState(false);
  async function handleAmpUrgency() {
    const targets = filteredPhotos.filter((p) => {
      const sev = (p as { severity?: string | null }).severity;
      return sev === "low" || sev === "moderate"; // high is already topped out
    });
    if (targets.length === 0) {
      toast.message("Severity is already at the top across the board.");
      return;
    }
    setAmpPending(true);
    const toastId = toast.loading(`Amping urgency on ${targets.length} photo${targets.length === 1 ? "" : "s"}…`);
    let bumped = 0;
    for (const p of targets) {
      const sev = (p as { severity?: "low" | "moderate" | "high" | null }).severity;
      const next: "moderate" | "high" = sev === "low" ? "moderate" : "high";
      try {
        await updatePhoto.mutateAsync({
          photo_id: p.id, deal_id: dealId, patch: { severity: next },
        });
        bumped++;
      } catch (e) {
        console.error("amp severity failed", p.id, e);
      }
    }
    setAmpPending(false);
    toast.success(
      `Bumped ${bumped} photo${bumped === 1 ? "" : "s"} +1 severity tier (+30% weight)`,
      { id: toastId },
    );
  }



  // Wipe every photo's tags, severity, and caption so the rep can start a clean re-tag pass.
  const [clearPending, setClearPending] = useState(false);
  async function handleClearAll() {
    const targets = filteredPhotos.filter((p) => {
      const ext = p as { inspection_tags?: string[]; severity?: string | null };
      return (p.caption && p.caption.length > 0)
        || (ext.inspection_tags && ext.inspection_tags.length > 0)
        || ext.severity;
    });
    if (targets.length === 0) {
      toast.message("Nothing to clear — no captions or tags yet.");
      return;
    }
    if (!confirm(`Clear captions, tags, and severity on ${targets.length} photo${targets.length === 1 ? "" : "s"}? The photos themselves stay.`)) return;
    setClearPending(true);
    const toastId = toast.loading(`Clearing ${targets.length}…`);
    let cleared = 0;
    for (const p of targets) {
      try {
        await updatePhoto.mutateAsync({
          photo_id: p.id, deal_id: dealId,
          patch: { inspection_tags: [], severity: null, caption: "" },
        });
        cleared++;
      } catch (e) {
        console.error("clear failed", p.id, e);
      }
    }
    setClearPending(false);
    toast.success(`Cleared ${cleared} photo${cleared === 1 ? "" : "s"} — ready for a fresh re-tag`, { id: toastId });
  }

  // ─── FLIR readings ──────────────────────────────────────────
  // Rep punches in surface temp + ambient from the FLIR. We compute a
  // back-of-the-envelope "after Cool Series" projection so the homeowner
  // sees a concrete number, not a vague claim.
  //
  // Method (deliberately conservative, calibrated to published reflective-
  // coating data, ASTM C1549 solar-reflectance studies, and Cool Series specs):
  //   delta_now    = wall_surface - ambient                  (°F over ambient)
  //   reduction    = min(delta_now, 0.65 * delta_now + 8)    (°F shaved off)
  //                  → roughly a 65% knockdown on the over-ambient delta,
  //                    floored at +8°F when the wall is barely above ambient,
  //                    capped so we never project below ambient.
  //   projected    = wall_surface - reduction                (°F after Cool Series)
  //   load_drop_%  = clamp(reduction * 1.1, 8, 27)           (% cooling load saved)
  //                  → tied to the 27% upper bound on the slide.
  type FlirReading = { id: string; location: string; wall: string; ambient: string };
  const [flirReadings, setFlirReadings] = useState<FlirReading[]>([
    { id: crypto.randomUUID(), location: "South wall", wall: "", ambient: "" },
  ]);
  function updateFlir(id: string, patch: Partial<FlirReading>) {
    setFlirReadings((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addFlir() {
    setFlirReadings((prev) => [...prev, { id: crypto.randomUUID(), location: "", wall: "", ambient: "" }]);
  }
  function removeFlir(id: string) {
    setFlirReadings((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  }
  function computeFlir(wallStr: string, ambientStr: string) {
    const wall = Number(wallStr);
    const ambient = Number(ambientStr);
    if (!Number.isFinite(wall) || !Number.isFinite(ambient) || wall <= ambient) return null;
    const delta = wall - ambient;
    const reduction = Math.min(delta, 0.65 * delta + 8);
    const projected = wall - reduction;
    const loadDrop = Math.max(8, Math.min(27, Math.round(reduction * 1.1)));
    return {
      delta: Math.round(delta),
      reduction: Math.round(reduction),
      projected: Math.round(projected),
      loadDrop,
    };
  }

  // Strip helpers — let us re-apply FLIR cleanly when readings change.
  // We match the unique opening phrases of our injected blocks and remove
  // through the end of that paragraph (incl. trailing • bullet lines).
  function stripFlirNarrative(text: string): string {
    if (!text) return text;
    let out = text;
    // Opinion paragraph + bullets (bullets are lines starting with "•")
    out = out.replace(
      /\n*FLIR thermal reading — fly-by calculation[\s\S]*?(?=\n{2,}(?!•)|$)/g,
      "",
    );
    // Executive-summary single line
    out = out.replace(/\n*Thermal verification: FLIR readings[^\n]*/g, "");
    // Recommended-scope addition
    out = out.replace(
      /\n*Apply DaBella Cool Series Forever Paint as a heat-reflective envelope on the elevations measured above[\s\S]*?(?=\n{2,}|$)/g,
      "",
    );
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }
  function stripFlirCaption(text: string): string {
    if (!text) return text;
    return text
      .replace(/\n*FLIR thermal:[^\n]*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const applyFlirRef = useRef<(silent?: boolean) => Promise<void>>(async () => {});
  applyFlirRef.current = async (silent = false) => {
    const valid = flirReadings
      .map((r) => ({ r, c: computeFlir(r.wall, r.ambient) }))
      .filter((x): x is { r: FlirReading; c: NonNullable<ReturnType<typeof computeFlir>> } => x.c !== null);
    if (valid.length === 0) {
      if (!silent) toast.error("Enter wall and ambient temps (wall must be hotter than ambient).");
      return;
    }
    const avg = (key: "delta" | "reduction" | "projected" | "loadDrop") =>
      Math.round(valid.reduce((s, x) => s + x.c[key], 0) / valid.length);
    const avgDelta = avg("delta");
    const avgReduction = avg("reduction");
    const avgLoad = avg("loadDrop");

    const bullets = valid
      .map(({ r, c }) => {
        const loc = r.location.trim() || "Reading";
        return `• ${loc}: surface ${Math.round(Number(r.wall))}°F vs. ambient ${Math.round(Number(r.ambient))}°F (Δ +${c.delta}°F). Cool Series projection: ~${c.projected}°F surface (a ~${c.reduction}°F drop, ~${c.loadDrop}% cooling-load reduction).`;
      })
      .join("\n");

    const opinionPara = `FLIR thermal reading — fly-by calculation. We measured the wall surface running ${avgDelta}°F over ambient today. That heat is what your wall framing, sheathing, and conditioned interior are absorbing all afternoon — every degree above ambient is load your HVAC has to fight. With DaBella's Cool Series Forever Paint, independent reflectance testing supports knocking that surface delta down by roughly ${avgReduction}°F on average, which translates to an estimated ${avgLoad}% reduction in cooling load on the affected elevations. The homeowner feels it two ways: cooler walls to the touch and a notably shorter AC runtime through the peak hours.\n${bullets}`;
    const scopeAdd = "Apply DaBella Cool Series Forever Paint as a heat-reflective envelope on the elevations measured above — the same coating system that drove the projected surface-temperature drop in the FLIR readings, neutralizing radiant transfer through the walls and lowering the cooling load on the home.";
    const sumLine = `Thermal verification: FLIR readings show the wall is currently running ~${avgDelta}°F over ambient. Cool Series Forever Paint is projected to drop that delta by ~${avgReduction}°F, an estimated ~${avgLoad}% cooling-load reduction on the affected walls.`;

    // Strip any prior FLIR block, then re-insert the freshly computed one.
    const baseOpinion = stripFlirNarrative(sections.professional_opinion ?? "");
    const baseScope = stripFlirNarrative(sections.recommended_scope ?? "");
    const baseSummary = stripFlirNarrative(sections.executive_summary ?? "");
    setDraft({
      ...sections,
      executive_summary: baseSummary ? `${baseSummary}\n\n${sumLine}` : sumLine,
      professional_opinion: baseOpinion ? `${baseOpinion}\n\n${opinionPara}` : opinionPara,
      recommended_scope: baseScope ? `${baseScope}\n\n${scopeAdd}` : scopeAdd,
    });

    // Cascade ONLY to FLIR photos — this caption IS the Cool Series tie-down.
    // The FLIR shot is the proof point that justifies the whole Cool Series
    // recommendation, so the caption tells that full story (not just numbers).
    const captionLine = `FLIR thermal proof — Cool Series tie-down. The thermal camera caught this wall running ~${avgDelta}°F over today's ambient — that's the radiant solar load being driven straight into the framing, sheathing, and conditioned interior, and it's exactly what the homeowner's AC is fighting through every peak hour. Faded, UV-burned stucco has lost its reflectivity, so virtually all of that energy transfers through the wall assembly.\n\nThis is precisely what DaBella's Cool Series Forever Paint is engineered to stop: independent reflectance testing supports a surface-temperature knockdown of roughly ${avgReduction}°F on the measured elevations, which translates to an estimated ${avgLoad}% reduction in cooling load on those walls. Cooler walls to the touch, shorter AC runtimes, and a measurably more comfortable home — this FLIR image is the documented, on-site evidence behind every Cool Series recommendation in this report.`;
    const isFlirPhoto = (p: typeof filteredPhotos[number]) => {
      const ext = p as { inspection_tags?: string[]; file_name?: string | null; storage_path?: string | null };
      const tagHit = (ext.inspection_tags ?? []).some((t) => /flir|thermal/i.test(t));
      const nameHit = /flir|thermal/i.test(`${ext.file_name ?? ""} ${ext.storage_path ?? ""}`);
      const capHit = /flir|thermal/i.test(p.caption ?? "");
      return tagHit || nameHit || capHit;
    };
    const captionTargets = filteredPhotos.filter(
      (p) => (p as { include_in_report?: boolean }).include_in_report !== false && isFlirPhoto(p),
    );
    let cascaded = 0;
    for (const p of captionTargets) {
      const base = stripFlirCaption(p.caption ?? "");
      const next = base ? `${base}\n\n${captionLine}` : captionLine;
      if (next === (p.caption ?? "").trim()) continue;
      try {
        await updatePhoto.mutateAsync({
          photo_id: p.id, deal_id: dealId,
          patch: { caption: next },
        });
        cascaded++;
      } catch (e) {
        console.error("flir caption cascade failed", p.id, e);
      }
    }


    if (!silent) {
      toast.success(
        cascaded > 0
          ? `Applied ${valid.length} FLIR reading${valid.length === 1 ? "" : "s"} — narrative + ${cascaded} photo caption${cascaded === 1 ? "" : "s"}`
          : `Applied ${valid.length} FLIR reading${valid.length === 1 ? "" : "s"} to the narrative`,
      );
    }
  };

  async function handleApplyFlir() {
    await applyFlirRef.current(false);
  }

  // Auto-cascade: as soon as any reading is valid (and whenever readings or
  // selected trades change), debounce and silently push the Cool Series
  // heat-transfer story into the narrative + captions. No button needed.
  const flirEligible = reportTypes.includes("stucco") || reportTypes.includes("paint");
  const flirSignature = useMemo(
    () => flirReadings.map((r) => `${r.location}|${r.wall}|${r.ambient}`).join("~"),
    [flirReadings],
  );
  useEffect(() => {
    if (!flirEligible) return;
    const hasValid = flirReadings.some((r) => computeFlir(r.wall, r.ambient) !== null);
    if (!hasValid) return;
    const t = setTimeout(() => { void applyFlirRef.current(true); }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flirSignature, flirEligible]);





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
    const finishNote = reportTypes.includes("stucco") && stuccoFinish
      ? `Existing stucco finish texture confirmed by the rep: ${stuccoFinish}. Reference this finish by name throughout the report and do not mention any other finish.`
      : "";
    const mergedTweak = [tweak?.trim(), finishNote].filter(Boolean).join("\n\n");
    try {
      const res = await generateNarrative.mutateAsync({
        report_types: reportTypes,
        photos: tagged,
        tweak: mergedTweak || undefined,
        language: lang,
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

        {reportTypes.includes("stucco") && (
          <div className="w-full basis-full">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Stucco Finish <span className="text-muted-foreground/70 font-normal normal-case tracking-normal">— pick the texture on this home; we'll thread it through the report</span>
            </Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {STUCCO_FINISHES.map((f) => {
                const active = stuccoFinish === f;
                return (
                  <button
                    type="button"
                    key={f}
                    onClick={() => pickStuccoFinish(f)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-foreground/80 border-border hover:border-primary/40 hover:bg-muted"
                    }`}
                    aria-pressed={active}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(reportTypes.includes("stucco") || reportTypes.includes("paint")) && (
          <div className="w-full basis-full rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-primary" />
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  FLIR Thermal Readings <span className="text-muted-foreground/70 font-normal normal-case tracking-normal">— auto-cascades Cool Series heat-transfer savings into the narrative + every photo caption as you type.</span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={addFlir}>
                  <Plus className="h-4 w-4 mr-1" /> Add reading
                </Button>
                <Button size="sm" variant="outline" onClick={handleApplyFlir}>
                  <Sparkles className="h-4 w-4 mr-1" /> Re-apply now
                </Button>

              </div>
            </div>
            <div className="space-y-2">
              {flirReadings.map((r) => {
                const c = computeFlir(r.wall, r.ambient);
                return (
                  <div key={r.id} className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_auto_auto] gap-2 items-center">
                    <Input
                      placeholder="Location (e.g. South wall)"
                      value={r.location}
                      onChange={(e) => updateFlir(r.id, { location: e.target.value })}
                    />
                    <Input
                      type="number" inputMode="decimal" placeholder="Wall °F"
                      value={r.wall}
                      onChange={(e) => updateFlir(r.id, { wall: e.target.value })}
                    />
                    <Input
                      type="number" inputMode="decimal" placeholder="Ambient °F"
                      value={r.ambient}
                      onChange={(e) => updateFlir(r.id, { ambient: e.target.value })}
                    />
                    <div className="text-xs text-muted-foreground min-w-[180px]">
                      {c
                        ? <>Δ +{c.delta}°F → <span className="font-semibold text-foreground">~{c.projected}°F</span> after Cool Series (−{c.reduction}°F, ~{c.loadDrop}% load)</>
                        : <span className="opacity-60">Δ — enter both temps</span>}
                    </div>
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => removeFlir(r.id)}
                      disabled={flirReadings.length === 1}
                      title="Remove reading"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}



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

        <Button
          variant="destructive"
          onClick={handleCancelAutoTag}
          disabled={!tagProgress}
          title={tagProgress ? "Stop the auto-tag run. Photos already tagged are kept." : "Only active during an Auto-tag run."}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel tagging
        </Button>

        <Button
          variant="outline"
          onClick={handleAmpUrgency}
          disabled={ampPending || filteredPhotos.length === 0}
          title="Adds +30% weight to every tag — bumps each photo one severity tier (low→moderate→high)."
        >
          {ampPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
          Amp urgency +30%
        </Button>

        <Button
          variant="outline"
          onClick={handleClearAll}
          disabled={clearPending || !!tagProgress || filteredPhotos.length === 0}
          title="Wipe captions, tags, and severity on every photo so you can run a fresh tag pass. Photos stay."
        >
          {clearPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eraser className="h-4 w-4 mr-2" />}
          Clear & re-tag
        </Button>




        <Button
          variant="outline"
          onClick={() => setCaptionTweakOpen(true)}
          disabled={!!captionTweakProgress || filteredPhotos.length === 0}
          title="Apply a global instruction to every photo's caption (tags & severity are preserved)."
        >
          {captionTweakProgress
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            : <Wand2 className="h-4 w-4 mr-2" />}
          {captionTweakProgress
            ? `Tweaking ${captionTweakProgress.done}/${captionTweakProgress.total}`
            : "Tweak all captions"}
        </Button>

        {captionTweakProgress && (
          <Button
            variant="destructive"
            onClick={() => { cancelCaptionTweakRef.current = true; }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel tweak
          </Button>
        )}

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
              <PhotoTagCard
                key={p.id}
                photo={p}
                reportType={primaryType}
                stuccoFinish={reportTypes.includes("stucco") ? stuccoFinish : null}
              />

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

      <Dialog open={captionTweakOpen} onOpenChange={setCaptionTweakOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tweak all captions</DialogTitle>
            <DialogDescription>
              Apply one instruction to every included photo's caption. Existing tags and severity are preserved — only captions are re-drafted using the photo + your instruction.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            placeholder="e.g. Keep it to two sentences, mention the homeowner by name, emphasize safety risk, avoid technical jargon…"
            value={captionTweakText}
            onChange={(e) => setCaptionTweakText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCaptionTweakOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                setCaptionTweakOpen(false);
                await handleTweakAllCaptions(captionTweakText);
              }}
              disabled={!!captionTweakProgress || !captionTweakText.trim()}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Apply to {filteredPhotos.length} caption{filteredPhotos.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <ShareInspectionPdfDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        customerName={customerName}
        address={deal?.address ?? ""}
        reportTypes={reportTypes}
        sections={sections}
        photos={sharePhotos}
      />
    </div>
  );
}
