import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// E0-03: the committed migrations must build every model and enum in schema.prisma.
// This catches a schema change shipped without its migration, in CI, with no database.
// The full check against a real Postgres (empty database):
//   prisma migrate deploy
//   prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const schema = readFileSync(dir("./schema.prisma"), "utf8");
const models = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]);
const enums = [...schema.matchAll(/^enum (\w+) \{/gm)].map((m) => m[1]);

function migrationsSql(): string {
  const root = dir("./migrations");
  if (!existsSync(root)) return "";
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => readFileSync(`${root}/${name}/migration.sql`, "utf8"))
    .join("\n");
}

describe("prisma migrations", () => {
  const sql = migrationsSql();

  it("reads the schema", () => {
    expect(models).toHaveLength(20);
    expect(enums).toHaveLength(12);
  });

  it("are locked to PostgreSQL", () => {
    const lock = dir("./migrations/migration_lock.toml");
    expect(existsSync(lock)).toBe(true);
    expect(readFileSync(lock, "utf8")).toContain('provider = "postgresql"');
  });

  it.each(models)("create the %s table", (model) => {
    expect(sql).toContain(`CREATE TABLE "${model}"`);
  });

  it.each(enums)("create the %s enum", (name) => {
    expect(sql).toContain(`CREATE TYPE "${name}" AS ENUM`);
  });
});
