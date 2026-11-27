// accounts module - Account 360, contacts, subscriptions.
// Owner: Dev A | Epic: E2 (docs/04-delivery/03-tickets.csv)
//
// Read queries (Prisma). Apply row-level filters here: reps see own + team records.

import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { accountReadFilter, can, canEditRecord, type RbacUser } from "@/lib/rbac";

import { paginate, sortRows, toAccountOverview, toAccountRow } from "./service";
import type { AccountListParams, AccountListResult, AccountOverview, ContactRow } from "./types";

/** Every word must appear in the name, the city or a contact's first or last name. */
function searchFilter(q: string): Prisma.AccountWhereInput[] {
  return q
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const contains = { contains: word, mode: "insensitive" as const };
      return {
        OR: [
          { name: contains },
          { city: contains },
          { contacts: { some: { OR: [{ firstName: contains }, { lastName: contains }] } } },
        ],
      };
    });
}

/**
 * The accounts list (E2-01), scoped to what the user may see (TC-03). ARR and pipeline are
 * aggregates across relations, so rows are sorted and paged in memory: fine at the PRD's
 * scale (about 200 accounts); move to SQL if that grows by an order of magnitude.
 */
export async function listAccounts(
  user: RbacUser,
  params: AccountListParams,
): Promise<AccountListResult> {
  const scope = accountReadFilter(user);
  const where: Prisma.AccountWhereInput = {
    AND: [
      scope,
      ...(params.sector.length ? [{ sector: { in: params.sector } }] : []),
      ...(params.tier.length ? [{ tier: { in: params.tier } }] : []),
      ...(params.lifecycle.length ? [{ lifecycle: { in: params.lifecycle } }] : []),
      ...searchFilter(params.q),
    ],
  };

  const [accounts, grandTotal] = await Promise.all([
    db.account.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        sector: true,
        tier: true,
        lifecycle: true,
        engagementScore: true,
        owner: { select: { name: true } },
        subscriptions: { select: { annualValue: true, active: true } },
        opportunities: { select: { amount: true, stage: true } },
      },
    }),
    db.account.count({ where: scope }),
  ]);

  const sorted = sortRows(accounts.map(toAccountRow), params.sort, params.dir);
  return { ...paginate(sorted, params.page, params.pageSize), grandTotal };
}

/**
 * Account 360 header and Overview (E2-02). Null when the account does not exist or the user
 * may not see it (TC-03), so the page shows the same "not available" either way.
 */
export async function getAccountOverview(
  user: RbacUser,
  id: string,
): Promise<AccountOverview | null> {
  const account = await db.account.findFirst({
    where: { AND: [accountReadFilter(user), { id }] },
    select: {
      id: true,
      name: true,
      city: true,
      sector: true,
      tier: true,
      lifecycle: true,
      engagementScore: true,
      healthScore: true,
      owner: { select: { name: true } },
      subscriptions: { select: { annualValue: true, active: true } },
      opportunities: { select: { amount: true, weightedValue: true, stage: true } },
    },
  });
  return account ? toAccountOverview(account) : null;
}

const CONTACT_FIELDS = {
  id: true,
  firstName: true,
  lastName: true,
  title: true,
  email: true,
  phone: true,
  influence: true,
  stance: true,
} as const;

/** The Contacts tab (E2-03): most influential first. Null when the account is not visible. */
export async function listContacts(
  user: RbacUser,
  accountId: string,
): Promise<ContactRow[] | null> {
  const account = await db.account.findFirst({
    where: { AND: [accountReadFilter(user), { id: accountId }] },
    select: {
      contacts: {
        select: CONTACT_FIELDS,
        orderBy: [{ influence: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
      },
    },
  });
  return account ? account.contacts : null;
}

/** Whether the user may change this account's records (REP: own accounts only). */
export async function canEditAccount(user: RbacUser, accountId: string): Promise<boolean> {
  if (!can(user, "records.edit")) return false;
  const account = await db.account.findFirst({
    where: { AND: [accountReadFilter(user), { id: accountId }] },
    select: { ownerId: true },
  });
  return !!account && canEditRecord(user, account);
}
