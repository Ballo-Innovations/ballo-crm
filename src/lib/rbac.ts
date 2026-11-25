import type { Prisma } from "@prisma/client";

import type { Role } from "./auth-session";
import { AppError } from "./errors";
import { primaryNav, type NavItem } from "./site";

/**
 * Role-based access (E0-05): the permission matrix in
 * docs/02-architecture/05-security-rbac-audit.md as one table, plus the row filters that apply
 * it to queries. Pure and client-safe, so the nav can use it too. Server actions go through
 * `requireCan` / `requireRole` in `src/lib/auth.ts`; queries add `accountReadFilter`.
 */

/** all = everything; team = records owned by the user's team; own = records they own. */
export type Scope = "all" | "team" | "own" | "none";

export const CAPABILITIES = [
  "records.view", // view accounts and opportunities
  "records.edit", // edit accounts and opportunities
  "engagement.log",
  "abm.manage", // ABM plans and playbooks
  "contracts.send", // create and send contracts
  "dashboards.executive",
  "admin.manage", // audit log, users, API keys
  "data.exportErase",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

const MATRIX: Record<Capability, Partial<Record<Role, Scope>>> = {
  "records.view": {
    ADMIN: "all",
    MANAGER: "all",
    REP: "team",
    MARKETING: "all",
    LEGAL: "all",
    READONLY: "all",
  },
  "records.edit": { ADMIN: "all", MANAGER: "all", REP: "own" },
  "engagement.log": { ADMIN: "all", MANAGER: "all", REP: "all", MARKETING: "all" },
  "abm.manage": { ADMIN: "all", MANAGER: "all", MARKETING: "all" },
  "contracts.send": { ADMIN: "all", MANAGER: "all", LEGAL: "all" },
  "dashboards.executive": { ADMIN: "all", MANAGER: "all", MARKETING: "all", READONLY: "all" },
  "admin.manage": { ADMIN: "all" },
  "data.exportErase": { ADMIN: "all" },
};

export function scopeFor(role: Role, capability: Capability): Scope {
  return MATRIX[capability][role] ?? "none";
}

export function can(user: { role: Role }, capability: Capability): boolean {
  return scopeFor(user.role, capability) !== "none";
}

export type RbacUser = { id: string; role: Role; teamId: string | null };

/**
 * Where-clause for reading accounts (and, through `account`, their opportunities).
 * A rep sees accounts owned by anyone in their team, or only their own without a team.
 */
export function accountReadFilter(user: RbacUser): Prisma.AccountWhereInput {
  const scope = scopeFor(user.role, "records.view");
  if (scope === "all") return {};
  if (scope === "team" && user.teamId) return { owner: { teamId: user.teamId } };
  if (scope === "none") return { id: { in: [] } };
  return { ownerId: user.id };
}

/** Whether the user may edit an account or opportunity with this owner. */
export function canEditRecord(user: RbacUser, record: { ownerId: string }): boolean {
  const scope = scopeFor(user.role, "records.edit");
  if (scope === "all") return true;
  return scope === "own" && record.ownerId === user.id;
}

/** Throws UNAUTHENTICATED / FORBIDDEN; returns the user when the capability is granted. */
export function assertCan<U extends { role: Role }>(user: U | null, capability: Capability): U {
  if (!user) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
  if (!can(user, capability)) throw new AppError("FORBIDDEN", "You do not have access to this.");
  return user;
}

export function assertRole<U extends { role: Role }>(user: U | null, roles: readonly Role[]): U {
  if (!user) throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
  if (!roles.includes(user.role)) {
    throw new AppError("FORBIDDEN", "You do not have access to this.");
  }
  return user;
}

/** Modules that need a capability beyond signing in (Settings holds users, audit, API keys). */
const NAV_CAPABILITY: Partial<Record<string, Capability>> = { "/settings": "admin.manage" };

export function capabilityForPath(href: string): Capability | undefined {
  return NAV_CAPABILITY[href];
}

/** The nav items this role may open (TC-01). */
export function navFor(role: Role, nav: NavItem[] = primaryNav): NavItem[] {
  return nav.filter((item) => {
    const capability = NAV_CAPABILITY[item.href];
    return !capability || scopeFor(role, capability) !== "none";
  });
}
