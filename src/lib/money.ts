const kwacha = new Intl.NumberFormat("en-ZM", { maximumFractionDigits: 0 });

/**
 * Formats integer ngwee (ZMW x 100) as kwacha, e.g. 35000000 -> "K 350,000".
 * Money is always stored as integer ngwee (ADR-003) - never format a float.
 */
export function formatZMW(ngwee: number): string {
  const sign = ngwee < 0 ? "-" : "";
  return `${sign}K ${kwacha.format(Math.round(Math.abs(ngwee) / 100))}`;
}
