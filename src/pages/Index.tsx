import { useState, useEffect, lazy, Suspense } from "react";
import { useCloseEngine } from "@/hooks/useCloseEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Presentation, ShieldAlert, Layers, Brain, Moon, Sun, Loader2, BookOpen } from "lucide-react";
import dabellaLogo from "@/assets/dabella-logo.png";

const CalculatorTab = lazy(() => import("@/components/engine/CalculatorTab"));
const PresentationTab = lazy(() => import("@/components/engine/PresentationTab"));
const ObjectionsTab = lazy(() => import("@/components/engine/ObjectionsTab"));
const ClosingStackTab = lazy(() => import("@/components/engine/ClosingStackTab"));
const CoachModeTab = lazy(() => import("@/components/engine/CoachModeTab"));
const PlaybookTab = lazy(() => import("@/components/engine/PlaybookTab"));

const TABS = [
  { value: "playbook", label: "Playbook", icon: BookOpen },
  { value: "calculator", label: "Calculator", icon: Calculator },
  { value: "presentation", label: "Presentation", icon: Presentation },
  { value: "objections", label: "Objections", icon: ShieldAlert },
  { value: "closing", label: "Closing Stack", icon: Layers },
  { value: "coach", label: "Coach Mode", icon: Brain },
] as const;

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );
}

export default function Index() {
  const { state, update, computed, coachingTip, reset } = useCloseEngine();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={dabellaLogo} alt="DaBella" className="h-9 w-auto" />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-display font-extrabold text-foreground tracking-tight leading-none">
                Close Engine
              </h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Inspection → Close Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className="rounded-xl bg-muted border border-border p-2.5 hover:bg-muted/80 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            </button>
            <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              DSE Field App
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <Tabs value={state.activeTab} onValueChange={(v) => update("activeTab", v)} className="w-full">
          <TabsList className="w-full h-auto sm:h-14 p-1.5 bg-card border border-border rounded-2xl mb-6 grid grid-cols-6 gap-1">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1 sm:gap-2 transition-all px-1 sm:px-3 py-2 sm:py-2.5"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="calculator"><CalculatorTab state={state} computed={computed} update={update} reset={reset} /></TabsContent>
            <TabsContent value="presentation"><PresentationTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="objections"><ObjectionsTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="closing"><ClosingStackTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="coach"><CoachModeTab state={state} coachingTip={coachingTip} update={update} /></TabsContent>
          </Suspense>
        </Tabs>
      </main>
    </div>
  );
}
