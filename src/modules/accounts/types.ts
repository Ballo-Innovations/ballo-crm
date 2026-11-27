// accounts module - Account 360, contacts, subscriptions.
// Owner: Dev A | Epic: E2 (docs/04-delivery/03-tickets.csv)
//
// Types and zod schemas for this module. Enums come from Prisma - never string-literal
// a stage, grade or role.

import { Lifecycle, Sector, Stance, Tier } from "@prisma/client";
import { z } from "zod";

import { normalizePhone } from "./phone";

export const SECTORS = Object.values(Sector);
export const TIERS = Object.values(Tier);
export const LIFECYCLES = Object.values(Lifecycle);

/** Sentence-case labels for the UI (design system, "Text"). */
export const SECTOR_LABEL: Record<Sector, string> = {
  BANKING: "Banking",
  MINING: "Mining",
  TELECOMS: "Telecoms",
  GOVERNMENT: "Government",
  NGO: "NGO",
  RETAIL: "Retail",
  ENERGY: "Energy",
  EDUCATION_HEALTH: "Education & health",
};

export const TIER_LABEL: Record<Tier, string> = {
  TIER1: "Tier 1",
  TIER2: "Tier 2",
  TIER3: "Tier 3",
};

export const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  PROSPECT: "Prospect",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  AT_RISK: "At risk",
  CHURNED: "Churned",
};

export const ACCOUNT_SORTS = [
  "name",
  "sector",
  "tier",
  "lifecycle",
  "owner",
  "arr",
  "pipeline",
  "engagement",
] as const;
export type AccountSortKey = (typeof ACCOUNT_SORTS)[number];
export type SortDir = "asc" | "desc";

/** The accounts list's URL state: `?q&sector&tier&lifecycle&sort&page&pageSize`. */
export type AccountListParams = {
  q: string;
  sector: Sector[];
  tier: Tier[];
  lifecycle: Lifecycle[];
  sort: AccountSortKey;
  dir: SortDir;
  page: number;
  pageSize: number;
};

/** One row of the accounts list. Money is integer ngwee. */
export type AccountRow = {
  id: string;
  name: string;
  city: string | null;
  sector: Sector;
  tier: Tier;
  lifecycle: Lifecycle;
  owner: string;
  engagementScore: number;
  /** Annual recurring revenue: the sum of active subscriptions. */
  arr: number;
  /** Open pipeline: the amount of every deal not yet won or lost. */
  pipeline: number;
};

export type AccountListResult = {
  rows: AccountRow[];
  /** Accounts matching the search and filters. */
  total: number;
  /** Accounts this user may see at all, for "6 of 9" and the empty state. */
  grandTotal: number;
  page: number;
  pageCount: number;
};

/** Account 360 header and Overview tab (E2-02). Money is integer ngwee. */
export type AccountOverview = {
  id: string;
  name: string;
  city: string | null;
  sector: Sector;
  tier: Tier;
  lifecycle: Lifecycle;
  owner: string;
  /** Sum of active subscriptions. */
  arr: number;
  /** Amount of every deal not yet won or lost. */
  pipeline: number;
  /** Weighted value of the same open deals (scoring spec). */
  weightedPipeline: number;
  openDeals: number;
  /** 0 to 100 (scoring spec, "Account engagement score"). */
  engagementScore: number;
  /** 0 to 1. */
  healthScore: number;
};

// ---------- Contacts (E2-03) ----------

export const STANCES = Object.values(Stance);

export const STANCE_LABEL: Record<Stance, string> = {
  SUPPORTER: "Supporter",
  NEUTRAL: "Neutral",
  SKEPTIC: "Skeptic",
};

const blankToNull = (v: unknown) =>
  typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : (v ?? null);

const required = (message: string) =>
  z.string({ error: message }).trim().min(1, message).max(80, "Keep it under 80 characters.");

/** Add or edit a contact. Phones become E.164; blank optional fields become null. */
export const contactInputSchema = z.object({
  firstName: required("Enter a first name."),
  lastName: required("Enter a last name."),
  title: z.preprocess(
    blankToNull,
    z.string().max(120, "Keep the title under 120 characters.").nullable(),
  ),
  email: z.preprocess(
    blankToNull,
    z.email({ error: "Enter a valid email, like name@company.zm." }).nullable(),
  ),
  phone: z.preprocess(
    blankToNull,
    z
      .string()
      .nullable()
      .transform((v, ctx) => {
        if (v === null) return null;
        const e164 = normalizePhone(v);
        if (!e164) {
          ctx.addIssue({ code: "custom", message: "Enter a phone number, like 97 123 4567." });
          return z.NEVER;
        }
        return e164;
      }),
  ),
  influence: z.coerce
    .number({ error: "Pick an influence from 1 to 5." })
    .int("Pick an influence from 1 to 5.")
    .min(1, "Pick an influence from 1 to 5.")
    .max(5, "Pick an influence from 1 to 5."),
  stance: z.enum(Stance, { error: "Pick a stance." }),
});

export type ContactInput = z.output<typeof contactInputSchema>;

export type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  influence: number;
  stance: Stance;
};
