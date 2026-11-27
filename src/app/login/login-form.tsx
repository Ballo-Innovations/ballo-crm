"use client";

import { useActionState, useId, useState } from "react";
import { ArrowRight, ArrowUp, Eye, EyeOff, Info } from "lucide-react";

import { AppButton } from "@/components/shared/app-button";
import { cn } from "@/lib/utils";

import { signInAction, type SignInState } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const trackCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState("CapsLock"));

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error && (
        <p
          role="alert"
          className="bg-danger/10 text-danger rounded-2xl px-4 py-3 text-sm font-medium"
        >
          {state.error}
        </p>
      )}
      <LineField
        label="Work email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="you@company.co.zm"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        autoFocus
        required
      />
      <LineField
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Your password"
        error={state.fieldErrors?.password}
        onKeyDown={trackCapsLock}
        onKeyUp={trackCapsLock}
        onBlur={() => setCapsLock(false)}
        required
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-mute hover:text-ink hover:bg-soft -mr-2 grid size-9 place-items-center rounded-full transition-colors"
          >
            {showPassword ? (
              <EyeOff className="size-[18px]" aria-hidden />
            ) : (
              <Eye className="size-[18px]" aria-hidden />
            )}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </button>
        }
      />
      <p
        aria-live="polite"
        className="text-mute -mt-3 flex items-center gap-1.5 text-[13px] empty:hidden"
      >
        {capsLock && (
          <>
            <ArrowUp className="size-3.5" aria-hidden /> Caps Lock is on
          </>
        )}
      </p>

      <div className="-mt-1 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setForgotOpen((v) => !v)}
          aria-expanded={forgotOpen}
          className="border-line hover:border-ink self-end border-b-[1.5px] text-sm font-semibold transition-colors"
        >
          Forgot password?
        </button>
        {forgotOpen && (
          <p
            role="status"
            className="bg-soft flex gap-2 rounded-2xl px-4 py-3 text-sm leading-relaxed"
          >
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Passwords are managed by your company. Your workspace admin can reset it for you.
          </p>
        )}
      </div>

      <AppButton
        type="submit"
        size="lg"
        icon={ArrowRight}
        loading={pending}
        className="mt-2 w-full"
      >
        {pending ? "Signing in…" : "Sign in"}
      </AppButton>
    </form>
  );
}

/**
 * Login-only field: label above, underlined input. The rest of the app uses PillField; the login
 * island is the one exception (docs/03-design/01-design-system.md "Login page").
 */
function LineField({
  label,
  error,
  trailing,
  className,
  ...input
}: React.ComponentProps<"input"> & { label: string; error?: string; trailing?: React.ReactNode }) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-ink/90 text-sm font-bold tracking-[0.02em]">
        {label}
      </label>
      <div
        className={cn(
          "border-line focus-within:border-ink flex h-[52px] items-center gap-2 border-b-[1.5px] transition-colors duration-150",
          error && "border-danger focus-within:border-danger",
        )}
      >
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? noteId : undefined}
          className="text-ink placeholder:text-mute/80 h-full min-w-0 flex-1 bg-transparent text-base outline-none"
          {...input}
        />
        {trailing}
      </div>
      {error && (
        <p id={noteId} className="text-danger flex items-center gap-1 text-[13px]">
          <Info className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
