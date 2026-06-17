import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";
import {
  type InspectionReportType,
  type InspectionSections,
  TEMPLATES,
} from "@/data/inspectionTemplates";

export interface InspectionRow {
  id: string;
  deal_id: string;
  report_type: InspectionReportType;
  sections: InspectionSections;
  created_at: string;
  updated_at: string;
}

const BUCKET = "deal-photos";

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
            sections: input.sections as unknown as Record<string, unknown>,
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
      const { error } = await supabase
        .from("deal_photos")
        .update(input.patch)
        .eq("id", input.photo_id);
      if (error) throw error;
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
    }) => {
      // Create a short-lived signed URL the edge function can fetch
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(input.storage_path, 60 * 5);
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Failed to sign photo URL");

      const { data, error } = await supabase.functions.invoke("inspect-photo", {
        body: { photo_url: signed.signedUrl, report_type: input.report_type },
      });
      if (error) throw error;
      return data as { tags: string[]; severity: "low" | "moderate" | "high"; caption: string };
    },
    onError: (err) => toast.error(errMsg(err, "AI tagging failed")),
  });
}
