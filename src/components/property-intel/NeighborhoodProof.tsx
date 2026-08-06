import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  lat: number | null;
  lng: number | null;
  street: string;
}

const RADIUS_MI = 1.5;

function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function NeighborhoodProof({ lat, lng, street }: Props) {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["neighborhood-proof", user?.id, lat, lng],
    enabled: !!user && lat !== null && lng !== null,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, address, stage, closed_at, lat, lng")
        .eq("rep_id", user!.id)
        .not("lat", "is", null)
        .not("lng", "is", null);
      if (error) throw error;
      return (data ?? [])
        .map((d) => ({ ...d, miles: milesBetween(lat!, lng!, d.lat as number, d.lng as number) }))
        .filter((d) => d.miles <= RADIUS_MI)
        .sort((a, b) => a.miles - b.miles);
    },
  });

  if (lat === null || lng === null) return null;

  const nearby = data ?? [];
  const won = nearby.filter((d) => d.stage === "won");
  const active = nearby.filter((d) => !["won", "lost", "disqualified"].includes(d.stage as string));

  const line = won.length
    ? `We've already completed ${won.length} home${won.length === 1 ? "" : "s"} within about a mile and a half of here${
        active.length ? `, and we're working with ${active.length} more right now` : ""
      } — that's why our crew is in the neighborhood this week.`
    : active.length
      ? `We're working with ${active.length} homeowner${active.length === 1 ? "" : "s"} within a mile and a half of here right now — that's why I'm on ${street} today.`
      : `You'd be our first home on ${street} — which means I can get the crew and the schedule built around you instead of the other way around.`;

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-display font-bold uppercase tracking-[0.14em]">Neighborhood proof</h3>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(line);
            toast.success("Proof line copied");
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] font-semibold hover:bg-muted/40"
        >
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Within 1.5 mi", value: nearby.length },
          { label: "Completed", value: won.length },
          { label: "In progress", value: active.length },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-hairline bg-muted/20 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-lg font-display font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <p className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-[12px] text-foreground/90">{line}</p>

      {nearby.length > 0 && (
        <ul className="mt-3 space-y-1">
          {nearby.slice(0, 5).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="truncate text-muted-foreground">{d.address ?? "Address pending"}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {d.miles.toFixed(1)} mi · {String(d.stage).replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
