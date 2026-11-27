import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import type { RbacUser } from "@/lib/rbac";

import { getAccountOverview } from "./queries";

// E2-02: the Overview numbers equal a SQL spot-check. Builds its own data (CI's database is
// empty) under a unique tag and removes it afterwards.
const TAG = `ov${Date.now().toString(36)}`;
const PRODUCT = `${TAG}-SDWAN`;
const admin: RbacUser = { id: "admin", role: "ADMIN", teamId: null };
let owner: RbacUser;
let otherTeamRep: RbacUser;
let accountId = "";
const userIds: string[] = [];

beforeAll(async () => {
  const mk = async (suffix: string, teamId: string) => {
    const u = await db.user.create({
      data: { email: `${TAG}-${suffix}@test.local`, name: `Rep ${suffix}`, password: "x", teamId },
    });
    userIds.push(u.id);
    return { id: u.id, role: u.role, teamId: u.teamId };
  };
  owner = await mk("owner", `${TAG}-a`);
  otherTeamRep = await mk("other", `${TAG}-b`);

  await db.product.create({
    data: { code: PRODUCT, name: "Test SD-WAN", category: "Connectivity", listPrice: 1 },
  });
  const account = await db.account.create({
    data: {
      name: `${TAG} Kariba Power Co.`,
      sector: "ENERGY",
      tier: "TIER1",
      lifecycle: "ONBOARDING",
      ownerId: owner.id,
      engagementScore: 64,
      healthScore: 0.82,
      subscriptions: {
        create: [
          { productCode: PRODUCT, annualValue: 41_000_000, startDate: new Date("2026-01-01") },
          { productCode: PRODUCT, annualValue: 12_500_000, startDate: new Date("2026-02-01") },
          {
            productCode: PRODUCT,
            annualValue: 7_000_000,
            startDate: new Date("2025-01-01"),
            active: false,
          },
        ],
      },
    },
  });
  accountId = account.id;
  for (const [amount, weightedValue, stage] of [
    [30_000_000, 12_000_000, "PROPOSE"],
    [18_000_000, 12_600_000, "NEGOTIATE"],
    [9_000_000, 900_000, "QUALIFY"],
    [50_000_000, 50_000_000, "CLOSED_WON"],
    [22_000_000, 0, "CLOSED_LOST"],
  ] as const) {
    await db.opportunity.create({
      data: {
        accountId,
        ownerId: owner.id,
        name: `Test ${stage}`,
        amount,
        weightedValue,
        stage,
        closeDate: new Date("2027-03-31T00:00:00Z"),
      },
    });
  }
});

afterAll(async () => {
  await db.opportunity.deleteMany({ where: { accountId } });
  await db.account.deleteMany({ where: { id: accountId } });
  await db.product.deleteMany({ where: { code: PRODUCT } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
});

describe("getAccountOverview", () => {
  it("matches a SQL spot-check of ARR, open pipeline and weighted pipeline", async () => {
    const [sql] = await db.$queryRaw<
      { arr: bigint; pipeline: bigint; weighted: bigint; open_deals: bigint }[]
    >`
      SELECT
        (SELECT COALESCE(SUM("annualValue"), 0) FROM "Subscription"
          WHERE "accountId" = ${accountId} AND active) AS arr,
        (SELECT COALESCE(SUM(amount), 0) FROM "Opportunity"
          WHERE "accountId" = ${accountId} AND stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')) AS pipeline,
        (SELECT COALESCE(SUM("weightedValue"), 0) FROM "Opportunity"
          WHERE "accountId" = ${accountId} AND stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')) AS weighted,
        (SELECT COUNT(*) FROM "Opportunity"
          WHERE "accountId" = ${accountId} AND stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')) AS open_deals
    `;
    const o = await getAccountOverview(admin, accountId);
    expect(o).not.toBeNull();
    expect(o!.arr).toBe(Number(sql!.arr));
    expect(o!.pipeline).toBe(Number(sql!.pipeline));
    expect(o!.weightedPipeline).toBe(Number(sql!.weighted));
    expect(o!.openDeals).toBe(Number(sql!.open_deals));
    // and the hand-computed values, so a wrong SQL cannot pass by agreeing with wrong code
    expect(o).toMatchObject({
      arr: 53_500_000,
      pipeline: 57_000_000,
      weightedPipeline: 25_500_000,
      openDeals: 3,
    });
  });

  it("returns the header fields and the stored scores", async () => {
    expect(await getAccountOverview(owner, accountId)).toMatchObject({
      name: `${TAG} Kariba Power Co.`,
      sector: "ENERGY",
      tier: "TIER1",
      lifecycle: "ONBOARDING",
      owner: "Rep owner",
      engagementScore: 64,
      healthScore: 0.82,
    });
  });

  it("returns nothing for an account the user may not see (TC-03)", async () => {
    expect(await getAccountOverview(otherTeamRep, accountId)).toBeNull();
  });

  it("returns nothing for an id that does not exist", async () => {
    expect(await getAccountOverview(admin, "no-such-account")).toBeNull();
  });
});
