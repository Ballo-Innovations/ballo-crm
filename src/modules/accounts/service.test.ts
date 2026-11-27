import { describe, expect, it } from "vitest";

import {
  DEFAULT_PAGE_SIZE,
  listParamsToQuery,
  paginate,
  parseListParams,
  sortRows,
  toAccountRow,
  toggleSort,
  type AccountRow,
} from "./service";

// E2-01: accounts list - paginated, sortable, searchable, filtered by sector, tier and lifecycle.

describe("parseListParams", () => {
  it("defaults to page 1 of 25, sorted by ARR, highest first", () => {
    expect(parseListParams({})).toEqual({
      q: "",
      sector: [],
      tier: [],
      lifecycle: [],
      sort: "arr",
      dir: "desc",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("reads search, filters (comma or repeated), sort and paging", () => {
    expect(
      parseListParams({
        q: "  zambezi ",
        sector: "BANKING,MINING",
        tier: ["TIER1", "TIER2"],
        lifecycle: "AT_RISK",
        sort: "name",
        page: "3",
        pageSize: "10",
      }),
    ).toEqual({
      q: "zambezi",
      sector: ["BANKING", "MINING"],
      tier: ["TIER1", "TIER2"],
      lifecycle: ["AT_RISK"],
      sort: "name",
      dir: "asc",
      page: 3,
      pageSize: 10,
    });
  });

  it("reads a leading minus as descending", () => {
    expect(parseListParams({ sort: "-name" })).toMatchObject({ sort: "name", dir: "desc" });
    expect(parseListParams({ sort: "arr" })).toMatchObject({ sort: "arr", dir: "asc" });
  });

  it("ignores values it does not know instead of failing (URLs get hand-edited)", () => {
    expect(
      parseListParams({
        sector: "BANKING,PIRATES",
        tier: "TIER9",
        sort: "password",
        page: "-4",
        pageSize: "100000",
      }),
    ).toMatchObject({
      sector: ["BANKING"],
      tier: [],
      sort: "arr",
      dir: "desc",
      page: 1,
      pageSize: 100,
    });
    expect(parseListParams({ page: "abc", pageSize: "0" })).toMatchObject({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("drops duplicate filter values and caps the search length", () => {
    const p = parseListParams({ sector: "MINING,MINING", q: "x".repeat(500) });
    expect(p.sector).toEqual(["MINING"]);
    expect(p.q).toHaveLength(100);
  });
});

describe("listParamsToQuery", () => {
  it("writes only what differs from the defaults, so URLs stay short", () => {
    expect(listParamsToQuery(parseListParams({}))).toEqual({});
    expect(
      listParamsToQuery(
        parseListParams({ q: "kitwe", sector: "RETAIL,ENERGY", sort: "-name", page: "2" }),
      ),
    ).toEqual({ q: "kitwe", sector: "RETAIL,ENERGY", sort: "-name", page: "2" });
  });

  it("round-trips through parseListParams", () => {
    const p = parseListParams({
      tier: "TIER2",
      lifecycle: "ACTIVE,AT_RISK",
      sort: "owner",
      pageSize: "50",
    });
    expect(parseListParams(listParamsToQuery(p))).toEqual(p);
  });
});

describe("toggleSort", () => {
  it("flips the direction on the current column", () => {
    expect(toggleSort({ sort: "arr", dir: "desc" }, "arr")).toEqual({ sort: "arr", dir: "asc" });
    expect(toggleSort({ sort: "name", dir: "asc" }, "name")).toEqual({ sort: "name", dir: "desc" });
  });

  it("starts text columns A to Z and number columns highest first", () => {
    expect(toggleSort({ sort: "arr", dir: "desc" }, "name")).toEqual({ sort: "name", dir: "asc" });
    expect(toggleSort({ sort: "name", dir: "asc" }, "pipeline")).toEqual({
      sort: "pipeline",
      dir: "desc",
    });
  });
});

describe("toAccountRow", () => {
  const raw = {
    id: "a1",
    name: "Zambezi Commercial Bank",
    city: "Lusaka",
    sector: "BANKING" as const,
    tier: "TIER1" as const,
    lifecycle: "ACTIVE" as const,
    engagementScore: 64,
    owner: { name: "Mutale Banda" },
    subscriptions: [
      { annualValue: 30_000_000, active: true },
      { annualValue: 27_000_000, active: true },
      { annualValue: 99_000_000, active: false },
    ],
    opportunities: [
      { amount: 10_000_000, stage: "PROPOSE" as const },
      { amount: 5_000_000, stage: "QUALIFY" as const },
      { amount: 70_000_000, stage: "CLOSED_WON" as const },
      { amount: 80_000_000, stage: "CLOSED_LOST" as const },
    ],
  };

  it("sums active subscriptions as ARR and open deals as pipeline (ngwee)", () => {
    expect(toAccountRow(raw)).toEqual({
      id: "a1",
      name: "Zambezi Commercial Bank",
      city: "Lusaka",
      sector: "BANKING",
      tier: "TIER1",
      lifecycle: "ACTIVE",
      engagementScore: 64,
      owner: "Mutale Banda",
      arr: 57_000_000,
      pipeline: 15_000_000,
    });
  });

  it("gives zero, not nothing, for an account with no services or deals", () => {
    expect(toAccountRow({ ...raw, subscriptions: [], opportunities: [] })).toMatchObject({
      arr: 0,
      pipeline: 0,
    });
  });
});

const row = (name: string, extra: Partial<AccountRow> = {}): AccountRow => ({
  id: name,
  name,
  city: null,
  sector: "BANKING",
  tier: "TIER2",
  lifecycle: "ACTIVE",
  engagementScore: 0,
  owner: "Mutale Banda",
  arr: 0,
  pipeline: 0,
  ...extra,
});

describe("sortRows", () => {
  const rows = [
    row("SolarZed", { arr: 0, tier: "TIER2", lifecycle: "PROSPECT", sector: "ENERGY" }),
    row("ZedMobile", { arr: 51, tier: "TIER1", lifecycle: "ACTIVE", sector: "TELECOMS" }),
    row("konkola copper", { arr: 30, tier: "TIER1", lifecycle: "ACTIVE", sector: "MINING" }),
    row("MegaMart", { arr: 30, tier: "TIER2", lifecycle: "AT_RISK", sector: "RETAIL" }),
  ];
  const names = (r: AccountRow[]) => r.map((x) => x.name);

  it("sorts numbers highest first, breaking ties by name", () => {
    expect(names(sortRows(rows, "arr", "desc"))).toEqual([
      "ZedMobile",
      "konkola copper",
      "MegaMart",
      "SolarZed",
    ]);
  });

  it("sorts names A to Z ignoring case", () => {
    expect(names(sortRows(rows, "name", "asc"))).toEqual([
      "konkola copper",
      "MegaMart",
      "SolarZed",
      "ZedMobile",
    ]);
  });

  it("sorts lifecycle and tier in their business order, not alphabetically", () => {
    expect(names(sortRows(rows, "lifecycle", "asc"))).toEqual([
      "SolarZed",
      "konkola copper",
      "ZedMobile",
      "MegaMart",
    ]);
    expect(names(sortRows(rows, "tier", "asc")).slice(0, 2)).toEqual([
      "konkola copper",
      "ZedMobile",
    ]);
  });

  it("sorts by sector, owner, pipeline and engagement", () => {
    const more = [
      row("A", { sector: "RETAIL", owner: "Zulu", pipeline: 5, engagementScore: 10 }),
      row("B", { sector: "BANKING", owner: "Banda", pipeline: 9, engagementScore: 80 }),
      row("C", { sector: "MINING", owner: "Mwale", pipeline: 1, engagementScore: 45 }),
    ];
    expect(names(sortRows(more, "sector", "asc"))).toEqual(["B", "C", "A"]);
    expect(names(sortRows(more, "owner", "asc"))).toEqual(["B", "C", "A"]);
    expect(names(sortRows(more, "pipeline", "desc"))).toEqual(["B", "A", "C"]);
    expect(names(sortRows(more, "engagement", "desc"))).toEqual(["B", "C", "A"]);
  });

  it("does not change the input array", () => {
    const before = names(rows);
    sortRows(rows, "name", "desc");
    expect(names(rows)).toEqual(before);
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 5 }, (_, i) => row(`A${i}`));

  it("returns the requested page with totals", () => {
    expect(paginate(rows, 2, 2)).toEqual({
      rows: [rows[2], rows[3]],
      page: 2,
      pageCount: 3,
      total: 5,
    });
  });

  it("clamps a page past the end to the last page", () => {
    expect(paginate(rows, 9, 2)).toMatchObject({ rows: [rows[4]], page: 3 });
  });

  it("reports one empty page when there is nothing to show", () => {
    expect(paginate([], 1, 25)).toEqual({ rows: [], page: 1, pageCount: 1, total: 0 });
  });
});
