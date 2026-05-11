import { memo } from "react";
import dabellaLogo from "@/assets/dabella-logo.png";

export interface PresentationHeaderProps<S extends string> {
  stages: readonly S[];
  stageLabels: Record<S, string>;
  stage: S;
  canNavigate: (s: S) => boolean;
  onStageClick: (s: S) => void;
  title?: string;
  subtitle?: string;
}

function PresentationHeaderImpl<S extends string>({
  stages,
  stageLabels,
  stage,
  canNavigate,
  onStageClick,
  title,
  subtitle,
}: PresentationHeaderProps<S>) {
  return (
    <header className="text-center pt-8 pb-4 px-6">
      <img src={dabellaLogo} alt="DaBella" className="h-10 w-auto mx-auto mb-4" />

      <nav className="flex items-center justify-center gap-2 mb-5">
        {stages.map((s, i) => {
          const isActive = stage === s;
          const disabled = !canNavigate(s);
          return (
            <button
              key={s}
              onClick={() => !disabled && onStageClick(s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : disabled
                  ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isActive ? "bg-primary-foreground/20" : "bg-border"
                }`}
              >
                {i + 1}
              </span>
              {stageLabels[s]}
            </button>
          );
        })}
      </nav>

      {(title || subtitle) && (
        <div className="animate-fade-in">
          {title && (
            <h1 className="text-display-md font-display text-foreground mb-1">{title}</h1>
          )}
          {subtitle && (
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
}

export default memo(PresentationHeaderImpl) as typeof PresentationHeaderImpl;
