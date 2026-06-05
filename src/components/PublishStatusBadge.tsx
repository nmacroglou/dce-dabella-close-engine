import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2, Radio } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

declare const __BUILD_TIME__: string;

const PUBLISHED_URL = "https://dce-dabella-close-engine.lovable.app";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PublishStatusBadge() {
  const localBuild = typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "";
  const isPreview =
    typeof window !== "undefined" &&
    /(^|\.)id-preview--/.test(window.location.hostname);
  const envLabel = isPreview ? "Preview" : "Live";

  const [prodBuild, setProdBuild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = `${PUBLISHED_URL}/build-info.json?t=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((j: { buildTime?: string }) => {
        if (cancelled) return;
        setProdBuild(j.buildTime ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setErr(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Compare with a small tolerance — same build if timestamps match exactly.
  const inSync = !!prodBuild && !!localBuild && prodBuild === localBuild;
  const previewAhead =
    !!prodBuild && !!localBuild && new Date(localBuild) > new Date(prodBuild);

  let statusIcon = <Loader2 className="h-3 w-3 animate-spin" />;
  let statusClass = "text-muted-foreground";
  let statusText = "Checking…";

  if (!loading) {
    if (err) {
      statusIcon = <AlertTriangle className="h-3 w-3" />;
      statusClass = "text-warning";
      statusText = "Unknown";
    } else if (inSync) {
      statusIcon = <CheckCircle2 className="h-3 w-3" />;
      statusClass = "text-accent";
      statusText = "In sync";
    } else if (previewAhead) {
      statusIcon = <AlertTriangle className="h-3 w-3" />;
      statusClass = "text-warning";
      statusText = "Republish needed";
    } else {
      statusIcon = <AlertTriangle className="h-3 w-3" />;
      statusClass = "text-warning";
      statusText = "Out of sync";
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-hairline bg-muted/50 px-2 py-1 text-[10px] font-semibold">
            <span
              className={`flex items-center gap-1 ${
                isPreview ? "text-primary" : "text-accent"
              }`}
            >
              <Radio className="h-3 w-3" />
              {envLabel}
            </span>
            <span className="h-3 w-px bg-hairline" />
            <span className={`flex items-center gap-1 ${statusClass}`}>
              {statusIcon}
              {statusText}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <div>
              <span className="text-muted-foreground">This build:</span>{" "}
              <span className="font-mono">{formatWhen(localBuild)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Live build:</span>{" "}
              <span className="font-mono">
                {loading ? "checking…" : err ? "unreachable" : formatWhen(prodBuild)}
              </span>
            </div>
            {previewAhead && (
              <div className="text-warning pt-1">
                Preview is newer — click Publish → Update to deploy.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
