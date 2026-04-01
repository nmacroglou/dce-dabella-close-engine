import { useCloseEngine } from "@/hooks/useCloseEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalculatorTab from "@/components/engine/CalculatorTab";
import PresentationTab from "@/components/engine/PresentationTab";
import ObjectionsTab from "@/components/engine/ObjectionsTab";
import ClosingStackTab from "@/components/engine/ClosingStackTab";
import CoachModeTab from "@/components/engine/CoachModeTab";
import { Calculator, Presentation, ShieldAlert, Layers, Brain, DollarSign, TrendingUp, Zap, BarChart3 } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function Index() {
  const { state, update, computed, coachingTip } = useCloseEngine();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  DaBella Close Engine
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  iPad Field App
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Inspection → Close Assistant
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Live in-home sales tool for running Option A/B/C, payment lanes, objection routing, efficiency, standby, T-close, ROI, energy savings, and final assumptive close.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <MetricChip icon={DollarSign} label="Option A" value={fmt(state.priceA)} />
              <MetricChip icon={TrendingUp} label="Eff. C" value={fmt(computed.efficiencyPrice)} />
              <MetricChip icon={BarChart3} label="ROI Value" value={fmt(computed.roiValue)} />
              <MetricChip icon={Zap} label="10Y Savings" value={fmt(computed.energySavings)} />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-5">
        <Tabs
          value={state.activeTab}
          onValueChange={(v) => update("activeTab", v)}
          className="w-full"
        >
          <TabsList className="w-full h-14 p-1.5 bg-muted rounded-2xl mb-6 grid grid-cols-5">
            <TabsTrigger value="calculator" className="rounded-xl text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
              <Calculator className="h-4 w-4" /> Calculator
            </TabsTrigger>
            <TabsTrigger value="presentation" className="rounded-xl text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
              <Presentation className="h-4 w-4" /> Presentation
            </TabsTrigger>
            <TabsTrigger value="objections" className="rounded-xl text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
              <ShieldAlert className="h-4 w-4" /> Objections
            </TabsTrigger>
            <TabsTrigger value="closing" className="rounded-xl text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
              <Layers className="h-4 w-4" /> Closing Stack
            </TabsTrigger>
            <TabsTrigger value="coach" className="rounded-xl text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
              <Brain className="h-4 w-4" /> Coach Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <CalculatorTab state={state} computed={computed} update={update} />
          </TabsContent>
          <TabsContent value="presentation">
            <PresentationTab state={state} computed={computed} update={update} />
          </TabsContent>
          <TabsContent value="objections">
            <ObjectionsTab state={state} computed={computed} update={update} />
          </TabsContent>
          <TabsContent value="closing">
            <ClosingStackTab state={state} computed={computed} update={update} />
          </TabsContent>
          <TabsContent value="coach">
            <CoachModeTab state={state} coachingTip={coachingTip} update={update} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function MetricChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="metric-card flex items-center gap-2.5 min-w-0">
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground truncate uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
