/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import { useDeals } from "@/hooks/useDeals";
import { useAllProfiles, buildProfileMap } from "@/hooks/useProfiles";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useFollowUps } from "@/hooks/useFollowUps";
import { followUpStatus } from "@/types/followUp";
import { STAGE_LABELS, type DealStage, type Deal } from "@/types/deal";
import { PRODUCT_OPTIONS, type ProductType } from "@/data/products";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  DollarSign,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrencyShort } from "@/lib/format";

type Category = "stage" | "lead_source" | "product";

// Pin colors are derived from the app's dark-mode semantic tokens so the map
// matches the stage badges, source chips, and product colors used everywhere else.
const STAGE_HEX: Record<DealStage, string> = {
  inspecting: "#94a3b8", // muted-foreground
  presented: "#3b82f6", // primary
  follow_up: "#fbbf24", // warning
  won: "#22c55e", // success
  lost: "#ef4444", // destructive
  disqualified: "#64748b", // muted-foreground / slate
};

const SOURCE_HEX: Record<string, string> = {
  internet: "#3b82f6", // primary
  canvass: "#22c55e", // success
  self_gen: "#fbbf24", // warning
  referral: "#a855f7", // purple accent
  other: "#94a3b8", // muted
};

const PRODUCT_HEX: Record<ProductType, string> = {
  "Roofing System": "#ef4444",
  Windows: "#3b82f6",
  Siding: "#f97316",
  Stucco: "#a8a29e",
  Paint: "#a855f7",
  Solar: "#eab308",
  Gutters: "#22c55e",
  Bath: "#06b6d4",
};

function productColor(product: string | undefined): string {
  if (!product) return PRODUCT_HEX["Roofing System"];
  const exact = (PRODUCT_OPTIONS as readonly string[]).find((p) => p === product);
  if (exact) return PRODUCT_HEX[exact as ProductType];
  const normalized = product.toLowerCase();
  const partial = PRODUCT_OPTIONS.find((p) =>
    normalized.includes(p.toLowerCase()) || p.toLowerCase().includes(normalized),
  );
  return partial ? PRODUCT_HEX[partial] : "#94a3b8";
}

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

type PinKind = "won" | "overdue" | "due_today" | "normal";

function pinIcon(
  google: typeof globalThis.google,
  hex: string,
  kind: PinKind,
): google.maps.Icon {
  const size = kind === "won" ? 56 : 48;
  const w = kind === "won" ? 44 : 40;
  const stroke = kind === "overdue" ? "#ef4444" : kind === "due_today" ? "#f59e0b" : "#ffffff";
  const strokeW = kind === "overdue" || kind === "due_today" ? 5 : 3;
  const center =
    kind === "won"
      ? `<text x="22" y="26" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="800" fill="${hex}">$</text>`
      : `<circle cx="22" cy="21" r="3.5" fill="${hex}"/>`;
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${size}" viewBox="0 0 44 56">
      <filter id="s" x="-40%" y="-30%" width="180%" height="180%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.55"/>
      </filter>
      <path filter="url(#s)" d="M22 3C12.1 3 4 11.1 4 21c0 12.7 16.1 30.5 17.2 31.8.4.5 1.2.5 1.6 0C23.9 51.5 40 33.7 40 21 40 11.1 31.9 3 22 3Z" fill="${hex}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <circle cx="22" cy="21" r="8.5" fill="#ffffff"/>
      ${center}
    </svg>
  `);
  return {
    url: `data:image/svg+xml;charset=UTF-8,${svg}`,
    scaledSize: new google.maps.Size(w, size),
    anchor: new google.maps.Point(w / 2, size - 4),
  };
}

export type LeadsMapAction =
  | { type: "open"; dealId: string }
  | { type: "draft"; dealId: string; followUpId?: string };

type RangeDays = 7 | 30 | 90 | "all";
const RANGE_OPTIONS: RangeDays[] = [7, 30, 90, "all"];

interface Props {
  onAction?: (a: LeadsMapAction) => void;
}

export default function LeadsMap({ onAction }: Props) {
  const { data: deals = [], refetch } = useDeals();
  const { isAdmin } = useIsAdmin();
  const { data: profiles = [] } = useAllProfiles(isAdmin);
  const profileMap = useMemo(() => buildProfileMap(profiles), [profiles]);
  const { data: followUps = [] } = useFollowUps();

  const [category, setCategory] = useState<Category>("stage");
  const [ready, setReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [query, setQuery] = useState("");
  const [repFilter, setRepFilter] = useState<string>("all");
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [activeStages, setActiveStages] = useState<Set<DealStage>>(
    new Set(["inspecting", "presented", "follow_up", "won"]),
  );

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);

  // Next open follow-up by deal
  const nextByDeal = useMemo(() => {
    const m = new Map<string, ReturnType<typeof followUps.filter>[number]>();
    for (const f of followUps) {
      if (f.completed_at) continue;
      const cur = m.get(f.deal_id);
      if (!cur || new Date(f.due_at) < new Date(cur.due_at)) m.set(f.deal_id, f);
    }
    return m;
  }, [followUps]);

  const geocoded = useMemo(
    () => deals.filter((d) => typeof d.lat === "number" && typeof d.lng === "number"),
    [deals],
  );
  const missing = deals.filter((d) => d.address && (d.lat == null || d.lng == null)).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff = rangeDays === "all" ? 0 : Date.now() - rangeDays * 864e5;
    return geocoded.filter((d) => {
      if (!activeStages.has(d.stage)) return false;
      if (isAdmin && repFilter !== "all" && d.rep_id !== repFilter) return false;
      if (rangeDays !== "all") {
        // Use closed_at for won/lost, else stage change or created_at.
        const ts =
          (d.stage === "won" || d.stage === "lost") && d.closed_at
            ? new Date(d.closed_at).getTime()
            : new Date(d.stage_changed_at || d.created_at).getTime();
        if (ts < cutoff) return false;
      }
      if (!q) return true;
      return (
        (d.homeowner1 || "").toLowerCase().includes(q) ||
        (d.address || "").toLowerCase().includes(q) ||
        (d.products || []).some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [geocoded, activeStages, isAdmin, repFilter, query, rangeDays]);

  // KPIs (computed from filtered/geocoded set)
  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const wonThisMonth = filtered.filter(
      (d) => d.stage === "won" && d.closed_at && new Date(d.closed_at).getTime() >= monthStart,
    );
    const wonRevenue = wonThisMonth.reduce((s, d) => s + (d.closed_amount || 0), 0);
    const pipelineValue = filtered
      .filter((d) => d.stage !== "won" && d.stage !== "lost" && d.stage !== "disqualified")
      .reduce((s, d) => s + (d.price_a || 0), 0);
    let overdue = 0;
    for (const d of filtered) {
      const nf = nextByDeal.get(d.id);
      if (nf && followUpStatus(nf) === "overdue") overdue++;
    }
    return {
      onMap: filtered.length,
      wonCount: wonThisMonth.length,
      wonRevenue,
      pipelineValue,
      overdue,
    };
  }, [filtered, nextByDeal]);

  // Init map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(mapEl.current, {
          center: { lat: 40.72, lng: -111.9 },
          zoom: 11,
          tilt: 0,
          mapTypeId: "roadmap",
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy",
        });
        infoRef.current = new google.maps.InfoWindow();
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

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    filtered.forEach((d) => {
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

      const nf = nextByDeal.get(d.id);
      const status = nf ? followUpStatus(nf) : null;
      const kind: PinKind =
        d.stage === "won"
          ? "won"
          : status === "overdue"
            ? "overdue"
            : status === "due_today"
              ? "due_today"
              : "normal";

      const pos = { lat: d.lat as number, lng: d.lng as number };
      const marker = new google.maps.Marker({
        position: pos,
        map: mapRef.current!,
        title: d.homeowner1 || d.address || "Deal",
        icon: pinIcon(google, hex, kind),
        zIndex: kind === "won" ? 300 : kind === "overdue" ? 250 : kind === "due_today" ? 200 : 100,
      });

      marker.addListener("click", () => {
        if (!infoRef.current) return;
        infoRef.current.setContent(buildInfoHtml(d, catLabel, nf, profileMap, isAdmin));
        infoRef.current.open({ map: mapRef.current!, anchor: marker });
        // Bind actions after DOM is inserted
        setTimeout(() => {
          document
            .querySelector(`[data-lm-open="${d.id}"]`)
            ?.addEventListener("click", () => onAction?.({ type: "open", dealId: d.id }));
          document
            .querySelector(`[data-lm-draft="${d.id}"]`)
            ?.addEventListener("click", () =>
              onAction?.({ type: "draft", dealId: d.id, followUpId: nf?.id }),
            );
        }, 30);
      });
      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (filtered.length > 0) {
      mapRef.current.fitBounds(bounds, 80);
      google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
        const z = mapRef.current?.getZoom() ?? 11;
        if (z > 16) mapRef.current?.setZoom(16);
        if (z < 4) mapRef.current?.setZoom(11);
      });
      if (filtered.length === 1) mapRef.current.setZoom(15);
    }
  }, [ready, filtered, category, isAdmin, profileMap, nextByDeal, onAction]);

  async function runGeocode(force = false) {
    setGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-deals", {
        body: { force },
      });
      if (error) throw error;
      const updated = data?.updated ?? 0;
      const cleared = data?.cleared ?? 0;
      const failed = data?.failed ?? 0;
      toast.success(
        `Geocoded ${updated} deal${updated === 1 ? "" : "s"}` +
          (cleared ? ` · cleared ${cleared} bad pin${cleared === 1 ? "" : "s"}` : "") +
          (failed && !cleared ? ` · ${failed} couldn't be resolved` : ""),
      );
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || "Geocode failed");
    } finally {
      setGeocoding(false);
    }
  }

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

  function toggleStage(s: DealStage) {
    setActiveStages((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  const kpiCards: Array<{ icon: any; label: string; value: string; accent: string }> = [
    { icon: Target, label: "On map", value: String(kpis.onMap), accent: "text-primary" },
    { icon: TrendingUp, label: "Won this month", value: `${kpis.wonCount} · ${formatCurrencyShort(kpis.wonRevenue)}`, accent: "text-success" },
    { icon: AlertCircle, label: "Overdue", value: String(kpis.overdue), accent: kpis.overdue > 0 ? "text-destructive" : "text-success" },
    { icon: DollarSign, label: "Pipeline value", value: formatCurrencyShort(kpis.pipelineValue), accent: "text-warning" },
  ];

  return (
    <section className="space-y-3">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {kpiCards.map((k) => (
          <div key={k.label} className="card-elevated-lg p-3 flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg bg-muted/40 flex items-center justify-center ${k.accent}`}>
              <k.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{k.label}</p>
              <p className={`text-base font-extrabold font-display leading-tight truncate ${k.accent}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-elevated-lg p-3 sm:p-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Territory Map
            </h3>
            {missing > 0 && (
              <span className="text-[11px] text-warning">· {missing} need geocoding</span>
            )}
            <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-hairline bg-background/40 ml-1">
              {RANGE_OPTIONS.map((d) => (
                <button
                  key={String(d)}
                  onClick={() => setRangeDays(d)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                    rangeDays === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d === "all" ? "All" : `${d}d`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search homeowner, address…"
                className="h-8 pl-7 pr-7 text-xs rounded-md border border-hairline bg-background/40 focus:outline-none focus:ring-1 focus:ring-primary w-56"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {isAdmin && profiles.length > 0 && (
              <select
                value={repFilter}
                onChange={(e) => setRepFilter(e.target.value)}
                className="h-8 text-xs rounded-md border border-hairline bg-background/40 px-2"
              >
                <option value="all">All reps</option>
                {profiles.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.display_name || p.email}
                  </option>
                ))}
              </select>
            )}
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
            <Button size="sm" variant="outline" onClick={() => runGeocode(false)} disabled={geocoding}>
              {geocoding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              <span className="ml-1.5">{missing > 0 ? `Geocode ${missing}` : "Re-geocode"}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => runGeocode(true)} disabled={geocoding} title="Re-run geocoding for every deal, including ones already placed">
              <span className="text-[11px]">Fix all locations</span>
            </Button>
          </div>
        </div>

        {/* Stage filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mr-1">Show:</span>
          {(Object.keys(STAGE_HEX) as DealStage[]).map((s) => {
            const on = activeStages.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleStage(s)}
                className={`text-[11px] font-semibold px-2 py-1 rounded-full border transition-all ${
                  on
                    ? "border-transparent text-white"
                    : "border-hairline bg-background/30 text-muted-foreground hover:text-foreground"
                }`}
                style={on ? { backgroundColor: STAGE_HEX[s] } : undefined}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${on ? "bg-white/80" : ""}`}
                  style={!on ? { backgroundColor: STAGE_HEX[s] } : undefined}
                />
                {STAGE_LABELS[s]}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <div
            ref={mapEl}
            className="w-full rounded-xl overflow-hidden border border-hairline"
            style={{ height: "68vh", minHeight: 520 }}
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}

          {/* Legend + pin key */}
          <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-background/90 backdrop-blur border border-hairline px-3 py-2 shadow-md max-w-[240px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {category === "stage" ? "Stage" : category === "lead_source" ? "Source" : "Product"}
            </div>
            <div className="grid grid-cols-1 gap-1 mb-2">
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
            <div className="border-t border-hairline pt-1.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full ring-2 ring-destructive bg-warning" />
                <span className="text-[11px]">Overdue follow-up</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full ring-2 ring-warning bg-primary" />
                <span className="text-[11px]">Due today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success text-[8px] font-black text-white leading-none flex items-center justify-center">$</span>
                <span className="text-[11px]">Won deal</span>
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground italic mt-3">
            {geocoded.length === 0
              ? missing === 0
                ? "No deals with addresses yet. Add an address to a deal, then click Geocode."
                : "You have addresses but no coordinates yet — click Geocode."
              : "No deals match the current filters."}
          </p>
        )}
      </div>
    </section>
  );
}

function buildInfoHtml(
  d: Deal,
  catLabel: string,
  nf: any,
  profileMap: Map<string, any>,
  isAdmin: boolean,
) {
  const rep = profileMap.get(d.rep_id);
  const status = nf ? followUpStatus(nf) : null;
  const statusColor =
    status === "overdue" ? "#ef4444" : status === "due_today" ? "#f59e0b" : "#3b82f6";
  const statusLabel =
    status === "overdue" ? "Overdue" : status === "due_today" ? "Due today" : "Upcoming";
  const stageLabel = STAGE_LABELS[d.stage];
  const money =
    d.stage === "won" && d.closed_amount
      ? `<div style="font-size:12px;font-weight:800;color:#16a34a;margin-top:4px">$${d.closed_amount.toLocaleString()} closed</div>`
      : "";

  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#0b1220;max-width:260px;padding:2px 2px 4px">
      <div style="font-weight:800;font-size:14px;line-height:1.2">${escapeHtml(d.homeowner1 || "Untitled")}</div>
      ${d.address ? `<div style="font-size:11px;color:#475569;margin-top:2px">${escapeHtml(d.address)}</div>` : ""}
      <div style="display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;background:#eef2ff;color:#3730a3;padding:2px 6px;border-radius:6px">${escapeHtml(stageLabel)}</span>
        <span style="font-size:10px;color:#475569">${escapeHtml(catLabel)}</span>
      </div>
      ${money}
      ${
        nf
          ? `<div style="margin-top:8px;padding:6px 8px;border-radius:6px;background:${statusColor}14;border:1px solid ${statusColor}55">
              <div style="font-size:10px;font-weight:700;color:${statusColor};text-transform:uppercase;letter-spacing:.05em">${statusLabel} · Touchpoint ${nf.touchpoint_number}</div>
              <div style="font-size:11px;color:#0b1220;margin-top:1px">${new Date(nf.due_at).toLocaleDateString()}</div>
            </div>`
          : `<div style="margin-top:8px;font-size:11px;color:#64748b;font-style:italic">No open follow-up</div>`
      }
      ${isAdmin && rep ? `<div style="font-size:10px;color:#64748b;margin-top:6px">Rep: ${escapeHtml(rep.display_name || rep.email || "")}</div>` : ""}
      <div style="display:flex;gap:6px;margin-top:8px">
        <button data-lm-open="${d.id}" style="flex:1;background:#2563eb;color:#fff;border:0;border-radius:6px;padding:6px 8px;font-size:11px;font-weight:700;cursor:pointer">Open deal</button>
        <button data-lm-draft="${d.id}" style="flex:1;background:#fff;color:#0b1220;border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;font-size:11px;font-weight:700;cursor:pointer">${nf?.ai_email_body ? "Edit follow-up" : "Draft follow-up"}</button>
      </div>
    </div>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
