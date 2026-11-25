/**
 * Seed entry point: `pnpm db:seed` (add `--reset` to wipe first).
 *
 * Seed v0 (E0-10): the 8 demo users, the product catalogue and 5 accounts with their
 * subscriptions. Safe to run again: without `--reset` it updates in place, with `--reset` it
 * wipes every table first. Either way the result is the same.
 * TODO(E10-01): seed v1 per docs/05-qa/03-demo-data-seed-spec.md.
 */
import { Prisma, PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/password";
import { DEMO_PASSWORD, seedAccounts, seedProducts, seedUsers } from "./seed-data";

const db = new PrismaClient();

/** Subscriptions started on a fixed date so every run produces identical data. */
const SUBSCRIPTION_START = new Date("2025-01-01T00:00:00Z");

async function wipe() {
  // Every application table, in one statement so foreign keys never get in the way.
  const tables = Prisma.dmmf.datamodel.models.map((model) => `"${model.dbName ?? model.name}"`);
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`);
}

async function main() {
  const reset = process.argv.includes("--reset");
  // Reset wipes data: allowed locally and on dev, by hand on stage, never on prod.
  if (reset && process.env.APP_ENV === "prod") {
    throw new Error("Refusing to run db:seed --reset with APP_ENV=prod.");
  }
  if (reset) await wipe();

  const password = await hashPassword(DEMO_PASSWORD);
  const users = new Map<string, string>();
  for (const user of seedUsers()) {
    const saved = await db.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, password },
      create: { ...user, password },
    });
    users.set(user.email, saved.id);
  }

  const products = seedProducts();
  for (const product of products) {
    await db.product.upsert({ where: { code: product.code }, update: product, create: product });
  }
  const prices = new Map(products.map((product) => [product.code, product.listPrice]));

  const accounts = seedAccounts();
  for (const { subscriptions, ownerEmail, ...fields } of accounts) {
    const ownerId = users.get(ownerEmail);
    if (!ownerId) throw new Error(`No seeded user ${ownerEmail}`);

    // Account names are not unique in the schema, so match the seeded one by name.
    const existing = await db.account.findFirst({ where: { name: fields.name } });
    const account = existing
      ? await db.account.update({ where: { id: existing.id }, data: { ...fields, ownerId } })
      : await db.account.create({ data: { ...fields, ownerId } });

    await db.subscription.deleteMany({ where: { accountId: account.id } });
    await db.subscription.createMany({
      data: subscriptions.map((productCode) => ({
        accountId: account.id,
        productCode,
        annualValue: prices.get(productCode) ?? 0,
        startDate: SUBSCRIPTION_START,
      })),
    });
  }

  process.stdout.write(
    `Seeded ${users.size} users, ${products.length} products, ${accounts.length} accounts` +
      `${reset ? " (after reset)" : ""}.\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
