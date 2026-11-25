import { Role as PrismaRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { ROLES, authorizeCredentials, sessionUserFromToken, withUserClaims } from "./auth-session";

// E0-04: credentials login, and the role travels in the session.

const george = {
  id: "usr_1",
  email: "george@ballo.test",
  name: "George M.",
  role: "ADMIN" as const,
  teamId: "lusaka" as string | null,
  password: "$2b$10$hash",
};

function deps(found: typeof george | null, passwordOk: boolean) {
  return {
    findUserByEmail: vi.fn(async () => found),
    verifyPassword: vi.fn(async () => passwordOk),
  };
}

describe("authorizeCredentials", () => {
  it("returns the user with their role for the right email and password", async () => {
    const d = deps(george, true);
    await expect(
      authorizeCredentials({ email: "george@ballo.test", password: "secret" }, d),
    ).resolves.toEqual({
      id: "usr_1",
      email: "george@ballo.test",
      name: "George M.",
      role: "ADMIN",
      teamId: "lusaka",
    });
    expect(d.verifyPassword).toHaveBeenCalledWith("secret", "$2b$10$hash");
  });

  it("matches the email without caring about case or spaces", async () => {
    const d = deps(george, true);
    await authorizeCredentials({ email: "  George@Ballo.TEST ", password: "secret" }, d);
    expect(d.findUserByEmail).toHaveBeenCalledWith("george@ballo.test");
  });

  it("rejects a wrong password", async () => {
    await expect(
      authorizeCredentials({ email: "george@ballo.test", password: "nope" }, deps(george, false)),
    ).resolves.toBeNull();
  });

  it("rejects an unknown email without checking a password", async () => {
    const d = deps(null, true);
    await expect(
      authorizeCredentials({ email: "nobody@ballo.test", password: "secret" }, d),
    ).resolves.toBeNull();
    expect(d.verifyPassword).not.toHaveBeenCalled();
  });

  it.each([
    [{}],
    [{ email: "not-an-email", password: "secret" }],
    [{ email: "george@ballo.test", password: "" }],
    [{ email: "george@ballo.test" }],
    [null],
  ])("rejects malformed input %j without touching the database", async (input) => {
    const d = deps(george, true);
    await expect(authorizeCredentials(input, d)).resolves.toBeNull();
    expect(d.findUserByEmail).not.toHaveBeenCalled();
  });
});

describe("ROLES", () => {
  it("matches the Prisma Role enum exactly", () => {
    expect([...ROLES].sort()).toEqual(Object.values(PrismaRole).sort());
  });
});

describe("role claim", () => {
  it("puts the user's id and role on the token at sign-in", () => {
    const token = withUserClaims(
      { sub: "usr_1" },
      { id: "usr_1", role: "MANAGER", teamId: "copperbelt" },
    );
    expect(token).toMatchObject({ uid: "usr_1", role: "MANAGER", teamId: "copperbelt" });
  });

  it("leaves the token alone on later requests (no user passed)", () => {
    const token = { sub: "usr_1", uid: "usr_1", role: "REP" };
    expect(withUserClaims(token, undefined)).toBe(token);
  });

  it("reads the session user, role included, back from the token", () => {
    expect(
      sessionUserFromToken({
        uid: "usr_1",
        role: "LEGAL",
        teamId: "lusaka",
        email: "l@ballo.test",
        name: "Lee",
      }),
    ).toEqual({ id: "usr_1", email: "l@ballo.test", name: "Lee", role: "LEGAL", teamId: "lusaka" });
  });

  it("reads a missing team as no team (null)", () => {
    expect(
      sessionUserFromToken({ uid: "usr_1", role: "REP", email: "r@b.test", name: "R" }),
    ).toMatchObject({ teamId: null });
  });

  it.each([
    [{ uid: "usr_1", email: "a@b.test", name: "A" }],
    [{ uid: "usr_1", role: "SUPERUSER", email: "a@b.test", name: "A" }],
    [{ role: "ADMIN", email: "a@b.test", name: "A" }],
    [null],
  ])("treats a token without a valid id and role as signed out: %j", (token) => {
    expect(sessionUserFromToken(token)).toBeNull();
  });
});
