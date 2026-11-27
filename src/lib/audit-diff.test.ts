import { describe, expect, it } from "vitest";

import { auditDiff, REDACTED } from "./audit-diff";

// E0-06: "Every wrapped action creates AuditLog with diff" (docs/02-architecture/05-security-rbac-audit.md).

describe("auditDiff", () => {
  it("UPDATE keeps only the fields that changed, before and after", () => {
    const before = { id: "o1", name: "Fibre", stage: "QUALIFY", amount: 100 };
    const after = { id: "o1", name: "Fibre", stage: "PROPOSE", amount: 250 };

    expect(auditDiff(before, after)).toEqual({
      before: { stage: "QUALIFY", amount: 100 },
      after: { stage: "PROPOSE", amount: 250 },
    });
  });

  it("records a field that was added or removed", () => {
    expect(auditDiff({ a: 1 }, { a: 1, b: 2 })).toEqual({
      before: { b: null },
      after: { b: 2 },
    });
    expect(auditDiff({ a: 1, b: 2 }, { a: 1 })).toEqual({
      before: { b: 2 },
      after: { b: null },
    });
  });

  it("returns empty objects when nothing changed", () => {
    expect(auditDiff({ a: 1 }, { a: 1 })).toEqual({ before: {}, after: {} });
  });

  it("compares nested values by content", () => {
    const d = auditDiff({ tags: ["a"], meta: { x: 1 } }, { tags: ["a"], meta: { x: 2 } });
    expect(d).toEqual({ before: { meta: { x: 1 } }, after: { meta: { x: 2 } } });
  });

  it("CREATE has no before and keeps the whole after snapshot", () => {
    expect(auditDiff(undefined, { id: "a1", name: "Acme" })).toEqual({
      before: null,
      after: { id: "a1", name: "Acme" },
    });
  });

  it("DELETE keeps the whole before snapshot and has no after", () => {
    expect(auditDiff({ id: "a1", name: "Acme" }, undefined)).toEqual({
      before: { id: "a1", name: "Acme" },
      after: null,
    });
  });

  it("never stores secrets such as passwords or key hashes", () => {
    const d = auditDiff(undefined, { id: "u1", email: "x@y.z", password: "bcrypt$", hash: "h" });
    expect(d.after).toEqual({ id: "u1", email: "x@y.z", password: REDACTED, hash: REDACTED });

    const u = auditDiff({ password: "old" }, { password: "new" });
    expect(u).toEqual({ before: { password: REDACTED }, after: { password: REDACTED } });
  });

  it("makes values JSON-safe (dates to ISO strings, bigint to string)", () => {
    const at = new Date("2026-11-26T10:00:00.000Z");
    const d = auditDiff(undefined, { closeDate: at, big: BigInt(5), nothing: undefined });
    expect(d.after).toEqual({ closeDate: "2026-11-26T10:00:00.000Z", big: "5" });
  });

  it("treats a non-object snapshot as a whole value", () => {
    expect(auditDiff(1, 2)).toEqual({ before: { value: 1 }, after: { value: 2 } });
  });
});
