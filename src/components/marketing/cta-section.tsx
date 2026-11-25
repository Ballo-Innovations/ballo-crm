import Link from "next/link";

import { HeroLink } from "./hero-link";

/** The page's one strong black element, per the design system. */
export function CtaSection() {
  return (
    <section className="bg-ink text-shell md:rounded-panel rounded-3xl px-6 py-14 text-center md:px-16 md:py-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
        <h2 className="text-[30px] leading-tight font-bold tracking-tight text-balance md:text-[44px]">
          Retire the spreadsheets. Run revenue from one place.
        </h2>
        <p className="text-[17px] text-pretty opacity-70">
          Accounts, pipeline, engagement and contracts together, so every role sees the same
          trustworthy picture.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <HeroLink href="/dashboard" inverted className="h-[52px] text-[15px]">
            Open the app
          </HeroLink>
          <Link
            href="/login"
            className="border-shell/40 hover:bg-shell/10 flex h-[52px] items-center rounded-full border-[1.5px] px-[26px] text-[15px] font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
