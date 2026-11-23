import { describe, expect, it } from "vitest";

import { initials, splitMatch } from "./text";

describe("initials", () => {
  it("takes the first letters of the first two words", () => {
    expect(initials("Kariba Power Co.")).toBe("KP");
    expect(initials("ruth phiri")).toBe("RP");
    expect(initials("Zedcell")).toBe("Z");
    expect(initials("  George  M. ")).toBe("GM");
  });
});

describe("splitMatch", () => {
  it("marks the first case-insensitive match", () => {
    expect(splitMatch("Go to Pipeline", "pipe")).toEqual([
      { text: "Go to ", match: false },
      { text: "Pipe", match: true },
      { text: "line", match: false },
    ]);
  });

  it("returns the whole text when there is no query or match", () => {
    expect(splitMatch("Leads", "")).toEqual([{ text: "Leads", match: false }]);
    expect(splitMatch("Leads", "xyz")).toEqual([{ text: "Leads", match: false }]);
  });
});
