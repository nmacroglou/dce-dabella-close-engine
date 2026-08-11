import { Home, ExternalLink } from "lucide-react";
import { useT } from "@/contexts/LanguageContext";

const VIDEO_ID = "8RuwwJSm68g";

export default function RoofResourcesPanel() {
  const t = useT();

  return (
    <div className="card-elevated-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <Home className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          {t("Westlake Royal Newpoint Cool Tile", "Teja Fría Newpoint de Westlake Royal")}
        </h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        {t(
          "Show this on the iPad when positioning concrete tile. Covers the Newpoint profile and Cool Roof performance.",
          "Muestra esto en el iPad al presentar teja de concreto. Cubre el perfil Newpoint y el rendimiento Cool Roof."
        )}
      </p>

      <div className="overflow-hidden rounded-xl border border-hairline bg-black aspect-video">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`}
          title="Westlake Royal Newpoint Cool Tile Roof"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
        />
      </div>

      <a
        href={`https://www.youtube.com/watch?v=${VIDEO_ID}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-between rounded-lg border border-hairline bg-muted/20 px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 transition-colors"
      >
        {t("Open on YouTube", "Abrir en YouTube")}
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </a>
    </div>
  );
}
