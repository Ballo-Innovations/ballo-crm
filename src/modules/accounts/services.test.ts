import { describe, expect, it } from "vitest";

import { toServices, usageLevel } from "./service";

// E2-04: Services tab - what the account buys (with usage) and the whitespace it leaves:
// catalogue products it does not buy, valued at list price (data model: subscriptions
// "drive whitespace and recommender").

const catalogue = [
  { code: "COLO", name: "Colocation (rack)", category: "Data Centre", listPrice: 15_000_000 },
  {
    code: "DRAAS",
    name: "Disaster Recovery as a Service",
    category: "Cloud",
    listPrice: 20_000_000,
  },
  {
    code: "FIB",
    name: "Dedicated Fibre Internet",
    category: "Connectivity",
    listPrice: 18_000_000,
  },
  { code: "VOICE", name: "SIP Trunking / Voice", category: "Connectivity", listPrice: 4_800_000 },
];

const sub = (productCode: string, annualValue: number, extra: Record<string, unknown> = {}) => ({
  id: `s-${productCode}-${annualValue}`,
  productCode,
  annualValue,
  usagePct: null as number | null,
  active: true,
  startDate: new Date("2025-01-01T00:00:00Z"),
  endDate: null as Date | null,
  ...extra,
});

describe("toServices", () => {
  const result = toServices(
    [
      sub("FIB", 18_000_000, { usagePct: 92 }),
      sub("COLO", 30_000_000, { usagePct: 40 }),
      sub("VOICE", 4_000_000, { active: false, endDate: new Date("2026-06-30T00:00:00Z") }),
    ],
    catalogue,
  );

  it("lists active services, biggest first, with the product's name and category", () => {
    expect(result.active.map((s) => [s.code, s.name, s.category, s.annualValue])).toEqual([
      ["COLO", "Colocation (rack)", "Data Centre", 30_000_000],
      ["FIB", "Dedicated Fibre Internet", "Connectivity", 18_000_000],
    ]);
  });

  it("keeps ended services apart", () => {
    expect(result.ended.map((s) => s.code)).toEqual(["VOICE"]);
  });

  it("sums ARR from active services only", () => {
    expect(result.arr).toBe(48_000_000);
  });

  it("lists products not bought as whitespace, at list price, most valuable first", () => {
    expect(result.whitespace.map((p) => [p.code, p.listPrice])).toEqual([
      ["DRAAS", 20_000_000],
      ["VOICE", 4_800_000],
    ]);
    expect(result.whitespaceValue).toBe(24_800_000);
  });

  it("treats an account that buys nothing as all whitespace", () => {
    const empty = toServices([], catalogue);
    expect(empty.active).toEqual([]);
    expect(empty.whitespace).toHaveLength(4);
    expect(empty.whitespaceValue).toBe(57_800_000);
  });

  it("names a product missing from the catalogue by its code", () => {
    const odd = toServices([sub("LEGACY", 1_000_000)], catalogue);
    expect(odd.active[0]).toMatchObject({ code: "LEGACY", name: "LEGACY", category: null });
  });
});

describe("usageLevel", () => {
  it.each([
    [null, "unknown"],
    [10, "low"],
    [39, "low"],
    [40, "normal"],
    [79, "normal"],
    [80, "high"],
    [100, "high"],
  ] as const)("%s -> %s", (pct, level) => {
    expect(usageLevel(pct)).toBe(level);
  });
});
