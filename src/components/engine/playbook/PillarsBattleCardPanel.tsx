import { useState } from "react";
import { Maximize2, Download, Heart, X, ZoomIn, ZoomOut, Maximize, Moon, Apple, Droplet, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import pillarsCard from "@/assets/dabella-3-pillars-battlecard.webp";
import pillarsCardFull from "@/assets/dabella-3-pillars-battlecard.png";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const STEP = 0.25;

export default function PillarsBattleCardPanel() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);

  const isFit = zoom === null;
  const current = zoom ?? 1;
  const zoomIn = () => setZoom(Math.min(MAX_ZOOM, +(current + STEP).toFixed(2)));
  const zoomOut = () => {
    const next = +(current - STEP).toFixed(2);
    setZoom(next <= 1 ? null : Math.max(MIN_ZOOM, next));
  };
  const fit = () => setZoom(null);

  return (
    <div className="card-elevated-lg p-5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 mb-3 text-left"
        aria-expanded={expanded}
      >
        <Heart className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          3 Pillars of Power
        </h4>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
      <>


      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 border border-hairline px-2 py-2">
          <Moon className="h-4 w-4 text-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Sleep</span>
          <span className="text-[10px] text-muted-foreground">6–8 hrs</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 border border-hairline px-2 py-2">
          <Apple className="h-4 w-4 text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Eat</span>
          <span className="text-[10px] text-muted-foreground">Fuel up</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 border border-hairline px-2 py-2">
          <Droplet className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Water</span>
          <span className="text-[10px] text-muted-foreground">5 × 32oz</span>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setZoom(null); }}>
        <DialogTrigger asChild>
          <button className="group relative w-full overflow-hidden rounded-xl border border-hairline bg-muted/30 hover:border-primary/40 transition-all pressable">
            <img
              src={pillarsCard}
              alt="DaBella 3 Pillars of Power battle card — Sleep, Eat, Water"
              className="w-full h-auto"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-hairline overflow-hidden flex flex-col [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>3 Pillars of Power Battle Card</DialogTitle>
            <DialogDescription>Sleep, eat, water — pre-appointment readiness check.</DialogDescription>
          </VisuallyHidden>

          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-card/50 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Heart className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">3 Pillars of Power</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2 truncate">
                Sleep · Eat · Water — before every crucial conversation
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex items-center rounded-lg border border-hairline bg-card overflow-hidden">
                <button onClick={zoomOut} disabled={isFit || current <= MIN_ZOOM} className="inline-flex items-center justify-center px-2.5 py-1.5 text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Zoom out">
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 py-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground border-x border-hairline min-w-[58px] text-center">
                  {isFit ? "Fit" : `${Math.round(current * 100)}%`}
                </span>
                <button onClick={zoomIn} disabled={current >= MAX_ZOOM} className="inline-flex items-center justify-center px-2.5 py-1.5 text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Zoom in">
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
              <button onClick={fit} disabled={isFit} className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <Maximize className="h-3.5 w-3.5" /> Fit
              </button>
              <a href={pillarsCardFull} download="dabella-3-pillars-battlecard.png" className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                <Download className="h-3.5 w-3.5" /> Download
              </a>
              <button onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors" aria-label="Close">
                <X className="h-3.5 w-3.5" /> Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted/20 p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="min-h-full min-w-full flex items-center justify-center">
              <img
                src={pillarsCard}
                alt="DaBella 3 Pillars of Power battle card"
                onClick={() => (isFit ? setZoom(1.5) : fit())}
                style={isFit ? undefined : { width: `${current * 100}%`, maxWidth: "none", height: "auto" }}
                className={isFit ? "max-w-full max-h-[calc(95vh-120px)] w-auto h-auto object-contain rounded-md shadow-2xl cursor-zoom-in" : "rounded-md shadow-2xl cursor-zoom-out"}
              />
            </div>
          </div>

          <div className="px-4 py-2 border-t border-hairline bg-card/50 text-[11px] text-muted-foreground text-center shrink-0">
            Am I rested? Am I fed? Am I hydrated? — If yes to all three, you are cleared for battle.
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Pre-appointment readiness: <span className="font-semibold text-foreground">rested, fed, hydrated</span>. Tap to expand.
      </p>
      </>
      )}
    </div>
  );
}
