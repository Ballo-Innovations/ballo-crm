/**
 * Seed entry point: `pnpm db:seed` (add `--reset` to wipe first).
 *
 * Scaffold only - it loads the product catalogue so the command works end to end.
 * TODO(E0-10): seed v0 (users, 5 accounts) and make `--reset` idempotent.
 * TODO(E10-01): seed v1 per docs/05-qa/03-demo-data-seed-spec.md.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

type ProductSeed = { code: string; name: string; category: string; listPrice: number };

const db = new PrismaClient();

function loadJson<T>(name: string): T {
  const path = fileURLToPath(new URL(`./seed/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

async function main() {
  // Reset wipes data: allowed locally and on dev, by hand on stage, never on prod.
  if (process.argv.includes("--reset") && process.env.APP_ENV === "prod") {
    throw new Error("Refusing to run db:seed --reset with APP_ENV=prod.");
  }

  const products = loadJson<ProductSeed[]>("products.json");
  for (const product of products) {
    await db.product.upsert({ where: { code: product.code }, update: product, create: product });
  }
  process.stdout.write(`Seeded ${products.length} products.\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
