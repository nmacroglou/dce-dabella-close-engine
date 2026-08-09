import { useState } from "react";
import { FileText, ExternalLink, Download, BookOpen, Thermometer, ChevronDown, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

export default function CoolLifeResourcesPanel() {
  const [proofOpen, setProofOpen] = useState(true);
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="space-y-4">
      <div className="card-elevated-lg p-5">
        <button
          onClick={() => setProofOpen(!proofOpen)}
          className="w-full flex items-center gap-2 mb-3 text-left"
        >
          <Thermometer className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
            Thermal Proof — Before vs. After
          </h4>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${proofOpen ? "rotate-180" : ""}`} />
        </button>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Same wall, same sun. Coated surface reads roughly 30–35°F cooler — show this when the homeowner questions energy savings.
        </p>

        {proofOpen && (
          <div className="space-y-3 animate-fade-in">
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="block w-full overflow-hidden rounded-xl border border-hairline bg-black"
              aria-label="Open thermal proof image larger"
            >
              <img
                src={thermalProof.url}
                alt="Cool Life Coating before and after CoolWall: exterior photo above and thermal camera image below showing surface temperature dropping from about 135.7°F to 98.8°F"
                loading="lazy"
                className="w-full h-auto object-contain"
              />
            </button>

            <div className="rounded-xl bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">Read the numbers out loud</p>
              <p>• Uncoated stucco: <span className="font-bold text-foreground">135.7°F</span></p>
              <p>• Cool Life® coated: <span className="font-bold text-foreground">98.8°F</span></p>
              <p>• Delta: <span className="font-bold text-foreground">~37°F</span> cooler wall surface</p>
              <p>• Tap the image for a larger view</p>
            </div>
          </div>
        )}

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
                        src={thermalProof.url}
                        alt="Cool Life thermal comparison, enlarged"
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
    </div>
  );
}

