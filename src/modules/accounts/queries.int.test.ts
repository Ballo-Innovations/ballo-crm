import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import type { RbacUser } from "@/lib/rbac";

import { listAccounts } from "./queries";
import { parseListParams } from "./service";

// E2-01 against a real database. The test builds its own data (CI runs it on an empty,
// migrated database) and tags every account with a unique word, so seeded rows never interfere.
const TAG = `qx${Date.now().toString(36)}`;
const teamA = `${TAG}-lusaka`;
const teamB = `${TAG}-copperbelt`;
const PRODUCT = `${TAG}-FIBRE`;

const params = (raw: Record<string, string> = {}) =>
  parseListParams({ ...raw, q: raw.q ? `${TAG} ${raw.q}` : TAG });
const names = (r: { rows: { name: string }[] }) => r.rows.map((x) => x.name.replace(`${TAG} `, ""));

const admin: RbacUser = { id: "admin", role: "ADMIN", teamId: null };
const readonly: RbacUser = { id: "readonly", role: "READONLY", teamId: null };
let repA: RbacUser;
let repA2: RbacUser;
let repB: RbacUser;
const userIds: string[] = [];

// name, sector, tier, lifecycle, city, owner (A, A2 or B), active ARR, inactive ARR
const ACCOUNTS = [
  ["Zambezi Commercial Bank", "BANKING", "TIER1", "ACTIVE", "Lusaka", "A", 57_000_000, 0],
  ["ZedMobile", "TELECOMS", "TIER1", "ACTIVE", "Lusaka", "B", 51_000_000, 0],
  ["Konkola Copper Resources", "MINING", "TIER1", "ACTIVE", "Chingola", "A2", 30_000_000, 0],
  ["MegaMart Zambia", "RETAIL", "TIER2", "AT_RISK", "Kitwe", "B", 30_000_000, 9_000_000],
  ["SolarZed", "ENERGY", "TIER2", "PROSPECT", "Solwezi", "A", 0, 0],
] as const;

beforeAll(async () => {
  const mk = async (suffix: string, teamId: string) => {
    const u = await db.user.create({
      data: { email: `${TAG}-${suffix}@test.local`, name: `Rep ${suffix}`, password: "x", teamId },
    });
    userIds.push(u.id);
    return { id: u.id, role: u.role, teamId: u.teamId };
  };
  repA = await mk("a", teamA);
  repA2 = await mk("a2", teamA);
  repB = await mk("b", teamB);
  const owners = { A: repA, A2: repA2, B: repB };

  await db.product.create({
    data: { code: PRODUCT, name: "Test fibre", category: "Connectivity", listPrice: 1 },
  });

  for (const [name, sector, tier, lifecycle, city, owner, arr, inactive] of ACCOUNTS) {
    const subs = [
      ...(arr ? [{ annualValue: arr, active: true }] : []),
      ...(inactive ? [{ annualValue: inactive, active: false }] : []),
    ];
    await db.account.create({
      data: {
        name: `${TAG} ${name}`,
        sector,
        tier,
        lifecycle,
        city,
        ownerId: owners[owner].id,
        subscriptions: {
          create: subs.map((s) => ({
            ...s,
            productCode: PRODUCT,
            startDate: new Date("2026-01-01"),
          })),
        },
      },
    });
  }

  const bank = await db.account.findFirstOrThrow({
    where: { name: `${TAG} Zambezi Commercial Bank` },
  });
  await db.contact.create({
    data: { accountId: bank.id, firstName: "Natasha", lastName: "Mwale" },
  });

  const solar = await db.account.findFirstOrThrow({ where: { name: `${TAG} SolarZed` } });
  for (const [amount, stage] of [
    [40_000_000, "PROPOSE"],
    [25_000_000, "NEGOTIATE"],
    [90_000_000, "CLOSED_WON"],
    [60_000_000, "CLOSED_LOST"],
  ] as const) {
    await db.opportunity.create({
      data: {
        accountId: solar.id,
        ownerId: solar.ownerId,
        name: `Test ${stage}`,
        amount,
        stage,
        closeDate: new Date("2027-03-31T00:00:00Z"),
      },
    });
  }
});

afterAll(async () => {
  const mine = { name: { startsWith: `${TAG} ` } };
  await db.opportunity.deleteMany({ where: { account: mine } });
  await db.account.deleteMany({ where: mine }); // cascades contacts and subscriptions
  await db.product.deleteMany({ where: { code: PRODUCT } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
});

describe("listAccounts: who sees what (TC-03)", () => {
  it("an admin sees every account", async () => {
    const r = await listAccounts(admin, params());
    expect(r.total).toBe(5);
    expect(r.grandTotal).toBeGreaterThanOrEqual(5);
  });

  it("a rep sees only their team's accounts", async () => {
    expect(names(await listAccounts(repA, params({ sort: "name" })))).toEqual([
      "Konkola Copper Resources",
      "SolarZed",
      "Zambezi Commercial Bank",
    ]);
    expect(names(await listAccounts(repB, params({ sort: "name" })))).toEqual([
      "MegaMart Zambia",
      "ZedMobile",
    ]);
  });

  it("read-only users see every account", async () => {
    expect((await listAccounts(readonly, params())).total).toBe(5);
  });

  it("a rep's grand total counts only what they may see", async () => {
    expect((await listAccounts(repB, params())).grandTotal).toBe(2);
  });
});

describe("listAccounts: sorting and paging", () => {
  it("sorts by ARR, highest first, by default (ties by name)", async () => {
    expect(names(await listAccounts(admin, params()))).toEqual([
      "Zambezi Commercial Bank",
      "ZedMobile",
      "Konkola Copper Resources",
      "MegaMart Zambia",
      "SolarZed",
    ]);
  });

  it("computes ARR from active subscriptions only", async () => {
    const r = await listAccounts(admin, params({ q: "MegaMart" }));
    expect(r.rows[0]).toMatchObject({ arr: 30_000_000, owner: "Rep b" });
  });

  it("counts only open deals as pipeline", async () => {
    const r = await listAccounts(admin, params({ q: "SolarZed" }));
    expect(r.rows[0]?.pipeline).toBe(65_000_000);
  });

  it("returns the requested page and clamps past the end", async () => {
    const page3 = await listAccounts(admin, params({ sort: "name", pageSize: "2", page: "3" }));
    expect(page3).toMatchObject({ page: 3, pageCount: 3, total: 5 });
    expect(names(page3)).toEqual(["ZedMobile"]);
    expect((await listAccounts(admin, params({ pageSize: "2", page: "40" }))).page).toBe(3);
  });
});

describe("listAccounts: search and filters", () => {
  it("searches account names ignoring case", async () => {
    expect(names(await listAccounts(admin, params({ q: "zambezi" })))).toEqual([
      "Zambezi Commercial Bank",
    ]);
  });

  it("searches the city", async () => {
    expect(names(await listAccounts(admin, params({ q: "kitwe" })))).toEqual(["MegaMart Zambia"]);
  });

  it("searches contact names, including first and last name together", async () => {
    expect(names(await listAccounts(admin, params({ q: "mwale" })))).toEqual([
      "Zambezi Commercial Bank",
    ]);
    expect(names(await listAccounts(admin, params({ q: "Natasha Mwale" })))).toEqual([
      "Zambezi Commercial Bank",
    ]);
  });

  it("never widens a rep's view through search", async () => {
    expect((await listAccounts(repB, params({ q: "zambezi" }))).total).toBe(0);
  });

  it("ORs values within a filter and ANDs across filters", async () => {
    expect(
      names(await listAccounts(admin, params({ sector: "BANKING,RETAIL", sort: "name" }))),
    ).toEqual(["MegaMart Zambia", "Zambezi Commercial Bank"]);
    expect(
      names(await listAccounts(admin, params({ tier: "TIER2", lifecycle: "AT_RISK" }))),
    ).toEqual(["MegaMart Zambia"]);
  });
});
