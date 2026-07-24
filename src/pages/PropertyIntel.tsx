import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import PropertySearch from "@/components/property-intel/PropertySearch";
import PropertyIntelReportView from "@/components/property-intel/PropertyIntelReport";
import { generateReport } from "@/lib/propertyIntel/generateReport";
import type { PropertyIntelReport } from "@/lib/propertyIntel/types";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Search } from "lucide-react";

export default function PropertyIntel() {
  const { user } = useAuth();
  const [report, setReport] = useState<PropertyIntelReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async (query: string) => {
    setLoading(true);
    // Simulate provider round-trip so the UI feels real.
    await new Promise((r) => setTimeout(r, 550));
    const first = (user?.user_metadata?.full_name || user?.email || "").split(/[ @]/)[0] || "Nik";
    setReport(generateReport(query, first));
    setLoading(false);
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
            <button onClick={() => setReport(null)}
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-muted/40 px-3 py-1.5 text-[12px] font-semibold hover:bg-muted/60">
              <ArrowLeft className="h-3.5 w-3.5" /> New search
            </button>
          )}
        </div>

        {!report && <PropertySearch onSearch={runSearch} loading={loading} />}
        {report && <PropertyIntelReportView report={report} />}
      </main>
    </div>
  );
}
