import type { NextAuthConfig } from "next-auth";

import { LOGIN_PATH } from "@/lib/auth-routes";
import { sessionUserFromToken, withUserClaims, type Role } from "@/lib/auth-session";

/**
 * Edge-safe Auth.js settings (no Prisma), shared by `src/middleware.ts` and `src/auth.ts`.
 * Sessions are JWTs in an httpOnly cookie (security doc), signed with AUTH_SECRET.
 */
export const authConfig = {
  pages: { signIn: LOGIN_PATH },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  // The app sits behind Traefik, which sets the forwarded host and protocol.
  trustHost: true,
  providers: [],
  logger: {
    // A wrong password is an expected outcome, not a server error; keep it out of the logs.
    // Match on `type`: the production build minifies class names, so `name` is unreliable.
    error(error) {
      if ("type" in error && error.type === "CredentialsSignin") return;
      console.error(error);
    },
  },
  callbacks: {
    jwt({ token, user }) {
      return withUserClaims(
        token,
        user as { id?: string; role?: Role; teamId?: string | null } | undefined,
      );
    },
    session({ session, token }) {
      const user = sessionUserFromToken(token);
      if (user) session.user = { ...session.user, ...user };
      return session;
    },
  },
} satisfies NextAuthConfig;
