import { useState, useRef, useEffect } from "react";
import { FileText, ExternalLink, Download, BookOpen, Thermometer, X, ZoomIn, ZoomOut, RotateCcw, Maximize } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import thermalProof from "@/assets/coolwall-thermal-before-after.png.asset.json";

const RESOURCES = [
  {
    label: "Cool Life Presentation",
    description: "Cool Life Presentation 2021 · PDF",
    filename: "Cool-Life-Presentation-2021.pdf",
    url: "https://lifetimepluscoatings.com/wp-content/uploads/2021/09/Cool-Life-Presentation-2021.pdf",
  },
  {
    label: "Cool Life Reference Manual",
    description: "Product Reference Manual · PDF",
    filename: "Cool-Life-Product-Reference-Manual.pdf",
    url: "https://lifetimepluscoatings.com/wp-content/uploads/2021/09/Cool-Life-Product-Reference-Manual.pdf",
  },
  {
    label: "Demo Kit Training Manual",
    description: "Demo Kit Training Manual 2019 · PDF",
    filename: "Demo-Kit-Training-Manual-2019.pdf",
    url: "https://lifetimepluscoatings.com/wp-content/uploads/2021/09/Demo-Kit-Training-Manual-2019.pdf",
  },
  {
    label: "Exterior Inspection Presentation",
    description: "Exterior Inspection PowerPoint 2021 · PDF",
    filename: "Exterior-Inspection-Power-Point-2021.pdf",
    url: "https://lifetimepluscoatings.com/wp-content/uploads/2021/09/Exterior-Inspection-Power-Point-2021.pdf",
  },
];

const RESOURCES_PAGE = "https://lifetimepluscoatings.com/resources/";

function requestFullscreen(el: HTMLElement) {
  const method =
    el.requestFullscreen ||
    // @ts-ignore
    (el as any).webkitRequestFullscreen ||
    // @ts-ignore
    (el as any).mozRequestFullScreen ||
    // @ts-ignore
    (el as any).msRequestFullscreen;
  return method?.call(el);
}

function exitFullscreen() {
  const doc = document as any;
  const method =
    document.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.msExitFullscreen;
  return method?.call(document);
}

function isFullscreen() {
  const doc = document as any;
  return !!(
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export default function CoolLifeResourcesPanel() {
  const [open, setOpen] = useState(false);
  const [fsOpen, setFsOpen] = useState(false);
  const fsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChange = () => {
      setFsOpen(isFullscreen());
      if (!isFullscreen()) setOpen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    document.addEventListener("mozfullscreenchange", onChange);
    document.addEventListener("MSFullscreenChange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
      document.removeEventListener("mozfullscreenchange", onChange);
      document.removeEventListener("MSFullscreenChange", onChange);
    };
  }, []);

  const openFullscreen = async () => {
    setOpen(true);
    if (fsRef.current) {
      try {
        await requestFullscreen(fsRef.current);
      } catch {
        // Browser fullscreen unavailable; fallback to dialog-based fullscreen
      }
    }
  };

  const closeFullscreen = () => {
    if (isFullscreen()) {
      exitFullscreen();
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="card-elevated-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          Cool Life® Resources
        </h4>
        <a
          href={RESOURCES_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          aria-label="Open Lifetime Plus Coatings resources page"
        >
          Source
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Official Lifetime Plus Coatings training and presentation library.
      </p>

      <div className="mb-4 rounded-xl border border-hairline bg-muted/20 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Thermometer className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-foreground">Thermal proof — before vs. after Cool Life</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              onClick={openFullscreen}
              className="group relative block w-full text-left"
              aria-label="Open full-screen thermal proof image"
            >
              <img
                src={thermalProof.url}
                alt="Cool Life Coating before and after CoolWall: exterior photo above and thermal camera image below showing surface temperature dropping from about 135.7°F to 98.8°F"
                loading="lazy"
                className="w-full rounded-lg border border-hairline transition-transform group-hover:scale-[1.01]"
              />
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize className="h-3 w-3" />
                View full screen
              </span>
            </button>
          </DialogTrigger>
          <DialogContent
            ref={fsRef}
            className="fixed inset-0 z-50 max-w-none max-h-none w-screen h-screen translate-x-0 translate-y-0 border-0 bg-black p-0 shadow-none rounded-none data-[state=open]:animate-none data-[state=closed]:animate-none [&>button]:hidden"
            aria-describedby="thermal-proof-caption"
          >
            <div className="relative h-full w-full overflow-hidden">
              <button
                type="button"
                onClick={closeFullscreen}
                className="absolute right-4 top-4 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close full-screen image"
              >
                <X className="h-5 w-5" />
              </button>
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={5}
                wheel={{ step: 0.15, disabled: false }}
                pinch={{ disabled: false }}
                panning={{ disabled: false }}
                doubleClick={{ disabled: true }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute left-4 top-4 z-20 flex items-center gap-1 rounded-lg bg-black/60 p-1">
                      <button
                        type="button"
                        onClick={() => zoomIn()}
                        className="rounded-md p-2 text-white hover:bg-white/10"
                        aria-label="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => zoomOut()}
                        className="rounded-md p-2 text-white hover:bg-white/10"
                        aria-label="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => resetTransform()}
                        className="rounded-md p-2 text-white hover:bg-white/10"
                        aria-label="Reset zoom"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                    <TransformComponent
                      wrapperClass="h-full w-full cursor-grab active:cursor-grabbing"
                      contentClass="h-full w-full"
                    >
                      <img
                        src={thermalProof.url}
                        alt="Cool Life Coating before and after CoolWall: full screen thermal comparison"
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
            <p id="thermal-proof-caption" className="sr-only">
              Same wall, same sun. Coated surface reads roughly 30–35°F cooler — use this at the table when the homeowner
              questions energy savings.
            </p>
          </DialogContent>
        </Dialog>
        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
          Same wall, same sun. Coated surface reads roughly 30–35°F cooler — use this at the table when the homeowner
          questions energy savings.
        </p>
      </div>

      <div className="space-y-2">
        {RESOURCES.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-3 rounded-xl border border-hairline bg-muted/20 p-3 hover:border-primary/40 transition-all"
          >
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{r.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{r.description}</p>
            </div>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-hairline bg-card text-foreground hover:bg-muted/50 transition-colors"
              aria-label={`Open ${r.label}`}
              title="Open"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={r.url}
              download={r.filename}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-hairline bg-card text-foreground hover:bg-muted/50 transition-colors"
              aria-label={`Download ${r.label}`}
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}

      </div>
    </div>
  );
}
