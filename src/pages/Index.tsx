import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCloseEngine } from "@/hooks/useCloseEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Presentation, ShieldAlert, Layers, Brain, Loader2, BookOpen, DollarSign, ClipboardCheck, Sparkles, Camera } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ActiveDealBanner from "@/components/ActiveDealBanner";
import { useT } from "@/contexts/LanguageContext";

const CalculatorTab = lazy(() => import("@/components/engine/CalculatorTab"));
const PresentationTab = lazy(() => import("@/components/engine/PresentationTab"));
const ObjectionsTab = lazy(() => import("@/components/engine/ObjectionsTab"));
const ClosingStackTab = lazy(() => import("@/components/engine/ClosingStackTab"));
const CoachModeTab = lazy(() => import("@/components/engine/CoachModeTab"));
const PlaybookTab = lazy(() => import("@/components/engine/PlaybookTab"));
const CommissionTab = lazy(() => import("@/components/engine/CommissionTab"));
const PostCloseTab = lazy(() => import("@/components/engine/PostCloseTab"));
const VisionTab = lazy(() => import("@/components/engine/VisionTab"));
const InspectionTab = lazy(() => import("@/components/engine/InspectionTab"));

const useTabs = () => {
  const t = useT();
  return [
    { value: "playbook", label: t("Playbook", "Manual"), icon: BookOpen },
    { value: "calculator", label: t("Calculator", "Calculadora"), icon: Calculator },
    { value: "inspection", label: t("Inspection", "Inspección"), icon: Camera },
    { value: "presentation", label: t("Presentation", "Presentación"), icon: Presentation },
    { value: "vision", label: t("Vision", "Visión"), icon: Sparkles },
    { value: "objections", label: t("Objections", "Objeciones"), icon: ShieldAlert },
    { value: "closing", label: t("Closing Stack", "Cierre"), icon: Layers },
    { value: "postclose", label: t("Post-Close", "Post-Cierre"), icon: ClipboardCheck },
    { value: "commission", label: t("Performance", "Rendimiento"), icon: DollarSign },
    { value: "coach", label: t("Coach Mode", "Modo coach"), icon: Brain },
  ] as const;
};

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );
}

export default function Index() {
  const { state, update, computed, coachingTip, reset } = useCloseEngine();
  const location = useLocation();
  const TABS = useTabs();

  useEffect(() => {
    const tab = (location.state as { tab?: string } | null)?.tab;
    if (tab && tab !== state.activeTab) {
      update("activeTab", tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);


  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <ActiveDealBanner />

        <Tabs value={state.activeTab} onValueChange={(v) => update("activeTab", v)} className="w-full">
          <TabsList className="w-full h-auto sm:h-14 p-1.5 bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl mb-6 grid grid-cols-10 gap-1 shadow-sm">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-xl text-[13px] font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none gap-1.5 transition-all px-2 lg:px-2.5 py-2 sm:py-2.5"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="playbook"><PlaybookTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="calculator"><CalculatorTab state={state} computed={computed} update={update} reset={reset} /></TabsContent>
            <TabsContent value="inspection"><InspectionTab /></TabsContent>
            <TabsContent value="presentation"><PresentationTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="vision"><VisionTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="objections"><ObjectionsTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="closing"><ClosingStackTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="postclose"><PostCloseTab state={state} computed={computed} update={update} /></TabsContent>
            <TabsContent value="commission"><CommissionTab /></TabsContent>
            <TabsContent value="coach"><CoachModeTab state={state} coachingTip={coachingTip} update={update} /></TabsContent>
          </Suspense>
        </Tabs>
      </main>
    </div>
  );
}
