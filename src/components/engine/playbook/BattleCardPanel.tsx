import { useState } from "react";
import { Maximize2, Download, BookOpen, X, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import battleCard from "@/assets/dabella-10-step-battlecard.png";

export default function BattleCardPanel() {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="card-elevated-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          10-Step Battle Card
        </h4>
      </div>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setZoomed(false); }}>
        <DialogTrigger asChild>
          <button className="group relative w-full overflow-hidden rounded-xl border border-hairline bg-muted/30 hover:border-primary/40 transition-all pressable">
            <img
              src={battleCard}
              alt="DaBella 10-Step Sales Method battle card"
              className="w-full h-auto"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        </DialogTrigger>
        <DialogContent
          className="max-w-[98vw] w-[98vw] h-[95vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-hairline overflow-hidden flex flex-col [&>button]:hidden"
        >
          <VisuallyHidden>
            <DialogTitle>DaBella 10-Step Battle Card</DialogTitle>
            <DialogDescription>Full-screen reference of the 10-step sales method.</DialogDescription>
          </VisuallyHidden>

          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-card/50 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">10-Step Battle Card</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2 truncate">
                Homeowner emotional journey &amp; time-in-home close rates
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setZoomed((z) => !z)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
                {zoomed ? "Fit" : "Zoom"}
              </button>
              <a
                href={battleCard}
                download="dabella-10-step-battlecard.png"
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" /> Close
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto bg-muted/20 p-4 flex items-start justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <img
              src={battleCard}
              alt="DaBella 10-Step Sales Method battle card"
              onClick={() => setZoomed((z) => !z)}
              className={
                zoomed
                  ? "max-w-none w-auto h-auto rounded-md shadow-2xl cursor-zoom-out"
                  : "max-w-full max-h-full w-auto h-auto object-contain rounded-md shadow-2xl cursor-zoom-in"
              }
            />
          </div>

          <div className="px-4 py-2 border-t border-hairline bg-card/50 text-[11px] text-muted-foreground text-center shrink-0">
            Press <kbd className="px-1.5 py-0.5 rounded border border-hairline bg-muted/50 font-mono">Esc</kbd> or click outside to close · Click image to {zoomed ? "fit" : "zoom"}
          </div>
        </DialogContent>
      </Dialog>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Tap to expand. Reference the homeowner emotional journey and time-in-home close rates.
      </p>
    </div>
  );
}
