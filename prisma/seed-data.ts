import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Lifecycle, Role, Sector, Tier } from "@prisma/client";

/**
 * Seed v0 data (E0-10): the 8 demo users, the product catalogue and 5 accounts.
 * Users follow docs/05-qa/03-demo-data-seed-spec.md. Accounts are fictional only.
 * Pure: no database access, so it is unit-tested (seed-data.test.ts).
 */

/** Demo only, per the seed spec. Never used outside local, dev and stage. */
export const DEMO_PASSWORD = "Compass!2026";

export type SeedUser = { email: string; name: string; role: Role };

export function seedUsers(): SeedUser[] {
  return [
    { email: "admin@compass.zm", name: "Natasha Mwanza", role: "ADMIN" },
    { email: "chanda@compass.zm", name: "Chanda Mwila", role: "MANAGER" },
    { email: "mutale@compass.zm", name: "Mutale Banda", role: "REP" },
    { email: "bwalya@compass.zm", name: "Bwalya Phiri", role: "REP" },
    { email: "nkandu@compass.zm", name: "Nkandu Tembo", role: "REP" },
    { email: "lombe@compass.zm", name: "Lombe Zulu", role: "REP" },
    { email: "thandiwe@compass.zm", name: "Thandiwe Sakala", role: "MARKETING" },
    { email: "legal@compass.zm", name: "Grace Chileshe", role: "LEGAL" },
  ];
}

export type SeedProduct = { code: string; name: string; category: string; listPrice: number };

function loadJson<T>(name: string): T {
  const path = fileURLToPath(new URL(`./seed/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function seedProducts(): SeedProduct[] {
  return loadJson<SeedProduct[]>("products.json");
}

type SampleAccount = {
  name: string;
  sector: Sector;
  tier: Tier;
  lifecycle: Lifecycle;
  sites: number;
  city: string;
  subscriptions: string[];
};

export type SeedAccount = SampleAccount & { ownerEmail: string };

/** Fictional accounts from accounts-sample.json (the sample also names real organisations; skip those). */
const V0_ACCOUNTS = [
  "Zambezi Commercial Bank",
  "Konkola Copper Resources",
  "ZedMobile",
  "MegaMart Zambia",
  "SolarZed",
];

export function seedAccounts(): SeedAccount[] {
  const reps = seedUsers().filter((user) => user.role === "REP");
  const sample = loadJson<SampleAccount[]>("accounts-sample.json");
  return V0_ACCOUNTS.map((name, index) => {
    const account = sample.find((entry) => entry.name === name);
    if (!account) throw new Error(`accounts-sample.json has no account named ${name}`);
    return { ...account, ownerEmail: reps[index % reps.length].email };
  });
}
