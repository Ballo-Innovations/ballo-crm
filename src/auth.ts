import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { authorizeCredentials } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

/** Auth.js with email + password (E0-04). Route handler: src/app/api/auth/[...nextauth]/route.ts. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (input) =>
        authorizeCredentials(input, {
          findUserByEmail: (email) =>
            db.user.findUnique({
              where: { email },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                teamId: true,
                password: true,
              },
            }),
          verifyPassword,
        }),
    }),
  ],
});
