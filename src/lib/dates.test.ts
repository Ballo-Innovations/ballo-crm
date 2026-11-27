import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatRelative,
  formatTime,
  formatWeekday,
  toISODate,
} from "./dates";

// Rules: docs/03-design/01-design-system.md "Numbers, dates and text".
// Stored in UTC, shown in Africa/Lusaka (CAT, UTC+2) unless the user has another zone.

describe("formatDate", () => {
  it("shows day, short month and year", () => {
    expect(formatDate("2026-11-23T08:00:00Z")).toBe("23 Nov 2026");
  });

  it("uses Lusaka time, so a late UTC evening is already the next day", () => {
    expect(formatDate(new Date("2026-11-22T22:30:00Z"))).toBe("23 Nov 2026");
  });

  it("can drop the year in tight spaces", () => {
    expect(formatDate("2026-11-23T08:00:00Z", { year: false })).toBe("23 Nov");
  });
});

describe("formatWeekday", () => {
  it("shows the short weekday, day and month", () => {
    expect(formatWeekday("2026-11-26T08:00:00Z")).toBe("Thu 26 Nov");
  });
});

describe("formatTime", () => {
  it("is 24-hour in Lusaka time with no zone shown", () => {
    expect(formatTime("2026-11-23T08:42:00Z")).toBe("10:42");
    expect(formatTime("2026-11-23T19:05:00Z")).toBe("21:05");
  });

  it("shows the zone only when it is not Lusaka", () => {
    expect(formatTime("2026-11-23T08:42:00Z", { timeZone: "Europe/London" })).toBe("08:42 GMT");
  });
});

describe("formatDateTime", () => {
  it("joins date and time with a comma", () => {
    expect(formatDateTime("2026-11-23T08:42:00Z")).toBe("23 Nov 2026, 10:42");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-11-26T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it.each([
    [ago(20_000), "just now"],
    [ago(5 * MIN), "5 min ago"],
    [ago(59 * MIN), "59 min ago"],
    [ago(3 * HOUR), "3h ago"],
    [ago(23 * HOUR), "23h ago"],
    [ago(DAY), "1d ago"],
    [ago(6 * DAY), "6d ago"],
  ])("past %s -> %s", (date, out) => {
    expect(formatRelative(date, now)).toBe(out);
  });

  it("switches to the date after 7 days", () => {
    expect(formatRelative(ago(7 * DAY), now)).toBe("19 Nov 2026");
  });

  it.each([
    [new Date(now.getTime() + 5 * MIN), "in 5 min"],
    [new Date(now.getTime() + 3 * HOUR), "in 3h"],
    [new Date(now.getTime() + DAY), "in 1 day"],
    [new Date(now.getTime() + 3 * DAY), "in 3 days"],
  ])("future %s -> %s", (date, out) => {
    expect(formatRelative(date, now)).toBe(out);
  });

  it("shows a date more than 7 days ahead", () => {
    expect(formatRelative(new Date(now.getTime() + 10 * DAY), now)).toBe("6 Dec 2026");
  });
});

describe("formatDateRange", () => {
  it("shares month and year within a month, with an en dash and no spaces", () => {
    expect(formatDateRange("2026-12-01T08:00:00Z", "2026-12-07T08:00:00Z")).toBe("1–7 Dec 2026");
  });

  it("shares only the year across months", () => {
    expect(formatDateRange("2026-11-28T08:00:00Z", "2026-12-03T08:00:00Z")).toBe(
      "28 Nov–3 Dec 2026",
    );
  });

  it("writes both years across years", () => {
    expect(formatDateRange("2026-12-28T08:00:00Z", "2027-01-03T08:00:00Z")).toBe(
      "28 Dec 2026–3 Jan 2027",
    );
  });

  it("shows one date when start and end are the same day", () => {
    expect(formatDateRange("2026-12-01T06:00:00Z", "2026-12-01T15:00:00Z")).toBe("1 Dec 2026");
  });
});

describe("toISODate", () => {
  it("gives the Lusaka calendar date as ISO 8601, for exports and the API", () => {
    expect(toISODate("2026-11-22T22:30:00Z")).toBe("2026-11-23");
    expect(toISODate(new Date("2026-01-05T10:00:00Z"))).toBe("2026-01-05");
  });
});

describe("invalid input", () => {
  it("throws rather than printing 'Invalid Date' in the UI", () => {
    expect(() => formatDate("not a date")).toThrow(RangeError);
  });
});
