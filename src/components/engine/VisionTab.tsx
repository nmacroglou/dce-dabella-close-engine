import { useMemo, useState, useCallback } from "react";

import {
  Sparkles, Home, ShieldCheck, Heart, TrendingUp, Sun, CloudRain,
  Users, Award, ChevronLeft, ChevronRight, Play, RotateCcw, Volume2,
  Camera, Coffee, PartyPopper, Calendar, DollarSign, Loader2, Check, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { EngineTabProps } from "@/types/engine";
import { supabase } from "@/integrations/supabase/client";

// Scene generation — one image per matching moment id
type SceneDef = {
  momentId: string;
  buildPrompt: (ctx: { product: string; option: string; material?: string }) => string;
};
const SCENES: SceneDef[] = [
  {
    momentId: "arrival",
    buildPrompt: ({ product, option, material }) =>
      `Photorealistic exterior architectural rendering, golden-hour lighting, suburban American two-story home with a freshly installed ${product.toLowerCase()}${material ? ` (${material})` : ""}${option ? ` styled as "${option}"` : ""}. Crisp detail, manicured lawn, warm sky, lifestyle real-estate photography aesthetic, shot on 35mm, shallow depth of field. No people, no text, no watermarks.`,
  },
  {
    momentId: "weather",
    buildPrompt: ({ product, option }) =>
      `Photorealistic exterior of a cozy American home at night during a heavy rainstorm, dramatic moody lighting, warm interior lights glowing from windows, brand new ${product.toLowerCase()}${option ? ` (${option})` : ""} visibly intact and water shedding cleanly. Cinematic, weatherproof feel, peaceful and protected mood. No people, no text, no watermarks.`,
  },
  {
    momentId: "family",
    buildPrompt: ({ product, option }) =>
      `Photorealistic exterior of a beautiful American family home on a calm Saturday morning, soft sunlight, autumn leaves, the ${product.toLowerCase()}${option ? ` (${option})` : ""} looking pristine years after install. Warm, nostalgic, lifestyle magazine quality, shot on medium format. No people, no text, no watermarks.`,
  },
];

type PriorityKey = "comfort" | "curb" | "protection" | "legacy";

const PRIORITIES: Array<{
  key: PriorityKey;
  label: string;
  tagline: string;
  icon: typeof Home;
  gradient: string;
  ring: string;
}> = [
  {
    key: "comfort",
    label: "Comfort & Peace of Mind",
    tagline: "How it feels to live inside your new home every day.",
    icon: Heart,
    gradient: "from-rose-500/30 via-orange-500/20 to-amber-500/10",
    ring: "ring-rose-400/40",
  },
  {
    key: "curb",
    label: "Curb Appeal & Pride",
    tagline: "The moment you pull in the driveway and smile.",
    icon: Home,
    gradient: "from-sky-500/30 via-indigo-500/20 to-violet-500/10",
    ring: "ring-sky-400/40",
  },
  {
    key: "protection",
    label: "Protection & Security",
    tagline: "Knowing your family is safe through every season.",
    icon: ShieldCheck,
    gradient: "from-emerald-500/30 via-teal-500/20 to-cyan-500/10",
    ring: "ring-emerald-400/40",
  },
  {
    key: "legacy",
    label: "Value & Legacy",
    tagline: "An asset that pays you back — and outlives the loan.",
    icon: TrendingUp,
    gradient: "from-amber-500/30 via-yellow-500/20 to-lime-500/10",
    ring: "ring-amber-400/40",
  },
];

type Moment = {
  id: string;
  kicker: string;
  headline: (ctx: VisionCtx) => string;
  body: (ctx: VisionCtx) => string;
  talkTrack: (ctx: VisionCtx) => string[];
  icon: typeof Camera;
  gradient: string;
  stat?: (ctx: VisionCtx) => { label: string; value: string };
};

type VisionCtx = {
  firstName: string;
  product: string;
  optionName: string;
  price: number;
  monthly?: number;
};

const BASE_MOMENTS: Moment[] = [
  {
    id: "arrival",
    kicker: "Moment 01 · The Arrival",
    icon: Home,
    gradient: "from-indigo-500/40 via-blue-500/30 to-cyan-400/20",
    headline: (c) => `${c.firstName}, picture pulling in next spring…`,
    body: (c) =>
      `Your new ${c.product.toLowerCase()} is finished. The sun catches it just right. For a second, you just sit in the truck and look at your house.`,
    talkTrack: (c) => [
      `Close your eyes for a second, ${c.firstName}. It's about six weeks from now.`,
      `You pull into the driveway after a long day. You glance up at the roof line.`,
      `That ${c.optionName} looks even better in person than it did on the sample.`,
      `Notice the feeling in your chest right there. That's what we're really buying today.`,
    ],
  },
  {
    id: "weather",
    kicker: "Moment 02 · The First Storm",
    icon: CloudRain,
    gradient: "from-slate-600/40 via-blue-700/30 to-indigo-500/20",
    headline: () => "3 a.m. The wind picks up. You roll over and go back to sleep.",
    body: (c) =>
      `The next morning the neighbors are out checking shingles in the yard. You walk out with coffee and your ${c.product.toLowerCase()} hasn't moved an inch. Golden Pledge. Factory-trained. Done right.`,
    talkTrack: (c) => [
      `Now jump ahead — first real storm of the year.`,
      `Used to be, ${c.firstName}, you'd lie there listening, wondering what was about to fail.`,
      `Tonight you don't. You sleep. Because the system on top of your house was installed by GAF Master Elite — top 2% in the country.`,
      `That's not a feature. That's a feeling. And it shows up every storm for the next 30+ years.`,
    ],
  },
  {
    id: "neighbor",
    kicker: "Moment 03 · The Neighbor Walks Over",
    icon: Users,
    gradient: "from-amber-500/40 via-orange-500/30 to-rose-400/20",
    headline: () => "\"Who did your house?\"",
    body: (c) =>
      `It happens within the first month. Someone stops at the mailbox. They want to know who you used, what it cost, and whether you'd recommend them. You hand them a card. That's pride of ownership.`,
    talkTrack: (c) => [
      `This one always happens — usually within 30 days.`,
      `A neighbor, a coworker, somebody at church says "your house looks incredible — who did it?"`,
      `You get to be the person who knew, who picked right, who didn't settle.`,
      `${c.firstName}, you're not just buying a ${c.product.toLowerCase()}. You're buying the story you get to tell.`,
    ],
  },
  {
    id: "family",
    kicker: "Moment 04 · A Saturday Morning",
    icon: Coffee,
    gradient: "from-emerald-500/40 via-teal-500/30 to-cyan-400/20",
    headline: (c) => `Coffee on the porch. ${c.firstName === "your homeowner" ? "Family" : c.firstName + "'s family"} inside. Nothing on the to-do list.`,
    body: () =>
      `No buckets in the attic. No "we should really get that looked at." Just a normal Saturday in a house that finally takes care of itself.`,
    talkTrack: (c) => [
      `Think about your last five Saturdays. How many of them had a house project on the list?`,
      `Now picture this version: nothing pending. Nothing nagging. The big stuff is handled.`,
      `That's what 'done right, one time' actually buys you — your weekends back.`,
    ],
  },
  {
    id: "legacy",
    kicker: "Moment 05 · 18 Months From Now",
    icon: PartyPopper,
    gradient: "from-purple-500/40 via-fuchsia-500/30 to-pink-400/20",
    headline: () => "An appraiser. A buyer. A daughter moving home.",
    body: (c) =>
      `Whatever the reason — someone walks the property. They look up. And what they see adds real, measurable value. Your ${c.product.toLowerCase()} isn't an expense anymore. It's equity.`,
    talkTrack: (c) => [
      `${c.firstName}, here's where most folks get the math wrong.`,
      `They think of this as a cost. It isn't. It's a transfer of money from your checking account into the appraised value of the house.`,
      `Worst case, you sell. The next owner pays you for what you did today. Best case, you stay, and you enjoy it every single day in between.`,
    ],
  },
  {
    id: "decision",
    kicker: "Moment 06 · The Decision That Made It Real",
    icon: Award,
    gradient: "from-primary/40 via-blue-500/30 to-violet-500/20",
    headline: (c) =>
      c.price > 0
        ? `Today. ${formatCurrency(c.price)}. The day everything above started.`
        : `Today. The day everything above started.`,
    body: (c) =>
      `Every single moment we just walked through — the storm, the neighbor, the Saturday morning, the equity — they all trace back to one decision. The one in front of you, right now.`,
    talkTrack: (c) => [
      `So ${c.firstName} — when you picture all of that... the arrival, the storm, the neighbor, the Saturday, the legacy...`,
      `Is there any part of it that you don't want?`,
      `Because everything I just described — that's not a sales pitch. That's just what happens next, the moment we put pen to paper.`,
      `Let's get you there.`,
    ],
    stat: (c) =>
      c.price > 0
        ? { label: "Today's investment", value: formatCurrency(c.price) }
        : { label: "Today's investment", value: "—" },
  },
];

// Priority-tinted opener inserted in front of the journey
const PRIORITY_OPENERS: Record<PriorityKey, Moment> = {
  comfort: {
    id: "open-comfort",
    kicker: "Your Journey · Comfort",
    icon: Heart,
    gradient: "from-rose-500/40 via-orange-500/30 to-amber-400/20",
    headline: (c) => `${c.firstName}, this one's really about how it feels.`,
    body: () =>
      `Everything we're going to walk through next — the storm, the Saturday morning, the way you sleep — it's all about peace of mind. So let's start there.`,
    talkTrack: (c) => [
      `You told me what matters most isn't the shingle, the window, the panel. It's how your home feels.`,
      `Good. That's what this next five minutes is about. Just close your eyes with me for a second, ${c.firstName}.`,
    ],
  },
  curb: {
    id: "open-curb",
    kicker: "Your Journey · Curb Appeal",
    icon: Home,
    gradient: "from-sky-500/40 via-indigo-500/30 to-violet-400/20",
    headline: (c) => `${c.firstName}, you said the look matters. Let's start there.`,
    body: () =>
      `Pride of ownership isn't a soft thing — it's the single biggest reason homeowners tell us they wish they'd done this sooner.`,
    talkTrack: (c) => [
      `You mentioned the curb appeal piece a couple times. That's not vanity — that's pride.`,
      `So let's start at the curb and walk through what your home becomes.`,
    ],
  },
  protection: {
    id: "open-protection",
    kicker: "Your Journey · Protection",
    icon: ShieldCheck,
    gradient: "from-emerald-500/40 via-teal-500/30 to-cyan-400/20",
    headline: (c) => `${c.firstName}, this is about protecting what's inside.`,
    body: () =>
      `Your home protects your family. Our job is to protect your home. So everything you're about to see is built around that one promise.`,
    talkTrack: (c) => [
      `You said the big driver here is protection — keeping the family, the photos, the memories safe.`,
      `Then this is the right room to be in. Let me walk you through it.`,
    ],
  },
  legacy: {
    id: "open-legacy",
    kicker: "Your Journey · Legacy",
    icon: TrendingUp,
    gradient: "from-amber-500/40 via-yellow-500/30 to-lime-400/20",
    headline: (c) => `${c.firstName}, you're thinking long-term. Let's match that.`,
    body: () =>
      `This decision isn't really about today. It's about what this house is worth in 5, 10, 25 years — and what it does for your family long after the loan is paid off.`,
    talkTrack: (c) => [
      `You think like an owner, not a buyer. So I'm going to talk to you that way.`,
      `Forget the monthly for a second. Let's talk about what this asset becomes.`,
    ],
  },
};

export default function VisionTab({ state }: EngineTabProps) {
  const [priority, setPriority] = useState<PriorityKey | null>(null);
  const [step, setStep] = useState(0);
  const [showTalkTrack, setShowTalkTrack] = useState(true);
  const [customerMode, setCustomerMode] = useState(false);

  // Scene image state — generated up-front, revealed as user reaches each card
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [loadingScenes, setLoadingScenes] = useState<Record<string, boolean>>({});
  const [hasRun, setHasRun] = useState(false);
  const anyLoading = Object.values(loadingScenes).some(Boolean);
  const loadedCount = Object.values(images).filter(Boolean).length;
  const allReady = hasRun && !anyLoading && loadedCount === SCENES.length;

  const ctx = useMemo<VisionCtx>(() => {
    const first = (state.homeowner1 || "").trim().split(/\s+/)[0] || "your homeowner";
    const product = state.products?.[0] || "new system";
    const selected = state.selectedOption;
    const optionName =
      selected === "A" ? state.optionAName :
      selected === "B" ? state.optionBName :
      selected === "C" ? state.optionCName :
      state.optionBName || "your selection";
    const price =
      selected === "A" ? state.priceA :
      selected === "B" ? state.priceB :
      selected === "C" ? state.priceC :
      state.priceB || 0;
    return { firstName: first, product, optionName, price };
  }, [state]);

  const journey = useMemo(() => {
    if (!priority) return BASE_MOMENTS;
    return [PRIORITY_OPENERS[priority], ...BASE_MOMENTS];
  }, [priority]);

  const moment = journey[step];
  const progress = ((step + 1) / journey.length) * 100;

  const reset = () => {
    setPriority(null);
    setStep(0);
  };

  // -------- Landing (priority selection) --------
  if (!priority) {
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-xl p-6 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-violet-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <Badge variant="outline" className="mb-4 border-primary/40 text-primary bg-primary/10 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Art of the Possible
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
              {ctx.firstName === "your homeowner"
                ? "Let's walk them through it."
                : `${ctx.firstName}, let's take a quick walk together.`}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
              Before we talk numbers, I want to show you what life looks like 90 days, 1 year,
              and 10 years from now — once this {ctx.product.toLowerCase()} is on your home.
            </p>
            <p className="text-sm text-muted-foreground mt-3 italic">
              Pick what matters most to {ctx.firstName === "your homeowner" ? "them" : "you"} —
              we'll start there.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRIORITIES.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.key}
                onClick={() => { setPriority(p.key); setStep(0); }}
                className={cn(
                  "group relative overflow-hidden text-left rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 transition-all",
                  "hover:scale-[1.015] hover:border-primary/40 hover:shadow-2xl active:scale-[0.99]",
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 group-hover:opacity-100 transition-opacity", p.gradient)} />
                <div className="relative">
                  <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-xl bg-background/70 backdrop-blur ring-1", p.ring)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold tracking-tight">{p.label}</h3>
                  <p className="mt-1.5 text-sm text-foreground/80">{p.tagline}</p>
                  <div className="mt-4 inline-flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Begin <ChevronRight className="h-4 w-4 ml-0.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Card className="border-border/60 bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <Volume2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">How to run this:</strong> Hand the iPad to the
              customer. Let <em>them</em> pick what matters most. That single tap tells you exactly
              which emotional door to walk through — and the talk track below each moment writes
              itself.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // -------- Journey --------
  const M = moment;
  const Icon = M.icon;
  const stat = M.stat?.(ctx);

  const isRoof = (state.products?.[0] || "").toLowerCase().includes("roof");
  const material = isRoof ? state.roofMaterial : undefined;

  return (
    <div className="space-y-5">
      {/* Customer mode toggle */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge variant={customerMode ? "default" : "secondary"} className="text-[10px] uppercase tracking-wider">
            {customerMode ? "Customer view" : "Rep view"}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {customerMode
              ? "Descriptions & script hidden. Hand the iPad over."
              : "Showing rep-facing descriptions, talk track & step labels."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="customer-mode" className="text-xs font-medium cursor-pointer">Customer mode</Label>
          <Switch id="customer-mode" checked={customerMode} onCheckedChange={setCustomerMode} />
        </div>
      </div>

      {/* Progress + controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium tracking-wide uppercase">
              {customerMode ? `${step + 1} of ${journey.length}` : M.kicker}
            </span>
            {!customerMode && <span>{step + 1} / {journey.length}</span>}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="shrink-0 gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Restart
        </Button>
      </div>

      {/* Cinematic moment card */}
      <div key={M.id} className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-xl">
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", M.gradient)} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />

          {/* Decorative iconography */}
          <div className="absolute -right-10 -top-10 opacity-10">
            <Icon className="h-64 w-64" strokeWidth={1} />
          </div>

          <div className="relative p-6 sm:p-10 min-h-[420px] flex flex-col justify-end">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-background/80 backdrop-blur ring-1 ring-border/60 mb-5">
              <Icon className="h-7 w-7 text-primary" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight max-w-4xl">
              {M.headline(ctx)}
            </h2>

            {!customerMode && (
              <p className="mt-4 text-base sm:text-xl text-foreground/85 max-w-3xl leading-relaxed">
                {M.body(ctx)}
              </p>
            )}

            {stat && (
              <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 self-start">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {stat.label}
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Vision gallery — AI-rendered visuals for the selected product/option */}
      <VisionGallery product={ctx.product} optionName={ctx.optionName} material={material} />

      {/* Talk track (rep-facing) */}
      {!customerMode && (
      <Card className="border-border/60 bg-card/40 backdrop-blur-xl overflow-hidden">
        <button
          onClick={() => setShowTalkTrack(v => !v)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Rep talk track</span>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">say this</Badge>
          </div>
          <ChevronRight className={cn("h-4 w-4 transition-transform", showTalkTrack && "rotate-90")} />
        </button>
        {showTalkTrack && (
          <div className="overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="px-5 pb-5 pt-1 space-y-2.5 border-t border-border/40">
              {M.talkTrack(ctx).map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-[11px] font-mono text-muted-foreground/60 mt-1 shrink-0 w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[15px] leading-relaxed text-foreground/90 italic">
                    "{line}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </Card>
      )}



      {/* Nav */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex gap-1.5">
          {journey.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "bg-primary w-8" : "bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to moment ${i + 1}`}
            />
          ))}
        </div>

        {step < journey.length - 1 ? (
          <Button
            onClick={() => setStep(s => Math.min(journey.length - 1, s + 1))}
            className="gap-1.5"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={reset} variant="outline" className="gap-1.5">
            <Play className="h-4 w-4" /> Run again
          </Button>
        )}
      </div>
    </div>
  );
}
