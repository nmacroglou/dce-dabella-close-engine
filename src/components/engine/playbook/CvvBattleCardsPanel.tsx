import { FileText, ExternalLink, Download, Shield } from "lucide-react";
import bathAsset from "@/assets/bath-cvv-battle-card.pdf.asset.json";
import roofingAsset from "@/assets/roofing-cvv-battle-card.pdf.asset.json";
import windowAsset from "@/assets/window-cvv-battle-card.pdf.asset.json";

const CARDS = [
  { label: "Roofing", filename: "roofing-cvv-battle-card.pdf", url: roofingAsset.url },
  { label: "Windows", filename: "window-cvv-battle-card.pdf", url: windowAsset.url },
  { label: "Bath", filename: "bath-cvv-battle-card.pdf", url: bathAsset.url },
];

export default function CvvBattleCardsPanel() {
  return (
    <div className="card-elevated-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          CVV Battle Cards
        </h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Competitor value vs. value reference sheets by product line.
      </p>
      <div className="space-y-2">
        {CARDS.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-3 rounded-xl border border-hairline bg-muted/20 p-3 hover:border-primary/40 transition-all"
          >
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{c.label}</p>
              <p className="text-[11px] text-muted-foreground">CVV Battle Card · PDF</p>
            </div>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-hairline bg-card text-foreground hover:bg-muted/50 transition-colors"
              aria-label={`Open ${c.label} battle card`}
              title="Open"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={c.url}
              download={c.filename}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-hairline bg-card text-foreground hover:bg-muted/50 transition-colors"
              aria-label={`Download ${c.label} battle card`}
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
