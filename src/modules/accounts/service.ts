// accounts module - Account 360, contacts, subscriptions.
// Owner: Dev A | Epic: E2 (docs/04-delivery/03-tickets.csv)
//
// Pure business logic - no DB access, no I/O. Unit tests live next to this file
// (`service.test.ts`).

import type { Lifecycle, Sector, Tier } from "@prisma/client";
import { Stage } from "@prisma/client";

import {
  ACCOUNT_SORTS,
  LIFECYCLES,
  SECTORS,
  TIERS,
  type AccountListParams,
  type AccountOverview,
  type AccountRow,
  type AccountSortKey,
  type SortDir,
} from "./types";

export type { AccountRow } from "./types";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
const MAX_SEARCH = 100;
const DEFAULT_SORT: AccountSortKey = "arr";
const DEFAULT_DIR: SortDir = "desc";

/** Columns that start highest first when picked; the rest start A to Z. */
const NUMERIC_SORTS = new Set<AccountSortKey>(["arr", "pipeline", "engagement"]);

type Raw = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** "A,B" or ?x=A&x=B, keeping only known values, each once. */
function list<T extends string>(v: string | string[] | undefined, allowed: readonly T[]): T[] {
  const values = (Array.isArray(v) ? v : [v ?? ""]).flatMap((s) => s.split(","));
  return [...new Set(values)].filter((s): s is T => (allowed as readonly string[]).includes(s));
}

function int(v: string | undefined, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, max);
}

/**
 * Reads the list's URL state. Unknown values are dropped rather than rejected: URLs are
 * shared and hand-edited, and a bad filter should never break the page.
 */
export function parseListParams(raw: Raw): AccountListParams {
  const sortRaw = first(raw.sort) ?? "";
  const desc = sortRaw.startsWith("-");
  const key = (desc ? sortRaw.slice(1) : sortRaw) as AccountSortKey;
  const known = ACCOUNT_SORTS.includes(key);
  return {
    q: (first(raw.q) ?? "").trim().slice(0, MAX_SEARCH),
    sector: list(raw.sector, SECTORS),
    tier: list(raw.tier, TIERS),
    lifecycle: list(raw.lifecycle, LIFECYCLES),
    sort: known ? key : DEFAULT_SORT,
    dir: known ? (desc ? "desc" : "asc") : DEFAULT_DIR,
    page: int(first(raw.page), 1),
    pageSize: int(first(raw.pageSize), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
}

/** The URL query for the params, leaving out defaults so links stay short. */
export function listParamsToQuery(p: AccountListParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (p.q) out.q = p.q;
  if (p.sector.length) out.sector = p.sector.join(",");
  if (p.tier.length) out.tier = p.tier.join(",");
  if (p.lifecycle.length) out.lifecycle = p.lifecycle.join(",");
  if (p.sort !== DEFAULT_SORT || p.dir !== DEFAULT_DIR) {
    out.sort = `${p.dir === "desc" ? "-" : ""}${p.sort}`;
  }
  if (p.page !== 1) out.page = String(p.page);
  if (p.pageSize !== DEFAULT_PAGE_SIZE) out.pageSize = String(p.pageSize);
  return out;
}

/** Clicking a column: flip it if it is the current sort, otherwise start it its natural way. */
export function toggleSort(
  current: { sort: AccountSortKey; dir: SortDir },
  key: AccountSortKey,
): { sort: AccountSortKey; dir: SortDir } {
  if (current.sort === key) return { sort: key, dir: current.dir === "asc" ? "desc" : "asc" };
  return { sort: key, dir: NUMERIC_SORTS.has(key) ? "desc" : "asc" };
}

const CLOSED = new Set<Stage>([Stage.CLOSED_WON, Stage.CLOSED_LOST]);

export type RawAccount = {
  id: string;
  name: string;
  city: string | null;
  sector: Sector;
  tier: Tier;
  lifecycle: Lifecycle;
  engagementScore: number;
  owner: { name: string };
  subscriptions: { annualValue: number; active: boolean }[];
  opportunities: { amount: number; stage: Stage }[];
};

/** ARR is the sum of active subscriptions; pipeline is every deal not yet won or lost. */
export function toAccountRow(a: RawAccount): AccountRow {
  return {
    id: a.id,
    name: a.name,
    city: a.city,
    sector: a.sector,
    tier: a.tier,
    lifecycle: a.lifecycle,
    engagementScore: a.engagementScore,
    owner: a.owner.name,
    arr: a.subscriptions.reduce((sum, s) => (s.active ? sum + s.annualValue : sum), 0),
    pipeline: a.opportunities.reduce((sum, o) => (CLOSED.has(o.stage) ? sum : sum + o.amount), 0),
  };
}

// Business order, not alphabetical: Tier 1 first, lifecycle along the customer journey.
const TIER_ORDER = new Map(TIERS.map((t, i) => [t, i]));
const LIFECYCLE_ORDER = new Map(LIFECYCLES.map((l, i) => [l, i]));
const text = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

const COMPARE: Record<AccountSortKey, (a: AccountRow, b: AccountRow) => number> = {
  name: (a, b) => text(a.name, b.name),
  sector: (a, b) => text(a.sector, b.sector),
  tier: (a, b) => TIER_ORDER.get(a.tier)! - TIER_ORDER.get(b.tier)!,
  lifecycle: (a, b) => LIFECYCLE_ORDER.get(a.lifecycle)! - LIFECYCLE_ORDER.get(b.lifecycle)!,
  owner: (a, b) => text(a.owner, b.owner),
  arr: (a, b) => a.arr - b.arr,
  pipeline: (a, b) => a.pipeline - b.pipeline,
  engagement: (a, b) => a.engagementScore - b.engagementScore,
};

/** A sorted copy; ties always break by name A to Z so the order is stable. */
export function sortRows(rows: AccountRow[], sort: AccountSortKey, dir: SortDir): AccountRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => COMPARE[sort](a, b) * sign || COMPARE.name(a, b));
}

/** One page of rows; a page past the end shows the last page. */
export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    page: current,
    pageCount,
    total: rows.length,
  };
}

export type RawAccountOverview = Omit<RawAccount, "opportunities"> & {
  healthScore: number;
  opportunities: { amount: number; weightedValue: number; stage: Stage }[];
};

/** Header fields and Overview numbers (E2-02); open deals are those not won or lost. */
export function toAccountOverview(a: RawAccountOverview): AccountOverview {
  const open = a.opportunities.filter((o) => !CLOSED.has(o.stage));
  return {
    id: a.id,
    name: a.name,
    city: a.city,
    sector: a.sector,
    tier: a.tier,
    lifecycle: a.lifecycle,
    owner: a.owner.name,
    arr: a.subscriptions.reduce((sum, s) => (s.active ? sum + s.annualValue : sum), 0),
    pipeline: open.reduce((sum, o) => sum + o.amount, 0),
    weightedPipeline: open.reduce((sum, o) => sum + o.weightedValue, 0),
    openDeals: open.length,
    engagementScore: a.engagementScore,
    healthScore: a.healthScore,
  };
}

/** Health is stored 0 to 1 and shown with one decimal, as in the wireframe ("Health 0.9"). */
export function formatHealth(h: number): string {
  return h.toFixed(1);
}

export { formatPhone, normalizePhone } from "./phone";
