import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { BrandMark } from "./brand-logo";

export function CtaSection() {
  return (
    <section className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,oklch(0.29_0.13_268),oklch(0.2_0.1_268)_55%,oklch(0.16_0.08_266))] px-8 py-16 text-center text-white md:px-16">
          {/* cyan glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--brand),transparent_65%)] opacity-30 blur-2xl"
          />
          {/* grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.05]"
          />
          <div className="relative flex flex-col items-center gap-6">
            <BrandMark className="size-16 drop-shadow-2xl" />
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Retire the spreadsheets. Run revenue from one source of truth.
            </h2>
            <p className="max-w-xl text-lg text-pretty text-white/75">
              Bring accounts, pipeline, contracts, messaging, and AI intelligence together — and
              give every revenue role the same trustworthy view.
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Link href="/dashboard">
                  Get started
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white dark:bg-transparent"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
