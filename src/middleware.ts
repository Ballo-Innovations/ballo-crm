import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { guardRoute } from "@/lib/auth-routes";
import { sessionUserFromToken } from "@/lib/auth-session";

/**
 * Every route needs a session except the public ones in `src/lib/auth-routes.ts` (E0-04).
 *
 * Read-only on purpose: it decodes the session cookie and never writes one. Auth.js's own
 * middleware wrapper renews the cookie on every request, so a link prefetch finishing after
 * sign-out would set it again and sign the user back in (see middleware.test.ts).
 */
export default async function middleware(request: NextRequest) {
  // Behind Traefik the app sees http; Auth.js names the cookie by the public protocol.
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: proto.startsWith("https"),
  });

  const { pathname, search } = request.nextUrl;
  const decision = guardRoute(pathname, search, sessionUserFromToken(token) !== null);

  if (decision.kind === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.nextUrl));
  }
  if (decision.kind === "unauthorized") {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } },
      { status: 401 },
    );
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static files; everything else goes through the guard.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|txt)$).*)",
  ],
};
