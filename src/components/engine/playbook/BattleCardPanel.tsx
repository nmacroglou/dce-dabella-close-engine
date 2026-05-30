import { useState } from "react";
import { Maximize2, Download, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import battleCard from "@/assets/dabella-10-step-battlecard.png";

export default function BattleCardPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-elevated-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          10-Step Battle Card
        </h4>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
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
        <DialogContent className="max-w-[95vw] w-full p-2 sm:p-4">
          <div className="flex justify-end mb-2">
            <a
              href={battleCard}
              download="dabella-10-step-battlecard.png"
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          </div>
          <img
            src={battleCard}
            alt="DaBella 10-Step Sales Method battle card"
            className="w-full h-auto rounded-md"
          />
        </DialogContent>
      </Dialog>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Tap to expand. Reference the homeowner emotional journey and time-in-home close rates.
      </p>
    </div>
  );
}
