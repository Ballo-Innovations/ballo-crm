import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness check used by the container healthcheck, Traefik and the deploy smoke test.
 * Public on purpose: it must stay reachable without a session (keep it out of auth guards).
 */
export function GET() {
  return NextResponse.json({
    data: {
      status: "ok",
      env: process.env.APP_ENV ?? "local",
      release: process.env.RELEASE ?? null,
    },
  });
}
