import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { withAudit } from "./audit";
import type { SessionUser } from "./auth";
import { db } from "./db";

// E0-06 against a real Postgres: "Every wrapped action creates AuditLog with diff" (TC-70).

const ENTITY = "AuditTest";
let actor: SessionUser;

beforeAll(async () => {
  const user = await db.user.upsert({
    where: { email: "audit-int-test@example.test" },
    update: {},
    create: {
      email: "audit-int-test@example.test",
      name: "Audit Test",
      password: "x",
      role: "ADMIN",
    },
  });
  actor = { id: user.id, role: user.role, teamId: null, email: user.email, name: user.name };
});

beforeEach(async () => {
  await db.auditLog.deleteMany({ where: { entity: ENTITY } });
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { entity: ENTITY } });
  await db.user.deleteMany({ where: { email: "audit-int-test@example.test" } });
  await db.$disconnect();
});

describe("withAudit", () => {
  it("writes one AuditLog row with actor, entity, id, action and the before/after diff", async () => {
    const result = await withAudit(
      {
        actor,
        entity: ENTITY,
        entityId: "rec-1",
        action: "UPDATE",
        before: { stage: "QUALIFY", name: "Same" },
        after: { stage: "PROPOSE", name: "Same" },
      },
      async () => "done",
    );

    expect(result).toBe("done");
    const rows = await db.auditLog.findMany({ where: { entity: ENTITY } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorId: actor.id,
      entity: ENTITY,
      entityId: "rec-1",
      action: "UPDATE",
      before: { stage: "QUALIFY" },
      after: { stage: "PROPOSE" },
    });
  });

  it("CREATE takes the id and after snapshot from the action's result", async () => {
    await withAudit(
      {
        actor,
        entity: ENTITY,
        action: "CREATE",
        entityId: (r: { id: string }) => r.id,
        after: (r: { id: string; name: string }) => r,
      },
      async () => ({ id: "new-7", name: "Acme Zambia" }),
    );

    const row = await db.auditLog.findFirstOrThrow({ where: { entity: ENTITY } });
    expect(row).toMatchObject({
      entityId: "new-7",
      action: "CREATE",
      before: null,
      after: { id: "new-7", name: "Acme Zambia" },
    });
  });

  it("writes no row when the action fails, and rethrows", async () => {
    await expect(
      withAudit({ actor, entity: ENTITY, entityId: "x", action: "DELETE", before: { a: 1 } }, () =>
        Promise.reject(new Error("boom")),
      ),
    ).rejects.toThrow("boom");

    expect(await db.auditLog.count({ where: { entity: ENTITY } })).toBe(0);
  });

  it("records a system action with no actor", async () => {
    await withAudit(
      { actor: null, entity: ENTITY, entityId: "sys", action: "UPDATE" },
      async () => 1,
    );
    const row = await db.auditLog.findFirstOrThrow({ where: { entity: ENTITY } });
    expect(row.actorId).toBeNull();
  });
});
