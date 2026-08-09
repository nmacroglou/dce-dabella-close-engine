import { FileText, ExternalLink, Download, BookOpen, Thermometer } from "lucide-react";
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
