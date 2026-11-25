import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";

import { BrandMark } from "./brand-logo";
import { GradientText } from "./gradient-text";

export function HeroSection() {
  return (
    <section>
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-20 pb-16 md:pt-28 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col items-start gap-6">
          <Link
            href="#brutus-ai"
            className="border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-brand/40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm backdrop-blur transition-colors"
          >
            <Sparkles className="text-brand size-3.5" />
            Announcing Brutus AI intelligence
            <ChevronRight className="size-3.5" />
          </Link>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            One source of truth for <GradientText>revenue teams</GradientText>
          </h1>

          <p className="text-muted-foreground max-w-xl text-lg text-pretty">
            BalloCRM unifies accounts, pipelines, contracts, and customer communications into a
            single, AI-driven system of record, so B2B teams stop reconciling spreadsheets and
            start acting on account health, qualification, and cross-sell signals.
          </p>

          <div className="mt-1 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Get started
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="#platform">Explore the platform</Link>
            </Button>
          </div>

          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="text-brand size-4" />
              Native BalloAds messaging
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="text-brand size-4" />
              Brutus AI intelligence
            </span>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/** Floating brand mark on a spotlit pedestal, a product-agnostic hero visual. */
function HeroVisual() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-4 rounded-full bg-[radial-gradient(circle,var(--brand-muted),transparent_65%)] opacity-90 blur-2xl"
      />
      <div
        aria-hidden
        className="from-brand/25 absolute bottom-[18%] h-16 w-3/5 rounded-[50%] bg-gradient-to-b to-transparent blur-2xl"
      />
      <BrandMark className="relative size-44 drop-shadow-2xl md:size-56" />
    </div>
  );
}
