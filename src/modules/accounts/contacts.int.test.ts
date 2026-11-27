import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

import { createContact, deleteContact, updateContact } from "./mutations";
import { listContacts } from "./queries";

// E2-03: contacts CRUD on the Account 360 Contacts tab. Builds its own users and account
// (CI's database is empty) and removes them afterwards.
const TAG = `ct${Date.now().toString(36)}`;
const userIds: string[] = [];
let owner: SessionUser;
let teammate: SessionUser;
let otherTeam: SessionUser;
let manager: SessionUser;
let marketing: SessionUser;
let accountId = "";

const input = {
  firstName: "Natasha",
  lastName: "Mwale",
  title: "CFO",
  email: "natasha@example.zm",
  phone: "097 123 4567",
  influence: "4",
  stance: "SUPPORTER",
};

async function caught(p: Promise<unknown>): Promise<AppError> {
  try {
    await p;
  } catch (e) {
    if (e instanceof AppError) return e;
    throw e;
  }
  throw new Error("expected an AppError");
}

beforeAll(async () => {
  const mk = async (
    suffix: string,
    role: SessionUser["role"],
    teamId: string | null,
  ): Promise<SessionUser> => {
    const u = await db.user.create({
      data: {
        email: `${TAG}-${suffix}@test.local`,
        name: `User ${suffix}`,
        password: "x",
        role,
        teamId,
      },
    });
    userIds.push(u.id);
    return { id: u.id, email: u.email, name: u.name, role: u.role, teamId: u.teamId };
  };
  owner = await mk("owner", "REP", `${TAG}-a`);
  teammate = await mk("mate", "REP", `${TAG}-a`);
  otherTeam = await mk("other", "REP", `${TAG}-b`);
  manager = await mk("manager", "MANAGER", null);
  marketing = await mk("mkt", "MARKETING", null);
  const account = await db.account.create({
    data: { name: `${TAG} Kafue Valley Foods`, sector: "RETAIL", ownerId: owner.id },
  });
  accountId = account.id;
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await db.account.deleteMany({ where: { id: accountId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
});

describe("createContact", () => {
  it("adds a contact on the owner's account and audits it", async () => {
    const c = await createContact(owner, accountId, input);
    expect(c).toMatchObject({
      firstName: "Natasha",
      lastName: "Mwale",
      phone: "+260971234567",
      influence: 4,
      stance: "SUPPORTER",
    });
    const audit = await db.auditLog.findFirst({
      where: { entity: "Contact", entityId: c.id, action: "CREATE" },
    });
    expect(audit?.actorId).toBe(owner.id);
    expect(audit?.after).toMatchObject({ firstName: "Natasha", accountId });
  });

  it("rejects invalid input with field messages and writes nothing", async () => {
    const before = await db.contact.count({ where: { accountId } });
    const err = await caught(createContact(owner, accountId, { ...input, firstName: "" }));
    expect(err.code).toBe("VALIDATION");
    expect(err.fields?.firstName).toBe("Enter a first name.");
    expect(await db.contact.count({ where: { accountId } })).toBe(before);
  });

  it("lets a manager add contacts on any account", async () => {
    const c = await createContact(manager, accountId, { ...input, firstName: "Joseph" });
    expect(c.firstName).toBe("Joseph");
  });

  it("stops a rep who does not own the account, even a teammate", async () => {
    expect((await caught(createContact(teammate, accountId, input))).code).toBe("FORBIDDEN");
  });

  it("hides the account from another team entirely", async () => {
    expect((await caught(createContact(otherTeam, accountId, input))).code).toBe("NOT_FOUND");
  });

  it("stops roles that cannot edit records", async () => {
    expect((await caught(createContact(marketing, accountId, input))).code).toBe("FORBIDDEN");
  });
});

describe("updateContact", () => {
  it("changes the fields and audits only what changed", async () => {
    const c = await createContact(owner, accountId, { ...input, firstName: "Lombe" });
    const updated = await updateContact(owner, c.id, {
      ...input,
      firstName: "Lombe",
      stance: "SKEPTIC",
      influence: "2",
    });
    expect(updated).toMatchObject({ stance: "SKEPTIC", influence: 2 });
    const audit = await db.auditLog.findFirst({
      where: { entity: "Contact", entityId: c.id, action: "UPDATE" },
    });
    expect(audit?.before).toEqual({ stance: "SUPPORTER", influence: 4 });
    expect(audit?.after).toEqual({ stance: "SKEPTIC", influence: 2 });
  });

  it("stops a teammate who does not own the account", async () => {
    const c = await createContact(owner, accountId, { ...input, firstName: "Chanda" });
    expect((await caught(updateContact(teammate, c.id, input))).code).toBe("FORBIDDEN");
  });

  it("says not found for an unknown contact", async () => {
    expect((await caught(updateContact(owner, "nope", input))).code).toBe("NOT_FOUND");
  });
});

describe("deleteContact", () => {
  it("removes the contact and audits what was removed", async () => {
    const c = await createContact(owner, accountId, { ...input, firstName: "Mutale" });
    await deleteContact(owner, c.id);
    expect(await db.contact.findUnique({ where: { id: c.id } })).toBeNull();
    const audit = await db.auditLog.findFirst({
      where: { entity: "Contact", entityId: c.id, action: "DELETE" },
    });
    expect(audit?.before).toMatchObject({ firstName: "Mutale" });
  });

  it("stops another team's rep", async () => {
    const c = await createContact(owner, accountId, { ...input, firstName: "Bwalya" });
    expect((await caught(deleteContact(otherTeam, c.id))).code).toBe("NOT_FOUND");
  });
});

describe("listContacts", () => {
  it("lists the account's contacts, most influential first, for anyone who can see it", async () => {
    const list = await listContacts(teammate, accountId);
    expect(list).not.toBeNull();
    const influence = list!.map((c) => c.influence);
    expect(influence).toEqual([...influence].sort((a, b) => b - a));
    expect(list!.some((c) => c.firstName === "Natasha")).toBe(true);
  });

  it("returns nothing for an account the user may not see", async () => {
    expect(await listContacts(otherTeam, accountId)).toBeNull();
  });
});
