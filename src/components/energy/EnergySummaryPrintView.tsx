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
 * Print-only proposal-style summary for the Energy Lens.
 * Editorial, multi-page composition:
 *   1. Cover — forest green, gold rule, prepared-for banner
 *   2. Utility Reality + Inflation Curve (SVG chart)
 *   3. Recommended configuration + year-by-year savings (SVG area chart)
 *   4. Three options + bottom line
 *
 * Each page is forced to an A4 sheet via the `.report-page` class
 * (see @media print in index.css).
 */
export default function EnergySummaryPrintView({
  utility, homeowner, monthlyBill, rate, exportRate, inflationPct, horizon,
  systemKw, hasBattery, selfConsumption, result, options,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const recommended = options.find((o) => o.kw === systemKw) ?? options[1];
  const reportId = `ER-${utility.id.toUpperCase()}-${new Date().getFullYear()}-${String(Math.abs(Math.round((monthlyBill + systemKw * 100) % 9999))).padStart(4, "0")}`;

  return (
    <div className="print-summary text-[#0f1711] font-sans">
      {/* ========================================================== */}
      {/* PAGE 1 — COVER                                              */}
      {/* ========================================================== */}
      <section className="report-page cover-band relative overflow-hidden">
        <div className="cover-accent" />

        {/* faint typographic watermark */}
        <div aria-hidden className="absolute -right-10 bottom-6 select-none pointer-events-none">
          <p className="font-display text-[260px] leading-none font-extrabold text-white/[0.04] tracking-tighter">25</p>
        </div>

        <div className="relative px-14 pt-12 pb-14 h-full flex flex-col">
          {/* top eyebrow */}
          <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.22em] text-[#8dc63f]">
            <span>DABELLA · ENERGY ROOF</span>
            <span className="text-[#dce8dc]">{today.toUpperCase()}</span>
          </div>

          {/* report id chip */}
          <div className="mt-2 inline-flex w-fit items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-[#dce8dc]/80">
            <span className="h-px w-6 bg-[#daa520]" />
            REPORT {reportId}
          </div>

          {/* hero */}
          <div className="mt-20 flex-1">
            <p className="text-[11px] font-bold tracking-[0.24em] text-[#8dc63f]">
              INFLATION LENS · HOMEOWNER SUMMARY
            </p>

            <h1 className="mt-5 font-display text-[56px] leading-[0.98] font-extrabold text-white tracking-tight">
              A Home Hedged<br />
              <span className="text-[#daa520]">Against Rising Power.</span>
            </h1>

            <div className="mt-5 h-[3px] w-20 bg-[#daa520]" />

            <p className="mt-7 text-[12.5px] text-[#dce8dc] leading-[1.7] max-w-md">
              A bespoke read on what {utility.name} inflation means for your monthly bill —
              and the lever a GAF Energy Roof gives you to reduce that exposure over the next {horizon} years.
            </p>

            <div className="mt-16 border-t border-[#daa520]/60 pt-4">
              <p className="text-[9px] font-bold tracking-[0.26em] text-[#daa520]">PREPARED FOR</p>
              <p className="mt-2 font-display text-[32px] font-extrabold text-white tracking-tight">
                {homeowner?.trim() || "The Homeowner"}
              </p>
              <p className="mt-1 text-[11px] text-[#b8ccb8] tracking-wide">{utility.region}</p>
            </div>
          </div>

          {/* headline figures band */}
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-[#3a5a3d] pt-5">
            <CoverFigure label={`${horizon}-yr do nothing`} value={formatCurrencyShort(result.cumulativeDoNothing)} tone="warn" />
            <CoverFigure label="Lifetime savings" value={formatCurrencyShort(result.cumulativeSavings)} tone="good" />
            <CoverFigure label="Exposure reduced" value={pct(result.inflationExposureReducedPct)} tone="good" />
          </div>

          {/* trust footer */}
          <div className="mt-8 grid grid-cols-4 gap-3 border-t border-[#3a5a3d] pt-3 text-[8.5px] font-bold tracking-[0.2em] text-[#b8ccb8] text-center">
            <span>LIFETIME WARRANTY</span>
            <span>GAF MASTER ELITE</span>
            <span>TOP-RATED CREWS</span>
            <span>LOCALLY OWNED</span>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* PAGE 2 — UTILITY REALITY + INFLATION CURVE                  */}
      {/* ========================================================== */}
      <section className="report-page bg-white px-14 py-12">
        <PageHeader eyebrow="01 — DIAGNOSIS" title="Your utility reality" reportId={reportId} />

        <div className="mt-6">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#1b401e]">PROVIDER</p>
          <div className="mt-1 flex items-end justify-between border-b-2 border-[#1b401e] pb-3">
            <h2 className="font-display text-[26px] font-extrabold text-[#0c1e0e] leading-tight">
              {utility.name} <span className="text-[#6c9e2a]">·</span> {utility.region}
            </h2>
            <img src={dabellaLogo} alt="DaBella" className="h-7" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <KV label="Current bill" value={`${formatCurrency(monthlyBill)}/mo`} />
          <KV label="Effective rate" value={`$${rate.toFixed(2)}/kWh`} />
          <KV label="Annual usage" value={`${formatCount(result.annualKwhUsage)} kWh`} />
          <KV label="Export credit" value={`$${exportRate.toFixed(2)}/kWh`} />
        </div>

        <h3 className="mt-10 font-display text-[18px] font-extrabold text-[#0c1e0e]">
          The cost of doing nothing
        </h3>
        <p className="text-[11px] text-[#475547] mt-1 leading-relaxed max-w-2xl">
          At an inflation scenario of <span className="font-bold text-[#0c1e0e]">{pct(inflationPct)}/year</span>,
          your annual bill compounds against you. The curve below shows total spend with no action.
        </p>

        <div className="mt-5 rounded-md border border-[#1b401e]/20 bg-[#fbfaf6] p-5">
          <InflationCurve series={result.series} horizon={horizon} />
          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-[#1b401e]/15">
            <BigStat label={`Spend over ${horizon} years`} value={formatCurrencyShort(result.cumulativeDoNothing)} tone="warn" />
            <BigStat label="Year-1 annual bill" value={formatCurrency(result.annualBillYear1)} tone="warn" />
            <BigStat label={`Year-${horizon} annual bill`} value={formatCurrencyShort(result.series[result.series.length - 1]?.doNothingAnnual ?? 0)} tone="warn" />
          </div>
        </div>

        <p className="mt-6 text-[10.5px] text-[#7c8a7d] italic leading-relaxed">
          Inflation assumption: {pct(inflationPct)} compounded annually — based on regional regulatory filings and recent rate-case history.
        </p>

        <PageFooter pageNum="02" totalPages="04" />
      </section>

      {/* ========================================================== */}
      {/* PAGE 3 — RECOMMENDED CONFIG + YEAR-BY-YEAR SAVINGS          */}
      {/* ========================================================== */}
      <section className="report-page bg-white px-14 py-12">
        <PageHeader eyebrow="02 — THE LEVER" title="What an Energy Roof changes" reportId={reportId} />

        <div className="mt-6 grid grid-cols-[1.1fr_1fr] gap-6">
          {/* Recommended config card */}
          <div className="rounded-md border-2 border-[#1b401e] overflow-hidden">
            <div className="bg-[#1b401e] text-white px-5 py-3 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.2em]">RECOMMENDED CONFIGURATION</span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#daa520]">PRIMARY</span>
            </div>
            <div className="p-5 bg-[#f7fbef]">
              <div className="font-display text-[32px] font-extrabold text-[#0c1e0e] leading-none">
                {systemKw} kW <span className="text-[#6c9e2a] text-[18px] font-bold">+ {hasBattery ? "Battery" : "Grid-tied"}</span>
              </div>
              <p className="text-[11px] text-[#475547] mt-1.5">
                Sized to offset roughly {Math.round(result.offsetPct * 100)}% of your bill in year one.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-[11px]">
                <ConfigRow label="Annual production" value={`${formatCount(result.prodYear1)} kWh`} />
                <ConfigRow label="Self-used in home" value={pct(selfConsumption)} />
                <ConfigRow label="Year-1 value" value={`${formatCurrency(result.valueYear1Monthly)}/mo`} />
                <ConfigRow label="Bill offset" value={pct(result.offsetPct)} />
              </div>
            </div>
          </div>

          {/* Why it fits */}
          <div className="rounded-md border border-[#1b401e]/20 bg-[#fbfaf6] p-5">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1b401e] mb-2">WHY THIS FITS</p>
            <p className="text-[12px] text-[#0c1e0e] leading-[1.65]">
              A {systemKw} kW array produces ~{formatCount(result.prodYear1)} kWh/year — about{" "}
              <span className="font-bold">{Math.round(result.offsetPct * 100)}%</span> of your annual bill.
              {hasBattery
                ? ` With a battery, ~${Math.round(selfConsumption * 100)}% of that production is consumed in the home at the full retail rate of $${rate.toFixed(2)}/kWh — capturing the high-value hours.`
                : ` Without a battery, more production is sold back at the lower export rate ($${exportRate.toFixed(2)}/kWh), leaving value on the table during peak hours.`}
            </p>
            <div className="mt-4 pt-3 border-t border-[#1b401e]/15 grid grid-cols-2 gap-3 text-[10px]">
              <Tick label="GAF Master Elite installation" />
              <Tick label="Lifetime workmanship warranty" />
              <Tick label="UL-listed components" />
              <Tick label="Permits & inspections handled" />
            </div>
          </div>
        </div>

        <h3 className="mt-10 font-display text-[18px] font-extrabold text-[#0c1e0e]">
          Savings, year by year
        </h3>
        <p className="text-[11px] text-[#475547] mt-1 leading-relaxed max-w-2xl">
          The gap between "do nothing" and "with Energy Roof" widens each year as utility rates climb.
        </p>

        <div className="mt-5 rounded-md border border-[#1b401e]/20 bg-white p-5">
          <SavingsCurve series={result.series} horizon={horizon} />
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1b401e]/15 text-[10px]">
            <LegendDot color="#b91c1c" label="Do nothing — cumulative" />
            <LegendDot color="#1b401e" label="With Energy Roof — cumulative" />
            <LegendDot color="#daa520" label="Energy value captured" />
            <LegendDot color="#6c9e2a" label="Savings (gap)" />
          </div>
        </div>

        <PageFooter pageNum="03" totalPages="04" />
      </section>

      {/* ========================================================== */}
      {/* PAGE 4 — THREE OPTIONS + BOTTOM LINE                        */}
      {/* ========================================================== */}
      <section className="report-page bg-white px-14 py-12">
        <PageHeader eyebrow="03 — YOUR OPTIONS" title="Three ways to start" reportId={reportId} />

        <div className="mt-6 grid grid-cols-3 gap-4">
          {options.map((o) => {
            const isRec = o.kw === recommended.kw;
            return (
              <div
                key={o.key}
                className={`rounded-md overflow-hidden border ${
                  isRec ? "border-2 border-[#1b401e] bg-[#f7fbef]" : "border-[#1b401e]/20 bg-white"
                }`}
              >
                <div className={`px-4 py-2.5 flex items-center justify-between ${
                  isRec ? "bg-[#1b401e] text-white" : "bg-[#f1f4eb] text-[#1b401e]"
                }`}>
                  <span className="text-[10px] font-bold tracking-[0.18em]">OPTION {o.key}</span>
                  {isRec && <span className="text-[8.5px] font-bold tracking-[0.16em] text-[#daa520]">SELECTED</span>}
                </div>
                <div className="p-4">
                  <div className="font-display text-[24px] font-extrabold text-[#0c1e0e] leading-none">{o.kw} kW</div>
                  <p className="text-[11px] font-bold text-[#1b401e] mt-1.5">{o.title}</p>
                  <p className="text-[9.5px] text-[#475547] mt-0.5 leading-snug">{o.tag}</p>

                  <div className="mt-4 space-y-2 pt-3 border-t border-[#1b401e]/15">
                    <OptRow label="Year 1" value={formatCurrency(o.y1)} />
                    <OptRow label="10-year" value={formatCurrencyShort(o.y10)} />
                    <OptRow label="25-year" value={formatCurrencyShort(o.y25)} bold />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="mt-10 font-display text-[18px] font-extrabold text-[#0c1e0e]">
          The bottom line
        </h3>

        <div className="mt-3 rounded-md border-l-4 border-[#1b401e] bg-[#fbfaf6] p-6">
          <p className="text-[13px] text-[#0c1e0e] leading-[1.75]">
            Over <span className="font-bold">{horizon} years</span>, doing nothing costs about{" "}
            <span className="font-bold text-[#b91c1c]">{formatCurrencyShort(result.cumulativeDoNothing)}</span>.
            The recommended {systemKw} kW {hasBattery ? "+ battery" : ""} configuration neutralizes roughly{" "}
            <span className="font-bold text-[#1b401e]">{pct(result.inflationExposureReducedPct)}</span> of that
            exposure — keeping <span className="font-bold text-[#1b401e]">{formatCurrencyShort(result.cumulativeSavings)}</span>{" "}
            in the household instead of flowing back to the utility.
          </p>
        </div>

        {/* Signature block */}
        <div className="mt-10 grid grid-cols-2 gap-8">
          <div className="border-t-2 border-[#1b401e] pt-3">
            <p className="text-[9px] font-bold tracking-[0.22em] text-[#1b401e]">HOMEOWNER ACKNOWLEDGEMENT</p>
            <div className="mt-10 h-px bg-[#1b401e]/30" />
            <div className="grid grid-cols-[1fr_auto] gap-4 mt-2 text-[9px] text-[#475547] tracking-wider">
              <span>SIGNATURE</span><span>DATE</span>
            </div>
          </div>
          <div className="border-t-2 border-[#1b401e] pt-3">
            <p className="text-[9px] font-bold tracking-[0.22em] text-[#1b401e]">DABELLA REPRESENTATIVE</p>
            <div className="mt-10 h-px bg-[#1b401e]/30" />
            <div className="grid grid-cols-[1fr_auto] gap-4 mt-2 text-[9px] text-[#475547] tracking-wider">
              <span>SIGNATURE</span><span>DATE</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-4 border-t border-[#1b401e]/20 flex items-center justify-between text-[9px] font-bold tracking-[0.2em] text-[#1b401e]">
          <span>DABELLA.US</span>
          <span>HOME IMPROVEMENT, EXPERTLY DONE</span>
          <span>REPORT {reportId}</span>
        </div>

        <p className="mt-3 text-[9px] italic text-[#7c8a7d] leading-relaxed">
          Estimates only — not a quote. Actual savings depend on utility plan, roof orientation, shading, and household usage patterns.
          Inflation projections are scenario-based and reflect regional regulatory trends; they are not guarantees of future utility behavior.
        </p>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* Sub-components                                                    */
/* ──────────────────────────────────────────────────────────────── */

function PageHeader({ eyebrow, title, reportId }: { eyebrow: string; title: string; reportId: string }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[9.5px] font-bold tracking-[0.26em] text-[#6c9e2a]">{eyebrow}</p>
        <h2 className="mt-1.5 font-display text-[28px] font-extrabold text-[#0c1e0e] leading-none tracking-tight">{title}</h2>
        <div className="mt-2 h-[2px] w-12 bg-[#daa520]" />
      </div>
      <div className="text-right">
        <p className="text-[8.5px] font-bold tracking-[0.22em] text-[#1b401e]/60">DABELLA · ENERGY ROOF</p>
        <p className="text-[8.5px] tracking-[0.18em] text-[#1b401e]/50 mt-0.5">{reportId}</p>
      </div>
    </div>
  );
}

function PageFooter({ pageNum, totalPages }: { pageNum: string; totalPages: string }) {
  return (
    <div className="absolute bottom-8 left-14 right-14 flex items-center justify-between text-[8.5px] font-bold tracking-[0.22em] text-[#1b401e]/60">
      <span>DABELLA.US</span>
      <span>{pageNum} / {totalPages}</span>
    </div>
  );
}

function CoverFigure({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" }) {
  const color = tone === "warn" ? "#e8a87c" : "#8dc63f";
  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color }}>{label}</p>
      <p className="font-display text-[28px] font-extrabold text-white mt-1.5 tabular-nums leading-none">{value}</p>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-[#6c9e2a] pl-3">
      <p className="text-[9px] font-bold tracking-[0.18em] text-[#6c9e2a] uppercase">{label}</p>
      <p className="font-display text-[18px] font-extrabold text-[#0c1e0e] mt-1 tabular-nums leading-none">{value}</p>
    </div>
  );
}

function BigStat({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" }) {
  const color = tone === "warn" ? "#b91c1c" : "#1b401e";
  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color }}>{label}</p>
      <p className="font-display text-[22px] font-extrabold mt-1 tabular-nums leading-none" style={{ color }}>{value}</p>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-dotted border-[#1b401e]/25 pb-1">
      <span className="text-[#475547]">{label}</span>
      <span className="font-bold text-[#0c1e0e] tabular-nums">{value}</span>
    </div>
  );
}

function Tick({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[#1b401e]">
      <svg width="9" height="9" viewBox="0 0 10 10" className="flex-shrink-0">
        <path d="M1 5l3 3 5-6" fill="none" stroke="#1b401e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-semibold">{label}</span>
    </div>
  );
}

function OptRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[9.5px] font-bold tracking-[0.16em] text-[#475547] uppercase">{label}</span>
      <span className={`font-mono tabular-nums ${bold ? "font-extrabold text-[14px] text-[#1b401e]" : "font-semibold text-[12px] text-[#0c1e0e]"}`}>
        {value}
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
      <span className="text-[#475547] font-semibold">{label}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* SVG charts — pure SVG so they print pixel-perfect                  */
/* ──────────────────────────────────────────────────────────────── */

function InflationCurve({ series, horizon }: { series: LensResult["series"]; horizon: number }) {
  const W = 700, H = 220, P = { l: 56, r: 16, t: 14, b: 30 };
  const max = Math.max(...series.map((s) => s.doNothingCumulative), 1);
  const xs = (i: number) => P.l + (i / (series.length - 1 || 1)) * (W - P.l - P.r);
  const ys = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);

  const areaPath =
    `M ${xs(0)} ${ys(0)} ` +
    series.map((s, i) => `L ${xs(i)} ${ys(s.doNothingCumulative)}`).join(" ") +
    ` L ${xs(series.length - 1)} ${ys(0)} Z`;
  const linePath =
    `M ${xs(0)} ${ys(series[0]?.doNothingCumulative ?? 0)} ` +
    series.map((s, i) => `L ${xs(i)} ${ys(s.doNothingCumulative)}`).join(" ");

  const ticks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), Math.round(max)];
  const xTickIdx = [0, Math.floor(series.length * 0.25), Math.floor(series.length * 0.5), Math.floor(series.length * 0.75), series.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="warnFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Y grid */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={ys(t)} y2={ys(t)} stroke="#1b401e" strokeOpacity="0.08" />
          <text x={P.l - 8} y={ys(t) + 3} textAnchor="end" fontSize="9" fill="#475547" fontWeight="600">
            {t >= 1000 ? `$${Math.round(t / 1000)}k` : `$${t}`}
          </text>
        </g>
      ))}

      {/* Area + line */}
      <path d={areaPath} fill="url(#warnFill)" />
      <path d={linePath} fill="none" stroke="#b91c1c" strokeWidth="2" />

      {/* End-point marker */}
      <circle cx={xs(series.length - 1)} cy={ys(series[series.length - 1]?.doNothingCumulative ?? 0)} r="3.5" fill="#b91c1c" />
      <text
        x={xs(series.length - 1) - 6}
        y={ys(series[series.length - 1]?.doNothingCumulative ?? 0) - 8}
        textAnchor="end"
        fontSize="10"
        fontWeight="800"
        fill="#b91c1c"
      >
        {formatCurrencyShort(series[series.length - 1]?.doNothingCumulative ?? 0)}
      </text>

      {/* X labels */}
      {xTickIdx.map((i, k) => (
        <text key={k} x={xs(i)} y={H - 10} textAnchor="middle" fontSize="9" fill="#475547" fontWeight="600">
          Yr {series[i]?.year ?? i + 1}
        </text>
      ))}

      {/* Axis baselines */}
      <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="#1b401e" strokeOpacity="0.35" />
      <line x1={P.l} x2={P.l} y1={P.t} y2={H - P.b} stroke="#1b401e" strokeOpacity="0.35" />

      <text x={P.l} y={P.t - 2} fontSize="9" fontWeight="800" fill="#1b401e" letterSpacing="1.2">
        CUMULATIVE SPEND · DO NOTHING ({horizon}Y)
      </text>
    </svg>
  );
}

function SavingsCurve({ series, horizon }: { series: LensResult["series"]; horizon: number }) {
  const W = 700, H = 240, P = { l: 56, r: 16, t: 14, b: 30 };
  const max = Math.max(
    ...series.map((s) => Math.max(s.doNothingCumulative, s.withRoofCumulative, s.energyValueCumulative)),
    1
  );
  const xs = (i: number) => P.l + (i / (series.length - 1 || 1)) * (W - P.l - P.r);
  const ys = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);

  const pathFor = (key: keyof (typeof series)[number]) =>
    `M ${xs(0)} ${ys(series[0]?.[key] as number ?? 0)} ` +
    series.map((s, i) => `L ${xs(i)} ${ys(s[key] as number)}`).join(" ");

  // Savings gap area
  const gapPath =
    `M ${xs(0)} ${ys(series[0]?.withRoofCumulative ?? 0)} ` +
    series.map((s, i) => `L ${xs(i)} ${ys(s.withRoofCumulative)}`).join(" ") +
    ` ` +
    series.slice().reverse().map((s) => {
      const i = series.indexOf(s);
      return `L ${xs(i)} ${ys(s.doNothingCumulative)}`;
    }).join(" ") +
    ` Z`;

  const ticks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), Math.round(max)];
  const xTickIdx = [0, Math.floor(series.length * 0.25), Math.floor(series.length * 0.5), Math.floor(series.length * 0.75), series.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="gapFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6c9e2a" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#6c9e2a" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={ys(t)} y2={ys(t)} stroke="#1b401e" strokeOpacity="0.08" />
          <text x={P.l - 8} y={ys(t) + 3} textAnchor="end" fontSize="9" fill="#475547" fontWeight="600">
            {t >= 1000 ? `$${Math.round(t / 1000)}k` : `$${t}`}
          </text>
        </g>
      ))}

      {/* gap shading = savings */}
      <path d={gapPath} fill="url(#gapFill)" />

      {/* lines */}
      <path d={pathFor("doNothingCumulative")} fill="none" stroke="#b91c1c" strokeWidth="2" />
      <path d={pathFor("withRoofCumulative")} fill="none" stroke="#1b401e" strokeWidth="2" />
      <path d={pathFor("energyValueCumulative")} fill="none" stroke="#daa520" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* X labels */}
      {xTickIdx.map((i, k) => (
        <text key={k} x={xs(i)} y={H - 10} textAnchor="middle" fontSize="9" fill="#475547" fontWeight="600">
          Yr {series[i]?.year ?? i + 1}
        </text>
      ))}

      <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="#1b401e" strokeOpacity="0.35" />
      <line x1={P.l} x2={P.l} y1={P.t} y2={H - P.b} stroke="#1b401e" strokeOpacity="0.35" />

      <text x={P.l} y={P.t - 2} fontSize="9" fontWeight="800" fill="#1b401e" letterSpacing="1.2">
        DO NOTHING vs ENERGY ROOF · CUMULATIVE ({horizon}Y)
      </text>
    </svg>
  );
}
