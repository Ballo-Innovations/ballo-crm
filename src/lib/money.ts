const kwacha = new Intl.NumberFormat("en-ZM", { maximumFractionDigits: 0 });
const MINUS = "−";

/**
 * Formats integer ngwee (ZMW x 100) as kwacha, e.g. 640000000 -> "K6,400,000".
 * Money is always stored as integer ngwee (ADR-003) - never format a float.
 * Rules: docs/03-design/01-design-system.md "Numbers, dates and text".
 */
export function formatZMW(ngwee: number): string {
  const sign = ngwee < 0 ? MINUS : "";
  return `${sign}K${kwacha.format(Math.round(Math.abs(ngwee) / 100))}`;
}

const UNITS = ["K", "M", "B"] as const;

/** Compact kwacha for KPIs, cards and charts: K6.4M, K450K, K1.2B (one decimal, .0 dropped). */
export function formatZMWCompact(ngwee: number): string {
  const sign = ngwee < 0 ? MINUS : "";
  const k = Math.abs(ngwee) / 100;
  if (k < 1000) return `${sign}K${Math.round(k)}`;
  let i = Math.min(Math.floor(Math.log10(k) / 3) - 1, UNITS.length - 1);
  let v = Math.round(k / 1000 ** (i + 1) / 0.1) * 0.1;
  // 999,950 rounds to 1000K: show it as K1M instead
  if (v >= 1000 && i < UNITS.length - 1) {
    i += 1;
    v = 1;
  }
  const n = Number.isInteger(Math.round(v * 10) / 10) ? Math.round(v) : v.toFixed(1);
  return `${sign}K${n}${UNITS[i]}`;
}
