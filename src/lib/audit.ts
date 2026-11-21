import "server-only";

import type { SessionUser } from "./auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "ERASE";

export type AuditEntry = {
  actor: SessionUser | null;
  entity: string;
  entityId: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
};

/**
 * Every mutating server action writes an AuditLog row through this.
 * TODO(E0-06): persist to `AuditLog` with a before/after diff.
 */
export async function withAudit<T>(entry: AuditEntry, run: () => Promise<T>): Promise<T> {
  void entry;
  return run();
}
