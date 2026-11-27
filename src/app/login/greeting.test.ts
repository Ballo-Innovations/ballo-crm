import { describe, expect, it } from "vitest";

import { greetingFor } from "./greeting";

// The login greeting follows the clock in Lusaka (UTC+2, no daylight saving), not the server's.
describe("greetingFor", () => {
  it("says good morning before noon in Lusaka", () => {
    expect(greetingFor(new Date("2026-11-25T03:00:00Z"))).toBe("Good morning"); // 05:00
    expect(greetingFor(new Date("2026-11-25T09:59:00Z"))).toBe("Good morning"); // 11:59
  });

  it("says good afternoon from noon until 18:00 in Lusaka", () => {
    expect(greetingFor(new Date("2026-11-25T10:00:00Z"))).toBe("Good afternoon"); // 12:00
    expect(greetingFor(new Date("2026-11-25T15:59:00Z"))).toBe("Good afternoon"); // 17:59
  });

  it("says good evening from 18:00 in Lusaka, and late at night", () => {
    expect(greetingFor(new Date("2026-11-25T16:00:00Z"))).toBe("Good evening"); // 18:00
    expect(greetingFor(new Date("2026-11-25T21:30:00Z"))).toBe("Good evening"); // 23:30
    expect(greetingFor(new Date("2026-11-25T00:30:00Z"))).toBe("Good evening"); // 02:30
  });

  it("uses Lusaka time, not UTC: 23:00 UTC is already the next morning's 01:00", () => {
    expect(greetingFor(new Date("2026-11-25T23:00:00Z"))).toBe("Good evening"); // 01:00
    expect(greetingFor(new Date("2026-11-25T02:00:00Z"))).toBe("Good morning"); // 04:00
  });
});
