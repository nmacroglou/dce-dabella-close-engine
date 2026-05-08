import { lazy, Suspense } from "react";
import { useCloseEngine } from "@/hooks/useCloseEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Presentation, ShieldAlert, Layers, Brain, Loader2, BookOpen, DollarSign } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ActiveDealBanner from "@/components/ActiveDealBanner";

const CalculatorTab = lazy(() => import("@/components/engine/CalculatorTab"));
const PresentationTab = lazy(() => import("@/components/engine/PresentationTab"));
const ObjectionsTab = lazy(() => import("@/components/engine/ObjectionsTab"));
const ClosingStackTab = lazy(() => import("@/components/engine/ClosingStackTab"));
const CoachModeTab = lazy(() => import("@/components/engine/CoachModeTab"));
const PlaybookTab = lazy(() => import("@/components/engine/PlaybookTab"));
const CommissionTab = lazy(() => import("@/components/engine/CommissionTab"));

const TABS = [
  { value: "playbook", label: "Playbook", icon: BookOpen },
  { value: "calculator", label: "Calculator", icon: Calculator },
  { value: "presentation", label: "Presentation", icon: Presentation },
  { value: "objections", label: "Objections", icon: ShieldAlert },
  { value: "closing", label: "Closing Stack", icon: Layers },
  { value: "commission", label: "Commission Sheet", icon: DollarSign },
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <ActiveDealBanner />

        <Tabs value={state.activeTab} onValueChange={(v) => update("activeTab", v)} className="w-full">
          <TabsList className="w-full h-auto sm:h-14 p-1.5 bg-card border border-border rounded-2xl mb-6 grid grid-cols-7 gap-1">
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
            <TabsContent value="playbook"><PlaybookTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="calculator"><CalculatorTab state={state} computed={computed} update={update} reset={reset} /></TabsContent>
            <TabsContent value="presentation"><PresentationTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="objections"><ObjectionsTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="closing"><ClosingStackTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="commission"><CommissionTab /></TabsContent>
            <TabsContent value="coach"><CoachModeTab state={state} coachingTip={coachingTip} update={update} /></TabsContent>
          </Suspense>
        </Tabs>
      </main>
    </div>
  );
}
