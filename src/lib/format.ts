/** Shared formatters — single source of truth for every panel.
 *  IMPORTANT: every dollar amount in the app MUST go through formatCurrency
 *  (or its short alias `fmt`). Never hand-roll `$${n.toLocaleString()}` and
 *  never prefix the result with another `$` — formatCurrency already includes
 *  the symbol. */

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Canonical USD currency formatter. `formatCurrency(12345)` → "$12,345".
 *  Pass `decimals: 2` when cents matter (e.g. ledger payments). */
export function formatCurrency(n: number, opts: { decimals?: 0 | 2 } = {}): string {
  if (!Number.isFinite(n)) return "$0";
  return (opts.decimals === 2 ? usd2 : usd0).format(n);
}

/** Plain integer/count formatter — use for counts, NOT money.
 *  `formatCount(1234)` → "1,234". */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return intFmt.format(Math.round(n));
}

/** Compact short form: $1.2k, $3.4M — for tight chart axes/tiles. */
export function formatCurrencyShort(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return formatCurrency(n);
}

/** Percent from a 0-1 ratio, rounded. e.g. pct(0.236) -> "24%" */
export const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Percent from a 0-100 number, fixed decimals. e.g. pctNum(23.6) -> "23.6%" */
export const pctNum = (n: number, decimals = 1) => `${n.toFixed(decimals)}%`;

/** Short alias — kept so older call sites can `import { fmt }`. Identical to formatCurrency. */
export const fmt = (n: number) => formatCurrency(n);
