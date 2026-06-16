import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

type Rating = "good" | "needs-improvement" | "poor";

const COLOR: Record<Rating, string> = {
  good: "color:#16a34a;font-weight:bold",
  "needs-improvement": "color:#d97706;font-weight:bold",
  poor: "color:#dc2626;font-weight:bold",
};

const HISTORY_KEY = "__webVitals";
type Entry = { name: string; value: number; rating: Rating; t: number };

declare global {
  interface Window {
    __webVitals?: Entry[];
    showWebVitals?: () => void;
  }
}

function log(metric: Metric) {
  const rating = (metric.rating ?? "good") as Rating;
  const val = Math.round(metric.value * 100) / 100;
  // eslint-disable-next-line no-console
  console.log(
    `%c[web-vitals] ${metric.name} = ${val}ms  (%c${rating}%c)`,
    "color:#2563eb;font-weight:bold",
    COLOR[rating],
    "color:inherit",
    metric,
  );

  const list = (window[HISTORY_KEY] ??= []);
  list.push({ name: metric.name, value: val, rating, t: Date.now() });
  if (list.length > 200) list.shift();
}

export function initWebVitals() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __webVitalsInit?: boolean }).__webVitalsInit) return;
  (window as unknown as { __webVitalsInit?: boolean }).__webVitalsInit = true;

  // Core Web Vitals — INP is the key one for "typing responsiveness".
  onLCP(log, { reportAllChanges: false });
  onINP(log, { reportAllChanges: true });
  onCLS(log);
  onFCP(log);
  onTTFB(log);

  window.showWebVitals = () => {
    const entries = window[HISTORY_KEY] ?? [];
    if (!entries.length) {
      // eslint-disable-next-line no-console
      console.log("[web-vitals] no metrics yet — interact with the page first");
      return;
    }
    // Latest per metric
    const latest = new Map<string, Entry>();
    for (const e of entries) latest.set(e.name, e);
    // eslint-disable-next-line no-console
    console.table([...latest.values()]);
  };

  // eslint-disable-next-line no-console
  console.log(
    "%c[web-vitals] logging enabled — call showWebVitals() to see a summary",
    "color:#2563eb",
  );
}
