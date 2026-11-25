import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { DEMO_PASSWORD, seedAccounts, seedProducts, seedUsers } from "./seed-data";

// E0-10: seed v0 = users, products, 5 accounts (docs/05-qa/03-demo-data-seed-spec.md).

describe("seed users", () => {
  const users = seedUsers();

  it("are the 8 demo users from the seed spec", () => {
    expect(users).toHaveLength(8);
    const byRole = (role: Role) => users.filter((user) => user.role === role).length;
    expect(byRole("ADMIN")).toBe(1);
    expect(byRole("MANAGER")).toBe(1);
    expect(byRole("REP")).toBe(4);
    expect(byRole("MARKETING")).toBe(1);
    expect(byRole("LEGAL")).toBe(1);
  });

  it("include the admin the e2e tests sign in as", () => {
    expect(users).toContainEqual(
      expect.objectContaining({ email: "admin@compass.zm", role: "ADMIN" }),
    );
    expect(DEMO_PASSWORD).toBe("Compass!2026");
  });

  it("have unique, lower-case emails and a name", () => {
    const emails = users.map((user) => user.email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const user of users) {
      expect(user.email).toBe(user.email.toLowerCase());
      expect(user.name.length).toBeGreaterThan(0);
    }
  });
});

describe("seed products", () => {
  const products = seedProducts();

  it("load the catalogue with unique codes and whole-ngwee prices", () => {
    expect(products.length).toBeGreaterThan(0);
    expect(new Set(products.map((product) => product.code)).size).toBe(products.length);
    for (const product of products) expect(Number.isInteger(product.listPrice)).toBe(true);
  });
});

describe("seed accounts", () => {
  const accounts = seedAccounts();
  const codes = new Set(seedProducts().map((product) => product.code));
  const reps = new Set(
    seedUsers()
      .filter((u) => u.role === "REP")
      .map((u) => u.email),
  );

  it("are 5 accounts with unique names", () => {
    expect(accounts).toHaveLength(5);
    expect(new Set(accounts.map((account) => account.name)).size).toBe(5);
  });

  it("are owned by sales reps", () => {
    for (const account of accounts) expect(reps.has(account.ownerEmail)).toBe(true);
  });

  it("only subscribe to products in the catalogue", () => {
    for (const account of accounts) {
      for (const code of account.subscriptions) expect(codes.has(code)).toBe(true);
    }
    // A prospect may have none, but the seed as a whole must have some.
    expect(accounts.flatMap((account) => account.subscriptions).length).toBeGreaterThan(0);
  });

  it("use fictional names only (no real organisations)", () => {
    const names = accounts.map((account) => account.name).join(" ");
    expect(names).not.toMatch(/Ministry|UNZA|ZESCO|Levy Mwanawasa|\bUN\b|ZRA|City Council/);
  });
});
