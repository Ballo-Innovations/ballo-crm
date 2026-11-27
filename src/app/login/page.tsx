import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { CompassMark } from "@/components/shared/compass-mark";
import { safeCallbackUrl } from "@/lib/auth-routes";
import { siteConfig } from "@/lib/site";

import { greetingFor } from "./greeting";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The sign-in island is always dark, in both themes, so it re-points the colour tokens for
 * everything inside it (fields, button, alerts). See docs/03-design/01-design-system.md "Login page".
 */
const ISLAND_TOKENS = {
  "--ink": "#ffffff",
  "--shell": "#0d0d0d",
  "--card": "#1a1a1a",
  "--soft": "#222222",
  "--line": "#5a5a5a",
  "--mute": "#c4c4c4",
  "--danger": "#fca5a5",
} as React.CSSProperties;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const now = new Date();

  return (
    <main className="bg-shell text-ink grid min-h-dvh lg:grid-cols-[1.15fr_1fr]">
      <section className="flex min-w-0 flex-col justify-between gap-8 px-5 pt-6 pb-2 lg:py-8 lg:pr-6 lg:pl-10">
        <div className="flex items-center gap-2.5 text-2xl font-bold">
          <CompassMark label={siteConfig.name} />
          <span aria-hidden>{siteConfig.name}</span>
        </div>
        <div>
          <p className="text-[46px] leading-[0.92] font-bold tracking-[-0.045em] lg:text-[clamp(56px,6.4vw,104px)]">
            <span className="block">{greetingFor(now)}.</span>
            <span className="text-mute/60 block">Let&apos;s close something.</span>
          </p>
          <p className="text-mute mt-3 max-w-[420px] text-[15px] leading-normal lg:mt-6 lg:text-lg">
            Your pipeline, scores and next best actions are waiting where you left them.
          </p>
        </div>
        <p className="text-mute hidden text-sm lg:block">
          © {now.getFullYear()} {siteConfig.name} · Infratel workspace
        </p>
      </section>

      <section
        style={ISLAND_TOKENS}
        className="text-ink lg:rounded-card relative m-2.5 flex flex-col justify-center gap-8 overflow-hidden rounded-3xl bg-[#0d0d0d] px-[22px] py-8 lg:m-3.5 lg:justify-between lg:px-10 dark:bg-[#050505] dark:ring-1 dark:ring-[#2a2a2a]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_360px_at_90%_0%,rgb(255_255_255/0.08),transparent_60%),radial-gradient(420px_320px_at_0%_100%,rgb(255_255_255/0.05),transparent_60%)]"
        />
        <div className="hidden lg:block" />
        <div className="relative mx-auto w-full max-w-[380px]">
          <h1 className="mb-7 text-[15px] font-extrabold tracking-[0.1em] uppercase">Sign in</h1>
          <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />
        </div>
        <p className="text-mute relative flex items-center justify-center gap-2 text-[13px]">
          <ShieldCheck className="size-4" aria-hidden />
          Invite-only workspace. Your admin manages access.
        </p>
      </section>
    </main>
  );
}
