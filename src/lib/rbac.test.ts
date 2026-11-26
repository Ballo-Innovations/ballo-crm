import { describe, expect, it } from "vitest";

import type { Role } from "./auth-session";
import {
  CAPABILITIES,
  assertCan,
  assertRole,
  navFor,
  accountReadFilter,
  can,
  canEditRecord,
  scopeFor,
  type Capability,
  type Scope,
} from "./rbac";

// E0-05: the permission matrix in docs/02-architecture/05-security-rbac-audit.md, row by row.
// ✓ = "all", "team only" = "team", "own" = "own", – = "none".
const MATRIX: Record<Capability, Record<Role, Scope>> = {
  "records.view": {
    ADMIN: "all",
    MANAGER: "all",
    REP: "team",
    MARKETING: "all",
    LEGAL: "all",
    READONLY: "all",
  },
  "records.edit": {
    ADMIN: "all",
    MANAGER: "all",
    REP: "own",
    MARKETING: "none",
    LEGAL: "none",
    READONLY: "none",
  },
  "engagement.log": {
    ADMIN: "all",
    MANAGER: "all",
    REP: "all",
    MARKETING: "all",
    LEGAL: "none",
    READONLY: "none",
  },
  "abm.manage": {
    ADMIN: "all",
    MANAGER: "all",
    REP: "none",
    MARKETING: "all",
    LEGAL: "none",
    READONLY: "none",
  },
  "contracts.send": {
    ADMIN: "all",
    MANAGER: "all",
    REP: "none",
    MARKETING: "none",
    LEGAL: "all",
    READONLY: "none",
  },
  "dashboards.executive": {
    ADMIN: "all",
    MANAGER: "all",
    REP: "none",
    MARKETING: "all",
    LEGAL: "none",
    READONLY: "all",
  },
  "admin.manage": {
    ADMIN: "all",
    MANAGER: "none",
    REP: "none",
    MARKETING: "none",
    LEGAL: "none",
    READONLY: "none",
  },
  "data.exportErase": {
    ADMIN: "all",
    MANAGER: "none",
    REP: "none",
    MARKETING: "none",
    LEGAL: "none",
    READONLY: "none",
  },
};

const ROLES: Role[] = ["ADMIN", "MANAGER", "REP", "MARKETING", "LEGAL", "READONLY"];
const cases = (Object.keys(MATRIX) as Capability[]).flatMap((capability) =>
  ROLES.map((role) => [capability, role, MATRIX[capability][role]] as const),
);

describe("permission matrix (security doc)", () => {
  it("covers every capability the code defines", () => {
    expect([...CAPABILITIES].sort()).toEqual(Object.keys(MATRIX).sort());
  });

  it.each(cases)("%s for %s is %s", (capability, role, scope) => {
    expect(scopeFor(role, capability)).toBe(scope);
    expect(can({ role }, capability)).toBe(scope !== "none");
  });
});

const rep = { id: "usr_rep", role: "REP" as const, teamId: "lusaka" };
const loneRep = { id: "usr_solo", role: "REP" as const, teamId: null };
const manager = { id: "usr_mgr", role: "MANAGER" as const, teamId: null };
const legal = { id: "usr_legal", role: "LEGAL" as const, teamId: null };

describe("row filter for viewing accounts and opportunities", () => {
  it("lets roles with full view see everything", () => {
    expect(accountReadFilter(manager)).toEqual({});
    expect(accountReadFilter(legal)).toEqual({});
  });

  it("limits a rep to accounts owned by their team", () => {
    expect(accountReadFilter(rep)).toEqual({ owner: { teamId: "lusaka" } });
  });

  it("limits a rep without a team to their own accounts", () => {
    expect(accountReadFilter(loneRep)).toEqual({ ownerId: "usr_solo" });
  });
});

describe("who may edit a record", () => {
  it("lets a rep edit only records they own", () => {
    expect(canEditRecord(rep, { ownerId: "usr_rep" })).toBe(true);
    expect(canEditRecord(rep, { ownerId: "usr_other" })).toBe(false);
  });

  it("lets managers edit any record", () => {
    expect(canEditRecord(manager, { ownerId: "usr_other" })).toBe(true);
  });

  it("never lets view-only roles edit, even their own record", () => {
    expect(canEditRecord(legal, { ownerId: "usr_legal" })).toBe(false);
    expect(canEditRecord({ id: "m", role: "MARKETING", teamId: null }, { ownerId: "m" })).toBe(
      false,
    );
  });
});

describe("assertCan / assertRole (behind requireCan and requireRole)", () => {
  it("refuses a signed-out caller as UNAUTHENTICATED", () => {
    expect(() => assertCan(null, "records.view")).toThrow(
      expect.objectContaining({ code: "UNAUTHENTICATED" }),
    );
    expect(() => assertRole(null, ["ADMIN"])).toThrow(
      expect.objectContaining({ code: "UNAUTHENTICATED" }),
    );
  });

  it("refuses a role without the capability as FORBIDDEN", () => {
    expect(() => assertCan(rep, "admin.manage")).toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
    expect(() => assertRole(rep, ["ADMIN", "MANAGER"])).toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("returns the user when allowed", () => {
    expect(assertCan(rep, "engagement.log")).toBe(rep);
    expect(assertRole(manager, ["ADMIN", "MANAGER"])).toBe(manager);
  });
});

describe("navigation by role (TC-01)", () => {
  const titles = (role: Role) => navFor(role).map((item) => item.title);

  it("shows Settings (users, audit log, API keys) to admins only", () => {
    expect(titles("ADMIN")).toContain("Settings");
    for (const role of ["MANAGER", "REP", "MARKETING", "LEGAL", "READONLY"] as const) {
      expect(titles(role)).not.toContain("Settings");
    }
  });

  it("keeps every other module visible to every role", () => {
    for (const role of ROLES) expect(titles(role)).toContain("Accounts");
  });
});
