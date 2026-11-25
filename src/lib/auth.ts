import "server-only";

import type { Role } from "@prisma/client";

import { auth } from "@/auth";

import { sessionUserFromToken } from "./auth-session";
import { AppError } from "./errors";

export type SessionUser = { id: string; email: string; name: string; role: Role };

/** Current signed-in user from the Auth.js session (role included), or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const { id, role, email, name } = session.user as Record<string, unknown>;
  return sessionUserFromToken({ uid: id, role, email, name });
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
