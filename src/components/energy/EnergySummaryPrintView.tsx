import dabellaLogo from "@/assets/dabella-logo.png";
import { formatCurrency, formatCurrencyShort, formatCount, pct } from "@/lib/format";
import type { LensResult } from "@/lib/energyLensCalc";
import type { Utility } from "@/data/energyLens";

interface Props {
  utility: Utility;
  homeowner?: string;
  monthlyBill: number;
  rate: number;
  exportRate: number;
  inflationPct: number;
  horizon: number;
  systemKw: number;
  hasBattery: boolean;
  selfConsumption: number;
  result: LensResult;
  options: Array<{ key: "A" | "B" | "C"; kw: number; title: string; tag: string; y1: number; y10: number; y25: number }>;
}

/**
 * Print-only summary. Mirrors the customer proposal aesthetic:
 * forest-green cover band, lime accent rule, serif-feel display type,
 * "Prepared for" banner, then a clean white data section.
 *
 * Visible only via @media print (parent toggles with `hidden print:block`).
 */
export default function EnergySummaryPrintView({
  utility, homeowner, monthlyBill, rate, exportRate, inflationPct, horizon,
  systemKw, hasBattery, selfConsumption, result, options,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const recommended = options.find((o) => o.kw === systemKw) ?? options[1];

  return (
    <div className="print-summary text-[#0f1711]">
      {/* === COVER BAND === */}
      <section className="cover-band relative overflow-hidden">
        <div className="cover-accent" />
        <div className="px-12 pt-10 pb-12">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.18em] text-[#8dc63f]">
            <span>DABELLA · ENERGY ROOF</span>
            <span className="text-[#dce8dc]">{today.toUpperCase()}</span>
          </div>

          <p className="mt-16 text-[11px] font-bold tracking-[0.22em] text-[#8dc63f]">
            INFLATION LENS · HOMEOWNER SUMMARY
          </p>

          <h1 className="mt-4 font-display text-[44px] leading-[1.05] font-extrabold text-white">
            A Home Hedged<br />Against Rising Power.
          </h1>

          <div className="mt-3 h-[3px] w-16 bg-[#daa520]" />

          <p className="mt-6 text-[12px] text-[#dce8dc] leading-relaxed max-w-md">
            A bespoke read on what {utility.name} inflation means for your monthly bill —
            and the lever a GAF Energy Roof gives you to reduce it.
          </p>

          <div className="mt-14 border-t border-[#daa520]/60 pt-3">
            <p className="text-[9px] font-bold tracking-[0.22em] text-[#daa520]">PREPARED FOR</p>
            <p className="mt-2 font-display text-[26px] font-extrabold text-white">
              {homeowner?.trim() || "The Homeowner"}
            </p>
            <p className="mt-1 text-[11px] text-[#b8ccb8]">{utility.region}</p>
          </div>

          <div className="mt-12 grid grid-cols-4 gap-3 border-t border-[#3a5a3d] pt-3 text-[8.5px] font-bold tracking-[0.18em] text-[#b8ccb8] text-center">
            <span>LIFETIME WARRANTY</span>
            <span>GAF MASTER ELITE</span>
            <span>TOP-RATED CREWS</span>
            <span>LOCALLY OWNED</span>
          </div>
        </div>
      </section>

      {/* === DATA SHEET === */}
      <section className="px-12 py-10 bg-white break-inside-avoid">
        <div className="flex items-end justify-between border-b-2 border-[#1b401e] pb-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1b401e]">YOUR UTILITY REALITY</p>
            <h2 className="font-display text-[22px] font-extrabold text-[#0c1e0e] mt-1">{utility.name} · {utility.region}</h2>
          </div>
          <img src={dabellaLogo} alt="DaBella" className="h-7" />
        </div>

        <div className="grid grid-cols-4 gap-4 mt-5">
          <KV label="Current bill" value={`${formatCurrency(monthlyBill)}/mo`} />
          <KV label="Effective rate" value={`$${rate.toFixed(2)}/kWh`} />
          <KV label="Annual usage" value={`${formatCount(result.annualKwhUsage)} kWh`} />
          <KV label="Inflation scenario" value={pct(inflationPct)} />
        </div>

        <h3 className="mt-8 font-display text-[16px] font-extrabold text-[#0c1e0e]">
          What happens if nothing changes
        </h3>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <BigStat label={`Spend over ${horizon} years`} value={formatCurrencyShort(result.cumulativeDoNothing)} tone="warn" />
          <BigStat label={`Exposure reduced`} value={pct(result.inflationExposureReducedPct)} tone="good" />
          <BigStat label={`Lifetime savings`} value={formatCurrencyShort(result.cumulativeSavings)} tone="good" />
        </div>

        <h3 className="mt-8 font-display text-[16px] font-extrabold text-[#0c1e0e]">
          Recommended configuration
        </h3>
        <div className="mt-3 border border-[#1b401e]/20 rounded-md overflow-hidden">
          <div className="grid grid-cols-4 bg-[#f1f4eb] text-[10px] font-bold tracking-[0.14em] text-[#1b401e] uppercase">
            <div className="p-3">System</div>
            <div className="p-3">Battery</div>
            <div className="p-3">Self-used in home</div>
            <div className="p-3">Year-1 monthly value</div>
          </div>
          <div className="grid grid-cols-4 text-[13px] font-semibold text-[#0c1e0e] border-t border-[#1b401e]/15">
            <div className="p-3">{systemKw} kW</div>
            <div className="p-3">{hasBattery ? "Yes" : "No"}</div>
            <div className="p-3">{pct(selfConsumption)}</div>
            <div className="p-3">{formatCurrency(result.valueYear1Monthly)} / mo</div>
          </div>
        </div>

        <h3 className="mt-8 font-display text-[16px] font-extrabold text-[#0c1e0e]">
          Your three options
        </h3>
        <div className="mt-3 border border-[#1b401e]/20 rounded-md overflow-hidden">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-[#f1f4eb] text-[10px] font-bold tracking-[0.14em] text-[#1b401e] uppercase">
            <div className="p-3">Option</div>
            <div className="p-3 text-right">Year 1</div>
            <div className="p-3 text-right">10-year</div>
            <div className="p-3 text-right">25-year</div>
          </div>
          {options.map((o) => {
            const isRec = o.kw === recommended.kw;
            return (
              <div
                key={o.key}
                className={`grid grid-cols-[1.4fr_1fr_1fr_1fr] text-[12px] border-t border-[#1b401e]/15 ${
                  isRec ? "bg-[#f7fbef]" : "bg-white"
                }`}
              >
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0c1e0e]">Option {o.key} · {o.kw} kW</span>
                    {isRec && <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#6c9e2a] bg-[#e4efce] px-1.5 py-0.5 rounded-sm">Selected</span>}
                  </div>
                  <div className="text-[10px] text-[#475547] mt-0.5">{o.title} — {o.tag}</div>
                </div>
                <div className="p-3 text-right font-mono font-semibold">{formatCurrency(o.y1)}</div>
                <div className="p-3 text-right font-mono font-semibold">{formatCurrencyShort(o.y10)}</div>
                <div className="p-3 text-right font-mono font-extrabold text-[#1b401e]">{formatCurrencyShort(o.y25)}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 text-[11px] leading-relaxed text-[#475547]">
          <div className="rounded-md border border-[#1b401e]/15 bg-[#fbfaf6] p-4">
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#1b401e] uppercase mb-1">Why this fits</p>
            A {systemKw} kW array produces ~{formatCount(result.prodYear1)} kWh/yr — about {Math.round(result.offsetPct * 100)}% of the bill.
            {hasBattery
              ? ` With a battery, ~${Math.round(selfConsumption * 100)}% of that power is used in the home at the full $${rate.toFixed(2)}/kWh retail rate.`
              : ` The export gap means more production is sold back at the lower $${exportRate.toFixed(2)}/kWh rate.`}
          </div>
          <div className="rounded-md border border-[#1b401e]/15 bg-[#fbfaf6] p-4">
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#1b401e] uppercase mb-1">The bottom line</p>
            Over {horizon} years, doing nothing costs about <span className="font-bold text-[#0c1e0e]">{formatCurrencyShort(result.cumulativeDoNothing)}</span>.
            The recommended setup neutralizes roughly <span className="font-bold text-[#0c1e0e]">{pct(result.inflationExposureReducedPct)}</span> of that exposure —
            keeping <span className="font-bold text-[#1b401e]">{formatCurrencyShort(result.cumulativeSavings)}</span> in the household.
          </div>
        </div>

        <div className="mt-10 pt-4 border-t border-[#1b401e]/20 flex items-center justify-between text-[9px] font-bold tracking-[0.18em] text-[#1b401e]">
          <span>DABELLA.US</span>
          <span>HOME IMPROVEMENT, EXPERTLY DONE</span>
        </div>

        <p className="mt-4 text-[9px] italic text-[#7c8a7d] leading-relaxed">
          Estimates only — not a quote. Actual savings depend on utility plan, roof conditions, and household usage patterns.
        </p>
      </section>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.16em] text-[#6c9e2a] uppercase">{label}</p>
      <p className="font-display text-[18px] font-extrabold text-[#0c1e0e] mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function BigStat({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" }) {
  const color = tone === "warn" ? "#b91c1c" : "#1b401e";
  const bg = tone === "warn" ? "#fdeded" : "#e9f6ea";
  return (
    <div className="rounded-md border p-4" style={{ borderColor: `${color}33`, background: bg }}>
      <p className="text-[9px] font-bold tracking-[0.16em] uppercase" style={{ color }}>{label}</p>
      <p className="font-display text-[26px] font-extrabold mt-1 tabular-nums" style={{ color }}>{value}</p>
    </div>
  );
}
