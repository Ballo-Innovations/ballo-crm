"use server";

// accounts module - Account 360, contacts, subscriptions.
// Owner: Dev A | Epic: E2 (docs/04-delivery/03-tickets.csv)
//
// Server actions: the session user -> the checked, validated, audited write in mutations.ts.

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { errorResponse, type ErrorBody } from "@/lib/validation";

import { createContact, deleteContact, updateContact } from "./mutations";
import type { ContactRow } from "./types";

export type ActionResult<T> = { ok: true; data: T } | ({ ok: false } & ErrorBody);

async function run<T>(
  work: (user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
    const data = await work(user);
    revalidatePath("/accounts");
    return { ok: true, data };
  } catch (err) {
    return { ok: false, ...errorResponse(err).body };
  }
}

export async function createContactAction(
  accountId: string,
  input: Record<string, string>,
): Promise<ActionResult<ContactRow>> {
  return run((user) => createContact(user, accountId, input));
}

export async function updateContactAction(
  contactId: string,
  input: Record<string, string>,
): Promise<ActionResult<ContactRow>> {
  return run((user) => updateContact(user, contactId, input));
}

export async function deleteContactAction(contactId: string): Promise<ActionResult<null>> {
  return run(async (user) => {
    await deleteContact(user, contactId);
    return null;
  });
}
