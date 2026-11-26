import "server-only";

import type { Role } from "@prisma/client";

import { auth } from "@/auth";

import { sessionUserFromToken, type SessionUser } from "./auth-session";
import { assertCan, assertRole, type Capability } from "./rbac";

export type { SessionUser };

/** Current signed-in user from the Auth.js session (role and team included), or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const { id, role, teamId, email, name } = session.user as Record<string, unknown>;
  return sessionUserFromToken({ uid: id, role, teamId, email, name });
}

/**
 * Guard for the top of every server action / API route, by capability:
 * `requireCan("records.edit")` -> zod parse -> `withAudit(...)`.
 * The matrix lives in src/lib/rbac.ts (docs/02-architecture/05-security-rbac-audit.md).
 * For "own"/"team" scopes, also check the record: `canEditRecord`, `accountReadFilter`.
 */
export async function requireCan(capability: Capability): Promise<SessionUser> {
  return assertCan(await getSessionUser(), capability);
}

/** Same guard by explicit role list, for the rare case no capability fits. */
export async function requireRole(roles: readonly Role[]): Promise<SessionUser> {
  return assertRole(await getSessionUser(), roles);
}
