import { memo } from "react";
import { Check } from "lucide-react";
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
  const activeIdx = stages.indexOf(stage);
  const lastIdx = stages.length - 1;
  const progressPct = lastIdx > 0 ? (activeIdx / lastIdx) * 100 : 0;

  return (
    <header className="text-center pt-8 pb-4 px-6">
      <img src={dabellaLogo} alt="DaBella" className="h-10 w-auto mx-auto mb-4" />

      {/* Connected step rail with animated progress */}
      <nav className="relative mx-auto mb-5 max-w-3xl">
        <div className="relative px-6">
          {/* Track */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-border/70 rounded-full" />
          {/* Progress fill */}
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-[2px] rounded-full transition-all duration-500 ease-out"
            style={{
              width: `calc((100% - 3rem) * ${progressPct} / 100)`,
              background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
              boxShadow: "0 0 12px hsl(var(--primary) / 0.45)",
            }}
          />
          <ol className="relative flex items-center justify-between">
            {stages.map((s, i) => {
              const isActive = stage === s;
              const isDone = i < activeIdx;
              const disabled = !canNavigate(s);
              return (
                <li key={s} className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => !disabled && onStageClick(s)}
                    disabled={disabled}
                    aria-current={isActive ? "step" : undefined}
                    className={`relative h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground scale-110 shadow-[0_6px_22px_-4px_hsl(var(--primary)/0.55)] ring-4 ring-primary/15"
                        : isDone
                        ? "bg-accent text-accent-foreground shadow-md"
                        : disabled
                        ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                        : "bg-card border border-hairline text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : i + 1}
                  </button>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stageLabels[s]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {(title || subtitle) && (
        <div key={title} className="animate-fade-in">
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
