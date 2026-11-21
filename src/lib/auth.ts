import "server-only";

import type { Role } from "@prisma/client";

import { AppError } from "./errors";

export type SessionUser = { id: string; email: string; name: string; role: Role };

/**
 * Current signed-in user, or null.
 * TODO(E0-04): implement with Auth.js (credentials login, session, role claim).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  return null;
}

/**
 * Guard for the top of every server action / API route:
 * `requireRole(["ADMIN", "MANAGER"])` -> zod parse -> `withAudit(...)`.
 * Permission matrix: docs/02-architecture/05-security-rbac-audit.md.
 * TODO(E0-05): row-level filters (reps see own + team accounts) and unit tests.
 */
export async function requireRole(roles: readonly Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
  if (!roles.includes(user.role)) {
    throw new AppError("FORBIDDEN", "You do not have access to this.");
  }
  return user;
}
