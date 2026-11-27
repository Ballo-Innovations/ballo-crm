import "server-only";

import { Prisma } from "@prisma/client";

import { auditDiff } from "./audit-diff";
import type { SessionUser } from "./auth";
import { db } from "./db";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "ERASE";

/** A fixed value, or one read from the action's result (for example the id of a new record). */
type FromResult<T, V> = V | ((result: T) => V);

export type AuditEntry<T = unknown> = {
  actor: SessionUser | null;
  entity: string;
  entityId: FromResult<T, string>;
  action: AuditAction;
  /** The record before the change (UPDATE, DELETE, ERASE). */
  before?: unknown;
  /** The record after the change (CREATE, UPDATE); pass a function to take it from the result. */
  after?: FromResult<T, unknown>;
};

function resolve<T, V>(value: FromResult<T, V>, result: T): V {
  return typeof value === "function" ? (value as (r: T) => V)(result) : value;
}

/**
 * Every mutating server action runs through this: it runs the action, then writes one AuditLog
 * row with the actor, entity, id, action and a before/after diff (only the changed fields for an
 * UPDATE; secrets redacted). A failed action writes no row and its error is rethrown.
 */
export async function withAudit<T>(entry: AuditEntry<T>, run: () => Promise<T>): Promise<T> {
  const result = await run();

  const diff = auditDiff(entry.before, resolve(entry.after, result));
  await db.auditLog.create({
    data: {
      actorId: entry.actor?.id ?? null,
      entity: entry.entity,
      entityId: resolve(entry.entityId, result),
      action: entry.action,
      before: diff.before ?? Prisma.DbNull,
      after: diff.after ?? Prisma.DbNull,
    },
  });

  return result;
}
