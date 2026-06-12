import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, ImageOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Scene = {
  id: string;
  label: string;
  hint: string;
  buildPrompt: (ctx: { product: string; option: string; material?: string }) => string;
};

const SCENES: Scene[] = [
  {
    id: "curb",
    label: "Curb Appeal · Golden Hour",
    hint: "How the home looks from the street.",
    buildPrompt: ({ product, option, material }) =>
      `Photorealistic exterior architectural rendering, golden-hour lighting, suburban American two-story home with a freshly installed ${product.toLowerCase()}${
        material ? ` (${material})` : ""
      }${option ? ` styled as "${option}"` : ""}. Crisp detail, manicured lawn, warm sky, lifestyle real-estate photography aesthetic, shot on 35mm, shallow depth of field. No people, no text, no watermarks.`,
  },
  {
    id: "storm",
    label: "Protection · The Storm Holds",
    hint: "Peace of mind through bad weather.",
    buildPrompt: ({ product, option }) =>
      `Photorealistic exterior of a cozy American home at night during a heavy rainstorm, dramatic moody lighting, warm interior lights glowing from windows, brand new ${product.toLowerCase()}${option ? ` (${option})` : ""} visibly intact and water shedding cleanly. Cinematic, weatherproof feel, peaceful and protected mood. No people, no text, no watermarks.`,
  },
  {
    id: "legacy",
    label: "Legacy · A Saturday Morning",
    hint: "The everyday payoff, years from now.",
    buildPrompt: ({ product, option }) =>
      `Photorealistic exterior of a beautiful American family home on a calm Saturday morning, soft sunlight, autumn leaves, the ${product.toLowerCase()}${option ? ` (${option})` : ""} looking pristine years after install. Warm, nostalgic, lifestyle magazine quality, shot on medium format. No people, no text, no watermarks.`,
  },
];

interface Props {
  product: string;
  optionName: string;
  material?: string;
}

export default function VisionGallery({ product, optionName, material }: Props) {
  const ctx = useMemo(() => ({ product, option: optionName, material }), [product, optionName, material]);
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [hasRun, setHasRun] = useState(false);

  const generateOne = async (scene: Scene) => {
    setLoading((p) => ({ ...p, [scene.id]: true }));
    setErrors((p) => ({ ...p, [scene.id]: null }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-vision-image", {
        body: { prompt: scene.buildPrompt(ctx) },
      });
      if (error) throw error;
      if (data?.image) {
        setImages((p) => ({ ...p, [scene.id]: data.image }));
      } else {
        throw new Error("No image returned");
      }
    } catch (e) {
      setErrors((p) => ({ ...p, [scene.id]: (e as Error).message || "Failed" }));
    } finally {
      setLoading((p) => ({ ...p, [scene.id]: false }));
    }
  };

  const generateAll = async () => {
    setHasRun(true);
    await Promise.all(SCENES.map(generateOne));
  };

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-bold tracking-tight">Paint the Vision</h3>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">AI renderings</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Quick visuals based on{" "}
            <span className="font-semibold text-foreground">{product}</span>
            {optionName ? <> · <span className="font-semibold text-foreground">{optionName}</span></> : null}
            {material ? <> · {material}</> : null}.
          </p>
        </div>
        <Button onClick={generateAll} size="sm" className="gap-1.5" disabled={Object.values(loading).some(Boolean)}>
          {hasRun ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {hasRun ? "Regenerate" : "Generate visuals"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SCENES.map((s) => {
          const img = images[s.id];
          const isLoading = loading[s.id];
          const err = errors[s.id];
          return (
            <div key={s.id} className="space-y-2">
              <div
                className={cn(
                  "relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40",
                  "flex items-center justify-center"
                )}
              >
                {img && !isLoading && (
                  <img src={img} alt={s.label} className="w-full h-full object-cover" />
                )}
                {isLoading && (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs">Rendering…</span>
                  </div>
                )}
                {!img && !isLoading && !err && (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground/70 px-4 text-center">
                    <ImageOff className="h-6 w-6" />
                    <span className="text-xs">Tap Generate to render</span>
                  </div>
                )}
                {err && !isLoading && (
                  <div className="text-xs text-destructive px-3 text-center">{err}</div>
                )}
                {img && !isLoading && (
                  <button
                    onClick={() => generateOne(s)}
                    className="absolute top-2 right-2 rounded-full bg-background/85 backdrop-blur p-1.5 hover:bg-background transition"
                    aria-label="Regenerate"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.hint}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
