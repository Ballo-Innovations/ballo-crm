import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import type { RbacUser } from "@/lib/rbac";

import { listAccounts } from "./queries";
import { parseListParams } from "./service";

// E2-01 against the seeded database (seed v0: 5 accounts, reps round-robin across two teams).
// Lusaka team: Zambezi Commercial Bank, Konkola Copper Resources, SolarZed.
// Copperbelt team: ZedMobile, MegaMart Zambia.

const params = (raw: Record<string, string> = {}) => parseListParams(raw);
const names = (r: { rows: { name: string }[] }) => r.rows.map((x) => x.name);

async function userFor(email: string): Promise<RbacUser> {
  const u = await db.user.findUniqueOrThrow({ where: { email } });
  return { id: u.id, role: u.role, teamId: u.teamId };
}

let admin: RbacUser;
let lusakaRep: RbacUser;
let copperbeltRep: RbacUser;
const created = { contactId: "", opportunityIds: [] as string[] };

beforeAll(async () => {
  admin = await userFor("admin@compass.zm");
  lusakaRep = await userFor("mutale@compass.zm");
  copperbeltRep = await userFor("nkandu@compass.zm");

  const bank = await db.account.findFirstOrThrow({ where: { name: "Zambezi Commercial Bank" } });
  const contact = await db.contact.create({
    data: { accountId: bank.id, firstName: "Natasha", lastName: "Mwale" },
  });
  created.contactId = contact.id;

  const solar = await db.account.findFirstOrThrow({ where: { name: "SolarZed" } });
  for (const [amount, stage] of [
    [40_000_000, "PROPOSE"],
    [25_000_000, "NEGOTIATE"],
    [90_000_000, "CLOSED_WON"],
    [60_000_000, "CLOSED_LOST"],
  ] as const) {
    const o = await db.opportunity.create({
      data: {
        accountId: solar.id,
        ownerId: solar.ownerId,
        name: `E2-01 test ${stage}`,
        amount,
        stage,
        closeDate: new Date("2027-03-31T00:00:00Z"),
      },
    });
    created.opportunityIds.push(o.id);
  }
});

afterAll(async () => {
  await db.opportunity.deleteMany({ where: { id: { in: created.opportunityIds } } });
  await db.contact.deleteMany({ where: { id: created.contactId } });
});

describe("listAccounts: who sees what (TC-03)", () => {
  it("an admin sees every account", async () => {
    const r = await listAccounts(admin, params());
    expect(r.total).toBe(5);
    expect(r.grandTotal).toBe(5);
  });

  it("a rep sees only their team's accounts", async () => {
    expect(names(await listAccounts(lusakaRep, params({ sort: "name" })))).toEqual([
      "Konkola Copper Resources",
      "SolarZed",
      "Zambezi Commercial Bank",
    ]);
    expect(names(await listAccounts(copperbeltRep, params({ sort: "name" })))).toEqual([
      "MegaMart Zambia",
      "ZedMobile",
    ]);
  });

  it("read-only users see every account", async () => {
    const readonly: RbacUser = { id: "nobody", role: "READONLY", teamId: null };
    expect((await listAccounts(readonly, params())).total).toBe(5);
  });

  it("a rep's grand total counts only what they may see", async () => {
    expect((await listAccounts(copperbeltRep, params({ q: "zz-none" }))).grandTotal).toBe(2);
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

  it("computes ARR from active subscriptions", async () => {
    const r = await listAccounts(admin, params({ q: "Zambezi" }));
    expect(r.rows[0]).toMatchObject({ arr: 57_000_000, owner: expect.any(String) });
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
    expect((await listAccounts(copperbeltRep, params({ q: "zambezi" }))).total).toBe(0);
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
