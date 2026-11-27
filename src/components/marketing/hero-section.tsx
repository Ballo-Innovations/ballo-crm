import Link from "next/link";
import { Sparkles } from "lucide-react";

import { HeroLink } from "./hero-link";
import { ProductShowcase } from "./product-showcase";
import { WaveBackground } from "./wave-background";

/** Option A "Product stage": centred headline over gradient waves, then the app preview. */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden px-2 pt-12 md:px-4 md:pt-20">
      <WaveBackground />
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-5 text-center">
        <span className="bg-soft inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[13px] font-semibold md:text-sm">
          <span className="bg-ink text-shell inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs">
            <Sparkles className="size-3" aria-hidden />
            New
          </span>
          Brutus now explains every grade
        </span>
        <h1 className="text-[44px] leading-[0.96] font-bold tracking-[-0.045em] text-balance md:text-[clamp(56px,6.6vw,88px)]">
          The commercial picture, <span className="text-mute block">in one place.</span>
        </h1>
        <p className="text-mute max-w-[560px] text-[17px] text-pretty md:text-lg">
          Accounts, pipeline, contracts and engagement in one CRM, with grades you can explain and a
          forecast you can defend.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <HeroLink href="/login" className="h-[52px] text-[15px]">
            Sign in to Infratel
          </HeroLink>
          <Link
            href="#features"
            className="bg-soft hover:bg-line flex h-[52px] items-center rounded-full px-[26px] text-[15px] font-semibold transition-colors"
          >
            See how it works
          </Link>
        </div>
      </div>

      <div id="product" className="scroll-mt-24">
        <ProductShowcase />
      </div>
    </section>
  );
}
