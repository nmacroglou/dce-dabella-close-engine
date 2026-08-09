import { useState } from "react";
import { Star, ExternalLink, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import reviewsFlyer from "@/assets/dabella-reviews-qr.png.asset.json";

const REVIEW_LINKS = [
  { label: "Google", href: "https://www.google.com/search?q=DaBella+Phoenix+reviews" },
  { label: "Better Business Bureau", href: "https://www.bbb.org/search?find_text=DaBella" },
  { label: "Angi", href: "https://www.angi.com/companylist/us/az/phoenix/dabella-reviews.htm" },
  { label: "Birdeye", href: "https://reviews.birdeye.com/dabella" },
  { label: "HomeAdvisor", href: "https://www.homeadvisor.com/rated.DaBella.html" },
];

export default function ReviewsPanel() {
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="card-elevated-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-4 w-4 text-warning" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          Leave a Review — QR Sheet
        </h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Hand the iPad to the homeowner after install sign-off. Tap the sheet for a full-screen, scannable view.
      </p>

      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="block w-full overflow-hidden rounded-xl border border-hairline bg-white"
        aria-label="Open review QR sheet larger"
      >
        <img
          src={reviewsFlyer.url}
          alt="DaBella review request sheet with QR codes for Google, BBB, Angi, Birdeye and HomeAdvisor"
          loading="lazy"
          className="w-full h-auto object-contain"
        />
      </button>

      <div className="mt-3 grid grid-cols-1 gap-1.5">
        {REVIEW_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-hairline bg-muted/20 px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 transition-colors"
          >
            {l.label}
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        ))}
      </div>

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] border-0 bg-black p-0 [&>button]:hidden">
          <div className="relative h-full w-full overflow-hidden">
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              aria-label="Close image"
            >
              <X className="h-5 w-5" />
            </button>
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={6} doubleClick={{ disabled: true }}>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-lg bg-black/60 p-1">
                    <button type="button" onClick={() => zoomIn()} className="rounded-md p-2 text-white hover:bg-white/10" aria-label="Zoom in">
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => zoomOut()} className="rounded-md p-2 text-white hover:bg-white/10" aria-label="Zoom out">
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => resetTransform()} className="rounded-md p-2 text-white hover:bg-white/10" aria-label="Reset zoom">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                  <TransformComponent wrapperClass="!h-full !w-full cursor-grab active:cursor-grabbing" contentClass="!h-full !w-full">
                    <img
                      src={reviewsFlyer.url}
                      alt="DaBella review QR sheet, enlarged"
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
