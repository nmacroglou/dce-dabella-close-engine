import { useState } from "react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import PropertySearch from "@/components/property-intel/PropertySearch";
import PropertyIntelReportView from "@/components/property-intel/PropertyIntelReport";
import { generateReport } from "@/lib/propertyIntel/generateReport";
import type { PropertyIntelReport } from "@/lib/propertyIntel/types";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Download, Loader2, Search } from "lucide-react";

export default function PropertyIntel() {
  const { user } = useAuth();
  const [report, setReport] = useState<PropertyIntelReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const runSearch = async (query: string) => {
    setLoading(true);
    const first = (user?.user_metadata?.full_name || user?.email || "").split(/[ @]/)[0] || "Nik";
    try {
      const r = await generateReport(query, first);
      setReport(r);
    } finally {
      setLoading(false);
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
