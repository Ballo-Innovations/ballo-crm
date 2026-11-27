/**
 * Pure before/after diff for AuditLog rows (E0-06). No database, no server imports, so it is
 * unit-tested on its own and reused by the audit log page.
 */

/** Stored in place of a secret value. */
export const REDACTED = "[redacted]";

/** Field names whose values never reach the audit log (password hashes, API key hashes, tokens). */
const SECRET_FIELDS = new Set(["password", "passwordHash", "hash", "token", "secret", "apiKey"]);

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export type AuditDiff = { before: JsonObject | null; after: JsonObject | null };

/** Converts a value into plain JSON: dates to ISO strings, bigint to string, undefined dropped. */
function toJson(value: unknown): Json {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.map(toJson);
  if (typeof value === "object") {
    // Prisma Decimal and similar value objects carry their own JSON form.
    const withToJson = value as { toJSON?: () => unknown };
    if (typeof withToJson.toJSON === "function") return toJson(withToJson.toJSON());
    const out: JsonObject = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = SECRET_FIELDS.has(k) ? REDACTED : toJson(v);
    }
    return out;
  }
  return String(value);
}

function toSnapshot(value: unknown): JsonObject | null {
  if (value === null || value === undefined) return null;
  const json = toJson(value);
  if (json !== null && typeof json === "object" && !Array.isArray(json)) return json;
  return { value: json };
}

/**
 * CREATE (no before) keeps the whole after snapshot; DELETE (no after) keeps the whole before.
 * When both exist, only the fields that changed are kept on each side; a missing field is null.
 */
export function auditDiff(before: unknown, after: unknown): AuditDiff {
  const b = toSnapshot(before);
  const a = toSnapshot(after);
  if (!b || !a) return { before: b, after: a };

  // Secrets are redacted to the same text on both sides, so compare their raw values instead.
  const rawBefore = before as Record<string, unknown>;
  const rawAfter = after as Record<string, unknown>;

  const changedBefore: JsonObject = {};
  const changedAfter: JsonObject = {};
  for (const key of new Set([...Object.keys(b), ...Object.keys(a)])) {
    const was = b[key] ?? null;
    const now = a[key] ?? null;
    const changed = SECRET_FIELDS.has(key)
      ? rawBefore[key] !== rawAfter[key]
      : JSON.stringify(was) !== JSON.stringify(now);
    if (changed) {
      changedBefore[key] = was;
      changedAfter[key] = now;
    }
  }
  return { before: changedBefore, after: changedAfter };
}
