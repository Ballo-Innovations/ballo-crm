import { describe, expect, it } from "vitest";

import { formatZMW, formatZMWCompact } from "./money";

describe("formatZMW", () => {
  it("formats integer ngwee as whole kwacha with no space", () => {
    expect(formatZMW(640_000_000)).toBe("K6,400,000");
    expect(formatZMW(35_000_000)).toBe("K350,000");
  });

  it("handles zero and negatives with a true minus sign", () => {
    expect(formatZMW(0)).toBe("K0");
    expect(formatZMW(-1_200_000)).toBe("−K12,000");
  });
});

describe("formatZMWCompact", () => {
  it.each([
    [640_000_000, "K6.4M"],
    [45_000_000, "K450K"],
    [120_000_000_000, "K1.2B"],
    [500_000_000, "K5M"],
    [99_995_000, "K1M"],
    [95_000, "K950"],
    [0, "K0"],
    [-640_000_000, "−K6.4M"],
  ])("%i ngwee -> %s", (ngwee, out) => {
    expect(formatZMWCompact(ngwee)).toBe(out);
  });
});
