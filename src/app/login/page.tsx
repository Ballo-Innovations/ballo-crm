import type { Metadata } from "next";

import { safeCallbackUrl } from "@/lib/auth-routes";
import { siteConfig } from "@/lib/site";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="bg-main text-ink flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="bg-card rounded-card w-full max-w-[420px] p-[26px] sm:p-9">
        <div className="mb-8 flex items-center gap-2.5 text-2xl font-bold">
          <span className="bg-ink text-shell grid size-9 place-items-center rounded-full text-base">
            b
          </span>
          {siteConfig.name}
        </div>
        <h1 className="text-[26px] font-bold tracking-tight">Sign in</h1>
        <p className="text-mute mt-1 mb-4 text-[15px]">Use your work email and password.</p>
        <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />
      </section>
    </main>
  );
}
