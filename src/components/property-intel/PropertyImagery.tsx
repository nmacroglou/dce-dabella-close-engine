import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "@/lib/googleMapsLoader";
import { Camera, Satellite, Loader2, ImageOff, ExternalLink } from "lucide-react";

type View = "street" | "aerial";

/** Compass bearing (deg) from point A to point B. */
function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

interface Props {
  lat: number | null;
  lng: number | null;
  address: string;
}

/**
 * Curb-side + aerial imagery for the searched property.
 * Uses the Maps JS API (Street View panorama + satellite map) with the browser key.
 */
export default function PropertyImagery({ lat, lng, address }: Props) {
  const [view, setView] = useState<View>("street");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStreetView, setHasStreetView] = useState(true);
  const [panoDate, setPanoDate] = useState<string | null>(null);

  const streetRef = useRef<HTMLDivElement>(null);
  const aerialRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (lat == null || lng == null) {
      setLoading(false);
      setError("No coordinates on this property record.");
      return;
    }
    let cancelled = false;
    initialized.current = false;

    loadGoogleMapsApi()
      .then((g) => {
        if (cancelled || initialized.current) return;
        initialized.current = true;
        const center = { lat, lng };

        // Aerial / satellite
        if (aerialRef.current) {
          const map = new g.maps.Map(aerialRef.current, {
            center,
            zoom: 20,
            mapTypeId: g.maps.MapTypeId.SATELLITE,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "cooperative",
          });
          map.setTilt(45);
          new g.maps.Marker({ position: center, map });
        }

        // Street View — snap to the nearest panorama within 80m
        const svc = new g.maps.StreetViewService();
        svc.getPanorama({ location: center, radius: 80, source: g.maps.StreetViewSource.OUTDOOR })
          .then(({ data }) => {
            if (cancelled || !streetRef.current) return;
            const panoLoc = data.location?.latLng;
            const heading = panoLoc ? bearing(panoLoc.lat(), panoLoc.lng(), center.lat, center.lng) : 0;
            new g.maps.StreetViewPanorama(streetRef.current, {
              pano: data.location?.pano,
              pov: { heading, pitch: 0 },
              zoom: 0,
              addressControl: false,
              fullscreenControl: true,
              motionTracking: false,
              motionTrackingControl: false,
            });
            setPanoDate(data.imageDate ?? null);
            setLoading(false);
          })
          .catch(() => {
            if (cancelled) return;
            setHasStreetView(false);
            setView("aerial");
            setLoading(false);
          });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-display font-bold uppercase tracking-[0.14em]">Property imagery</h3>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-hairline bg-muted/20 p-0.5">
          <button
            onClick={() => setView("street")}
            disabled={!hasStreetView}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition disabled:opacity-40 ${
              view === "street" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <Camera className="h-3 w-3" /> Curb
          </button>
          <button
            onClick={() => setView("aerial")}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition ${
              view === "aerial" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <Satellite className="h-3 w-3" /> Aerial
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-hairline bg-muted/20">
        <div className="h-[260px] sm:h-[320px]">
          <div ref={streetRef} className="h-full w-full" style={{ display: view === "street" ? "block" : "none" }} />
          <div ref={aerialRef} className="h-full w-full" style={{ display: view === "aerial" ? "block" : "none" }} />
        </div>

        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 text-[12px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading imagery…
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/80 px-4 text-center">
            <ImageOff className="h-5 w-5 text-muted-foreground" />
            <p className="text-[12px] text-muted-foreground">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {!hasStreetView
            ? "No street-level coverage here — showing aerial only."
            : panoDate
              ? `Curb image captured ${panoDate}. Verify condition on site.`
              : "Verify roof, siding and window condition on site."}
        </p>
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          Open in Maps <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
