import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";
import {
  type InspectionReportType,
  type InspectionSections,
  TEMPLATES,
} from "@/data/inspectionTemplates";

async function functionErrorMessage(error: unknown, fallback: string) {
  const context = (error as { context?: unknown })?.context;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      if (typeof payload?.error === "string" && payload.error) return payload.error;
    } catch {
      // Fall through to the standard error helper.
    }
  }
  return errMsg(error, fallback);
}

export interface InspectionRow {
  id: string;
  deal_id: string;
  report_type: InspectionReportType;
  sections: InspectionSections;
  created_at: string;
  updated_at: string;
}

const BUCKET = "deal-photos";
const MAX_ANALYSIS_SIDE = 1024;
const ANALYSIS_QUALITY = 0.72;

async function imageUrlToDataUrl(url: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load photo for AI inspection"));
    img.src = url;
  });

  const scale = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare photo for AI inspection");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", ANALYSIS_QUALITY);
}

export function useInspection(dealId: string | null, reportType: InspectionReportType) {
  return useQuery({
    queryKey: ["inspection", dealId, reportType],
    enabled: !!dealId,
    queryFn: async (): Promise<InspectionRow> => {
      if (!dealId) throw new Error("no deal");
      const { data, error } = await supabase
        .from("deal_inspections")
        .select("*")
        .eq("deal_id", dealId)
        .eq("report_type", reportType)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return {
          ...data,
          sections: { ...TEMPLATES[reportType], ...(data.sections as Partial<InspectionSections>) },
        } as InspectionRow;
      }
      // Synthesize a default in-memory row; first save creates the DB row.
      return {
        id: "",
        deal_id: dealId,
        report_type: reportType,
        sections: TEMPLATES[reportType],
        created_at: "",
        updated_at: "",
      };
    },
  });
}

export function useSaveInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      deal_id: string;
      report_type: InspectionReportType;
      sections: InspectionSections;
    }) => {
      const { error } = await supabase
        .from("deal_inspections")
        .upsert(
          [{
            deal_id: input.deal_id,
            report_type: input.report_type,
            sections: input.sections as unknown as never,
          }],
          { onConflict: "deal_id,report_type" },
        );
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["inspection", v.deal_id, v.report_type] });
    },
    onError: (err) => toast.error(errMsg(err, "Save failed")),
  });
}

/** Patch a photo's inspection fields (tags / severity / caption / include / report_type). */
export function useUpdatePhotoTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      photo_id: string;
      deal_id: string;
      patch: {
        inspection_tags?: string[];
        severity?: "low" | "moderate" | "high" | null;
        caption?: string | null;
        include_in_report?: boolean;
        inspection_report_type?: InspectionReportType;
      };
    }) => {
      const { data, error } = await supabase
        .from("deal_photos")
        .update(input.patch)
        .eq("id", input.photo_id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Photo update was blocked for this user");
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["deal-photos", v.deal_id] });
    },
    onError: (err) => toast.error(errMsg(err, "Update failed")),
  });
}

/** Call the inspect-photo edge function for AI tagging. */
export function useAnalyzePhoto() {
  return useMutation({
    mutationFn: async (input: {
      photo_id: string;
      storage_path: string;
      report_type: InspectionReportType;
      user_hint?: string;
      existing_tags?: string[];
    }) => {
      // Resize in the browser so the edge function never loads camera-sized images into memory.
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(input.storage_path, 60 * 5, {
          transform: { width: MAX_ANALYSIS_SIDE, height: MAX_ANALYSIS_SIDE, resize: "contain", quality: 72 },
        });
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Failed to sign photo URL");

      const imageDataUrl = await imageUrlToDataUrl(signed.signedUrl);

      const { data, error } = await supabase.functions.invoke("inspect-photo", {
        body: {
          image_data_url: imageDataUrl,
          report_type: input.report_type,
          user_hint: input.user_hint,
          existing_tags: input.existing_tags,
        },
      });
      if (error) throw new Error(await functionErrorMessage(error, "AI tagging failed"));
      return data as { tags: string[]; severity: "low" | "moderate" | "high"; caption: string };
    },
    onError: (err) => toast.error(errMsg(err, "AI tagging failed")),
  });
}

/** Generate narrative sections from tagged photo findings + optional tweak prompt. */
export function useGenerateNarrative() {
  return useMutation({
    mutationFn: async (input: {
      report_type: InspectionReportType;
      photos: { caption?: string | null; tags?: string[] | null; severity?: "low" | "moderate" | "high" | null }[];
      tweak?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-narrative", {
        body: input,
      });
      if (error) throw error;
      return data as { sections: InspectionSections };
    },
    onError: (err) => toast.error(errMsg(err, "Narrative generation failed")),
  });
}

