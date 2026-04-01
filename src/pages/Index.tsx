import { useCloseEngine } from "@/hooks/useCloseEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalculatorTab from "@/components/engine/CalculatorTab";
import PresentationTab from "@/components/engine/PresentationTab";
import ObjectionsTab from "@/components/engine/ObjectionsTab";
import ClosingStackTab from "@/components/engine/ClosingStackTab";
import CoachModeTab from "@/components/engine/CoachModeTab";
import { Calculator, Presentation, ShieldAlert, Layers, Brain } from "lucide-react";
import dabellaLogo from "@/assets/dabella-logo.png";

const TABS = [
  { value: "calculator", label: "Calculator", icon: Calculator },
  { value: "presentation", label: "Presentation", icon: Presentation },
  { value: "objections", label: "Objections", icon: ShieldAlert },
  { value: "closing", label: "Closing Stack", icon: Layers },
  { value: "coach", label: "Coach Mode", icon: Brain },
] as const;

export default function Index() {
  const { state, update, computed, coachingTip } = useCloseEngine();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={dabellaLogo} alt="DaBella" className="h-9 w-auto" />
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-display font-extrabold text-foreground tracking-tight leading-none">
                Close Engine
              </h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Inspection → Close Assistant
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            iPad Field App
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-5">
        <Tabs value={state.activeTab} onValueChange={(v) => update("activeTab", v)} className="w-full">
          <TabsList className="w-full h-14 p-1.5 bg-card border border-border rounded-2xl mb-6 grid grid-cols-5">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-2 transition-all"
              >
                <Icon className="h-4 w-4" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="calculator"><CalculatorTab state={state} computed={computed} update={update} /></TabsContent>
          <TabsContent value="presentation"><PresentationTab state={state} computed={computed} update={update} /></TabsContent>
          <TabsContent value="objections"><ObjectionsTab state={state} computed={computed} update={update} /></TabsContent>
          <TabsContent value="closing"><ClosingStackTab state={state} computed={computed} update={update} /></TabsContent>
          <TabsContent value="coach"><CoachModeTab state={state} coachingTip={coachingTip} update={update} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
