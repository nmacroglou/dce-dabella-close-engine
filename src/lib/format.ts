/** Shared formatters — keep all numeric/string formatting in one place. */

/** USD currency, no decimals. e.g. fmt(12345) -> "$12,345" */
export const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/** Percent from a 0-1 ratio, rounded. e.g. pct(0.236) -> "24%" */
export const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Percent from a 0-100 number, fixed decimals. e.g. pctNum(23.6) -> "23.6%" */
export const pctNum = (n: number, decimals = 1) => `${n.toFixed(decimals)}%`;
