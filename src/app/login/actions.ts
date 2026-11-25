"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/auth-routes";
import { credentialsSchema } from "@/lib/auth-session";

export type SignInState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  email?: string;
};

/** Sign in with email and password, then go back to where the user was heading. */
export async function signInAction(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "");
  const parsed = credentialsSchema.safeParse({ email, password: form.get("password") ?? "" });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return {
      email,
      fieldErrors: {
        email: fields.email ? "Enter your work email." : undefined,
        password: fields.password ? "Enter your password." : undefined,
      },
    };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallbackUrl(String(form.get("callbackUrl") ?? "")),
    });
    return {};
  } catch (error) {
    // A successful sign-in throws Next's redirect, which must propagate.
    if (error instanceof AuthError) {
      return { email, error: "That email and password don't match. Try again." };
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
