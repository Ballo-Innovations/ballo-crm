"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { AppButton } from "@/components/shared/app-button";
import { PillField } from "@/components/shared/pill-field";

import { signInAction, type SignInState } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {});

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error && (
        <p
          role="alert"
          className="bg-danger/10 text-danger rounded-2xl px-4 py-3 text-sm font-medium"
        >
          {state.error}
        </p>
      )}
      <PillField
        label="Work email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        autoFocus
        required
      />
      <PillField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />
      <AppButton
        type="submit"
        size="lg"
        icon={ArrowRight}
        loading={pending}
        className="mt-4 w-full"
      >
        {pending ? "Signing in…" : "Sign in"}
      </AppButton>
    </form>
  );
}
