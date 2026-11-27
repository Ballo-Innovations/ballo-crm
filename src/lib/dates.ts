/**
 * Date and time display for the UI. Dates are stored in UTC and shown in the user's time
 * zone, Africa/Lusaka (CAT, UTC+2) by default. Rules: docs/03-design/01-design-system.md
 * "Numbers, dates and text". Use these instead of formatting a date by hand.
 */

export const DEFAULT_TIME_ZONE = "Africa/Lusaka";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EN_DASH = "–";

export type DateInput = Date | string | number;
type ZoneOption = { timeZone?: string };

type Parts = {
  year: number;
  month: number;
  day: number;
  hour: string;
  minute: string;
  weekday: string;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

function toDate(input: DateInput): Date {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Invalid date: ${String(input)}`);
  return date;
}

function parts(input: DateInput, timeZone = DEFAULT_TIME_ZONE): Parts {
  const get = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(toDate(input))
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(get.year),
    month: Number(get.month),
    day: Number(get.day),
    hour: get.hour,
    minute: get.minute,
    weekday: get.weekday,
  };
}

const dayMonth = (p: Parts) => `${p.day} ${MONTHS[p.month - 1]}`;

/** "23 Nov 2026", or "23 Nov" with `year: false`. */
export function formatDate(input: DateInput, opts: ZoneOption & { year?: boolean } = {}): string {
  const p = parts(input, opts.timeZone);
  return opts.year === false ? dayMonth(p) : `${dayMonth(p)} ${p.year}`;
}

/** "Thu 26 Nov". */
export function formatWeekday(input: DateInput, opts: ZoneOption = {}): string {
  const p = parts(input, opts.timeZone);
  return `${p.weekday} ${dayMonth(p)}`;
}

/** "10:42", 24-hour. The zone is shown only when it is not Lusaka ("08:42 GMT"). */
export function formatTime(input: DateInput, opts: ZoneOption = {}): string {
  const timeZone = opts.timeZone ?? DEFAULT_TIME_ZONE;
  const p = parts(input, timeZone);
  const time = `${p.hour}:${p.minute}`;
  if (timeZone === DEFAULT_TIME_ZONE) return time;
  const zone = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" })
    .formatToParts(toDate(input))
    .find((x) => x.type === "timeZoneName")?.value;
  return zone ? `${time} ${zone}` : time;
}

/** "23 Nov 2026, 10:42". */
export function formatDateTime(input: DateInput, opts: ZoneOption = {}): string {
  return `${formatDate(input, opts)}, ${formatTime(input, opts)}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Recent activity: "just now", "5 min ago", "3h ago", "1d ago" up to 7 days, then the date.
 * Future: "in 5 min", "in 3h", "in 3 days". Put the exact date and time in a tooltip.
 */
export function formatRelative(
  input: DateInput,
  now: DateInput = new Date(),
  opts: ZoneOption = {},
): string {
  const diff = toDate(input).getTime() - toDate(now).getTime();
  const abs = Math.abs(diff);
  if (abs < MINUTE) return "just now";
  if (abs >= 7 * DAY) return formatDate(input, opts);
  const future = diff > 0;
  if (abs < HOUR) {
    const m = Math.floor(abs / MINUTE);
    return future ? `in ${m} min` : `${m} min ago`;
  }
  if (abs < DAY) {
    const h = Math.floor(abs / HOUR);
    return future ? `in ${h}h` : `${h}h ago`;
  }
  const d = Math.floor(abs / DAY);
  return future ? `in ${d} ${d === 1 ? "day" : "days"}` : `${d}d ago`;
}

/** "1–7 Dec 2026", "28 Nov–3 Dec 2026", "28 Dec 2026–3 Jan 2027" (en dash, no spaces). */
export function formatDateRange(start: DateInput, end: DateInput, opts: ZoneOption = {}): string {
  const a = parts(start, opts.timeZone);
  const b = parts(end, opts.timeZone);
  if (a.year !== b.year) return `${dayMonth(a)} ${a.year}${EN_DASH}${dayMonth(b)} ${b.year}`;
  if (a.month !== b.month) return `${dayMonth(a)}${EN_DASH}${dayMonth(b)} ${b.year}`;
  if (a.day !== b.day) return `${a.day}${EN_DASH}${b.day} ${MONTHS[b.month - 1]} ${b.year}`;
  return `${dayMonth(a)} ${a.year}`;
}

/** The calendar date in the user's zone as ISO 8601 ("2026-11-23"): exports and the API only. */
export function toISODate(input: DateInput, opts: ZoneOption = {}): string {
  const p = parts(input, opts.timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}
