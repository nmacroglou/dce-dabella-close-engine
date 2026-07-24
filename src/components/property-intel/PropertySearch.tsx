import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, LocateFixed, MapPin, ScanLine, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

interface Recent { id: string; standardized_address: string; created_at: string }

export default function PropertySearch({ onSearch, loading }: {
  onSearch: (query: string) => void; loading: boolean;
}) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("properties")
      .select("id,standardized_address,created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecent(((data ?? []) as unknown) as Recent[]));
  }, [user]);

  const useLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const q = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        setQ(q);
        onSearch(q);
      },
      () => toast.error("Location permission denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = () => {
    if (!q.trim()) return toast.error("Enter an address, ZIP, or parcel number");
    onSearch(q.trim());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card-elevated-lg p-5 sm:p-6">
        <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Address, ZIP, parcel #, or GPS
        </label>
        <div className="mt-2 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="4218 N 7th Ave, Phoenix, AZ 85013"
            className="flex-1 rounded-lg border border-hairline bg-background/60 px-3 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
            autoFocus
          />
          <button
            onClick={submit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Analyze
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={useLocation}
            className="flex items-center justify-center gap-1.5 rounded-md border border-hairline bg-muted/40 px-2 py-2 text-[11px] font-semibold hover:bg-muted/60">
            <LocateFixed className="h-3.5 w-3.5" /> Use location
          </button>
          <button onClick={() => toast.info("Tap the pipeline map to drop a pin (coming soon)")}
            className="flex items-center justify-center gap-1.5 rounded-md border border-hairline bg-muted/40 px-2 py-2 text-[11px] font-semibold hover:bg-muted/60">
            <MapPin className="h-3.5 w-3.5" /> Drop pin
          </button>
          <button onClick={() => {
            const v = prompt("Paste parcel number:") ?? "";
            if (v.trim()) { setQ(v.trim()); onSearch(v.trim()); }
          }}
            className="flex items-center justify-center gap-1.5 rounded-md border border-hairline bg-muted/40 px-2 py-2 text-[11px] font-semibold hover:bg-muted/60">
            <ScanLine className="h-3.5 w-3.5" /> Parcel #
          </button>
          <button onClick={() => toast.info("Photo upload analysed inside the deal Inspection tab")}
            className="flex items-center justify-center gap-1.5 rounded-md border border-hairline bg-muted/40 px-2 py-2 text-[11px] font-semibold hover:bg-muted/60">
            <Camera className="h-3.5 w-3.5" /> Photo
          </button>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="card-elevated p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">
            Recent searches
          </p>
          <ul className="divide-y divide-hairline/50">
            {recent.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => { setQ(r.standardized_address); onSearch(r.standardized_address); }}
                  className="w-full text-left py-2 text-sm hover:text-primary transition"
                >
                  {r.standardized_address}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-elevated p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">
          Try a demo address
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "4218 N 7th Ave, Phoenix, AZ 85013",
            "6811 E Osborn Rd, Scottsdale, AZ 85251",
            "12520 N 32nd St, Phoenix, AZ 85032",
            "3355 E Camelback Rd, Phoenix, AZ 85018",
          ].map((addr) => (
            <button key={addr} onClick={() => { setQ(addr); onSearch(addr); }}
              className="rounded-full border border-hairline bg-muted/30 px-3 py-1 text-[11px] font-semibold hover:border-primary hover:text-primary transition">
              {addr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
