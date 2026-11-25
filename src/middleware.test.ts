import { encode } from "next-auth/jwt";
import { NextRequest, type NextFetchEvent } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";

// E0-04 regression: signing out sometimes left the user signed in. The middleware renewed the
// session cookie on every request, so a link prefetch that finished after sign-out set the cookie
// again. The middleware must only read the session, never write it.

const SECRET = "test-secret-at-least-32-characters-long!!";
let middleware: (request: NextRequest, event: NextFetchEvent) => Promise<Response | undefined>;

beforeAll(async () => {
  process.env.AUTH_SECRET = SECRET;
  middleware = (await import("./middleware")).default as typeof middleware;
});

async function sessionCookie(name: string) {
  const token = await encode({
    salt: name,
    secret: SECRET,
    token: { uid: "usr_1", role: "ADMIN", email: "a@ballo.test", name: "Ada" },
  });
  return `${name}=${token}`;
}

function run(path: string, headers: Record<string, string> = {}) {
  return middleware(
    new NextRequest(new URL(path, "http://localhost:3000"), { headers }),
    {} as NextFetchEvent,
  );
}

describe("middleware", () => {
  it("redirects a signed-out page request to the login page", async () => {
    const response = await run("/dashboard");
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(
      "http://localhost:3000/login?callbackUrl=%2Fdashboard",
    );
  });

  it("answers a signed-out API request with 401", async () => {
    const response = await run("/api/v1/accounts");
    expect(response?.status).toBe(401);
  });

  it("lets a signed-in request through without touching the session cookie", async () => {
    const response = await run("/dashboard", {
      cookie: await sessionCookie("authjs.session-token"),
    });
    expect(response?.headers.get("location")).toBeNull();
    expect(response?.status).toBe(200);
    expect(response?.headers.get("set-cookie")).toBeNull();
  });

  it("reads the secure cookie behind HTTPS (Traefik sets x-forwarded-proto)", async () => {
    const response = await run("/dashboard", {
      cookie: await sessionCookie("__Secure-authjs.session-token"),
      "x-forwarded-proto": "https",
    });
    expect(response?.headers.get("location")).toBeNull();
    expect(response?.headers.get("set-cookie")).toBeNull();
  });

  it("treats a tampered cookie as signed out", async () => {
    const response = await run("/dashboard", { cookie: "authjs.session-token=not-a-real-token" });
    expect(response?.status).toBe(307);
  });

  it("sends a signed-in user away from the login page", async () => {
    const response = await run("/login", { cookie: await sessionCookie("authjs.session-token") });
    expect(response?.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });
});
