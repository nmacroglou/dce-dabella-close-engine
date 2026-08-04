import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import PropertySearch from "@/components/property-intel/PropertySearch";
import PropertyIntelReportView from "@/components/property-intel/PropertyIntelReport";
import { generateReport } from "@/lib/propertyIntel/generateReport";
import { saveSearchedProperty } from "@/lib/propertyIntel/saveProperty";
import type { PropertyIntelReport } from "@/lib/propertyIntel/types";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Loader2, Search, PlusCircle } from "lucide-react";

export default function PropertyIntel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActiveDealId } = useActiveDeal();
  const [report, setReport] = useState<PropertyIntelReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [creating, setCreating] = useState(false);

  const runSearch = async (query: string) => {
    setLoading(true);
    const first = (user?.user_metadata?.full_name || user?.email || "").split(/[ @]/)[0] || "Nik";
    try {
      const r = await generateReport(query, first);
      setReport(r);
      if (user) {
        await saveSearchedProperty(user.id, r);
        queryClient.invalidateQueries({ queryKey: ["pi-recent-searches", user.id] });
      }
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async () => {
    if (!report || !user) return;
    if (report.info.do_not_knock) {
      toast.error("Cannot create a deal for a Do Not Knock property");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.from("deals").insert({
        rep_id: user.id,
        homeowner1: report.identity.likely_owner_name ?? report.ownership.owner_name ?? "Prospect",
        address: report.property_match.standardized_address,
        lat: report.property_match.latitude,
        lng: report.property_match.longitude,
        stage: "inspecting",
        lead_source: "canvass",
        notes: `Property Intelligence — ${report.opportunity.primary_product} opportunity (score ${report.opportunity.opportunity_score}).`,
      } as never).select("id").maybeSingle();
      if (error) throw error;
      const dealId = (data as { id: string } | null)?.id;
      if (dealId) {
        setActiveDealId(dealId);
        queryClient.invalidateQueries({ queryKey: ["deals"] });
        toast.success("Deal card created");
        navigate("/deals");
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not create deal");
    } finally {
      setCreating(false);
    }
  };

  const exportPdf = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const { buildPropertyIntelPdf, propertyIntelPdfFilename } = await import("@/lib/pdf/propertyIntel");
      const { doc } = await buildPropertyIntelPdf(report);
      doc.save(propertyIntelPdfFilename(report));
      toast.success("PDF exported");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-display font-extrabold">
              Property Intelligence
            </h1>
          </div>
          {report && (
            <div className="flex items-center gap-2">
              <button onClick={createDeal} disabled={creating || report.info.do_not_knock}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/20 disabled:opacity-60">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                {creating ? "Creating…" : "Create deal"}
              </button>
              <button onClick={exportPdf} disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {exporting ? "Building…" : "Export PDF"}
              </button>
              <button onClick={() => setReport(null)}
                className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-muted/40 px-3 py-1.5 text-[12px] font-semibold hover:bg-muted/60">
                <ArrowLeft className="h-3.5 w-3.5" /> New search
              </button>
            </div>
          )}
        </div>

        {!report && <PropertySearch onSearch={runSearch} loading={loading} />}
        {report && <PropertyIntelReportView report={report} />}
      </main>
    </div>
  );
}
