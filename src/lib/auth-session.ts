import { z } from "zod";

/**
 * Credentials check and the role claim (E0-04). Pure: the database lookup and the password
 * check are passed in, so this is unit-tested without Prisma. Wired up in `src/auth.ts`.
 */

// Mirrors the Prisma `Role` enum. Kept as a literal list so this file stays edge-safe;
// `src/lib/auth-session.test.ts` and the type below fail if the two drift.
export const ROLES = ["ADMIN", "MANAGER", "REP", "MARKETING", "LEGAL", "READONLY"] as const;
export type Role = (typeof ROLES)[number];

export type SessionUser = { id: string; email: string; name: string; role: Role };

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

type StoredUser = SessionUser & { password: string };

export type AuthorizeDeps = {
  findUserByEmail: (email: string) => Promise<StoredUser | null>;
  verifyPassword: (plain: string, hash: string) => Promise<boolean>;
};

/** The signed-in user for valid credentials, otherwise null. Never says which part was wrong. */
export async function authorizeCredentials(
  input: unknown,
  deps: AuthorizeDeps,
): Promise<SessionUser | null> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return null;

  const user = await deps.findUserByEmail(parsed.data.email);
  if (!user) return null;
  if (!(await deps.verifyPassword(parsed.data.password, user.password))) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

type Claims = Record<string, unknown>;

/** Auth.js `jwt` callback: copy id and role onto the token at sign-in (`user` is set only then). */
export function withUserClaims<T extends Claims>(
  token: T,
  user: { id?: string; role?: Role } | undefined,
): T {
  if (!user) return token;
  return { ...token, uid: user.id, role: user.role };
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** The session user from a token, or null when the token lacks a valid id and role. */
export function sessionUserFromToken(token: Claims | null | undefined): SessionUser | null {
  if (!token || typeof token.uid !== "string" || !isRole(token.role)) return null;
  return {
    id: token.uid,
    email: typeof token.email === "string" ? token.email : "",
    name: typeof token.name === "string" ? token.name : "",
    role: token.role,
  };
}
