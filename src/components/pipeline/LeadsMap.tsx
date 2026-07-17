/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import { useDeals } from "@/hooks/useDeals";
import { useAllProfiles, buildProfileMap } from "@/hooks/useProfiles";
import { useIsAdmin } from "@/hooks/useUserRole";
import { STAGE_LABELS, type DealStage } from "@/types/deal";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Category = "stage" | "lead_source" | "product";

// Color per category value (hex — used inside Google Maps SVG icon).
const STAGE_HEX: Record<DealStage, string> = {
  inspecting: "#94a3b8",
  presented: "#3b82f6",
  follow_up: "#f59e0b",
  won: "#22c55e",
  lost: "#ef4444",
  disqualified: "#64748b",
};

const SOURCE_HEX: Record<string, string> = {
  internet: "#3b82f6",
  canvass: "#22c55e",
  self_gen: "#f59e0b",
  referral: "#a855f7",
  other: "#94a3b8",
};

const PRODUCT_HEX: Record<string, string> = {
  roofing: "#ef4444",
  windows: "#3b82f6",
  siding: "#f59e0b",
  gutters: "#22c55e",
  bath: "#a855f7",
  solar: "#eab308",
  other: "#94a3b8",
};

function labelize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

let googleMapsPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window !== "undefined" && (window as any).google?.maps) {
    return Promise.resolve((window as any).google);
  }
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const tracking = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) {
      reject(new Error("Google Maps browser key missing"));
      return;
    }
    (window as any).__initLeadsMap = () => resolve((window as any).google);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initLeadsMap${tracking ? `&channel=${tracking}` : ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return googleMapsPromise;
}

function pinIcon(google: typeof globalThis.google, hex: string) {
  return {
    path: "M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z",
    fillColor: hex,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 2.2,
    anchor: new google.maps.Point(12, 22),
  } as google.maps.Symbol;
}

export default function LeadsMap() {
  const { data: deals = [], refetch } = useDeals();
  const { isAdmin } = useIsAdmin();
  const { data: profiles = [] } = useAllProfiles(isAdmin);
  const profileMap = useMemo(() => buildProfileMap(profiles), [profiles]);

  const [category, setCategory] = useState<Category>("stage");
  const [ready, setReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const geocoded = useMemo(
    () => deals.filter((d) => typeof d.lat === "number" && typeof d.lng === "number"),
    [deals],
  );
  const missing = deals.filter((d) => d.address && (d.lat == null || d.lng == null)).length;

  // Init map (centered on Salt Lake Valley by default; will fit bounds when markers exist)
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(mapEl.current, {
          center: { lat: 40.72, lng: -111.9 },
          zoom: 11,
          tilt: 45,
          heading: 0,
          mapTypeId: "hybrid",
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          rotateControl: true,
          gestureHandling: "greedy",
        });
        setReady(true);
      })
      .catch((e) => toast.error(e.message || "Google Maps failed to load"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Render markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = (window as any).google as typeof globalThis.google;

    // Clear old
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    geocoded.forEach((d) => {
      let hex = "#94a3b8";
      let catLabel = "";
      if (category === "stage") {
        hex = STAGE_HEX[d.stage] || hex;
        catLabel = STAGE_LABELS[d.stage];
      } else if (category === "lead_source") {
        const src = (d.lead_source || "other").toLowerCase();
        hex = SOURCE_HEX[src] || SOURCE_HEX.other;
        catLabel = labelize(src);
      } else {
        const p = (d.products?.[0] || "other").toLowerCase();
        hex = PRODUCT_HEX[p] || PRODUCT_HEX.other;
        catLabel = d.products?.length ? d.products.map(labelize).join(", ") : "Other";
      }
      const pos = { lat: d.lat as number, lng: d.lng as number };
      const marker = new google.maps.Marker({
        position: pos,
        map: mapRef.current!,
        title: d.homeowner1 || d.address || "Deal",
        icon: pinIcon(google, hex),
      });
      const rep = profileMap.get(d.rep_id);
      const info = new google.maps.InfoWindow({
        content: `<div style="font-family:Inter,sans-serif;color:#0b1220;max-width:220px">
            <div style="font-weight:700;font-size:13px;margin-bottom:2px">${escapeHtml(d.homeowner1 || "Untitled")}</div>
            <div style="font-size:11px;color:#475569;margin-bottom:4px">${escapeHtml(d.address || "")}</div>
            <div style="font-size:11px"><b>${escapeHtml(catLabel)}</b></div>
            ${isAdmin && rep ? `<div style="font-size:11px;color:#475569;margin-top:2px">Rep: ${escapeHtml(rep.display_name || rep.email || "")}</div>` : ""}
          </div>`,
      });
      marker.addListener("click", () => info.open({ map: mapRef.current!, anchor: marker }));
      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (geocoded.length > 0) {
      mapRef.current.fitBounds(bounds, 80);
      const listener = google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
        const z = mapRef.current?.getZoom() ?? 11;
        if (z > 16) mapRef.current?.setZoom(16);
        if (z < 4) mapRef.current?.setZoom(11);
      });
      if (geocoded.length === 1) mapRef.current.setZoom(15);
      // eslint-disable-next-line no-console
      console.log(`[LeadsMap] rendered ${markersRef.current.length} markers for ${geocoded.length} deals`);
      void listener;
    } else {
      // eslint-disable-next-line no-console
      console.log(`[LeadsMap] no geocoded deals to render (total deals: ${deals.length})`);
    }
  }, [ready, geocoded, category, isAdmin, profileMap]);

  async function runGeocode() {
    setGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-deals", { body: {} });
      if (error) throw error;
      toast.success(`Geocoded ${data?.updated ?? 0} deal${data?.updated === 1 ? "" : "s"}`);
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || "Geocode failed");
    } finally {
      setGeocoding(false);
    }
  }

  // Legend items for the currently-selected category
  const legend = useMemo(() => {
    if (category === "stage") {
      return (Object.keys(STAGE_HEX) as DealStage[]).map((k) => ({
        label: STAGE_LABELS[k],
        hex: STAGE_HEX[k],
      }));
    }
    const src = category === "lead_source" ? SOURCE_HEX : PRODUCT_HEX;
    return Object.entries(src).map(([k, hex]) => ({ label: labelize(k), hex }));
  }, [category]);

  return (
    <section className="card-elevated-lg p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Leads Map · 3D
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {geocoded.length} shown{missing > 0 ? ` · ${missing} need geocoding` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-hairline bg-background/40 p-0.5">
            {(["stage", "lead_source", "product"] as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  category === c
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "stage" ? "Stage" : c === "lead_source" ? "Source" : "Product"}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={runGeocode} disabled={geocoding}>
            {geocoding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span className="ml-1.5">{missing > 0 ? `Geocode ${missing}` : "Re-geocode"}</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={mapEl}
          className="w-full rounded-xl overflow-hidden border border-hairline"
          style={{ height: "70vh", minHeight: 520 }}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-background/85 backdrop-blur border border-hairline px-3 py-2 shadow-md max-w-[240px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Legend
          </div>
          <div className="grid grid-cols-1 gap-1">
            {legend.map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: l.hex }}
                />
                <span className="text-[11px] text-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {geocoded.length === 0 && missing === 0 && (
        <p className="text-xs text-muted-foreground italic mt-3">
          No deals with addresses yet. Add an address to a deal, then click Geocode.
        </p>
      )}
    </section>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
