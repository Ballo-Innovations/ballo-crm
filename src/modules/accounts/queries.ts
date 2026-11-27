// accounts module - Account 360, contacts, subscriptions.
// Owner: Dev A | Epic: E2 (docs/04-delivery/03-tickets.csv)
//
// Read queries (Prisma). Apply row-level filters here: reps see own + team records.

import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { accountReadFilter, type RbacUser } from "@/lib/rbac";

import { paginate, sortRows, toAccountRow } from "./service";
import type { AccountListParams, AccountListResult } from "./types";

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
