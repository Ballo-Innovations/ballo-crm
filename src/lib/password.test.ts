import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

// Security doc: "Passwords: bcrypt."

describe("password hashing", () => {
  it("stores a bcrypt hash, never the password", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).not.toContain("correct horse");
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse");
    await expect(verifyPassword("correct horse", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong horse", hash)).resolves.toBe(false);
  });

  it("rejects instead of throwing when the stored value is not a bcrypt hash", async () => {
    await expect(verifyPassword("anything", "plain-text")).resolves.toBe(false);
  });
});
