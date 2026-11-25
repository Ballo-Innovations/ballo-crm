/**
 * Which routes need a session (E0-04). Pure and edge-safe: used by `src/middleware.ts`.
 * Public per docs/02-architecture/05-security-rbac-audit.md: signing links, the OpenAPI
 * document, webhooks (they check their own HMAC) and the health check, plus the landing page,
 * the login page and Auth.js's own endpoints.
 */

const PUBLIC_EXACT = new Set(["/", "/login", "/api/v1/health", "/openapi.json"]);
const PUBLIC_PREFIXES = ["/api/auth/", "/sign/", "/api/v1/webhooks/"];

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/dashboard";

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export type RouteDecision =
  { kind: "next" } | { kind: "redirect"; to: string } | { kind: "unauthorized" };

/** What to do with a request, given whether it carries a valid session. */
export function guardRoute(pathname: string, search: string, signedIn: boolean): RouteDecision {
  if (pathname === LOGIN_PATH && signedIn) return { kind: "redirect", to: HOME_PATH };
  if (signedIn || isPublicPath(pathname)) return { kind: "next" };
  if (pathname.startsWith("/api/")) return { kind: "unauthorized" };
  const callbackUrl = encodeURIComponent(`${pathname}${search}`);
  return { kind: "redirect", to: `${LOGIN_PATH}?callbackUrl=${callbackUrl}` };
}

/** Where to go after signing in: only a path inside this app, never another site or the login page. */
export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return HOME_PATH;
  }
  if (value === LOGIN_PATH || value.startsWith(`${LOGIN_PATH}?`)) return HOME_PATH;
  return value;
}
