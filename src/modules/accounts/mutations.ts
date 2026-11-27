// accounts module - writes. Each takes the signed-in user explicitly so it can be tested
// against a real database; `actions.ts` wraps them as server actions with the session user.
// Order per AGENTS.md: role check -> zod parse -> withAudit.

import "server-only";

import { withAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { accountReadFilter, assertCan, canEditRecord } from "@/lib/rbac";
import { parseInput } from "@/lib/validation";

import { contactInputSchema, type ContactRow } from "./types";

const CONTACT_FIELDS = {
  id: true,
  accountId: true,
  firstName: true,
  lastName: true,
  title: true,
  email: true,
  phone: true,
  influence: true,
  stance: true,
} as const;

/**
 * The account, if this user may change it. Hidden accounts are NOT_FOUND (the same answer as
 * a missing one, so ids do not leak); visible but not theirs to edit is FORBIDDEN.
 */
async function editableAccount(user: SessionUser, accountId: string) {
  assertCan(user, "records.edit");
  const account = await db.account.findFirst({
    where: { AND: [accountReadFilter(user), { id: accountId }] },
    select: { id: true, ownerId: true },
  });
  if (!account) throw new AppError("NOT_FOUND", "That account isn't available.");
  if (!canEditRecord(user, account)) {
    throw new AppError("FORBIDDEN", "Only the account owner or a manager can change contacts.");
  }
  return account;
}

async function editableContact(user: SessionUser, contactId: string) {
  assertCan(user, "records.edit");
  const contact = await db.contact.findUnique({ where: { id: contactId }, select: CONTACT_FIELDS });
  if (!contact) throw new AppError("NOT_FOUND", "That contact isn't available.");
  await editableAccount(user, contact.accountId);
  return contact;
}

export async function createContact(
  user: SessionUser,
  accountId: string,
  raw: unknown,
): Promise<ContactRow> {
  await editableAccount(user, accountId);
  const data = parseInput(contactInputSchema, raw);
  return withAudit<ContactRow & { accountId: string }>(
    {
      actor: user,
      entity: "Contact",
      entityId: (c) => c.id,
      action: "CREATE",
      after: (c: ContactRow) => c,
    },
    () => db.contact.create({ data: { ...data, accountId }, select: CONTACT_FIELDS }),
  );
}

export async function updateContact(
  user: SessionUser,
  contactId: string,
  raw: unknown,
): Promise<ContactRow> {
  const before = await editableContact(user, contactId);
  const data = parseInput(contactInputSchema, raw);
  return withAudit<ContactRow & { accountId: string }>(
    {
      actor: user,
      entity: "Contact",
      entityId: contactId,
      action: "UPDATE",
      before,
      after: (c: ContactRow) => c,
    },
    () => db.contact.update({ where: { id: contactId }, data, select: CONTACT_FIELDS }),
  );
}

export async function deleteContact(user: SessionUser, contactId: string): Promise<void> {
  const before = await editableContact(user, contactId);
  await withAudit(
    { actor: user, entity: "Contact", entityId: contactId, action: "DELETE", before },
    async () => {
      await db.contact.delete({ where: { id: contactId } });
    },
  );
}
