import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import type { RbacUser } from "@/lib/rbac";

import { listServices } from "./queries";

// E2-04 against a real database; builds its own data (CI's database is empty).
const TAG = `sv${Date.now().toString(36)}`;
const P1 = `${TAG}-A`;
const P2 = `${TAG}-B`;
const admin: RbacUser = { id: "admin", role: "ADMIN", teamId: null };
let otherTeam: RbacUser;
let accountId = "";
const userIds: string[] = [];

beforeAll(async () => {
  const owner = await db.user.create({
    data: { email: `${TAG}-o@test.local`, name: "Owner", password: "x", teamId: `${TAG}-a` },
  });
  const other = await db.user.create({
    data: { email: `${TAG}-x@test.local`, name: "Other", password: "x", teamId: `${TAG}-b` },
  });
  userIds.push(owner.id, other.id);
  otherTeam = { id: other.id, role: other.role, teamId: other.teamId };
  await db.product.createMany({
    data: [
      { code: P1, name: `${TAG} Fibre`, category: "Connectivity", listPrice: 18_000_000 },
      { code: P2, name: `${TAG} DRaaS`, category: "Cloud", listPrice: 20_000_000 },
    ],
  });
  const a = await db.account.create({
    data: {
      name: `${TAG} Kafue Gorge Mills`,
      sector: "MINING",
      ownerId: owner.id,
      subscriptions: {
        create: [
          {
            productCode: P1,
            annualValue: 21_000_000,
            usagePct: 85,
            startDate: new Date("2025-03-01"),
          },
        ],
      },
    },
  });
  accountId = a.id;
});

afterAll(async () => {
  await db.account.deleteMany({ where: { id: accountId } });
  await db.product.deleteMany({ where: { code: { in: [P1, P2] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
});

describe("listServices", () => {
  it("returns the account's services with usage, and the catalogue products it lacks", async () => {
    const s = await listServices(admin, accountId);
    expect(s).not.toBeNull();
    expect(s!.active).toEqual([
      expect.objectContaining({ code: P1, annualValue: 21_000_000, usagePct: 85 }),
    ]);
    expect(s!.arr).toBe(21_000_000);
    expect(s!.whitespace.map((p) => p.code)).toContain(P2);
    expect(s!.whitespace.map((p) => p.code)).not.toContain(P1);
  });

  it("returns nothing for an account the user may not see", async () => {
    expect(await listServices(otherTeam, accountId)).toBeNull();
  });
});
