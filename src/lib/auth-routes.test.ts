import { describe, expect, it } from "vitest";

import { guardRoute, isPublicPath, safeCallbackUrl } from "./auth-routes";

// E0-04: protected routes redirect to the login page.
// Public routes per docs/02-architecture/05-security-rbac-audit.md: everything is behind auth
// except signing links, the OpenAPI document, webhooks and the health check, plus the landing
// page and the login page itself.

describe("isPublicPath", () => {
  it.each([
    "/",
    "/login",
    "/api/auth/session",
    "/api/auth/callback/credentials",
    "/api/v1/health",
    "/sign/abc123",
    "/openapi.json",
    "/api/v1/webhooks/email/inbound",
    "/api/v1/webhooks/balloads",
  ])("%s is public", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([
    "/dashboard",
    "/pipeline",
    "/accounts",
    "/settings",
    "/kit",
    "/api/v1/accounts",
    "/loginx",
    "/signature",
    "/api/v1/healthz",
  ])("%s is protected", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe("guardRoute", () => {
  it("lets anyone through to a public page", () => {
    expect(guardRoute("/", "", false)).toEqual({ kind: "next" });
    expect(guardRoute("/api/v1/health", "", false)).toEqual({ kind: "next" });
  });

  it("lets a signed-in user through to a protected page", () => {
    expect(guardRoute("/pipeline", "", true)).toEqual({ kind: "next" });
  });

  it("sends a signed-out user to the login page and remembers where they were going", () => {
    expect(guardRoute("/accounts", "?open=acc_1", false)).toEqual({
      kind: "redirect",
      to: "/login?callbackUrl=%2Faccounts%3Fopen%3Dacc_1",
    });
  });

  it("answers 401 for a signed-out API call instead of redirecting", () => {
    expect(guardRoute("/api/v1/accounts", "", false)).toEqual({ kind: "unauthorized" });
  });

  it("sends a signed-in user away from the login page to the dashboard", () => {
    expect(guardRoute("/login", "", true)).toEqual({ kind: "redirect", to: "/dashboard" });
  });
});

describe("safeCallbackUrl", () => {
  it("keeps a path inside the app", () => {
    expect(safeCallbackUrl("/accounts?open=acc_1")).toBe("/accounts?open=acc_1");
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.example/phish",
    "//evil.example",
    "/\\evil.example",
    "dashboard",
  ])("falls back to the dashboard for %s", (value) => {
    expect(safeCallbackUrl(value)).toBe("/dashboard");
  });

  it("never sends the user back to the login page", () => {
    expect(safeCallbackUrl("/login")).toBe("/dashboard");
  });
});
