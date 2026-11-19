import { describe, expect, it } from "vitest";

import { formatZMW } from "./money";

describe("formatZMW", () => {
  it("formats integer ngwee as whole kwacha", () => {
    expect(formatZMW(35_000_000)).toBe("K 350,000");
  });

  it("handles zero and negatives", () => {
    expect(formatZMW(0)).toBe("K 0");
    expect(formatZMW(-150_000)).toBe("-K 1,500");
  });
});
